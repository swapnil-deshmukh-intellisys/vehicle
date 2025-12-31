from django.shortcuts import render, redirect, get_object_or_404
from django.core.exceptions import ValidationError
from django.contrib import messages
from django.http import JsonResponse
from django.http import HttpResponse
from django.db import transaction
from django.db.models import Q, Max, Count
from django.conf import settings
from django.core.paginator import Paginator
from GMSApp.modules import templatespath, managesession, audit, customfunctions
from GMSApp.models import Customer, Vehicle
from datetime import datetime, timezone, timedelta
from django.db.models.functions import TruncMonth, ExtractYear, ExtractMonth
from calendar import month_name
from collections import defaultdict
from django.utils.timezone import now
import logging, os, csv

from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods


@managesession.check_session_timeout
def c_prf_vehicles(request, context, id):
    customer_obj = get_object_or_404(Customer, id=id)
    if request.method == 'POST':
        try:
            with transaction.atomic():
                model = request.POST.get('model')
                make = request.POST.get('make')
                license_plate_no = request.POST.get('license_plate_no')
                external_bikeid = request.POST.get('external_bikeid')
                registration_no = request.POST.get('registration_no')
                year_of_manufacture = request.POST.get('year_of_manufacture') or None
                fuel_type = request.POST.get('fuel_type')
                transmission_type = request.POST.get('transmission_type')
                engine_no = request.POST.get('engine_no')
                chassis_no = request.POST.get('chassis_no')
                vin_no = request.POST.get('vin_no')
                color = request.POST.get('color')
                reg_state = request.POST.get('reg_state')
                reg_exp = request.POST.get('reg_exp') or None

                # Check for duplicate vehicle registration number within the same garage
                if registration_no:
                    existing_vehicle = Vehicle.objects.filter(
                        garage_id=context['garage_id'],
                        registration_no=registration_no
                    ).exclude(customer=customer_obj).first()
                    
                    if existing_vehicle:
                        return JsonResponse({
                            'status': False, 
                            'message': f'A vehicle with registration number {registration_no} already exists for another customer.',
                            'vehicle_id': None
                        })

                # Convert dates
                if reg_exp:
                    reg_exp = datetime.strptime(reg_exp, "%Y-%m-%d").date()    

                image_path = None
                if 'upload_image' in request.FILES:
                    vehicle_file = request.FILES['upload_image']
                    trimmed_filename = vehicle_file.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"vehicle_{current_datetime}{ext}"
                    directory = 'static/custom-assets/vehicle/images/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in vehicle_file.chunks():
                            destination.write(chunk)
                    image_path = file_path    

                # Create Vehicle For Customer
                vehicle_data = Vehicle.objects.create(                   
                    garage_id=context['garage_id'],
                    customer=customer_obj,
                    garage=None,
                    model=model,
                    make=make,
                    license_plate_no=license_plate_no,
                    external_bikeid=external_bikeid,
                    registration_no=registration_no,
                    year_of_manufacture=year_of_manufacture,
                    fuel_type=fuel_type,
                    transmission_type=transmission_type,
                    engine_no=engine_no,
                    chassis_no=chassis_no,
                    vin_no=vin_no,
                    color=color,
                    reg_state=reg_state,
                    reg_exp=reg_exp,
                    image_path=image_path,
                )
                
                msg = f"Vehicle '{model}' added successfully to customer '{customer_obj.name}'"

                # Audit logging
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', msg, 200)
                return JsonResponse({'status': True, 'message': msg, 'vehicle_id': vehicle_data.id})      

        except (ValidationError, Exception) as e:
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return JsonResponse({'status': False, 'message': error_msg, 'vehicle_id': None}) 


