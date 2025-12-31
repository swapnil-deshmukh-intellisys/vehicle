from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import  Garage, GarageService, UsersAccesses, ServiceCategory, RelGarageServiceCategory, City, GarageBusinessHours, VehicleType, RelGarageVehicleType
from GMSApp.modules import templatespath, managesession, audit, customfunctions
from django.conf import settings
from datetime import datetime
from decimal import Decimal
import logging, os


@managesession.check_session_timeout
def u_users_accesses_garage_id(request, context):
    if request.method == 'POST':
        try:
            with transaction.atomic():  
                # Extract form data
                garage_id = request.POST.get('garage')

                # First check if the record exists
                try:
                    # Try to get the existing record
                    user_access = UsersAccesses.objects.get(
                        user_id=context['userid'],
                        module='garage_id'
                    )
                    # Update the existing record
                    user_access.value = garage_id
                    user_access.save()
                except UsersAccesses.DoesNotExist:
                    # Create a new record if it doesn't exist
                    UsersAccesses.objects.create(
                        user_id=context['userid'],
                        module='garage_id',
                        value=garage_id
                    )

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_users_accesses_garage_id', 200) 
                messages.success(request,"Garage updated successfully.")
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        
        return redirect(request.META.get("HTTP_REFERER", "/")) 


@managesession.check_session_timeout
def r_accounts_garage(request, context):
    
    if request.method == 'GET': 
        # Get garage ID if user has access to a specific garage
        get_garage_id = customfunctions.get_users_accesses_garage_id(context['userid'])
        context['garage_id'] = get_garage_id['id'] if get_garage_id else None

        filter_garage_data = {}

        if context['usertype'] == 'business':
            garage = Garage.objects.filter(**filter_garage_data)
            page_obj = Paginator(garage, 100).get_page(request.GET.get('page'))
            context['garage'] = page_obj
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_accounts_garage', 200)
            return render(request, templatespath.template_accounts_garage_garage_r_garage, context) 
        elif context['usertype'] == 'admin':
            filter_garage_data['city_id__in']=context['allowed_city_ids']
            garage = Garage.objects.filter(**filter_garage_data)
            page_obj = Paginator(garage, 100).get_page(request.GET.get('page'))
            context['garage'] = page_obj
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_accounts_garage', 200)
            return render(request, templatespath.template_accounts_garage_garage_r_garage, context) 
        else:
            filter_garage_data['pk__in']=context['allowed_garage_ids']
            garage = Garage.objects.filter(**filter_garage_data)
            if garage.count() == 1:           
                garage_obj = get_object_or_404(Garage, id=garage.first().id)             
                context['garage_obj'] =  garage_obj
                context['selected_servicecategory_ids'] = list(garage_obj.rel_garage_servicecategory.values_list('servicecategory_id', flat=True))        
                
                context['servicecategory_objs'] = ServiceCategory.objects.filter(status='active')

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'v_accounts_garage', 200)
                return render(request, templatespath.template_accounts_garage_garage_v_garage, context)   
            else:  
                page_obj = Paginator(garage, 100).get_page(request.GET.get('page'))
                context['garage'] = page_obj
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_accounts_garage', 200)
                return render(request, templatespath.template_accounts_garage_garage_r_garage, context) 


