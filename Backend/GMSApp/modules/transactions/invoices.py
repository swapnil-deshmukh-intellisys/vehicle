
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db.models import F
from django.contrib import messages
from django.db import transaction
from GMSApp.models import Customer, Vehicle, Invoice, ProductCatalogues, TXNService, relInvoiceProductCatalogues, relInvoiceService, InvoiceBulkUploadTXN, TrackInvoiceUploads, InvoiceBulkUploadTXN, StockOutwards, Jobcard
from GMSApp.modules import templatespath, managesession, audit
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, date
import logging, csv, io, os
import pandas as pd
from django.utils.dateparse import parse_date


@managesession.check_session_timeout
def r_txn_invoices(request, context):
    if request.method == 'GET':       
        invoice_objs = Invoice.objects.filter(garage_id=context['garage_id'])

        # Get counts before pagination (for all)        
        context['total_invoice'] = invoice_objs.count()
        context['created_invoice'] = invoice_objs.filter(status='created').count()
        context['dispatched_invoice'] = invoice_objs.filter(status='dispatched').count()

        # Check for filter parameter in URL
        status_filter = request.GET.get('filter')
        if status_filter in ['created', 'dispatched']:
            invoice_objs = invoice_objs.filter(status=status_filter) 

        # Pagination
        paginator = Paginator(invoice_objs, 100)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        context['invoice_objs'] =  page_obj  

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_txn_invoices', 200)
        return render(request, templatespath.template_r_txn_invoices, context) 
    

@managesession.check_session_timeout
def c_txn_invoices(request, context):    
    # Check for jobcard_id in query parameters
    qs_jobcard_id = request.GET.get('jobcard_id')

    if request.method == 'GET':  
        # Check whether jobcard_id was found in GET parameters
        if qs_jobcard_id:
            context['jobcard_obj'] = get_object_or_404(Jobcard, id=qs_jobcard_id)
        # Get only products with available stock
        context['product_catalogues_objs'] = ProductCatalogues.objects.filter(
            garage_id=context['garage_id'],
            inward_stock__gt=0
        ).order_by('name')
        context['service_objs'] = TXNService.objects.filter(garage_id=context['garage_id'])

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_txn_invoices', 200)
        return render(request, templatespath.template_c_txn_invoices, context)     

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                customer_id = request.POST.get('customerid')
                name = request.POST.get('customername')
                vehicle_id = request.POST.get('vehicle')
                invoicedate = request.POST.get('invoicedate')
                pono = request.POST.get('pono')
                podate = request.POST.get('podate') or None

                # Convert dates
                if podate:
                    podate = datetime.strptime(podate, "%Y-%m-%d").date()

                # Ensure required fields are provided
                if not customer_id or not vehicle_id:
                    raise ValueError("Customer and Vehicle are required.")

                # Fetch related objects
                customer = get_object_or_404(Customer, id=customer_id)
                vehicle = get_object_or_404(Vehicle, id=vehicle_id)

                # Get the total amount from the form
                amount = request.POST.get('amount', 0)
                
                # Create and save Invoice
                invoice = Invoice.objects.create(
                    garage_id=context['garage_id'],
                    invoicedate=invoicedate,
                    pono=pono,
                    podate=podate,
                    customer=customer,
                    name=name,
                    vehicle=vehicle,
                    amount=float(amount)
                )

                # Insert Fromdb Parts
                fromdb_part_ids = request.POST.getlist('fromdb_partname')
                fromdb_part_values = request.POST.getlist('fromdb_partvalue')
                fromdb_part_taxes = request.POST.getlist('fromdb_parttax')
                fromdb_part_discounts = request.POST.getlist('fromdb_partdiscount')
                fromdb_part_quantities = request.POST.getlist('fromdb_partquantity')

                for i in range(len(fromdb_part_ids)):
                    part_id = fromdb_part_ids[i]
                    if part_id:  # Only insert if part is selected
                        part = ProductCatalogues.objects.filter(id=part_id).first()
                        quantity = int(fromdb_part_quantities[i]) if i < len(fromdb_part_quantities) and fromdb_part_quantities[i] else 1
                        if quantity <= 0:
                            raise ValueError(f"Invalid quantity for {part.name} - must be greater than 0")
                        
                        if part.current_stock < quantity:
                            raise ValueError(f"Insufficient stock for {part.name}. Available: {part.current_stock}, Required: {quantity}")

                        # Update stock in ProductCatalogues  
                        part.outward_stock += quantity
                        part.save()
                        
                        # Create stock outward entry
                        try:
                            stock_outward = StockOutwards.objects.create(
                                garage_id=context['garage_id'],
                                product=part,
                                quantity=quantity,
                                rate=float(fromdb_part_values[i] or 0),
                                discount=float(fromdb_part_discounts[i] or 0),
                                gst=float(fromdb_part_taxes[i] or 0),
                                total_price=float(fromdb_part_values[i] or 0) * quantity,
                                issued_to=customer.name,
                                issued_date=invoicedate,
                                usage_purpose='Invoice',
                                reference_document=invoice.id,
                                location='Invoice',
                                rack='Invoice',
                                remarks='Invoice',
                            )
                            
                            # Create relInvoiceProductCatalogues entry
                            relInvoiceProductCatalogues.objects.create(
                                invoice=invoice,
                                part=part,
                                part_source='inventory',
                                part_name=part.name if part else '',
                                part_value=float(fromdb_part_values[i] or 0),
                                part_tax=float(fromdb_part_taxes[i] or 0),
                                part_discount=float(fromdb_part_discounts[i] or 0),
                                quantity=quantity
                            )
                            
                            # Log the operation
                            logging.getLogger(__name__).info(
                                f"Created StockOutwards for part {part.name} - Quantity: {quantity}, Invoice: {invoice.id}"
                            )
                            
                        except ValueError as ve:
                            raise ValueError(f"Error processing part {part.name}: {str(ve)}")
                        except Exception as e:
                            logging.getLogger(__name__).error(
                                f"Error creating StockOutwards for part {part.name}: {str(e)}"
                            )
                            raise Exception(f"Failed to process part {part.name}")
                        

                # Insert Fromuser Parts
                fromuser_part_names = request.POST.getlist('fromuser_partname')
                fromuser_part_values = request.POST.getlist('fromuser_partvalue')
                fromuser_part_taxes = request.POST.getlist('fromuser_parttax')
                fromuser_part_discounts = request.POST.getlist('fromuser_partdiscount')

                for i in range(len(fromuser_part_names)):
                    if fromuser_part_names[i]:
                        relInvoiceProductCatalogues.objects.create(
                            invoice=invoice,
                            part=None,
                            part_source='external',
                            part_name=fromuser_part_names[i],
                            part_value=fromuser_part_values[i] or 0,
                            part_tax=fromuser_part_taxes[i] or 0,
                            part_discount=fromuser_part_discounts[i] or 0
                        )

                # Insert Fromdb Services
                fromdb_service_ids = request.POST.getlist('fromdb_servicename')
                fromdb_service_values = request.POST.getlist('fromdb_servicevalue')
                fromdb_service_taxes = request.POST.getlist('fromdb_servicetax')
                fromdb_service_discounts = request.POST.getlist('fromdb_servicediscount')

                for i in range(len(fromdb_service_ids)):
                    service_id = fromdb_service_ids[i]
                    if service_id:  # Only insert if service is selected
                        service = TXNService.objects.filter(id=service_id).first()
                        relInvoiceService.objects.create(
                            invoice=invoice,
                            service=service,
                            service_source='service',
                            service_name=service.name if service else '',
                            service_value=fromdb_service_values[i] or 0,
                            service_tax=fromdb_service_taxes[i] or 0,
                            service_discount=fromdb_service_discounts[i] or 0
                        )

                # Insert Fromuser Services
                fromuser_service_names = request.POST.getlist('fromuser_servicename')
                fromuser_service_values = request.POST.getlist('fromuser_servicevalue')
                fromuser_service_taxes = request.POST.getlist('fromuser_servicetax')
                fromuser_service_discounts = request.POST.getlist('fromuser_servicediscount')

                for i in range(len(fromuser_service_names)):
                    if fromuser_service_names[i]:
                        check_txn_service = TXNService.objects.filter(name=fromuser_service_names[i], garage_id=context['garage_id']).first()
                        if check_txn_service:
                            service = check_txn_service
                        else:
                            service = TXNService.objects.create(
                                garage_id=context['garage_id'],
                                name=fromuser_service_names[i],
                                price=fromuser_service_values[i] or 0,
                                gst=fromuser_service_taxes[i] or 0,
                                discount=fromuser_service_discounts[i] or 0,
                                notes='external invoice'
                            )
                            
                        relInvoiceService.objects.create(
                            invoice=invoice,
                            service=service,
                            service_source='service',
                            service_name=service.name if service else '',
                            service_value=fromuser_service_values[i] or 0,
                            service_tax=fromuser_service_taxes[i] or 0,
                            service_discount=fromuser_service_discounts[i] or 0
                        )      

                # If jobcard_id exists in query parameters, update the jobcard with invoice ID
                if qs_jobcard_id:
                    jobcard = get_object_or_404(Jobcard, id=qs_jobcard_id)
                    jobcard.invoice = invoice
                    jobcard.save()
                    messages.success(request, f"Invoice {invoice.invoiceid} created successfully for jobcard {jobcard.id}")
                    return redirect('r-txn-job-sheets')
                else:
                    messages.success(request, f"Invoice {invoice.invoiceid} created successfully")
                    return redirect('r-txn-invoices')

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_txn_invoices', 200) 

        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)