@managesession.check_session_timeout
def u_prf_vehicles(request, context, id):
    vehicle_obj = get_object_or_404(Vehicle, id=id)

    if request.method == 'POST':
        try:
            with transaction.atomic():

                # Handle file upload
                if 'upload_image' in request.FILES:
                    vehicle_file = request.FILES['upload_image']
                    trimmed_filename = vehicle_file.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"vehicle_{current_datetime}{ext}"
                    directory = 'static/custom-assets/vehicle/images/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Delete old file if exists
                    if vehicle_obj.image_path:
                        old_img_path = os.path.join(settings.BASE_DIR, vehicle_obj.image_path)
                        if os.path.exists(old_img_path):
                            os.remove(old_img_path)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in vehicle_file.chunks():
                            destination.write(chunk)
                    # Update file path
                    vehicle_obj.image_path = file_path
                    vehicle_obj.save()
                    messages.success(request, "Vehicle image updated successfully!")
                else:                   
                    updated = False  # Flag to track if any value is updated

                    # Helper function to update fields only if changed
                    def update_field(obj, field, new_value):
                        nonlocal updated
                        if getattr(obj, field) != new_value:
                            setattr(obj, field, new_value)
                            updated = True
                    # Extract form data        
                    model = request.POST.get('model')
                    make = request.POST.get('make')
                    license_plate_no = request.POST.get('license_plate_no')
                    external_bikeid = request.POST.get('external_bikeid')
                    registration_no = request.POST.get('registration_no')
                    year_of_manufacture = request.POST.get('year_of_manufacture') or None
                    fuel_type = request.POST.get('fuel_type')
                    transmission_type = request.POST.get('transmission_type')
                    engine_no = request.POST.get('engine_no')
                    chassis_no = request.POST.get('chassis_no')
                    vin_no = request.POST.get('vin_no')
                    color = request.POST.get('color')
                    reg_state = request.POST.get('reg_state')
                    reg_exp = request.POST.get('reg_exp') or None

                    # # Convert dates
                    # if year_of_manufacture:
                    #     year_of_manufacture = datetime.strptime(year_of_manufacture, "%Y-%m-%d").date()
                    if reg_exp:
                        reg_exp = datetime.strptime(reg_exp, "%Y-%m-%d").date()    

                    # Update fields if changed
                    update_field(vehicle_obj, "model", model)
                    update_field(vehicle_obj, "make", make)
                    update_field(vehicle_obj, "license_plate_no", license_plate_no)
                    update_field(vehicle_obj, "external_bikeid", external_bikeid)
                    update_field(vehicle_obj, "registration_no", registration_no)
                    update_field(vehicle_obj, "year_of_manufacture", year_of_manufacture)
                    update_field(vehicle_obj, "fuel_type", fuel_type)
                    update_field(vehicle_obj, "transmission_type", transmission_type)
                    update_field(vehicle_obj, "engine_no", engine_no)
                    update_field(vehicle_obj, "chassis_no", chassis_no)
                    update_field(vehicle_obj, "vin_no", vin_no)
                    update_field(vehicle_obj, "color", color)
                    update_field(vehicle_obj, "reg_state", reg_state)
                    update_field(vehicle_obj, "reg_exp", reg_exp)

                    # Save only if any field was updated
                    if updated:
                        vehicle_obj.save()
                        messages.success(request, "Data updated successfully!")
                    else:
                        messages.info(request, "No changes were made.") 

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_prf_vehicles', 200)
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect('u-prf-customers', vehicle_obj.customer.id)  
    # ✅ GET request → render the form
    context_data = {
        "vehicle": vehicle_obj,
        "usertype": context['usertype'],
        "useruiacl": context['useruiacl'],
        "garage_id": context['garage_id'],
    }
    # return render(request, templatespath.PROFILE_VEHICLES_U_VEHICLES, context_data)
    return render(request, templatespath.PROFILE_VEHICLES_V_VEHICLES, context_data)

@managesession.check_session_timeout
def d_prf_vehicles(request, context, id):
    try:
        with transaction.atomic():
            vehicle_obj = get_object_or_404(Vehicle, id=id)
            vehicle_obj.delete()

            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'Vehicle deleted successfully', 200)
            messages.success(request, f"Vehicle '{vehicle_obj.model}' deleted successfully")
    except (ValidationError, Exception) as e:
        # Determine error message based on exception type
        error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
        messages.error(request, error_msg)
        logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
    
    return redirect('u-prf-customers', vehicle_obj.customer.id)


@managesession.check_session_timeout
def r_vehicles(request, context):
    """View function for listing all vehicles"""
    try:
        # Get all vehicles for the current garage
        vehicles = Vehicle.objects.filter(
            garage_id=context['garage_id']
        ).select_related('customer').order_by('-updated_at')
        
        # Search functionality
        search_query = request.GET.get('search', '')
        if search_query:
            vehicles = vehicles.filter(
                Q(make__icontains=search_query) | 
                Q(model__icontains=search_query) | 
                Q(license_plate_no__icontains=search_query) | 
                Q(registration_no__icontains=search_query) |
                Q(customer__name__icontains=search_query)
            )
        
        # Pagination
        paginator = Paginator(vehicles, 10)  # Show 10 vehicles per page
        page_number = request.GET.get('page', 1)
        vehicles_page = paginator.get_page(page_number)
        
        # Context data
        context_data = {
            'vehicles': vehicles_page,
            'search_query': search_query,
            'usertype': context['usertype'],
            'useruiacl': context['useruiacl'],
            'garage_id': context['garage_id'],
            'business_logo':context['business_logo']
        }
        
        # Audit logging
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_vehicles', 200)
        
        return render(request, templatespath.PROFILE_VEHICLES_R_VEHICLES, context_data)
    
    except Exception as e:
        error_msg = str(e)
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
        messages.error(request, error_msg)
        logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        return render(request, templatespath.PROFILE_VEHICLES_R_VEHICLES, {'error': error_msg})


