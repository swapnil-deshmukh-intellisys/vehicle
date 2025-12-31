from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import  City
from GMSApp.modules import templatespath, managesession, audit
from django.conf import settings
from datetime import datetime
import logging, os


@managesession.check_session_timeout
def r_accounts_city(request, context):

    if request.method == 'GET': 
        # Fetch and paginate accounts
        city_objs = City.objects.all()
        page_obj = Paginator(city_objs, 100).get_page(request.GET.get('page'))
        context['city_objs'] = page_obj

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_accounts_city', 200)
        return render(request, templatespath.template_accounts_city_r_city, context) 


@managesession.check_session_timeout
def c_accounts_city(request, context):

    if request.method == 'GET': 
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_city', 200)
        return render(request, templatespath.template_accounts_city_c_city, context)

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                name = request.POST.get('name')
                status = request.POST.get('status') 

                # Prepare data
                insert_city_data = {         
                    'name': name,
                    'status':status
                } 

                # Create
                City.objects.create(**insert_city_data)
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_city', 200) 
                messages.success(request,"Data created successfully")
                return redirect('r-accounts-city')
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)


@managesession.check_session_timeout
def u_accounts_city(request, context, id):
    city_obj = get_object_or_404(City, id=id)
    context['city_obj'] =  city_obj

    if request.method == 'GET': 
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_city', 200)
        return render(request, templatespath.template_accounts_city_u_city, context)        

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
                                
                # Update fields
                update_city_data = {  
                    'name': name,
                    'status':status
                } 

                # Apply all updates
                for field, value in update_city_data.items():
                    update_field(city_obj, field, value)

                # Save only if any field was updated
                if updated:
                    city_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.")   
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_city', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path)  



@managesession.check_session_timeout
def d_accounts_city(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    city_obj = get_object_or_404(City, id=id)
                    if city_obj:
                        deleted_data.append(city_obj.id) 
                        city_obj.delete()

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