@managesession.check_session_timeout
def bulk_upload_invoices(request, context):
    if request.method == 'GET':
        track_invoice_uploads = TrackInvoiceUploads.objects.filter(garage_id=context['garage_id'])
        paginator = Paginator(track_invoice_uploads, 100)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        context['track_invoice_uploads'] = page_obj
        return render(request, templatespath.template_bulk_upload_invoices, context)

    if request.method == 'POST':
        track_invoice_uploads = None
        try:
            if 'invoice_file' not in request.FILES:
                raise ValidationError('No invoice file was uploaded.')

            invoice_file = request.FILES['invoice_file']
            file_extension = invoice_file.name.lower().rsplit('.', 1)[-1]
            VALID_EXTENSIONS = {'csv', 'xls', 'xlsx'}

            if file_extension not in VALID_EXTENSIONS:
                raise ValidationError('Please upload a valid Excel or CSV file.')

            df = pd.read_csv(io.StringIO(invoice_file.read().decode('utf-8'))) \
                if file_extension == 'csv' else pd.read_excel(invoice_file)

            if df.empty:
                raise ValidationError('The uploaded file is empty.')

            df.columns = df.columns.str.strip().str.lower()

            REQUIRED_COLUMNS = [
                'invoice_id', 'invoice_date', 'customer_phone', 'customer_name', 'vehicle_model'
            ]
            OPTIONAL_COLUMNS = [
                'customer_gst', 'customer_address', 'customer_email', 'customer_pincode',
                'vehicle_make', 'vehicle_license_plate_no', 'vehicle_external_bikeid',
                'vehicle_registration_no', 'vehicle_fuel_type', 'vehicle_transmission_type',
                'vehicle_engine_no', 'vehicle_chassis_no', 'vehicle_vin_no', 'vehicle_color',
                'vehicle_reg_state', 'invoice_pono'
            ]

            # Check required columns
            missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
            if missing_columns:
                raise ValidationError(f'Missing required columns: {", ".join(missing_columns)}')

            empty_required = [
                col for col in REQUIRED_COLUMNS
                if df[col].isna().any() or df[col].astype(str).str.strip().eq('').any()
            ]
            if empty_required:
                raise ValidationError(f'Empty values found in required columns: {", ".join(empty_required)}')

            for col in OPTIONAL_COLUMNS:
                if col in df.columns:
                    df[col] = df[col].fillna('').astype(str).replace({'nan': '', 'NaN': '', 'None': ''})

            upload_dir = os.path.join('static', 'invoicebulkuploadedfiles')
            os.makedirs(upload_dir, exist_ok=True)
            original_name, ext = os.path.splitext(invoice_file.name)
            safe_original = "_".join(original_name.split())
            current_time = datetime.now().strftime('%Y%m%d_%H%M%S')
            saved_filename = f"garage_id_{context['garage_id']}_{safe_original}_{current_time}{ext}"
            file_path = os.path.join(upload_dir, saved_filename)

            with open(file_path, 'wb+') as destination:
                for chunk in invoice_file.chunks():
                    destination.write(chunk)

            track_invoice_uploads = TrackInvoiceUploads.objects.create(
                garage_id=context['garage_id'],
                file_name=invoice_file.name,
                file_path=file_path,
                success_count=0,
                failed_count=0,
                total_count=len(df)
            )

            success_count = 0
            failed_invoices = []

            def safe_date(val):
                if pd.isnull(val) or val in ("", "nan", "NaT", None):
                    return None
                if isinstance(val, date):
                    return val
                if hasattr(val, 'to_pydatetime'):
                    try:
                        return val.to_pydatetime().date()
                    except:
                        return None
                if isinstance(val, str):
                    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%m/%d/%Y", "%d.%m.%Y"):
                        try:
                            return datetime.strptime(val, fmt).date()
                        except:
                            continue
                    try:
                        return datetime.fromisoformat(val).date()
                    except:
                        pass
                return None

            for _, row in df.iterrows():
                with transaction.atomic():
                    invoice_id = row.get('invoice_id', 'N/A')
                    try:
                        invoice_date = safe_date(row.get('invoice_date'))
                        if not invoice_date:
                            raise ValueError("Invalid or missing invoice_date.")

                        invoice_podate = safe_date(row.get('invoice_podate'))
                        # vehicle_year_of_manufacture = safe_date(row.get('vehicle_year_of_manufacture'))
                        vehicle_reg_exp = safe_date(row.get('vehicle_reg_exp'))

                        customer, _ = Customer.objects.update_or_create(
                            garage_id=context['garage_id'],
                            partner_id=context.get('partner_id'),
                            phone=row['customer_phone'],
                            defaults={
                                'name': row['customer_name'],
                                'gst': row.get('customer_gst', ''),
                                'address': row.get('customer_address', ''),
                                'email': row.get('customer_email', ''),
                                'pincode': row.get('customer_pincode', '')
                            }
                        )

                        vehicle, _ = Vehicle.objects.update_or_create(
                            garage_id=context['garage_id'],
                            customer_id=customer.id,
                            model=row['vehicle_model'],
                            defaults={
                                'make': row.get('vehicle_make', ''),
                                'license_plate_no': row.get('vehicle_license_plate_no', ''),
                                'external_bikeid': row.get('vehicle_external_bikeid', ''),
                                'registration_no': row.get('vehicle_registration_no', ''),
                                'year_of_manufacture': row.get('vehicle_year_of_manufacture'),#vehicle_year_of_manufacture
                                'fuel_type': row.get('vehicle_fuel_type', ''),
                                'transmission_type': row.get('vehicle_transmission_type', ''),
                                'engine_no': row.get('vehicle_engine_no', ''),
                                'chassis_no': row.get('vehicle_chassis_no', ''),
                                'vin_no': row.get('vehicle_vin_no', ''),
                                'color': row.get('vehicle_color', ''),
                                'reg_state': row.get('vehicle_reg_state', ''),
                                'reg_exp': vehicle_reg_exp,
                                'image_path': ''
                            }
                        )

                        invoice, _ = Invoice.objects.update_or_create(
                            garage_id=context['garage_id'],
                            invoiceid=invoice_id,
                            defaults={
                                'invoicedate': invoice_date,
                                'pono': row.get('invoice_pono', ''),
                                'podate': invoice_podate,
                                'customer': customer,
                                'name': row['customer_name'],
                                'vehicle': vehicle,
                                'status': 'created',
                                'amount': 0.0
                            }
                        )

                        InvoiceBulkUploadTXN.objects.create(
                            invoice_id=invoice.invoiceid,
                            track_invoice_uploads=track_invoice_uploads,
                            customer=customer,
                            vehicle=vehicle,
                            status='Invoice Created'
                        )

                        success_count += 1

                    except Exception as e:
                        failed_invoices.append({
                            'invoice_id': invoice_id,
                            'error': str(e)
                        })
                        continue

            failed_count = len(df) - success_count
            track_invoice_uploads.success_count = success_count
            track_invoice_uploads.failed_count = failed_count
            track_invoice_uploads.save()

            msg = f'Successfully imported {success_count} of {len(df)} invoices.\n'
            if failed_invoices:
                msg += '\nFailed Invoices:\n'
                for f in failed_invoices:
                    msg += f"- Invoice {f['invoice_id']}: {f['error']}\n"

            if success_count > 0:
                messages.success(request, msg)
            else:
                messages.error(request, 'Failed to import any invoices.\n' + msg)

            audit.create_audit_log(
                context['useremail'],
                f'Bulk uploaded {success_count} of {len(df)} invoices. Failed: {len(failed_invoices)}.',
                'bulk_upload_invoices',
                200 if success_count else 400
            )

        except ValidationError as e:
            msg = ', '.join(e.messages) if hasattr(e, 'messages') else str(e)
            messages.error(request, msg)
            if track_invoice_uploads:
                track_invoice_uploads.failed_count = 1
                track_invoice_uploads.save()
            audit.create_audit_log(context['useremail'], f'Bulk upload failed: {msg[:200]}', 'bulk_upload_invoices', 400)

        except Exception as e:
            messages.error(request, 'Unexpected error during file upload.')
            logging.exception("Unexpected error in bulk_upload_invoices")
            if track_invoice_uploads:
                track_invoice_uploads.failed_count = 1
                track_invoice_uploads.save()
            audit.create_audit_log(context['useremail'], 'Bulk upload failed: Unexpected error', 'bulk_upload_invoices', 500)

        return redirect('bulk-upload-invoices')


