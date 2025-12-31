from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import  CC
from GMSApp.modules import templatespath, managesession, audit
from django.conf import settings
from datetime import datetime
import logging, os


@managesession.check_session_timeout
def r_accounts_cc(request, context):

    if request.method == 'GET': 
        # Fetch and paginate accounts
        cc_objs = CC.objects.all()
        page_obj = Paginator(cc_objs, 100).get_page(request.GET.get('page'))
        context['cc_objs'] = page_obj

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_accounts_cc', 200)
        return render(request, templatespath.template_accounts_cc_r_cc, context) 


@managesession.check_session_timeout
def c_accounts_cc(request, context):

    if request.method == 'GET': 
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_cc', 200)
        return render(request, templatespath.template_accounts_cc_c_cc, context)

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                name = request.POST.get('name')
                from_value = request.POST.get('from_value')
                to_value = request.POST.get('to_value')
                status = request.POST.get('status') 

                # Prepare data
                insert_cc_data = {        
                    'name': name,
                    'from_value': from_value,
                    'to_value': to_value,
                    'status': status
                } 

                # Handle image file upload
                if 'cc_img' in request.FILES:
                    cc_img = request.FILES['cc_img']
                    trimmed_filename = cc_img.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"cc_img_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/cc/images/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in cc_img.chunks():
                            destination.write(chunk)
                    insert_cc_data['image_path'] = file_path 

                # Create
                CC.objects.create(**insert_cc_data)
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_cc', 200) 
                messages.success(request,"Data created successfully")
                return redirect('r-accounts-cc')
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)


@managesession.check_session_timeout
def u_accounts_cc(request, context, id):
    cc_obj = get_object_or_404(CC, id=id)
    context['cc_obj'] =  cc_obj

    if request.method == 'GET': 
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_cc', 200)
        return render(request, templatespath.template_accounts_cc_u_cc, context)        

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
                from_value = request.POST.get('from_value')
                to_value = request.POST.get('to_value')
                status = request.POST.get('status') 

                # Prepare data
                update_cc_data = {                    
                    'name': name,
                    'from_value': from_value,
                    'to_value': to_value,
                    'status': status
                } 

                # Handle image file upload
                if 'cc_img' in request.FILES:
                    cc_img = request.FILES['cc_img']
                    trimmed_filename = cc_img.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"cc_img_{current_datetime}{ext}"
                    directory = 'static/custom-assets/accounts/cc/images/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Delete old file if exists
                    if cc_obj.image_path:
                        old_image_path = os.path.join(settings.BASE_DIR, cc_obj.image_path)
                        if os.path.exists(old_image_path):
                            os.remove(old_image_path)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in cc_img.chunks():
                            destination.write(chunk)
                    update_cc_data['image_path'] = file_path 

                # Apply all updates
                for field, value in update_cc_data.items():
                    update_field(cc_obj, field, value)

                # Save only if any field was updated
                if updated:
                    cc_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.")   
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_cc', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path)  



@managesession.check_session_timeout
def d_accounts_cc(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    cc_obj = get_object_or_404(CC, id=id)
                    if cc_obj:
                        deleted_data.append(cc_obj.id) 
                        cc_obj.delete()

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