@managesession.check_session_timeout
def c_accounts_garage(request, context):

    if request.method == 'GET':    
        context['servicecategory_objs'] = ServiceCategory.objects.filter(status='active')  
        context['vehicletype_objs'] = VehicleType.objects.all()

        if context['usertype'] == 'admin':
            context['city_objs'] = City.objects.filter(id__in=context['allowed_city_ids'],status='active')  
        else:
            context['city_objs'] = City.objects.filter(status='active')  

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_garage', 200)
        return render(request, templatespath.template_accounts_garage_garage_c_garage, context)

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                garage_name = request.POST.get('garage_name')
                garage_tagline = request.POST.get('garage_tagline')
                year_established = request.POST.get('year_established')
                # Convert empty string to None for year_established
                year_established = int(year_established) if year_established else None

                contact_person = request.POST.get('contact_person')
                contact_email = request.POST.get('contact_email')
                contact_phone = request.POST.get('contact_phone')
                alternate_phone = request.POST.get('alternate_phone')

                street_address = request.POST.get('street_address')
                city_id = request.POST.get('city_id')
                state = request.POST.get('state')
                pincode = request.POST.get('pincode')
                landmark = request.POST.get('landmark')
                location = request.POST.get('location')
                
                garage_description = request.POST.get('garage_description')
                website = request.POST.get('website')
                gst = request.POST.get('gst')                
                pan = request.POST.get('pan')
                aadhar = request.POST.get('aadhar')
                terms_conditions = request.POST.get('terms_conditions', '')
                
                
                service_radius = request.POST.get('service_radius')
                latitude = request.POST.get('latitude')
                longitude = request.POST.get('longitude')
                # Convert empty strings to None for decimal fields
                service_radius = Decimal(service_radius) if service_radius else None
                latitude = Decimal(latitude) if latitude else None
                longitude = Decimal(longitude) if longitude else None

                if not city_id:
                    raise ValidationError("City is required")
                city_obj = get_object_or_404(City, id=city_id)

                # Handle logo file upload
                logo_path = None
                if 'garage_logo' in request.FILES:
                    garage_logo = request.FILES['garage_logo']
                    trimmed_filename = garage_logo.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"garage_logo_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/garage/logo/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in garage_logo.chunks():
                            destination.write(chunk)
                    logo_path = file_path
                
                # Handle authorized signatory file upload
                signatory_path = None
                if 'authorized_signatory' in request.FILES:
                    signatory_file = request.FILES['authorized_signatory']
                    trimmed_filename = signatory_file.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"garage_signatory_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/garage/signatory/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in signatory_file.chunks():
                            destination.write(chunk)
                    signatory_path = file_path

                # Create record
                garage = Garage.objects.create(
                    # Garage Identity
                    name = garage_name,
                    logo = logo_path,
                    authorized_signatory = signatory_path,
                    tagline = garage_tagline,
                    year_established = year_established,
                    # Contact Information
                    contact_person = contact_person,
                    phone = contact_phone,
                    email = contact_email,
                    alt_phone = alternate_phone,
                    # Address fields
                    address = street_address,
                    radius = service_radius,
                    city = city_obj,
                    state = state,
                    postal_code = pincode,
                    landmark = landmark,
                    location = location,
                    # Additional Information
                    about = garage_description,
                    website = website, 
                    gst = gst,
                    pan = pan,
                    aadhar = aadhar,
                    terms_and_conditions = terms_conditions,
                    latitude = latitude,
                    longitude = longitude,
                )

                servicecategory_ids = request.POST.getlist("servicecategory")
                for servicecategory_id in servicecategory_ids:
                    RelGarageServiceCategory.objects.create(
                        garage=garage,
                        servicecategory_id=servicecategory_id
                    )
                
                vehicletype_ids = request.POST.getlist("vehicletype")
                for vehicletype_id in vehicletype_ids:
                    RelGarageVehicleType.objects.create(
                        garage=garage,
                        vehicletype_id=vehicletype_id
                    )
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_garage', 200) 
                messages.success(request,"Garage created successfully")
                return redirect('r-accounts-garage')
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)


@managesession.check_session_timeout
def v_accounts_garage(request, context, id):
    garage_obj = get_object_or_404(Garage, id=id)

    if request.method == 'GET': 
        context['garage_obj'] =  garage_obj
        context['selected_servicecategory_ids'] = list(garage_obj.rel_garage_servicecategory.values_list('servicecategory_id', flat=True))        
        
        context['servicecategory_objs'] = ServiceCategory.objects.filter(status='active')

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'v_accounts_garage', 200)
        return render(request, templatespath.template_accounts_garage_garage_v_garage, context)   