@managesession.check_session_timeout
def track_invoice_uploads(request, context, id):
    track_invoice_upload = TrackInvoiceUploads.objects.get(id=id)
    context['track_invoice_upload'] = track_invoice_upload

    if request.method == 'GET':
        if track_invoice_upload.invoice_bulk_upload_txn.exists():
            invoice_bulk_upload_txn = track_invoice_upload.invoice_bulk_upload_txn.all()
            paginator = Paginator(invoice_bulk_upload_txn, 100)
            page_number = request.GET.get('page')
            page_obj = paginator.get_page(page_number)
            context['invoice_bulk_upload_txn'] = page_obj
            return render(request, templatespath.template_track_invoice_uploads, context)
        else:
            messages.error(request, 'Invoice bulk upload txn not found.')
            return redirect('bulk-upload-invoices')

    if request.method == 'POST':
        try:  
            # Get the base filename without extension
            track_invoice_upload_file_name = os.path.splitext(os.path.basename(track_invoice_upload.file_path))[0]
            current_time = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            if 'services_file' in request.FILES:
                services_file = request.FILES['services_file']
                file_extension = services_file.name.lower().rsplit('.', 1)[-1]
                
                VALID_EXTENSIONS = {'csv', 'xls', 'xlsx'}
                if file_extension not in VALID_EXTENSIONS:
                    messages.error(request, 'Please upload a valid Excel or CSV file for services.')
                    return redirect(request.path)
                
                try:
                    df = pd.read_csv(io.StringIO(services_file.read().decode('utf-8'))) \
                        if file_extension == 'csv' else pd.read_excel(services_file)
                    
                    if df.empty:
                        raise ValidationError('The uploaded services file is empty.')
                    
                    df.columns = df.columns.str.strip().str.lower()
                    
                    REQUIRED_COLUMNS = ['invoice_id', 'service_name', 'quantity', 'service_value']
                    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
                    
                    if missing_columns:
                        raise ValidationError(f'Missing required columns in services file: {", ".join(missing_columns)}')

                    # Check for empty values in required columns
                    empty_required = []
                    for col in REQUIRED_COLUMNS:
                        if df[col].isna().any() or df[col].astype(str).str.strip().eq('').any():
                            empty_required.append(col)
                    
                    if empty_required:
                        raise ValidationError(f'Empty values found in required columns: {", ".join(empty_required)}. Please ensure all required columns have values.')    
                    
                    """ Uploading file into invoicebulkuploadedfiles folder """
                    # Define the upload directory
                    upload_dir = os.path.join('static', 'invoicebulkuploadedfiles') 

                    # Create directory if it doesn't exist
                    os.makedirs(upload_dir, exist_ok=True)    

                    # Generate filename
                    saved_filename = f"{track_invoice_upload_file_name}_SERVICES_{current_time}{file_extension}"
                    file_path = os.path.join(upload_dir, saved_filename)

                    # Save the file with the new filename
                    with open(file_path, 'wb+') as destination:
                        for chunk in services_file.chunks():
                            destination.write(chunk)

                    success_count = 0
                    failed_entries = []
                    processed_invoices = set()
                    
                    # Process each row individually with its own transaction
                    for idx, row in df.iterrows():
                        try:
                            # Use a transaction for each row to avoid issues with the entire batch
                            with transaction.atomic():
                                invoice_id = row.get('invoice_id')
                                bulk_invoice = track_invoice_upload.invoice_bulk_upload_txn.filter(invoice_id=invoice_id).first()
                                
                                if not bulk_invoice:
                                    raise ValueError(f'Invoice ID {invoice_id} not found in this upload batch')

                                if bulk_invoice.final_status == 'Invoice Created':
                                    raise ValueError(f'Invoice ID {invoice_id} has already been finalized')    
                                
                                # Handle NaN values for numeric fields
                                def safe_float(val, default=0.0):
                                    """Convert value to float, handling NaN and invalid values."""
                                    if pd.isna(val) or val == 'nan' or val == '' or val is None:
                                        return default
                                    try:
                                        return float(val)
                                    except (ValueError, TypeError):
                                        return default
                                
                                # Get values with NaN handling
                                print("Service Value: ", row)
                                quantity = safe_float(row['quantity'], 1)  # Default quantity is 1
                                service_value = safe_float(row['service_value'], 0.0)
                                service_tax = safe_float(row.get('service_tax'), 0.0)
                                service_discount = safe_float(row.get('service_discount'), 0.0)

                                # Get Invoice
                                invoice = Invoice.objects.get(invoiceid=invoice_id)

                                # Check service exists or not if exists then get else create
                                service, created = TXNService.objects.get_or_create(
                                    garage=invoice.garage,
                                    name=row['service_name'],
                                    defaults={
                                        'price': service_value,
                                        'gst': service_tax,
                                        'discount': service_discount,
                                        'notes': f'Created from Invoice ID {invoice_id}',
                                    }
                                )

                                # Skip add service into invoice already binded
                                if not relInvoiceService.objects.filter(invoice=invoice, service=service).exists():
                                    # relInvoiceService.objects.create(
                                    #     invoice=invoice,
                                    #     service=service,
                                    #     service_source='service',
                                    #     service_name=service.name if service else '',
                                    #     quantity=int(quantity) if quantity >= 1 else 1,  # Ensure quantity is at least 1
                                    #     service_value=service.price if service else service_value,
                                    #     service_tax=service.gst if service else service_tax,
                                    #     service_discount=service.discount if service else service_discount
                                    # ) 
                                    
                                    relInvoiceService.objects.create(
                                        invoice=invoice,
                                        service=service,
                                        service_source='service',
                                        service_name=service.name if service else '',
                                        quantity=int(quantity) if quantity >= 1 else 1,  # Ensure quantity is at least 1
                                        service_value=service_value,
                                        service_tax=service_tax,
                                        service_discount=service_discount
                                    )

                                    # Get each service and update invoice amount   
                                    # Calculate line item values
                                    line_value = service_value * quantity  # Value = Unit Price × Quantity
                                    line_discount = (service_discount / 100) * line_value  # Discount = Value × (Discount % / 100)
                                    taxable_amount = line_value - line_discount  # Taxable Amount = Value - Discount
                                    line_tax = (service_tax / 100) * taxable_amount  # Tax = Taxable Amount × (Tax % / 100)
                                    line_total = line_value - line_discount + line_tax  # Total = Value - Discount + Tax

                                    # Update invoice amount
                                    invoice.amount = invoice.amount + line_total
                                    invoice.save()
                                
                                    # Update status for this invoice
                                    bulk_invoice.status = 'Services Updated'
                                    bulk_invoice.save()

                                    # Track processed invoices
                                    processed_invoices.add(bulk_invoice.id)
                                    success_count += 1
                        except Exception as e:
                            error_msg = f'Service Update Failed: {str(e)} (Row: {idx + 2})'
                            try:
                                # Update status in a separate transaction
                                if 'bulk_invoice' in locals() and bulk_invoice:
                                    bulk_invoice.status = error_msg
                                    bulk_invoice.save()
                            except Exception:
                                # If we can't even update the status, just continue
                                pass
                                
                            failed_entries.append({
                                'row': idx + 2,
                                'invoice_id': row.get('invoice_id') or 'N/A',
                                'error': str(e)
                            })
                            continue
                    
                    # Prepare success/failure message
                    if not failed_entries:
                        msg = 'All services imported successfully.'
                        audit_msg = 'All services imported successfully.'
                    else:
                        success_msg = f'Successfully imported {success_count} services.' if success_count > 0 else 'No services were imported.'
                        msg = f'{success_msg}\n\nFailed to import {len(failed_entries)} services:'
                        audit_msg = f'{success_msg} Failed to import {len(failed_entries)} services:'
                        for entry in failed_entries[:10]:  # Show first 10 failures
                            msg += f"\n- Row {entry['row']} (Invoice: {entry['invoice_id']}): {entry['error']}"
                            audit_msg += f" Row {entry['row']} (Invoice: {entry['invoice_id']}): {entry['error']};"
                        if len(failed_entries) > 10:
                            msg += f"\n... and {len(failed_entries) - 10} more failures"
                            audit_msg += f" and {len(failed_entries) - 10} more failures"
                    
                    messages.success(request, msg)
                    # Log to audit
                    audit.create_audit_log(
                        context['useremail'], 
                        f'BULK_UPLOAD_SERVICES: {audit_msg}', 
                        'u_txn_invoices', 
                        200 if success_count > 0 else 400
                    )
                    
                except Exception as e:
                    messages.error(request, f'Error processing services file: {str(e)}')
            
            elif 'parts_file' in request.FILES:
                parts_file = request.FILES['parts_file']
                file_extension = parts_file.name.lower().rsplit('.', 1)[-1]
                
                VALID_EXTENSIONS = {'csv', 'xls', 'xlsx'}
                if file_extension not in VALID_EXTENSIONS:
                    messages.error(request, 'Please upload a valid Excel or CSV file for parts.')
                    return redirect(request.path)
                
                try:
                    df = pd.read_csv(io.StringIO(parts_file.read().decode('utf-8'))) \
                        if file_extension == 'csv' else pd.read_excel(parts_file)
                    
                    if df.empty:
                        raise ValidationError('The uploaded parts file is empty.')
                    
                    df.columns = df.columns.str.strip().str.lower()
                    
                    REQUIRED_COLUMNS = ['invoice_id', 'part_name', 'quantity', 'part_value']
                    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
                    
                    if missing_columns:
                        raise ValidationError(f'Missing required columns in parts file: {", ".join(missing_columns)}')
                    
                    # Check for empty values in required columns
                    empty_required = []
                    for col in REQUIRED_COLUMNS:
                        if df[col].isna().any() or df[col].astype(str).str.strip().eq('').any():
                            empty_required.append(col)
                    
                    if empty_required:
                        raise ValidationError(f'Empty values found in required columns: {", ".join(empty_required)}. Please ensure all required columns have values.')    

                    """ Uploading file into invoicebulkuploadedfiles folder """
                    # Define the upload directory
                    upload_dir = os.path.join('static', 'invoicebulkuploadedfiles') 

                    # Create directory if it doesn't exist
                    os.makedirs(upload_dir, exist_ok=True)    

                    # Generate filename
                    saved_filename = f"{track_invoice_upload_file_name}_PARTS_{current_time}{file_extension}"
                    file_path = os.path.join(upload_dir, saved_filename)

                    # Save the file with the new filename
                    with open(file_path, 'wb+') as destination:
                        for chunk in parts_file.chunks():
                            destination.write(chunk)
                    
                    success_count = 0
                    failed_entries = []
                    processed_invoices = set()
                    
                    # Process each row individually with its own transaction
                    for idx, row in df.iterrows():
                        try:
                            # Use a transaction for each row to avoid issues with the entire batch
                            with transaction.atomic():
                                invoice_id = row.get('invoice_id')
                                bulk_invoice = track_invoice_upload.invoice_bulk_upload_txn.filter(invoice_id=invoice_id).first()
                                
                                if not bulk_invoice:
                                    raise ValueError(f'Invoice ID {invoice_id} not found in this upload batch')
                                
                                if bulk_invoice.final_status == 'Invoice Created':
                                    raise ValueError(f'Invoice ID {invoice_id} has already been finalized')    
                                
                                # Handle NaN values for numeric fields
                                def safe_float(val, default=0.0):
                                    """Convert value to float, handling NaN and invalid values."""
                                    if pd.isna(val) or val == 'nan' or val == '' or val is None:
                                        return default
                                    try:
                                        return float(val)
                                    except (ValueError, TypeError):
                                        return default
                                
                                # Get values with NaN handling
                                quantity = safe_float(row['quantity'], 1)  # Default quantity is 1
                                part_value = safe_float(row['part_value'], 0.0)
                                part_tax = safe_float(row.get('part_tax'), 0.0)
                                part_discount = safe_float(row.get('part_discount'), 0.0)
                                
                                # Get Invoice
                                invoice = Invoice.objects.get(invoiceid=invoice_id)
                                
                                # Skip add parts into invoice already binded
                                if not relInvoiceProductCatalogues.objects.filter(invoice=invoice, part_name=row['part_name']).exists():
                                    relInvoiceProductCatalogues.objects.create(
                                        invoice=invoice,
                                        part=None,
                                        part_source='external',
                                        part_name=row['part_name'],
                                        quantity=int(quantity) if quantity >= 1 else 1,  # Ensure quantity is at least 1
                                        part_value=part_value,
                                        part_tax=part_tax,
                                        part_discount=part_discount
                                    ) 

                                    # Get each service and update invoice amount   
                                    # Calculate line item values
                                    line_value = part_value * quantity  # Value = Unit Price × Quantity
                                    line_discount = (part_discount / 100) * line_value  # Discount = Value × (Discount % / 100)
                                    taxable_amount = line_value - line_discount  # Taxable Amount = Value - Discount
                                    line_tax = (part_tax / 100) * taxable_amount  # Tax = Taxable Amount × (Tax % / 100)
                                    line_total = line_value - line_discount + line_tax  # Total = Value - Discount + Tax

                                    # Update invoice amount
                                    invoice.amount = invoice.amount + line_total
                                    invoice.save()                              
                                    
                                    # Update status for this invoice
                                    bulk_invoice.status = 'Parts Updated'
                                    bulk_invoice.save()

                                    # Track processed invoices
                                    processed_invoices.add(bulk_invoice.id)
                                    success_count += 1
                        except Exception as e:
                            error_msg = f'Parts Update Failed: {str(e)} (Row: {idx + 2})'
                            try:
                                # Update status in a separate transaction
                                if 'bulk_invoice' in locals() and bulk_invoice:
                                    bulk_invoice.status = error_msg
                                    bulk_invoice.save()
                            except Exception:
                                # If we can't even update the status, just continue
                                pass
                            
                            failed_entries.append({
                                'row': idx + 2,
                                'invoice_id': row.get('invoice_id') or 'N/A',
                                'error': str(e)
                            })
                            continue
                    
                    # Prepare success/failure message
                    if not failed_entries:
                        msg = 'All parts imported successfully.'
                        audit_msg = 'All parts imported successfully.'
                    else:
                        success_msg = f'Successfully imported {success_count} parts.' if success_count > 0 else 'No parts were imported.'
                        msg = f'{success_msg}\n\nFailed to import {len(failed_entries)} parts:'
                        audit_msg = f'{success_msg} Failed to import {len(failed_entries)} parts:'
                        for entry in failed_entries[:10]:  # Show first 10 failures
                            msg += f"\n- Row {entry['row']} (Invoice: {entry['invoice_id']}): {entry['error']}"
                            audit_msg += f" Row {entry['row']} (Invoice: {entry['invoice_id']}): {entry['error']};"
                        if len(failed_entries) > 10:
                            msg += f"\n... and {len(failed_entries) - 10} more failures"
                            audit_msg += f" and {len(failed_entries) - 10} more failures"
                    
                    messages.success(request, msg)
                    # Log to audit
                    audit.create_audit_log(
                        context['useremail'], 
                        f'BULK_UPLOAD_PARTS: {audit_msg}', 
                        'u_txn_invoices', 
                        200 if success_count > 0 else 400
                    )
                    
                except Exception as e:
                    messages.error(request, f'Error processing parts file: {str(e)}')
            
            else:
                messages.error(request, 'No file was uploaded.')
                
        except Exception as e:
            messages.error(request, f'An error occurred: {str(e)}')
        
        return redirect(request.path)


