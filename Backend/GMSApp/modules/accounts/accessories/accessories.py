from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import  Accessories
from GMSApp.modules import templatespath, managesession, audit
from django.conf import settings
from datetime import datetime
import logging, os


@managesession.check_session_timeout
def r_accounts_accessories(request, context):

    if request.method == 'GET': 
        # Fetch and paginate accounts
        accessories_objs = Accessories.objects.all()
        page_obj = Paginator(accessories_objs, 100).get_page(request.GET.get('page'))
        context['accessories_objs'] = page_obj

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_accounts_accessories', 200)
        return render(request, templatespath.template_accounts_accessories_r_accessories, context) 


@managesession.check_session_timeout
def c_accounts_accessories(request, context):

    if request.method == 'GET': 
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_accessories', 200)
        return render(request, templatespath.template_accounts_accessories_c_accessories, context)

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                name = request.POST.get('name')
                # Convert numerical values safely
                price = float(request.POST.get('price') or 0.00)
                gst = float(request.POST.get('gst') or 0.00)
                status = request.POST.get('status') 
                description = request.POST.get('description')

                # Prepare data
                insert_accessories_data = {   
                    'name': name,
                    'price': price,
                    'gst': gst,
                    'status': status,
                    'description': description
                } 

                # Handle image file upload
                if 'accessories_img' in request.FILES:
                    accessories_img = request.FILES['accessories_img']
                    trimmed_filename = accessories_img.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"accessories_img_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/accessories/images/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in accessories_img.chunks():
                            destination.write(chunk)
                    insert_accessories_data['image_path'] = file_path 

                # Create
                Accessories.objects.create(**insert_accessories_data)
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_accessories', 200) 
                messages.success(request,"Data created successfully")
                return redirect('r-accounts-accessories')
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)


@managesession.check_session_timeout
def u_accounts_accessories(request, context, id):
    accessories_obj = get_object_or_404(Accessories, id=id)
    context['accessories_obj'] =  accessories_obj

    if request.method == 'GET': 
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_accessories', 200)
        return render(request, templatespath.template_accounts_accessories_u_accessories, context)        

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
                # Convert numerical values safely
                price = float(request.POST.get('price') or 0.00)
                gst = float(request.POST.get('gst') or 0.00)
                status = request.POST.get('status') 
                description = request.POST.get('description')
                                
                # Update fields
                update_accessories_data = {  
                    'name': name,
                    'price': price,
                    'gst': gst,
                    'status': status,
                    'description': description
                } 

                # Handle image file upload
                if 'accessories_img' in request.FILES:
                    accessories_img = request.FILES['accessories_img']
                    trimmed_filename = accessories_img.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"accessories_img_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/accessories/images/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Delete old file if exists
                    if accessories_obj.image_path:
                        old_image_path = os.path.join(settings.BASE_DIR, accessories_obj.image_path)
                        if os.path.exists(old_image_path):
                            os.remove(old_image_path)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in accessories_img.chunks():
                            destination.write(chunk)
                    update_accessories_data['image_path'] = file_path 

                # Apply all updates
                for field, value in update_accessories_data.items():
                    update_field(accessories_obj, field, value)

                # Save only if any field was updated
                if updated:
                    accessories_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.")   
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_accessories', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path)  



@managesession.check_session_timeout
def d_accounts_accessories(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    accessories_obj = get_object_or_404(Accessories, id=id)
                    if accessories_obj:
                        deleted_data.append(accessories_obj.id) 
                        accessories_obj.delete()

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