@managesession.check_session_timeout
def u_accounts_garage(request, context, id):
    garage_obj = get_object_or_404(Garage, id=id)
    context['garage_obj'] =  garage_obj

    if request.method == 'GET': 
        context['selected_servicecategory_ids'] = list(garage_obj.rel_garage_servicecategory.values_list('servicecategory_id', flat=True))
        context['servicecategory_objs'] = ServiceCategory.objects.filter(status='active')
        context['selected_vehicletype_ids'] = list(garage_obj.rel_garage_vehicletype.values_list('vehicletype_id', flat=True))
        context['vehicletype_objs'] = VehicleType.objects.all()
        
        if context['usertype'] == 'admin':
            context['city_objs'] = City.objects.filter(id__in=context['allowed_city_ids'],status='active')  
        else:
            context['city_objs'] = City.objects.filter(status='active')  

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_garage', 200)
        return render(request, templatespath.template_accounts_garage_garage_u_garage, context)        

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
                garage_name = request.POST.get('garage_name')
                garage_tagline = request.POST.get('garage_tagline')
                year_established = request.POST.get('year_established')
                # Convert empty string to None for year_established
                year_established = int(year_established) if year_established else None

                contact_person = request.POST.get('contact_person')
                contact_email = request.POST.get('contact_email')
                contact_phone = request.POST.get('contact_phone')
                alternate_phone = request.POST.get('alternate_phone')

                street_address = request.POST.get('street_address')
                city_id = request.POST.get('city_id')
                state = request.POST.get('state')
                pincode = request.POST.get('pincode')
                landmark = request.POST.get('landmark')
                location = request.POST.get('location')
                
                garage_description = request.POST.get('garage_description')
                position = int(request.POST.get('position', 0))
                website = request.POST.get('website')  
                gst = request.POST.get('gst')
                pan = request.POST.get('pan')
                aadhar = request.POST.get('aadhar')
                terms_conditions = request.POST.get('terms_conditions', '')
                
                service_radius = request.POST.get('service_radius')
                latitude = request.POST.get('latitude')
                longitude = request.POST.get('longitude')
                # Convert empty strings to None for decimal fields
                service_radius = Decimal(service_radius) if service_radius else None
                latitude = Decimal(latitude) if latitude else None
                longitude = Decimal(longitude) if longitude else None

                if not city_id:
                    raise ValidationError("City is required")
                city_obj = get_object_or_404(City, id=city_id)

                # Garage Identity
                update_field(garage_obj, "name", garage_name)
                update_field(garage_obj, "tagline", garage_tagline)
                update_field(garage_obj, "year_established", year_established)
                # Contact Information
                update_field(garage_obj, "contact_person", contact_person)
                update_field(garage_obj, "phone", contact_phone)
                update_field(garage_obj, "email", contact_email)
                update_field(garage_obj, "alt_phone", alternate_phone)
                # Address fields
                update_field(garage_obj, "address", street_address)
                update_field(garage_obj, "radius", service_radius)
                update_field(garage_obj, "city", city_obj)
                update_field(garage_obj, "state", state)
                update_field(garage_obj, "postal_code", pincode)
                update_field(garage_obj, "landmark", landmark)
                update_field(garage_obj, "location", location)
                # Additional Information
                update_field(garage_obj, "about", garage_description)
                update_field(garage_obj, "position", position)
                update_field(garage_obj, "website", website)
                update_field(garage_obj, "gst", gst)
                update_field(garage_obj, "pan", pan)
                update_field(garage_obj, "aadhar", aadhar)
                update_field(garage_obj, "terms_and_conditions", terms_conditions)
                update_field(garage_obj, "latitude", latitude)
                update_field(garage_obj, "longitude", longitude)
                
                # New fields - Only update if user is admin or business
                if context['usertype'] == 'admin' or context['usertype'] == 'business':
                    is_displayed = request.POST.get('is_displayed') == 'on'
                    is_exclusive = request.POST.get('is_exclusive') == 'on'
                    is_verified = request.POST.get('is_verified') == 'on'
                    is_offer = request.POST.get('is_offer') == 'on'
                    offer_text = request.POST.get('offer_text', '')
                    
                    update_field(garage_obj, "displayed", is_displayed)
                    update_field(garage_obj, "is_exclusive", is_exclusive)
                    update_field(garage_obj, "is_verified", is_verified)
                    update_field(garage_obj, "is_offer", is_offer)
                    update_field(garage_obj, "offer_text", offer_text if is_offer else '')      
                # Handle logo file upload
                if 'garage_logo' in request.FILES:
                    garage_logo = request.FILES['garage_logo']
                    trimmed_filename = garage_logo.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"garage_logo_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/garage/logo/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Delete old file if exists
                    if garage_obj.logo:
                        old_logo_path = os.path.join(settings.BASE_DIR, garage_obj.logo)
                        if os.path.exists(old_logo_path):
                            os.remove(old_logo_path)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in garage_logo.chunks():
                            destination.write(chunk)
                    # Update file path
                    update_field(garage_obj, "logo", file_path) 
                    
                # Handle authorized signatory file upload
                if 'authorized_signatory' in request.FILES:
                    signatory_file = request.FILES['authorized_signatory']
                    trimmed_filename = signatory_file.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"garage_signatory_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/garage/signatory/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Delete old file if exists
                    if garage_obj.authorized_signatory:
                        old_signatory_path = os.path.join(settings.BASE_DIR, garage_obj.authorized_signatory)
                        if os.path.exists(old_signatory_path):
                            os.remove(old_signatory_path)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in signatory_file.chunks():
                            destination.write(chunk)
                    # Update file path
                    update_field(garage_obj, "authorized_signatory", file_path)

                # Extract selected servicecategory
                servicecategory_ids = request.POST.getlist("servicecategory")
                # Convert the servicecategory_ids to a set for easier comparison
                new_servicecategory_ids = set(map(int, servicecategory_ids))
                # Fetch existing servicecategory_ids for the garage
                existing_servicecategory_ids = set(
                    RelGarageServiceCategory.objects.filter(garage=garage_obj).values_list('servicecategory_id', flat=True)
                )
                # Determine the IDs to add and remove
                servicecategory_ids_to_add = new_servicecategory_ids - existing_servicecategory_ids
                servicecategory_ids_to_remove = existing_servicecategory_ids - new_servicecategory_ids   
                # Remove IDs that are no longer needed
                if servicecategory_ids_to_remove:
                    RelGarageServiceCategory.objects.filter(garage=garage_obj, servicecategory_id__in=servicecategory_ids_to_remove).delete()
                    updated = True 
                # Add new IDs 
                for servicecategory_id in servicecategory_ids_to_add:
                    RelGarageServiceCategory.objects.create(
                        garage=garage_obj,
                        servicecategory_id=servicecategory_id
                    )  
                    updated = True  
                
                # Handle vehicle types
                vehicletype_ids = request.POST.getlist("vehicletype")
                new_vehicletype_ids = set(map(int, vehicletype_ids))
                existing_vehicletype_ids = set(
                    RelGarageVehicleType.objects.filter(garage=garage_obj).values_list('vehicletype_id', flat=True)
                )
                vehicletype_ids_to_add = new_vehicletype_ids - existing_vehicletype_ids
                vehicletype_ids_to_remove = existing_vehicletype_ids - new_vehicletype_ids
                
                if vehicletype_ids_to_remove:
                    RelGarageVehicleType.objects.filter(garage=garage_obj, vehicletype_id__in=vehicletype_ids_to_remove).delete()
                    updated = True
                
                for vehicletype_id in vehicletype_ids_to_add:
                    RelGarageVehicleType.objects.create(
                        garage=garage_obj,
                        vehicletype_id=vehicletype_id
                    )
                    updated = True
                
                # Save only if any field was updated
                if updated:
                    garage_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.")   
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_garage', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path)  