@managesession.check_session_timeout
def u_bulk_upload_invoices_final_status(request, context):
    if request.method == 'POST':
        try:
            with transaction.atomic():
                ids = request.POST.getlist('id[]')
                updated_data = []
                for id in ids:
                    invoice_bulk_upload_txn_obj = get_object_or_404(InvoiceBulkUploadTXN, id=id)
                    if invoice_bulk_upload_txn_obj:
                        updated_data.append(invoice_bulk_upload_txn_obj.id) 
                        invoice_bulk_upload_txn_obj.final_status = 'Invoice Created'
                        invoice_bulk_upload_txn_obj.save()

                if updated_data:
                    msg = f"{len(updated_data)} final status updated"
                    sts = True
                else:
                    msg = "Failed to update final status"
                    sts = False
                msg = msg.replace("[", "").replace("]", "")

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', msg, 200)
                response = JsonResponse({'status': sts, 'message': msg})      
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            response = JsonResponse({'status': False, 'message': error_msg})
        return response           


@managesession.check_session_timeout
def u_txn_invoices(request, context, id):
    invoice = get_object_or_404(Invoice, id=id)
    
    if request.method == 'GET':        
        context['invoice'] = invoice
        # Get only products with available stock
        context['product_catalogues_objs'] = ProductCatalogues.objects.filter(
            garage_id=context['garage_id']
        ).order_by('name')
        context['service_objs'] = TXNService.objects.filter(garage_id=context['garage_id'])
        
        # Get existing invoice services and parts with quantities
        context['invoice_services'] = relInvoiceService.objects.filter(invoice=invoice)
        context['invoice_parts'] = relInvoiceProductCatalogues.objects.filter(invoice=invoice)

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_txn_invoices', 200)
        return render(request, templatespath.template_u_txn_invoices, context)     

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                customer_id = request.POST.get('customerid')
                name = request.POST.get('customername')
                vehicle_id = request.POST.get('vehicle')
                invoicedate = request.POST.get('invoicedate')
                pono = request.POST.get('pono')
                podate = request.POST.get('podate') or None
                podate = datetime.strptime(podate, "%Y-%m-%d").date() if podate else None
                comments = request.POST.get('comments')

                if not customer_id or not vehicle_id:
                    raise ValueError("Customer and Vehicle are required.")

                # Fetch related objects
                customer = get_object_or_404(Customer, id=customer_id)
                vehicle = get_object_or_404(Vehicle, id=vehicle_id)

                # Update invoice
                invoice.invoicedate = invoicedate
                invoice.pono = pono
                invoice.podate = podate
                invoice.customer = customer
                invoice.name = name
                invoice.vehicle = vehicle
                invoice.amount = float(request.POST.get('amount', 0))
                invoice.comments = comments
                invoice.save()

                # Delete existing StockOutwards and ProductCatalogues entries
                stock_outwards = StockOutwards.objects.filter(
                    garage_id=context['garage_id'],
                    usage_purpose='Invoice',
                    reference_document=invoice.id
                )

                # Reset outward_stock for all parts in this invoice
                for stock_out in stock_outwards:
                    try:
                        part = stock_out.product  # Access the product directly through the foreign key
                        # Update stock in ProductCatalogues   
                        part.outward_stock -= stock_out.quantity
                        part.save()
                    except ProductCatalogues.DoesNotExist:
                        continue  # Skip if part doesn't exist

                # Delete existing StockOutwards entries
                stock_outwards.delete()

                # Delete existing invoice parts and services
                relInvoiceProductCatalogues.objects.filter(invoice=invoice).delete()
                relInvoiceService.objects.filter(invoice=invoice).delete()

                # --- Insert parts ---
                fromdb_part_ids = request.POST.getlist('fromdb_partname')
                fromdb_part_values = request.POST.getlist('fromdb_partvalue')
                fromdb_part_taxes = request.POST.getlist('fromdb_parttax')
                fromdb_part_discounts = request.POST.getlist('fromdb_partdiscount')
                fromdb_part_quantities = request.POST.getlist('fromdb_partquantity')

                for i in range(len(fromdb_part_ids)):
                    part_id = fromdb_part_ids[i]
                    if part_id:
                        part = ProductCatalogues.objects.filter(id=part_id).first()
                        if part:
                            quantity = int(fromdb_part_quantities[i]) if i < len(fromdb_part_quantities) and fromdb_part_quantities[i] else 1
                            if quantity <= 0:
                                raise ValueError(f"Invalid quantity for {part.name} - must be greater than 0")
                        
                            if part.current_stock < quantity:
                                raise ValueError(f"Insufficient stock for {part.name}. Available: {part.current_stock}, Required: {quantity}")

                            # Update stock in ProductCatalogues                        
                            part.outward_stock += quantity
                            part.save()
                            
                            # Create StockOutwards entry
                            StockOutwards.objects.create(
                                garage_id=context['garage_id'],
                                product=part,
                                quantity=quantity,
                                rate=float(fromdb_part_values[i] or 0),
                                discount=float(fromdb_part_discounts[i] or 0),
                                gst=float(fromdb_part_taxes[i] or 0),
                                total_price=float(fromdb_part_values[i] or 0) * quantity,
                                issued_to=customer.name,
                                issued_date=invoicedate,
                                usage_purpose='Invoice',
                                reference_document=invoice.id,
                                location='Invoice',
                                rack='Invoice',
                                remarks='Invoice',
                            )
                            
                            # Create relInvoiceProductCatalogues entry
                            relInvoiceProductCatalogues.objects.create(
                                invoice=invoice,
                                part=part,
                                part_source='inventory',
                                part_name=part.name if part else '',
                                part_value=float(fromdb_part_values[i] or 0),
                                part_tax=float(fromdb_part_taxes[i] or 0),
                                part_discount=float(fromdb_part_discounts[i] or 0),
                                quantity=quantity
                            )

                fromuser_part_names = request.POST.getlist('fromuser_partname')
                fromuser_part_values = request.POST.getlist('fromuser_partvalue')
                fromuser_part_taxes = request.POST.getlist('fromuser_parttax')
                fromuser_part_discounts = request.POST.getlist('fromuser_partdiscount')

                for i in range(len(fromuser_part_names)):
                    if fromuser_part_names[i]:
                        relInvoiceProductCatalogues.objects.create(
                            invoice=invoice,
                            part=None,
                            part_source='external',
                            part_name=fromuser_part_names[i],
                            part_value=fromuser_part_values[i] or 0,
                            part_tax=fromuser_part_taxes[i] or 0,
                            part_discount=fromuser_part_discounts[i] or 0
                        )

                # --- Insert services ---
                fromdb_service_ids = request.POST.getlist('fromdb_servicename')
                fromdb_service_values = request.POST.getlist('fromdb_servicevalue')
                fromdb_service_taxes = request.POST.getlist('fromdb_servicetax')
                fromdb_service_discounts = request.POST.getlist('fromdb_servicediscount')
                fromdb_service_quantities = request.POST.getlist('fromdb_servicequantity')

                for i in range(len(fromdb_service_ids)):
                    service_id = fromdb_service_ids[i]
                    if service_id:
                        service = TXNService.objects.filter(id=service_id).first()
                        quantity = int(fromdb_service_quantities[i]) if i < len(fromdb_service_quantities) and fromdb_service_quantities[i] else 1
                        relInvoiceService.objects.create(
                            invoice=invoice,
                            service=service,
                            service_source='service',
                            service_name=service.name if service else '',
                            service_value=fromdb_service_values[i] or 0,
                            service_tax=fromdb_service_taxes[i] or 0,
                            service_discount=fromdb_service_discounts[i] or 0,
                            quantity=quantity
                        )

                fromuser_service_names = request.POST.getlist('fromuser_servicename')
                fromuser_service_values = request.POST.getlist('fromuser_servicevalue')
                fromuser_service_taxes = request.POST.getlist('fromuser_servicetax')
                fromuser_service_discounts = request.POST.getlist('fromuser_servicediscount')

                for i in range(len(fromuser_service_names)):
                    if fromuser_service_names[i]:
                        check_txn_service = TXNService.objects.filter(name=fromuser_service_names[i], garage_id=context['garage_id']).first()
                        if check_txn_service:
                            service = check_txn_service
                        else:
                            service = TXNService.objects.create(
                                garage_id=context['garage_id'],
                                name=fromuser_service_names[i],
                                price=fromuser_service_values[i] or 0,
                                gst=fromuser_service_taxes[i] or 0,
                                discount=fromuser_service_discounts[i] or 0,
                                notes='external invoice'
                            )

                        relInvoiceService.objects.create(
                            invoice=invoice,
                            service=service,
                            service_source='service',
                            service_name=service.name if service else '',
                            service_value=fromuser_service_values[i] or 0,
                            service_tax=fromuser_service_taxes[i] or 0,
                            service_discount=fromuser_service_discounts[i] or 0
                        )

                messages.success(request, f"Invoice {invoice.invoiceid} {'updated' if invoice else 'created'} successfully")
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_txn_invoices', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path) 


