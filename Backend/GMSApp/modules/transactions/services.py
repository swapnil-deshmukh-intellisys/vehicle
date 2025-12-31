
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import TXNService
from GMSApp.modules import templatespath, managesession, audit
from datetime import datetime, timedelta
import logging


@managesession.check_session_timeout
def r_txn_services(request, context):
    if request.method == 'GET':
        services = TXNService.objects.filter(garage_id=context['garage_id'])

        # Pagination
        paginator = Paginator(services, 100)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        context['services'] =  page_obj
        
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_txn_services', 200)
        return render(request, templatespath.template_r_txn_services, context) 
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                name = request.POST.get('name')
                # Convert numerical values safely
                price = float(request.POST.get('price') or 0.00)
                gst = float(request.POST.get('gst') or 0.00)
                discount = float(request.POST.get('discount') or 0.00)
                notes = request.POST.get('notes')

                # Create service record
                TXNService.objects.create(
                    garage_id=context['garage_id'],
                    name=name,
                    price=price,
                    gst=gst,
                    discount=discount,
                    notes=notes
                )
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_txn_services', 200) 
                messages.success(request,"Service created successfully")
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        return redirect(request.path)
                

@managesession.check_session_timeout
def u_txn_services(request, context, id):   
    if request.method == 'POST':
        try:
            with transaction.atomic():
                service_obj = get_object_or_404(TXNService, id=id)

                updated = False  # Flag to track changes

                # Helper function to update fields only if changed
                def update_field(obj, field, new_value):
                    nonlocal updated
                    if getattr(obj, field) != new_value:
                        setattr(obj, field, new_value)
                        updated = True

                # Extract form data and update only if changed
                update_field(service_obj, 'name', request.POST.get('name'))
                update_field(service_obj, 'price', request.POST.get('price'))
                update_field(service_obj, 'gst', request.POST.get('gst'))
                update_field(service_obj, 'discount', request.POST.get('discount'))
                update_field(service_obj, 'notes', request.POST.get('notes'))

                # Save only if any field was updated
                if updated:
                    service_obj.save()
                    messages.success(request, "Service updated successfully!")
                else:
                    messages.info(request, "No changes were made.")
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_txn_services', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        return redirect('r-txn-services')


@managesession.check_session_timeout
def d_txn_services(request, context):
    if request.method == 'POST':
        try:
            with transaction.atomic():
                service_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in service_ids:
                    service_obj = TXNService.objects.filter(id=id).first()
                    if service_obj:
                        deleted_data.append(service_obj.id) 
                        service_obj.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} services deleted"
                    sts = True
                else:
                    msg = "Failed to delete services"
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