from django.shortcuts import render, redirect, get_object_or_404
from django.core.exceptions import ValidationError
from django.contrib import messages
from django.http import JsonResponse
from django.db import transaction
from django.db.models import Q
from django.core.paginator import Paginator
from GMSApp.modules import templatespath, managesession, audit
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from GMSApp.models import Customer, Vehicle
import logging,json
from django.db.models import Count


@managesession.check_session_timeout
def r_prf_customers(request, context):

    if request.method == 'GET':
        searchby_name = request.GET.get('searchby_name')
        searchby_phone = request.GET.get('searchby_phone')
        searchby_vehiclenumber = request.GET.get('searchby_vehiclenumber')

        # Build dynamic filter conditions
        customer_filter = Q(garage_id=context['garage_id'])

        if searchby_name:
            customer_filter &= Q(name__icontains=searchby_name)

        if searchby_phone:
            customer_filter &= Q(phone__icontains=searchby_phone)

        # Fetch Customer with combined filters
        customer_objs = (
            Customer.objects
            .filter(customer_filter)
            .annotate(vehicle_count=Count('vehicle'))
            .order_by('-vehicle_count')
        )

        # Pagination
        paginator = Paginator(customer_objs, 100)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)

        context['customer_objs'] = page_obj
        
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_prf_customers', 200)
        return render(request, templatespath.template_r_prf_customers, context)


@managesession.check_session_timeout
def c_prf_customers(request, context):
    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                name = request.POST.get('name')
                gst = request.POST.get('gst')
                address = request.POST.get('address')
                email = request.POST.get('email')
                phone = request.POST.get('phone')
                alt_phone = request.POST.get('alt_phone')
                pincode = request.POST.get('pincode')

                # Check if customer with this phone number already exists
                existing_customer = Customer.objects.filter(
                    garage_id=context['garage_id'],
                    phone=phone
                ).first()
                
                use_existing = request.POST.get('use_existing', 'false').lower() == 'true'
                
                if existing_customer and not use_existing:
                    return JsonResponse({
                        'status': False, 
                        'message': 'A customer with this phone number already exists. Would you like to use the existing customer?',
                        'customer_id': existing_customer.id,
                        'existing_customer': {
                            'id': existing_customer.id,
                            'name': existing_customer.name,
                            'phone': existing_customer.phone,
                            'email': existing_customer.email,
                            'address': existing_customer.address
                        }
                    })
                elif existing_customer and use_existing:
                    # Return existing customer
                    msg = f"Using existing customer '{existing_customer.name}'"
                    audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', msg, 200)
                    return JsonResponse({'status': True, 'message': msg, 'customer_id': existing_customer.id})

                # Create new customer
                customer_data = Customer.objects.create(
                    garage_id=context['garage_id'],
                    name=name,
                    gst=gst,
                    address=address,
                    email=email,
                    phone=phone,
                    alt_phone=alt_phone,
                    pincode=pincode,
                )

                msg = f"Customer '{customer_data.name}' created successfully"

                # Audit logging
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', msg, 200)
                return JsonResponse({'status': True, 'message': msg, 'customer_id': customer_data.id})      

        except (ValidationError, Exception) as e:
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return JsonResponse({'status': False, 'message': error_msg, 'customer_id': None})   


@managesession.check_session_timeout
def u_prf_customers(request, context, id):
    customer_obj = get_object_or_404(Customer, id=id)
    context['customer_obj'] = customer_obj

    if request.method == 'GET':
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_prf_customers', 200)
        return render(request, templatespath.template_u_prf_customers, context)

    if request.method == 'POST':
        try:
            with transaction.atomic():
                updated = False  # Flag to track if any value is updated

                # Helper function to update fields only if changed
                def update_field(obj, field, new_value):
                    nonlocal updated
                    if getattr(obj, field) != new_value:
                        setattr(obj, field, new_value)
                        updated = True

                # Extract form data
                name = request.POST.get('name')
                phone = request.POST.get('phone')
                alt_phone = request.POST.get('alt_phone')
                email = request.POST.get('email')
                pincode = request.POST.get('pincode')
                address = request.POST.get('address')

                # Update fields if changed
                update_field(customer_obj, "name", name)
                update_field(customer_obj, "phone", phone)
                update_field(customer_obj, "alt_phone", alt_phone)
                update_field(customer_obj, "email", email)
                update_field(customer_obj, "pincode", pincode)
                update_field(customer_obj, "address", address)

                # Save only if any field was updated
                if updated:
                    customer_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.") 

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_prf_customers', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path)  