# @managesession.check_session_timeout
# def c_vehicles(request, context):
#     """View function for creating a new vehicle"""
#     try:
#         # Get all customers for dropdown
#         customers = Customer.objects.filter(
#             garage_id=context['garage_id']
#         ).order_by('name')
        
#         if request.method == 'POST':
#             try:
#                 with transaction.atomic():
#                     # Extract form data
#                     make = request.POST.get('make')
#                     model = request.POST.get('model')
#                     variant = request.POST.get('variant')
#                     year = request.POST.get('year')
#                     color = request.POST.get('color')
#                     registration_number = request.POST.get('registration_number')
#                     vin = request.POST.get('vin')
#                     registration_date = request.POST.get('registration_date') or None
#                     registration_expiry = request.POST.get('registration_expiry') or None
#                     engine_type = request.POST.get('engine_type')
#                     transmission = request.POST.get('transmission')
#                     fuel_type = request.POST.get('fuel_type')
#                     body_type = request.POST.get('body_type')
#                     mileage = request.POST.get('mileage')
#                     last_service_date = request.POST.get('last_service_date') or None
#                     owner_id = request.POST.get('owner')
#                     status = request.POST.get('status')
#                     notes = request.POST.get('notes')
                    
#                     # Convert dates
#                     if registration_date:
#                         registration_date = datetime.strptime(registration_date, "%Y-%m-%d").date()
#                     if registration_expiry:
#                         registration_expiry = datetime.strptime(registration_expiry, "%Y-%m-%d").date()
#                     if last_service_date:
#                         last_service_date = datetime.strptime(last_service_date, "%Y-%m-%d").date()
                    
#                     # Get customer object
#                     customer = get_object_or_404(Customer, id=owner_id)
                    
#                     # Handle image upload
#                     image_path = None
#                     if 'vehicle_image' in request.FILES:
#                         vehicle_file = request.FILES['vehicle_image']
#                         trimmed_filename = vehicle_file.name.strip().replace(' ', '_')
#                         current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
#                         _name, ext = os.path.splitext(trimmed_filename)
#                         new_filename = f"vehicle_{current_datetime}{ext}"
#                         directory = 'static/custom-assets/vehicle/images/'  # Target directory
#                         file_path = os.path.join(directory, new_filename)
#                         # Ensure the directory exists
#                         os.makedirs(directory, exist_ok=True)
#                         # Save the uploaded file to the filesystem
#                         with open(file_path, 'wb+') as destination:
#                             for chunk in vehicle_file.chunks():
#                                 destination.write(chunk)
#                         image_path = file_path
                    
#                     # Create new vehicle
#                     vehicle = Vehicle.objects.create(
#                         garage_id=context['garage_id'],
#                         customer=customer,
#                         make=make,
#                         model=model,
#                         license_plate_no=registration_number,  # Map to existing field
#                         registration_no=registration_number,
#                         year_of_manufacture=year,
#                         color=color,
#                         fuel_type=fuel_type,
#                         transmission_type=transmission,
#                         vin_no=vin,
#                         image_path=image_path,
#                         notes=notes,
#                         status=status
#                     )
                    
#                     msg = f"Vehicle '{make} {model}' created successfully"
#                     audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', msg, 200)
#                     messages.success(request, msg)
#                     return redirect('r-vehicles')
                    
#             except (ValidationError, Exception) as e:
#                 error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
#                 audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
#                 messages.error(request, error_msg)
#                 logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        
#         # Context data for the form
#         context_data = {
#             'customers': customers,
#             'usertype': context['usertype'],
#             'useruiacl': context['useruiacl'],
#             'garage_id': context['garage_id'],
#         }
        
#         return render(request, templatespath.PROFILE_VEHICLES_C_VEHICLES, context_data)
        
#     except Exception as e:
#         error_msg = str(e)
#         audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
#         messages.error(request, error_msg)
#         logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
#         return render(request, templatespath.PROFILE_VEHICLES_C_VEHICLES, {'error': error_msg})


