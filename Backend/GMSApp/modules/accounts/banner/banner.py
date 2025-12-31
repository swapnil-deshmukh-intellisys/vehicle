from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import  Banner, City
from GMSApp.modules import templatespath, managesession, audit
from django.conf import settings
from datetime import datetime
import logging, os


@managesession.check_session_timeout
def r_accounts_banner(request, context):

    if request.method == 'GET': 
        # Fetch and paginate accounts
        banner_objs = Banner.objects.all()
        page_obj = Paginator(banner_objs, 100).get_page(request.GET.get('page'))
        context['banner_objs'] = page_obj

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_accounts_banner', 200)
        return render(request, templatespath.template_accounts_banner_r_banner, context) 


@managesession.check_session_timeout
def c_accounts_banner(request, context):

    if request.method == 'GET': 
        context['city_objs'] = City.objects.filter(status='active')
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_banner', 200)
        return render(request, templatespath.template_accounts_banner_c_banner, context)

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                status = request.POST.get('status') 
                order = int(request.POST.get('order'))
                city_id = request.POST.get('city_id')  

                if not city_id:
                    raise ValidationError("City is required")

                city_obj = get_object_or_404(City, id=city_id)

                # Prepare data
                insert_banner_data = {      
                    'city': city_obj,
                    'status': status,
                    'order': order
                } 

                # Handle image file upload
                if 'banner_img' in request.FILES:
                    banner_img = request.FILES['banner_img']
                    trimmed_filename = banner_img.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"banner_img_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/banner/images/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in banner_img.chunks():
                            destination.write(chunk)
                    insert_banner_data['image_path'] = file_path 

                # Create
                Banner.objects.create(**insert_banner_data)
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_banner', 200) 
                messages.success(request,"Data created successfully")
                return redirect('r-accounts-banner')
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)


@managesession.check_session_timeout
def u_accounts_banner(request, context, id):
    banner_obj = get_object_or_404(Banner, id=id)
    context['banner_obj'] =  banner_obj

    if request.method == 'GET': 
        context['city_objs'] = City.objects.filter(status='active')
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_banner', 200)
        return render(request, templatespath.template_accounts_banner_u_banner, context)        

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

                status = request.POST.get('status')                 
                order = int(request.POST.get('order'))
                city_id = request.POST.get('city_id')  

                if not city_id:
                    raise ValidationError("City is required")

                city_obj = get_object_or_404(City, id=city_id)  
                                
                # Update fields
                update_banner_data = {  
                    'status': status,
                    'order': order,
                    'city': city_obj
                } 

                # Handle image file upload
                if 'banner_img' in request.FILES:
                    banner_img = request.FILES['banner_img']
                    trimmed_filename = banner_img.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"banner_img_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/banner/images/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Delete old file if exists
                    if banner_obj.image_path:
                        old_image_path = os.path.join(settings.BASE_DIR, banner_obj.image_path)
                        if os.path.exists(old_image_path):
                            os.remove(old_image_path)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in banner_img.chunks():
                            destination.write(chunk)
                    update_banner_data['image_path'] = file_path 

                # Apply all updates
                for field, value in update_banner_data.items():
                    update_field(banner_obj, field, value)

                # Save only if any field was updated
                if updated:
                    banner_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.")   
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_banner', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path)  



@managesession.check_session_timeout
def d_accounts_banner(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    banner_obj = get_object_or_404(Banner, id=id)
                    if banner_obj:
                        deleted_data.append(banner_obj.id) 
                        banner_obj.delete()

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