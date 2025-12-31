from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import  ServiceCategory, City, RelCityServiceCategory
from GMSApp.modules import templatespath, managesession, audit
from django.conf import settings
from datetime import datetime
import logging, os


@managesession.check_session_timeout
def r_accounts_servicecategory(request, context):

    if request.method == 'GET': 
        # Fetch and paginate accounts
        servicecategory_objs = ServiceCategory.objects.all()
        page_obj = Paginator(servicecategory_objs, 100).get_page(request.GET.get('page'))
        context['servicecategory_objs'] = page_obj

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_accounts_servicecategory', 200)
        return render(request, templatespath.template_accounts_servicecategory_r_servicecategory, context) 


@managesession.check_session_timeout
def c_accounts_servicecategory(request, context):

    if request.method == 'GET':         
        context['city_objs'] = City.objects.filter(status='active')
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_servicecategory', 200)
        return render(request, templatespath.template_accounts_servicecategory_c_servicecategory, context)

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                name = request.POST.get('name')
                status = request.POST.get('status') 

                # Prepare servicecategory data
                insert_servicecategory_data = {     
                    'name': name,
                    'status':status
                } 

                # Handle image file upload
                if 'servicecategory_img' in request.FILES:
                    servicecategory_img = request.FILES['servicecategory_img']
                    trimmed_filename = servicecategory_img.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"servicecategory_img_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/servicecategory/images/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in servicecategory_img.chunks():
                            destination.write(chunk)
                    insert_servicecategory_data['image_path'] = file_path 

                # Create servicecategory
                servicecategory_obj = ServiceCategory.objects.create(**insert_servicecategory_data)
                
                # Handle city assignments for service category
                city_ids = request.POST.getlist("city_id")
                if city_ids and city_ids[0]:  # Check if city_ids is not empty and first element is not empty
                    for city_id in city_ids:
                        RelCityServiceCategory.objects.create(
                            city_id=city_id,
                            servicecategory=servicecategory_obj
                        )
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_servicecategory', 200) 
                messages.success(request,"Data created successfully")
                return redirect('r-accounts-servicecategory')
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)


@managesession.check_session_timeout
def u_accounts_servicecategory(request, context, id):
    servicecategory_obj = get_object_or_404(ServiceCategory, id=id)
    context['servicecategory_obj'] =  servicecategory_obj

    if request.method == 'GET': 
        context['city_objs'] = City.objects.filter(status='active')
        context['selected_city_ids'] = list(servicecategory_obj.rel_city_servicecategory.values_list('city_id', flat=True))
        
        # Get display status from the first city relationship if it exists
        first_relation = servicecategory_obj.rel_city_servicecategory.first()
        context['display_status'] = first_relation.display if first_relation else False
        
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_servicecategory', 200)
        return render(request, templatespath.template_accounts_servicecategory_u_servicecategory, context)        

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

                name = request.POST.get('name')
                status = request.POST.get('status')
                                
                # Update servicecategory fields
                update_servicecategory_data = {  
                    'name': name,
                    'status':status
                } 

                # Handle image file upload
                if 'servicecategory_img' in request.FILES:
                    servicecategory_img = request.FILES['servicecategory_img']
                    trimmed_filename = servicecategory_img.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"servicecategory_img_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/servicecategory/images/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Delete old file if exists
                    if servicecategory_obj.image_path:
                        old_image_path = os.path.join(settings.BASE_DIR, servicecategory_obj.image_path)
                        if os.path.exists(old_image_path):
                            os.remove(old_image_path)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in servicecategory_img.chunks():
                            destination.write(chunk)
                    update_servicecategory_data['image_path'] = file_path 

                # Apply all updates
                for field, value in update_servicecategory_data.items():
                    update_field(servicecategory_obj, field, value)

                # Handle city assignments and display status for service category
                new_city_ids = set(map(int, request.POST.getlist("city_id", [])))
                display_status = request.POST.get('display') == 'on'  # Get display status from form
                
                # Get existing city relationships
                existing_relations = {
                    rel.city_id: rel 
                    for rel in RelCityServiceCategory.objects.filter(servicecategory=servicecategory_obj)
                }
                existing_city_ids = set(existing_relations.keys())
                
                # Get IDs to add/remove
                city_ids_to_add = new_city_ids - existing_city_ids
                city_ids_to_remove = existing_city_ids - new_city_ids
                
                # Bulk delete removed cities
                if city_ids_to_remove:
                    RelCityServiceCategory.objects.filter(
                        servicecategory=servicecategory_obj,
                        city_id__in=city_ids_to_remove
                    ).delete()
                    updated = True
                    
                # Update display status for existing cities
                cities_to_update = []
                for city_id in (new_city_ids & existing_city_ids):
                    relation = existing_relations[city_id]
                    if relation.display != display_status:
                        relation.display = display_status
                        cities_to_update.append(relation)
                        updated = True
                
                # Bulk update display status for existing cities
                if cities_to_update:
                    RelCityServiceCategory.objects.bulk_update(cities_to_update, ['display'])
                
                # Bulk create new city relationships with display status
                if city_ids_to_add:
                    RelCityServiceCategory.objects.bulk_create(
                        [
                            RelCityServiceCategory(
                                city_id=city_id,
                                servicecategory=servicecategory_obj,
                                display=display_status
                            )
                            for city_id in city_ids_to_add
                        ]
                    )
                    updated = True

                # Save only if any field was updated
                if updated:
                    servicecategory_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.")   
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_servicecategory', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path)  



@managesession.check_session_timeout
def d_accounts_servicecategory(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    servicecategory_obj = get_object_or_404(ServiceCategory, id=id)
                    if servicecategory_obj:
                        deleted_data.append(servicecategory_obj.id) 
                        servicecategory_obj.delete()

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