@managesession.check_session_timeout
def d_txn_invoices(request, context):
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    invoice_obj = get_object_or_404(Invoice, id=id)
                    if invoice_obj:
                        deleted_data.append(invoice_obj.id) 
                        invoice_obj.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} invoice deleted"
                    sts = True
                else:
                    msg = "Failed to delete invoice"
                    sts = False
                msg = msg.replace("[", "").replace("]", "")

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', msg, 200)
                response = JsonResponse({'status': sts, 'message': msg})      
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            response = JsonResponse({'status': False, 'message': error_msg})
        return response           
             

@csrf_exempt
@managesession.check_session_timeout
def u_txn_invoices_status(request, context):
    """Update invoice status via AJAX"""
    if request.method == 'POST':
        try:
            invoice_id = request.POST.get('invoice_id')
            status = request.POST.get('status')
            
            # Validate status
            valid_statuses = ['created', 'dispatched']
            if status not in valid_statuses:
                return JsonResponse({'success': False, 'message': 'Invalid status value'})
            
            # Get the invoice
            invoice = get_object_or_404(Invoice, id=invoice_id)
            current_status = invoice.status.lower()
            
            # Define the valid status progression
            status_progression = {
                'created': ['dispatched'],
                'dispatched': []
            }
            
            # Check if the requested status change follows the valid progression
            if status.lower() not in status_progression.get(current_status, valid_statuses):
                return JsonResponse({
                    'success': False, 
                    'message': f'Invalid status transition from {current_status} to {status}. Status can only progress forward.'
                })
            
            # Update the invoice status
            invoice.status = status
            invoice.save()
            
            # Log the audit
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}, Updated invoice status to {status}', 'u_txn_invoices_status', 200)
            
            return JsonResponse({'success': True})
        except Exception as e:
            logging.error(f"Error updating invoice status: {str(e)}")
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


