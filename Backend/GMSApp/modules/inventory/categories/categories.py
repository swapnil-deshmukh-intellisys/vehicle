
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import ProductCategories
from GMSApp.modules import templatespath, managesession, audit
from datetime import datetime, timedelta
import logging


@managesession.check_session_timeout
def r_inv_categories(request, context): 
    if request.method == 'GET':
        product_categories = ProductCategories.objects.filter(garage_id=context['garage_id'])

        # Pagination
        paginator = Paginator(product_categories, 100)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        context['product_categories'] =  page_obj
        
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_inv_categories', 200)
        return render(request, templatespath.template_r_inv_categories, context) 
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                name = request.POST.get('name')
                description = request.POST.get('description')

                # Create Product Categories record
                ProductCategories.objects.create(
                    garage_id=context['garage_id'],
                    name=name,
                    description=description
                )
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_inv_categories', 200) 
                messages.success(request,"Product Categories created successfully")
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        return redirect(request.path)
                

@managesession.check_session_timeout
def u_inv_categories(request, context, id):   
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_categories_obj = get_object_or_404(ProductCategories, id=id)

                updated = False  # Flag to track changes

                # Helper function to update fields only if changed
                def update_field(obj, field, new_value):
                    nonlocal updated
                    if getattr(obj, field) != new_value:
                        setattr(obj, field, new_value)
                        updated = True

                # Extract form data and update only if changed
                update_field(product_categories_obj, 'name', request.POST.get('name'))
                update_field(product_categories_obj, 'description', request.POST.get('description'))

                # Save only if any field was updated
                if updated:
                    product_categories_obj.save()
                    messages.success(request, "Product Categories updated successfully!")
                else:
                    messages.info(request, "No changes were made.")
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_inv_categories', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        return redirect('r-inv-categories')


@managesession.check_session_timeout
def d_inv_categories(request, context):
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    product_categories_obj = ProductCategories.objects.filter(id=id).first()
                    if product_categories_obj:
                        deleted_data.append(product_categories_obj.id) 
                        product_categories_obj.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} product categories deleted"
                    sts = True
                else:
                    msg = "Failed to delete product categories"
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