# @managesession.check_session_timeout
# def v_vehicles(request, context, id):
#     """View function for viewing vehicle details"""
#     try:
#         # Get the vehicle object
#         vehicle = get_object_or_404(Vehicle, id=id)
        
#         # Create placeholder service history data
#         service_history = [
#             {
#                 'date': (datetime.now() - timedelta(days=30)).date(),
#                 'service_type': 'Oil Change',
#                 'description': 'Regular oil change and filter replacement',
#                 'cost': 45.00,
#                 'technician': 'John Smith'
#             },
#             {
#                 'date': (datetime.now() - timedelta(days=90)).date(),
#                 'service_type': 'Tire Rotation',
#                 'description': 'Rotated tires and balanced wheels',
#                 'cost': 35.00,
#                 'technician': 'Mike Johnson'
#             }
#         ]
        
#         # Create placeholder documents data
#         documents = [
#             {
#                 'name': 'Insurance Policy',
#                 'upload_date': (datetime.now() - timedelta(days=60)).date(),
#                 'expiry_date': (datetime.now() + timedelta(days=305)).date(),
#                 'file_type': 'PDF'
#             },
#             {
#                 'name': 'Registration Certificate',
#                 'upload_date': (datetime.now() - timedelta(days=120)).date(),
#                 'expiry_date': (datetime.now() + timedelta(days=245)).date(),
#                 'file_type': 'PDF'
#             }
#         ]
        
#         # Create placeholder maintenance schedule data
#         maintenance_schedule = [
#             {
#                 'service_type': 'Oil Change',
#                 'due_date': (datetime.now() + timedelta(days=30)).date(),
#                 'due_mileage': 5000,
#                 'status': 'Due Soon'
#             },
#             {
#                 'service_type': 'Brake Service',
#                 'due_date': (datetime.now() + timedelta(days=90)).date(),
#                 'due_mileage': 10000,
#                 'status': 'Scheduled'
#             }
#         ]
        
#         # Context data
#         context_data = {
#             'vehicle': vehicle,
#             'service_history': service_history,
#             'documents': documents,
#             'maintenance_schedule': maintenance_schedule,
#             'usertype': context['usertype'],
#             'useruiacl': context['useruiacl'],
#             'garage_id': context['garage_id'],
#         }
        
#         # Audit logging
#         audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'v_vehicles', 200)
        
#         return render(request, templatespath.PROFILE_VEHICLES_V_VEHICLES, context_data)
    
#     except Exception as e:
#         error_msg = str(e)
#         audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
#         messages.error(request, error_msg)
#         logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
#         return redirect('r-prf-vehicles')
    


# @managesession.check_session_timeout
# def u_vehicles(request, context, id):
#     """View function for updating a vehicle"""
#     try:
#         # Get the vehicle object
#         vehicle = get_object_or_404(Vehicle, id=id)
        
#         # Get all customers for dropdown
#         customers = Customer.objects.filter(
#             garage_id=context['garage_id']
#         ).order_by('name')
        
#         if request.method == 'POST':
#             try:
#                 with transaction.atomic():
#                     # Extract form data
#                     make = request.POST.get('make')
#                     model = request.POST.get('model')
#                     variant = request.POST.get('variant')
#                     year = request.POST.get('year')
#                     color = request.POST.get('color')
#                     registration_number = request.POST.get('registration_number')
#                     vin = request.POST.get('vin')
#                     registration_date = request.POST.get('registration_date') or None
#                     registration_expiry = request.POST.get('registration_expiry') or None
#                     engine_type = request.POST.get('engine_type')
#                     transmission = request.POST.get('transmission')
#                     fuel_type = request.POST.get('fuel_type')
#                     body_type = request.POST.get('body_type')
#                     mileage = request.POST.get('mileage')
#                     last_service_date = request.POST.get('last_service_date') or None
#                     owner_id = request.POST.get('owner')
#                     status = request.POST.get('status')
#                     notes = request.POST.get('notes')
                    
#                     # Convert dates
#                     if registration_date:
#                         registration_date = datetime.strptime(registration_date, "%Y-%m-%d").date()
#                     if registration_expiry:
#                         registration_expiry = datetime.strptime(registration_expiry, "%Y-%m-%d").date()
#                     if last_service_date:
#                         last_service_date = datetime.strptime(last_service_date, "%Y-%m-%d").date()
                    
#                     # Get customer object
#                     customer = get_object_or_404(Customer, id=owner_id)
                    
