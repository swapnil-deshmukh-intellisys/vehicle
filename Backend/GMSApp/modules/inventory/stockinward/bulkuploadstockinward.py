from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db.models import F
from django.contrib import messages
from django.db import transaction
from GMSApp.models import ProductCatalogues, Suppliers, StockInwards
from GMSApp.modules import managesession, audit
from datetime import datetime, date
import logging, csv, io, os
import pandas as pd


@managesession.check_session_timeout
def bulk_upload_stock_inward(request, context):
    if request.method == 'POST':
        try:
            if 'stock_inward_file' not in request.FILES:
                raise ValidationError('No stock inward file was uploaded.')

            stock_inward_file = request.FILES['stock_inward_file']
            file_extension = stock_inward_file.name.lower().rsplit('.', 1)[-1]
            VALID_EXTENSIONS = {'csv', 'xls', 'xlsx'}

            if file_extension not in VALID_EXTENSIONS:
                raise ValidationError('Please upload a valid Excel or CSV file.')

            df = pd.read_csv(io.StringIO(stock_inward_file.read().decode('utf-8'))) \
                if file_extension == 'csv' else pd.read_excel(stock_inward_file)

            if df.empty:
                raise ValidationError('The uploaded file is empty.')

            df.columns = df.columns.str.strip().str.lower()

            REQUIRED_COLUMNS = [
                'product_id', 'supplier', 'supplier_location', 'supplier_mobile'
            ]
            OPTIONAL_COLUMNS = [
                 'quantity', 'rate', 'discount', 'gst', 'total_price', 'supplier_invoice_no', 'supplier_invoice_date', 'location', 'rack', 'expiry_date', 'warranty', 'remarks'
            ]

            # Check for missing required columns
            missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
            if missing_columns:
                raise ValidationError(f'Missing required columns: {", ".join(missing_columns)}')

            # Check for empty required values
            empty_required = [
                col for col in REQUIRED_COLUMNS
                if df[col].isna().any() or df[col].astype(str).str.strip().eq('').any()
            ]
            if empty_required:
                raise ValidationError(f'Empty values found in required columns: {", ".join(empty_required)}')

            # Clean optional columns
            for col in OPTIONAL_COLUMNS:
                if col in df.columns:
                    df[col] = df[col].fillna('').astype(str).replace({'nan': '', 'NaN': '', 'None': ''})

            # Save uploaded file for audit/debug
            upload_dir = os.path.join('static', 'stockinwardbulkuploadedfiles')
            os.makedirs(upload_dir, exist_ok=True)
            original_name, ext = os.path.splitext(stock_inward_file.name)
            safe_original = "_".join(original_name.split())
            current_time = datetime.now().strftime('%Y%m%d_%H%M%S')
            saved_filename = f"garage_id_{context['garage_id']}_{safe_original}_{current_time}{ext}"
            file_path = os.path.join(upload_dir, saved_filename)
            with open(file_path, 'wb+') as destination:
                for chunk in stock_inward_file.chunks():
                    destination.write(chunk)

            success_count = 0
            failure_count = 0
            errors = []

            for index, row in df.iterrows():
                try:   
                    # Extract form data 
                    quantity = int(row['quantity'] or 0)
                    if quantity <= 0:
                        raise ValueError("Quantity must be greater than 0.")
                    rate = float(row['rate'] or 0.0)
                    discount = float(row['discount'] or 0.0)
                    gst = float(row['gst'] or 0.0)
                    total_price = float(row['total_price'] or 0.0)
                    supplier_invoice_no = row['supplier_invoice_no']
                    supplier_invoice_date = row['supplier_invoice_date'] or None
                    location = row['location']
                    rack = row['rack']
                    expiry_date = row['expiry_date'] or None
                    warranty = row['warranty'] or None
                    remarks = row['remarks']

                    # Convert dates
                    if supplier_invoice_date:
                        try:
                            supplier_invoice_date = datetime.strptime(supplier_invoice_date, "%Y-%m-%d").date()
                        except ValueError:
                            raise ValidationError(f"Invalid supplier_invoice_date format: {supplier_invoice_date}")
                    if expiry_date:
                        try:
                            expiry_date = datetime.strptime(expiry_date, "%Y-%m-%d").date()
                        except ValueError:
                            raise ValidationError(f"Invalid expiry_date format: {expiry_date}")
                    if warranty:
                        try:
                            warranty = datetime.strptime(warranty, "%Y-%m-%dT%H:%M")
                        except ValueError:
                            try:
                                warranty = datetime.strptime(warranty, "%Y-%m-%d")
                                warranty = datetime.combine(warranty, datetime.min.time())
                            except ValueError:
                                raise ValidationError(f"Invalid warranty format: {warranty}")
    

                    # Fetch related objects
                    product = get_object_or_404(ProductCatalogues, id=row['product_id']) 
                    supplier, created = Suppliers.objects.get_or_create(
                        garage_id=context['garage_id'],                    
                        supplier=row['supplier'],
                        mobile=row['supplier_mobile'],
                        location=row['supplier_location'],
                        defaults={
                            'code': '',
                            'name': row['supplier'],
                            'email': '',
                            'address': ''
                        }
                    )
                                        
                    # Create stock inward entry
                    stock_inward = StockInwards.objects.create(
                        garage_id=context['garage_id'],
                        product=product,
                        quantity=quantity,
                        rate=rate,
                        discount=discount,
                        gst=gst,
                        total_price=total_price,
                        supplier=supplier,
                        supplier_invoice_no=supplier_invoice_no,
                        supplier_invoice_date=supplier_invoice_date,
                        supplier_invoice_path='',
                        location=location,
                        rack=rack,
                        track_expiry=True if expiry_date else False,
                        expiry_date=expiry_date,
                        warranty=warranty,
                        remarks=remarks,
                    )

                    # Update inward_stock in ProductCatalogues
                    product.inward_stock += quantity
                    product.save()

                    success_count += 1
                except Exception as e:
                    failure_count += 1
                    errors.append(f"Row {index+2}: {str(e)}")  # Excel-style row number

            # Final message
            msg = f"✅ Uploaded {success_count} products.\n"
            if failure_count:
                msg += f"❌ Failed: {failure_count} rows.\n"
                for err in errors[:10]:  # show up to 10 errors
                    msg += f"- {err}\n"

            if success_count > 0:
                messages.success(request, msg)
            else:
                messages.error(request, msg)

            audit.create_audit_log(
                context['useremail'],
                f'Bulk uploaded stock. Success: {success_count}, Failures: {failure_count}',
                'bulk_upload_stock_inward',
                200 if success_count else 400
            )

        except ValidationError as e:
            msg = ', '.join(e.messages) if hasattr(e, 'messages') else str(e)
            messages.error(request, msg)
            audit.create_audit_log(context['useremail'], f'Bulk upload failed: {msg[:200]}', 'bulk_upload_stock_inward', 400)

        except Exception as e:
            messages.error(request, 'Unexpected error during file upload.')
            logging.exception("Unexpected error in bulk_upload_stock_inward")
            audit.create_audit_log(context['useremail'], 'Bulk upload failed: Unexpected error', 'bulk_upload_stock_inward', 500)

        return redirect('r-inv-stock-inward')
