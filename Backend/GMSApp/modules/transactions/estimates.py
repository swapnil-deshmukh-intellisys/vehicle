from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import Customer, Vehicle, Estimate, ProductCatalogues, TXNService, relEstimateProductCatalogues, relEstimateService, Jobcard
from GMSApp.modules import templatespath, managesession, audit
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime
import logging

# Custom filters are now in templatetags/invoice_estimate_filters.py


@managesession.check_session_timeout
def r_txn_estimates(request, context):
    if request.method == 'GET':       
        estimate_objs = Estimate.objects.filter(garage_id=context['garage_id'])

        # Get counts before pagination (for all)        
        context['total_estimate'] = estimate_objs.count()
        context['created_estimate'] = estimate_objs.filter(status='created').count()
        context['dispatched_estimate'] = estimate_objs.filter(status='dispatched').count()

        # Check for filter parameter in URL
        status_filter = request.GET.get('filter')
        if status_filter in ['created', 'dispatched']:
            estimate_objs = estimate_objs.filter(status=status_filter) 

        # Pagination
        paginator = Paginator(estimate_objs, 100)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        context['estimate_objs'] = page_obj  

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_txn_estimates', 200)
        return render(request, templatespath.template_r_txn_estimates, context) 
    

@managesession.check_session_timeout
def c_txn_estimates(request, context):
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
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_txn_estimates', 200)
        return render(request, templatespath.template_c_txn_estimates, context)     

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                customer_id = request.POST.get('customerid')
                name = request.POST.get('customername')
                vehicle_id = request.POST.get('vehicle')
                estimatedate = request.POST.get('estimatedate')
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
                
                # Create and save Estimate
                estimate = Estimate.objects.create(
                    garage_id=context['garage_id'],
                    estimatedate=estimatedate,
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

                for i in range(len(fromdb_part_ids)):
                    part_id = fromdb_part_ids[i]
                    if part_id:  # Only insert if part is selected
                        part = ProductCatalogues.objects.filter(id=part_id).first()
                        relEstimateProductCatalogues.objects.create(
                            estimate=estimate,
                            part=part,
                            part_source='inventory',
                            part_name=part.name if part else '',
                            part_value=fromdb_part_values[i] or 0,
                            part_tax=fromdb_part_taxes[i] or 0,
                            part_discount=fromdb_part_discounts[i] or 0
                        )

                # Insert Fromuser Parts
                fromuser_part_names = request.POST.getlist('fromuser_partname')
                fromuser_part_values = request.POST.getlist('fromuser_partvalue')
                fromuser_part_taxes = request.POST.getlist('fromuser_parttax')
                fromuser_part_discounts = request.POST.getlist('fromuser_partdiscount')

                for i in range(len(fromuser_part_names)):
                    if fromuser_part_names[i]:
                        relEstimateProductCatalogues.objects.create(
                            estimate=estimate,
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
                        relEstimateService.objects.create(
                            estimate=estimate,
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
                                notes='external estimate'
                            ) 

                        relEstimateService.objects.create(
                            estimate=estimate,
                            service=service,
                            service_source='service',
                            service_name=service.name if service else '',
                            service_value=fromuser_service_values[i] or 0,
                            service_tax=fromuser_service_taxes[i] or 0,
                            service_discount=fromuser_service_discounts[i] or 0
                        )      

                # If jobcard_id exists in query parameters, update the jobcard with estimate ID
                if qs_jobcard_id:
                    jobcard = get_object_or_404(Jobcard, id=qs_jobcard_id)
                    jobcard.estimate = estimate
                    jobcard.save()
                    messages.success(request, f"Estimate {estimate.estimateid} created successfully for jobcard {jobcard.id}")
                    return redirect('r-txn-job-sheets')
                else:
                    messages.success(request, f"Estimate {estimate.estimateid} created successfully")
                    return redirect('r-txn-estimates')

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_txn_estimates', 200) 
                
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path) 


@managesession.check_session_timeout
def u_txn_estimates(request, context, id):
    estimate = get_object_or_404(Estimate, id=id)
    
    if request.method == 'GET':        
        context['estimate'] = estimate
        # Get only products with available stock
        context['product_catalogues_objs'] = ProductCatalogues.objects.filter(
            garage_id=context['garage_id']
        ).order_by('name') 
        context['service_objs'] = TXNService.objects.filter(garage_id=context['garage_id'])
        
        # Get existing estimate services and parts with quantities
        context['estimate_services'] = relEstimateService.objects.filter(estimate=estimate)
        context['estimate_parts'] = relEstimateProductCatalogues.objects.filter(estimate=estimate)

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_txn_estimates', 200)
        return render(request, templatespath.template_u_txn_estimates, context)     

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                customer_id = request.POST.get('customerid')
                name = request.POST.get('customername')
                vehicle_id = request.POST.get('vehicle')
                estimatedate = request.POST.get('estimatedate')
                pono = request.POST.get('pono')
                podate = request.POST.get('podate') or None
                podate = datetime.strptime(podate, "%Y-%m-%d").date() if podate else None
                comments = request.POST.get('comments')

                if not customer_id or not vehicle_id:
                    raise ValueError("Customer and Vehicle are required.")

                # Fetch related objects
                customer = get_object_or_404(Customer, id=customer_id)
                vehicle = get_object_or_404(Vehicle, id=vehicle_id)

                if estimate:
                    estimate.estimatedate = estimatedate
                    estimate.pono = pono
                    estimate.podate = podate
                    estimate.customer = customer
                    estimate.name = name
                    estimate.vehicle = vehicle
                    estimate.amount = float(request.POST.get('amount', 0))
                    estimate.comments = comments
                    # Status is only changed from the listing page, not during update
                    estimate.save()

                    relEstimateProductCatalogues.objects.filter(estimate=estimate).delete()
                    relEstimateService.objects.filter(estimate=estimate).delete()
                else:
                    estimate = Estimate.objects.create(
                        garage_id=context['garage_id'],
                        estimatedate=estimatedate,
                        pono=pono,
                        podate=podate,
                        customer=customer,
                        name=name,
                        vehicle=vehicle
                    )

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
                        quantity = int(fromdb_part_quantities[i]) if i < len(fromdb_part_quantities) and fromdb_part_quantities[i] else 1
                        relEstimateProductCatalogues.objects.create(
                            estimate=estimate,
                            part=part,
                            part_source='inventory',
                            part_name=part.name if part else '',
                            part_value=fromdb_part_values[i] or 0,
                            part_tax=fromdb_part_taxes[i] or 0,
                            part_discount=fromdb_part_discounts[i] or 0,
                            quantity=quantity
                        )

                fromuser_part_names = request.POST.getlist('fromuser_partname')
                fromuser_part_values = request.POST.getlist('fromuser_partvalue')
                fromuser_part_taxes = request.POST.getlist('fromuser_parttax')
                fromuser_part_discounts = request.POST.getlist('fromuser_partdiscount')

                for i in range(len(fromuser_part_names)):
                    if fromuser_part_names[i]:
                        relEstimateProductCatalogues.objects.create(
                            estimate=estimate,
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
                        relEstimateService.objects.create(
                            estimate=estimate,
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
                                notes='external estimate'
                            ) 

                        relEstimateService.objects.create(
                            estimate=estimate,
                            service=service,
                            service_source='service',
                            service_name=service.name if service else '',
                            service_value=fromuser_service_values[i] or 0,
                            service_tax=fromuser_service_taxes[i] or 0,
                            service_discount=fromuser_service_discounts[i] or 0
                        )

                messages.success(request, f"Estimate {estimate.estimateid} {'updated' if estimate else 'created'} successfully")
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_txn_estimates', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path) 


@managesession.check_session_timeout
def d_txn_estimates(request, context):
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    estimate_obj = get_object_or_404(Estimate, id=id)
                    if estimate_obj:
                        deleted_data.append(estimate_obj.id) 
                        estimate_obj.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} estimate deleted"
                    sts = True
                else:
                    msg = "Failed to delete estimate"
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
def u_txn_estimates_status(request, context):
    """Update estimate status via AJAX"""
    if request.method == 'POST':
        try:
            estimate_id = request.POST.get('estimate_id')
            status = request.POST.get('status')
            
            # Validate status
            valid_statuses = ['created', 'dispatched']
            if status not in valid_statuses:
                return JsonResponse({'success': False, 'message': 'Invalid status value'})
            
            # Get the estimate
            estimate = get_object_or_404(Estimate, id=estimate_id)
            current_status = estimate.status.lower()
            
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
            
            # Update the estimate status
            estimate.status = status
            estimate.save()
            
            # Log the audit
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}, Updated estimate status to {status}', 'u_txn_estimates_status', 200)
            
            return JsonResponse({'success': True})
        except Exception as e:
            logging.error(f"Error updating estimate status: {str(e)}")
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


