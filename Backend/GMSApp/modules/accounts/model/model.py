from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import  Model, Brand, CC
from GMSApp.modules import templatespath, managesession, audit
from django.conf import settings
from datetime import datetime
import logging, os


@managesession.check_session_timeout
def r_accounts_model(request, context):

    if request.method == 'GET': 
        # Fetch and paginate accounts
        model_objs = Model.objects.all()
        page_obj = Paginator(model_objs, 100).get_page(request.GET.get('page'))
        context['model_objs'] = page_obj

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_accounts_model', 200)
        return render(request, templatespath.template_accounts_model_r_model, context) 


@managesession.check_session_timeout
def c_accounts_model(request, context):

    if request.method == 'GET': 
        context['brand_objs'] = Brand.objects.all()
        context['cc_objs'] = CC.objects.all()
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_model', 200)
        return render(request, templatespath.template_accounts_model_c_model, context)

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                name = request.POST.get('name')
                brand_id = request.POST.get('brand_id')
                cc_id = request.POST.get('cc_id')
                status = request.POST.get('status') 

                # Ensure required fields are provided
                if not brand_id or not cc_id:
                    raise ValueError("Brand and CC are required.")

                # Fetch related objects
                brand_obj = get_object_or_404(Brand, id=brand_id)
                cc_obj = get_object_or_404(CC, id=cc_id)

                # Prepare data
                insert_model_data = {         
                    'brand' : brand_obj,
                    'cc' : cc_obj,
                    'name': name,
                    'status':status
                } 

                # Handle image file upload
                if 'model_img' in request.FILES:
                    model_img = request.FILES['model_img']
                    trimmed_filename = model_img.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"model_img_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/model/images/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in model_img.chunks():
                            destination.write(chunk)
                    insert_model_data['image_path'] = file_path 

                # Create
                Model.objects.create(**insert_model_data)
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_model', 200) 
                messages.success(request,"Data created successfully")
                return redirect('r-accounts-model')
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)


@managesession.check_session_timeout
def u_accounts_model(request, context, id):
    model_obj = get_object_or_404(Model, id=id)
    context['model_obj'] =  model_obj

    if request.method == 'GET': 
        context['brand_objs'] = Brand.objects.all()
        context['cc_objs'] = CC.objects.all()
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_model', 200)
        return render(request, templatespath.template_accounts_model_u_model, context)        

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
                brand_id = request.POST.get('brand_id')
                cc_id = request.POST.get('cc_id')
                status = request.POST.get('status') 

                # Ensure required fields are provided
                if not brand_id or not cc_id:
                    raise ValueError("Brand and CC are required.")

                # Fetch related objects
                brand_obj = get_object_or_404(Brand, id=brand_id)
                cc_obj = get_object_or_404(CC, id=cc_id)
                                
                # Update fields
                update_model_data = {  
                    'name': name,
                    'brand': brand_obj,
                    'cc': cc_obj,
                    'status': status
                } 

                # Handle image file upload
                if 'model_img' in request.FILES:
                    model_img = request.FILES['model_img']
                    trimmed_filename = model_img.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"model_img_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/model/images/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Delete old file if exists
                    if model_obj.image_path:
                        old_image_path = os.path.join(settings.BASE_DIR, model_obj.image_path)
                        if os.path.exists(old_image_path):
                            os.remove(old_image_path)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in model_img.chunks():
                            destination.write(chunk)
                    update_model_data['image_path'] = file_path 

                # Apply all updates
                for field, value in update_model_data.items():
                    update_field(model_obj, field, value)

                # Save only if any field was updated
                if updated:
                    model_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.")   
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_model', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path)  



@managesession.check_session_timeout
def d_accounts_model(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    model_obj = get_object_or_404(Model, id=id)
                    if model_obj:
                        deleted_data.append(model_obj.id) 
                        model_obj.delete()

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