@managesession.check_session_timeout
def u_prf_customers_all(request, context, id):
    customer_obj = get_object_or_404(Customer, id=id)
    context['customer_obj'] = customer_obj

    if request.method == 'GET':
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_prf_customers', 200)
        return render(request, templatespath.template_u_prf_customers_all, context)

    if request.method == 'POST':
        try:
            with transaction.atomic():
                updated = False  # Flag to track if any value is updated

                # Helper function to update fields only if changed
                def update_field(obj, field, new_value):
                    nonlocal updated
                    if getattr(obj, field) != new_value:
                        setattr(obj, field, new_value)
                        updated = True

                # Extract form data
                name = request.POST.get('name')
                gst = request.POST.get('gst')
                address = request.POST.get('address')
                email = request.POST.get('email')
                phone = request.POST.get('phone')
                pincode = request.POST.get('pincode')

                # Update fields if changed
                update_field(customer_obj, "name", name)
                update_field(customer_obj, "gst", gst)
                update_field(customer_obj, "address", address)
                update_field(customer_obj, "email", email)
                update_field(customer_obj, "phone", phone)
                update_field(customer_obj, "pincode", pincode)

                # Save only if any field was updated
                if updated:
                    customer_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.") 

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_prf_customers', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path)

@managesession.check_session_timeout
def d_prf_customers(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    customer_obj = get_object_or_404(Customer, id=id)
                    if customer_obj:
                        deleted_data.append(customer_obj.id) 
                        customer_obj.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} customers deleted"
                    sts = True
                else:
                    msg = "Failed to delete customers"
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
def s_prf_customers_vehicles(request, context):
    if request.method == 'POST':
        try:
            with transaction.atomic():
                data = json.loads(request.body)
                phone = data.get('phone')

                customer = Customer.objects.filter(garage_id=context['garage_id'], phone=phone).first()

                if customer:
                    # Fetch related vehicles
                    vehicles = Vehicle.objects.filter(customer=customer).prefetch_related('jobcardbrand', 'jobcardmodel')
                    
                    # Prepare vehicle options
                    vehicle_options = [{"id": v.id, "license_plate_no": v.license_plate_no, "jobcardbrand": v.jobcardbrand.displayname if v.jobcardbrand else v.make, "jobcardmodel": v.jobcardmodel.displayname if v.jobcardmodel else v.model} for v in vehicles]

                    msg = f"Customer found: {customer.name or 'N/A'}"
                    sts = True
                    data = {
                        'id': customer.id,
                        'name': customer.name,
                        'email': customer.email,
                        'phone': customer.phone,
                        'alt_phone': customer.alt_phone,
                        'address': customer.address,
                        'pincode': customer.pincode,
                        'gst': customer.gst,
                        'vehicles': vehicle_options,  # Include vehicles in the response
                        'existing_customer': True  # Flag to indicate existing customer
                    }
                else:
                    msg = "No customer found with this phone. You can add a new customer or add vehicle to existing customer."
                    sts = False
                    data = {'existing_customer': False}

                # Audit logging
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', msg, 200)
                return JsonResponse({'status': sts, 'message': msg, 'data': data})

        except (ValidationError, Exception) as e:
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return JsonResponse({'status': False, 'message': error_msg}) 


@managesession.check_session_timeout
@csrf_exempt
def search_customers_by_phone(request, context):
    """Search for customers by phone number to prevent duplicates"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            phone = data.get('phone', '').strip()
            
            if not phone:
                return JsonResponse({'status': False, 'message': 'Phone number is required'})
            
            customers = Customer.objects.filter(
                garage_id=context['garage_id'],
                phone__icontains=phone
            ).values('id', 'name', 'phone', 'email', 'address', 'alt_phone', 'pincode')
            
            return JsonResponse({
                'status': True,
                'customers': list(customers),
                'count': len(customers)
            })
            
        except Exception as e:
            return JsonResponse({'status': False, 'message': str(e)})
    
    return JsonResponse({'status': False, 'message': 'Invalid request method'})


@managesession.check_session_timeout
def get_customer_list(request, context):
    """Get list of all customers for dropdown selection"""
    try:
        customers = Customer.objects.filter(
            garage_id=context['garage_id']
        ).values('id', 'name', 'phone', 'email').order_by('name')
        
        return JsonResponse({
            'status': True,
            'customers': list(customers)
        })
    except Exception as e:
        return JsonResponse({'status': False, 'message': str(e)}) 


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def update_customer_details(request, context):
    try:
        with transaction.atomic():
            customerid = request.POST.get('customerid')
            name = request.POST.get('name')
            phone = request.POST.get('phone')
            alt_phone = request.POST.get('alt_phone')
            email = request.POST.get('email')
            pincode = request.POST.get('pincode')
            address = request.POST.get('address')
            
            # Fix: Changed this condition to check if customerid is NOT provided
            if not customerid:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Customer ID is required'
                }, status=400)
                
            try:
                customer = Customer.objects.get(id=customerid)
            except Customer.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Customer not found'
                }, status=404)  # Changed status to 404 for not found

            if name:
                customer.name = name
            if phone:
                customer.phone = phone
            if alt_phone:
                customer.alt_phone = alt_phone
            if email:
                customer.email = email
            if address:
                customer.address = address
            if pincode:
                customer.pincode = pincode
            customer.save()
            
            return JsonResponse({
                'status': 'success',
                'id': customer.id,
                'message': 'Customer updated successfully'
            })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)