@managesession.check_session_timeout
def v_txn_estimates(request, context, id=None):
    """View estimate details in a printable/downloadable format"""
    try:
        # Check if id was passed as a parameter or in the URL
        if id is None and 'id' in request.GET:
            id = request.GET.get('id')
            
        # Get the estimate object
        estimate = get_object_or_404(Estimate, id=id)
        
        # Calculate estimate summary values
        subtotal = 0
        taxable_amount = 0
        tax_amount = 0
        discount_amount = 0
        
        # Calculate service amounts
        for service in estimate.estimate_services.all():
            service_value = float(service.service_value or 0)
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
        for part in estimate.estimate_product_catalogues.all():
            part_value = float(part.part_value or 0)
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
        
        # Add calculated values to the estimate object
        estimate.subtotal = round(subtotal, 2)
        estimate.taxable_amount = round(taxable_amount, 2)
        estimate.tax_amount = round(tax_amount, 2)
        estimate.discount_amount = round(discount_amount, 2)
        estimate.total_amount = round(taxable_amount + tax_amount, 2)
        
        # Add the estimate to the context
        context['estimate'] = estimate
        
        # Log the audit
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'v_txn_estimates', 200)
        
        # Render the estimate view template
        return render(request, templatespath.template_v_txn_estimates, context)
    
    except Exception as e:
        # Log the error
        logging.error(f"Error viewing estimate: {str(e)}")
        messages.error(request, f"Error viewing estimate: {str(e)}")
        return redirect('r-txn-estimates')