@managesession.check_session_timeout
def v_txn_invoices(request, context, id=None):
    try:
        # Check if id was passed as a parameter or in the URL
        if id is None and 'id' in request.GET:
            id = request.GET.get('id')
            
        # Get the invoice object
        invoice = get_object_or_404(Invoice, id=id)
        
        # Calculate invoice summary values
        subtotal = 0
        taxable_amount = 0
        tax_amount = 0
        discount_amount = 0
        
        # Calculate service amounts
        for service in invoice.invoice_services.all():
            service_quantity = float(service.quantity or 1)
            service_value = float(service.service_value or 0)
            service_value = service_value * service_quantity
            service_tax = float(service.service_tax or 0)
            service_discount = float(service.service_discount or 0)
            
            # Calculate individual values
            service_discount_value = service_value * (service_discount / 100)
            service_taxable_value = service_value - service_discount_value
            service_tax_value = service_taxable_value * (service_tax / 100)
            
            # Add to totals
            subtotal += service_value
            discount_amount += service_discount_value
            taxable_amount += service_taxable_value
            tax_amount += service_tax_value
        
        # Calculate part amounts
        for part in invoice.invoice_product_catalogues.all():
            part_quantity = float(part.quantity or 1)
            part_value = float(part.part_value or 0)
            part_value = part_value * part_quantity
            part_tax = float(part.part_tax or 0)
            part_discount = float(part.part_discount or 0)
            
            # Calculate individual values
            part_discount_value = part_value * (part_discount / 100)
            part_taxable_value = part_value - part_discount_value
            part_tax_value = part_taxable_value * (part_tax / 100)
            
            # Add to totals
            subtotal += part_value
            discount_amount += part_discount_value
            taxable_amount += part_taxable_value
            tax_amount += part_tax_value
        
        # Add calculated values to the invoice object
        invoice.subtotal = round(subtotal, 2)
        invoice.taxable_amount = round(taxable_amount, 2)
        invoice.tax_amount = round(tax_amount, 2)
        invoice.discount_amount = round(discount_amount, 2)
        invoice.total_amount = round(taxable_amount + tax_amount, 2)
        
        # Add the invoice to the context
        context['invoice'] = invoice
        
        # Log the audit
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'v_txn_invoices', 200)
        
        # Render the invoice view template
        return render(request, templatespath.template_v_txn_invoices, context)
    
    except Exception as e:
        # Log the error
        logging.error(f"Error viewing invoice: {str(e)}")
        messages.error(request, f"Error viewing invoice: {str(e)}")
        return redirect('r-txn-invoices')