#                     # Handle image upload
#                     if 'vehicle_image' in request.FILES:
#                         vehicle_file = request.FILES['vehicle_image']
#                         trimmed_filename = vehicle_file.name.strip().replace(' ', '_')
#                         current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
#                         _name, ext = os.path.splitext(trimmed_filename)
#                         new_filename = f"vehicle_{current_datetime}{ext}"
#                         directory = 'static/custom-assets/vehicle/images/'  # Target directory
#                         file_path = os.path.join(directory, new_filename)
#                         # Ensure the directory exists
#                         os.makedirs(directory, exist_ok=True)
#                         # Delete old file if exists
#                         if vehicle.image_path:
#                             old_img_path = os.path.join(settings.BASE_DIR, vehicle.image_path)
#                             if os.path.exists(old_img_path):
#                                 os.remove(old_img_path)
#                         # Save the uploaded file to the filesystem
#                         with open(file_path, 'wb+') as destination:
#                             for chunk in vehicle_file.chunks():
#                                 destination.write(chunk)
#                         # Update file path
#                         vehicle.image_path = file_path
                    
#                     # Update vehicle fields
#                     vehicle.customer = customer
#                     vehicle.make = make
#                     vehicle.model = model
#                     vehicle.license_plate_no = registration_number
#                     vehicle.registration_no = registration_number
#                     vehicle.year_of_manufacture = year
#                     vehicle.color = color
#                     vehicle.fuel_type = fuel_type
#                     vehicle.transmission_type = transmission
#                     vehicle.vin_no = vin
#                     vehicle.notes = notes
#                     vehicle.status = status
#                     vehicle.save()
                    
#                     msg = f"Vehicle '{make} {model}' updated successfully"
#                     audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', msg, 200)
#                     messages.success(request, msg)
#                     # return redirect('v-vehicles', id=vehicle.id)
#                     return redirect('v-prf-vehicles', id=vehicle.id)
                
                
                    
#             except (ValidationError, Exception) as e:
#                 error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
#                 audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
#                 messages.error(request, error_msg)
#                 logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
#                 return redirect('r-prf-vehicles')
        
#         # Context data for the form
#         context_data = {
#             'vehicle': vehicle,
#             'customers': customers,
#             'usertype': context['usertype'],
#             'useruiacl': context['useruiacl'],
#             'garage_id': context['garage_id'],
#         }
        
#         return render(request, templatespath.PROFILE_VEHICLES_U_VEHICLES, context_data)
        
#     except Exception as e:
#         error_msg = str(e)
#         audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
#         messages.error(request, error_msg)
#         logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
#         return redirect('r-prf-vehicles')


@managesession.check_session_timeout
def d_vehicles(request, context):
    """View function for deleting vehicles"""
    if request.method == 'POST':
        try:
            with transaction.atomic():
                ids = request.POST.getlist('id[]')
                
                if not ids:
                    return JsonResponse({'status': False, 'message': 'No vehicles selected for deletion'})
                
                # Delete selected vehicles
                Vehicle.objects.filter(id__in=ids).delete()
                
                msg = f"Selected vehicles deleted successfully"
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', msg, 200)
                return JsonResponse({'status': True, 'message': msg})
                
        except Exception as e:
            error_msg = str(e)
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return JsonResponse({'status': False, 'message': error_msg})
    
    return JsonResponse({'status': False, 'message': 'Invalid request method'})


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def update_vehicle_details(request, context):
    try:
        with transaction.atomic():
            vehicleid = request.POST.get('vehicleid')
            registration_no = request.POST.get('registration_no')
            make = request.POST.get('make')
            model = request.POST.get('model')
            year_of_manufacture = request.POST.get('year_of_manufacture') or None
            color = request.POST.get('color')
            engine_number = request.POST.get('engine_number')
            chassis_number = request.POST.get('chassis_number')
            
            # Fix: Changed this condition to check if vehicleid is NOT provided
            if not vehicleid:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Vehicle ID is required'
                }, status=400)
                
            try:
                vehicle = Vehicle.objects.get(id=vehicleid)
            except Vehicle.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Vehicle not found'
                }, status=404)  # Changed status to 404 for not found

            vehicle.make = make
            vehicle.model = model
            vehicle.license_plate_no = registration_no
            vehicle.registration_no = registration_no
            vehicle.year_of_manufacture = year_of_manufacture
            vehicle.color = color
            vehicle.engine_no = engine_number
            vehicle.chassis_no = chassis_number
            vehicle.save()
            
            return JsonResponse({
                'status': 'success',
                'id': vehicle.id,
                'message': 'Vehicle updated successfully'
            })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)    