from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import Garage, RelGarageService, GarageService, CC
from GMSApp.modules import templatespath, managesession, audit, customfunctions
from django.conf import settings
from datetime import datetime
import logging, os


@managesession.check_session_timeout
def r_accounts_garage_service(request, context, id):
    garage_obj = get_object_or_404(Garage, id=id)
    context['garage_obj'] =  garage_obj

    if request.method == 'GET': 

        # Fetch and paginate accounts
        relgarageservice_objs = RelGarageService.objects.filter(garage=garage_obj)
        page_obj = Paginator(relgarageservice_objs, 100).get_page(request.GET.get('page'))
        context['relgarageservice_objs'] = page_obj

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_accounts_garage_service', 200)
        return render(request, templatespath.template_accounts_garage_service_r_garage_service, context) 


@managesession.check_session_timeout
def c_accounts_garage_service(request, context, id):
    garage_obj = get_object_or_404(Garage, id=id)
    context['garage_obj'] =  garage_obj

    if request.method == 'GET':    
        context['service_objs'] = GarageService.objects.filter(status='active')
        context['cc_objs'] = CC.objects.filter(status='active')
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_garage_service', 200)
        return render(request, templatespath.template_accounts_garage_service_c_garage_service, context)

    if request.method == 'POST':
        try:
            with transaction.atomic():                 
                # Extract form data
                service_id = request.POST.get('service_id')
                cc_id = request.POST.get('cc_id')
                price = float(request.POST.get('price') or 0.00)
                status = request.POST.get('status') 
                description = request.POST.get('description')
                # Ensure required fields are provided
                if not service_id or not cc_id:
                    raise ValueError("Service and CC are required.")
                # Fetch related objects
                service_obj = get_object_or_404(GarageService, id=service_id)
                cc_obj = get_object_or_404(CC, id=cc_id)
                # Prepare data
                insert_relgarageservice_data = {                    
                    'business': garage_obj.business,
                    'garage': garage_obj,
                    'service': service_obj,
                    'cc': cc_obj,
                    'price': price,
                    'status': status,
                    'description': description
                } 
                # Create
                RelGarageService.objects.create(**insert_relgarageservice_data)              
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_garage_service', 200) 
                messages.success(request,"Data created successfully")
                return redirect('r-accounts-garage-service', id=garage_obj.id)
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)


@managesession.check_session_timeout
def u_accounts_garage_service(request, context, id):
    relgarageservice_obj = get_object_or_404(RelGarageService, id=id)
    context['relgarageservice_obj'] =  relgarageservice_obj

    if request.method == 'GET':         
        context['service_objs'] = GarageService.objects.filter(status='active')
        context['cc_objs'] = CC.objects.filter(status='active')
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_garage_service', 200)
        return render(request, templatespath.template_accounts_garage_service_u_garage_service, context)        

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
                service_id = request.POST.get('service_id')
                cc_id = request.POST.get('cc_id')
                price = float(request.POST.get('price') or 0.00)
                status = request.POST.get('status') 
                description = request.POST.get('description')
                # Ensure required fields are provided
                if not service_id or not cc_id:
                    raise ValueError("Service and CC are required.")
                # Fetch related objects
                service_obj = get_object_or_404(GarageService, id=service_id)
                cc_obj = get_object_or_404(CC, id=cc_id)
                # Update fields
                update_relgarageservice_data = {   
                    'service': service_obj,
                    'cc': cc_obj,
                    'price': price,
                    'status': status,
                    'description': description
                }

                # Apply all updates
                for field, value in update_relgarageservice_data.items():
                    update_field(relgarageservice_obj, field, value) 

                # Save only if any field was updated
                if updated:
                    relgarageservice_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.")   
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_garage_service', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path)  


@managesession.check_session_timeout
def d_accounts_garage_service(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    relgarageservice_obj = get_object_or_404(RelGarageService, id=id)
                    if relgarageservice_obj:
                        deleted_data.append(relgarageservice_obj.id) 
                        relgarageservice_obj.delete()

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