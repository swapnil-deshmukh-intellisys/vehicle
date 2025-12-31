from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import  GarageService, GarageServicetype
from GMSApp.modules import templatespath, managesession, audit
from GMSApp.modules.acl import acls
from django.conf import settings
from datetime import datetime
import logging, os, json


@managesession.check_session_timeout
def r_accounts_service(request, context):

    if request.method == 'GET':
        # Fetch and paginate accounts
        service_objs = GarageService.objects.all()
        page_obj = Paginator(service_objs, 100).get_page(request.GET.get('page'))
        context['service_objs'] = page_obj
             
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_accounts_service', 200)
        return render(request, templatespath.template_accounts_service_r_service, context) 


@managesession.check_session_timeout           
def c_accounts_service(request, context):

    if request.method == 'GET': 
        context['servicetype_objs'] = GarageServicetype.objects.filter(status='active')
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_service', 200)
        return render(request, templatespath.template_accounts_service_c_service, context) 

    if request.method == 'POST':
        try:
            with transaction.atomic():
                name = request.POST.get('name')
                servicetype_id = request.POST.get('servicetype_id')                
                status = request.POST.get('status')
                description = request.POST.get('description')

                # Ensure required fields are provided
                if not servicetype_id:
                    raise ValueError("Service Type is required.")

                # Fetch related objects
                servicetype_obj = get_object_or_404(GarageServicetype, id=servicetype_id) 

                # Create Garage Service
                GarageService.objects.create(
                    service_type=servicetype_obj,
                    name=name,
                    status=status,
                    description=description
                )

                # Audit logging
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_service', 200)
                messages.success(request, "Data created successfully!")                
                return redirect('r-accounts-service')
        except (ValidationError, Exception) as e:
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)                  


@managesession.check_session_timeout           
def u_accounts_service(request, context, id):
    service_obj = get_object_or_404(GarageService, id=id)
    context['service_obj'] =  service_obj 

    if request.method == 'GET':  
        context['servicetype_objs'] = GarageServicetype.objects.filter(status='active')
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_service', 200)
        return render(request, templatespath.template_accounts_service_u_service, context) 

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
                servicetype_id = request.POST.get('servicetype_id')                
                status = request.POST.get('status')
                description = request.POST.get('description')

                # Ensure required fields are provided
                if not servicetype_id:
                    raise ValueError("Service Type is required.")

                # Fetch related objects
                servicetype_obj = get_object_or_404(GarageServicetype, id=servicetype_id) 

                # Update fields
                update_service_data = {  
                    'name': name,                    
                    'service_type': servicetype_obj,
                    'status': status,
                    'description':description
                } 

                # Apply all updates
                for field, value in update_service_data.items():
                    update_field(service_obj, field, value)                 
                
                # Save only if any field was updated
                if updated:
                    service_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.")   
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_service', 200)      
        except (ValidationError, Exception) as e:
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        
        return redirect(request.path)            


@managesession.check_session_timeout
def d_accounts_service(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    service_obj = get_object_or_404(GarageService, id=id)
                    if service_obj:
                        deleted_data.append(service_obj.id) 
                        service_obj.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} records deleted"
                    sts = True
                else:
                    msg = "Failed to delete records"
                    sts = False
                msg = msg.replace("[", "").replace("]", "")

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', msg, 200)
                return JsonResponse({'status': sts, 'message': msg}) 
        except (ValidationError, Exception) as e:
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return JsonResponse({'status': False, 'message': error_msg}) 