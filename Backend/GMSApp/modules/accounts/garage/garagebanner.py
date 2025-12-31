from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import Garage, GarageBanner
from GMSApp.modules import templatespath, managesession, audit
from django.conf import settings
from datetime import datetime
import logging, os


@managesession.check_session_timeout
def r_accounts_garage_banner(request, context, id):
    garage_obj = get_object_or_404(Garage, id=id)
    context['garage_obj'] =  garage_obj

    if request.method == 'GET': 
        # Fetch and paginate accounts
        garagebanner_objs = GarageBanner.objects.filter(garage=garage_obj)
        page_obj = Paginator(garagebanner_objs, 100).get_page(request.GET.get('page'))
        context['garagebanner_objs'] = page_obj

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_accounts_garage_banner', 200)
        return render(request, templatespath.template_accounts_garage_banner_r_garage_banner, context) 


@managesession.check_session_timeout
def c_accounts_garage_banner(request, context, id):
    garage_obj = get_object_or_404(Garage, id=id) 
    context['garage_obj'] =  garage_obj

    if request.method == 'GET': 
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_garage_banner', 200)
        return render(request, templatespath.template_accounts_garage_banner_c_garage_banner, context)

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                status = request.POST.get('status') 
                order = int(request.POST.get('order'))

                # Prepare data
                insert_garagebanner_data = {                  
                    'business': garage_obj.business,                
                    'garage': garage_obj,
                    'status': status,
                    'order': order
                } 

                # Handle image file upload
                if 'garagebanner_img' in request.FILES:
                    garagebanner_img = request.FILES['garagebanner_img']
                    trimmed_filename = garagebanner_img.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"garagebanner_img_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/garage/banner/images/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in garagebanner_img.chunks():
                            destination.write(chunk)
                    insert_garagebanner_data['image_path'] = file_path 
   
                # Create
                GarageBanner.objects.create(**insert_garagebanner_data)
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_garage_banner', 200) 
                messages.success(request,"Data created successfully")
                return redirect('r-accounts-garage-banner', id=garage_obj.id)
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)


@managesession.check_session_timeout
def u_accounts_garage_banner(request, context, id):
    garagebanner_obj = get_object_or_404(GarageBanner, id=id)
    context['garagebanner_obj'] =  garagebanner_obj

    if request.method == 'GET': 
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_garage_banner', 200)
        return render(request, templatespath.template_accounts_garage_banner_u_garage_banner, context)        

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
                                
                # Update fields
                update_garagebanner_data = {  
                    'status': status,
                    'order': order
                } 

                # Handle image file upload
                if 'garagebanner_img' in request.FILES:
                    garagebanner_img = request.FILES['garagebanner_img']
                    trimmed_filename = garagebanner_img.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"garagebanner_img_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/garage/banner/images/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Delete old file if exists
                    if garagebanner_obj.image_path:
                        old_image_path = os.path.join(settings.BASE_DIR, garagebanner_obj.image_path)
                        if os.path.exists(old_image_path):
                            os.remove(old_image_path)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in garagebanner_img.chunks():
                            destination.write(chunk)
                    update_garagebanner_data['image_path'] = file_path 

                # Apply all updates
                for field, value in update_garagebanner_data.items():
                    update_field(garagebanner_obj, field, value)

                # Save only if any field was updated
                if updated:
                    garagebanner_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.")   
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_garage_banner', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path)  



@managesession.check_session_timeout
def d_accounts_garage_banner(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    garagebanner_obj = get_object_or_404(GarageBanner, id=id)
                    if garagebanner_obj:
                        deleted_data.append(garagebanner_obj.id) 
                        garagebanner_obj.delete()

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