@managesession.check_session_timeout
def u_accounts_garage_business_hours(request, context, id):  
    garage_obj = get_object_or_404(Garage, id=id)

    if request.method == 'POST':
        try:
            with transaction.atomic():                
                # Delete existing business hours
                garage_obj.garage_business_hours.all().delete()
                
                # Get the number of business hours entries submitted
                # Try to get fields with [] suffix first, fall back to without
                days = request.POST.getlist('day[]') or request.POST.getlist('day')
                start_times = request.POST.getlist('start_time[]') or request.POST.getlist('start_time')
                end_times = request.POST.getlist('end_time[]') or request.POST.getlist('end_time')
                is_closed_values = request.POST.getlist('is_closed[]') or request.POST.getlist('is_closed', [])
                                
                # Get list of indices where is_closed is checked
                is_closed_indices = [i for i, val in enumerate(is_closed_values) if val == 'on']
                                
                for i, day in enumerate(days):
                    if not day:  # Skip if day is not selected
                        continue
                        
                    # Get the day index (0=Monday, 6=Sunday)
                    day_choices = dict(GarageBusinessHours.DAYS_OF_WEEK)
                    day_index = [k for k, v in day_choices.items() if v.lower() == day.lower()][0]
                    
                    # Check if this entry is marked as closed
                    is_closed = i in is_closed_indices
                    
                    # Create business hours entry
                    GarageBusinessHours.objects.create(
                        garage=garage_obj,
                        day_of_week=day_index,
                        open_time=start_times[i] if not is_closed and start_times and i < len(start_times) and start_times[i] else None,
                        close_time=end_times[i] if not is_closed and end_times and i < len(end_times) and end_times[i] else None,
                        is_closed=is_closed
                    )
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_garage_business_hours', 200) 
                return JsonResponse({
                    'success': True,
                    'message': 'Business hours updated successfully!'
                })
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return JsonResponse({
                'success': False,
                'message': error_msg
            }, status=400)
        
        # Default response (shouldn't reach here)
        return JsonResponse({
            'success': False,
            'message': 'An unexpected error occurred.'
        }, status=500)   


@managesession.check_session_timeout
def d_accounts_garage(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    garage_obj = get_object_or_404(Garage, id=id)
                    if garage_obj:
                        deleted_data.append(garage_obj.id) 
                        garage_obj.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} records deleted"
                    sts = True
                else:
                    msg = "Failed to delete records"
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