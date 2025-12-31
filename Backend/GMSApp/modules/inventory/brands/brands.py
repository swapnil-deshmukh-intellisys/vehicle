
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import ProductBrands
from GMSApp.modules import templatespath, managesession, audit
from datetime import datetime, timedelta
import logging


@managesession.check_session_timeout
def r_inv_brands(request, context):
    if request.method == 'GET':
        product_brands = ProductBrands.objects.filter(garage_id=context['garage_id'])

        # Pagination
        paginator = Paginator(product_brands, 100)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        context['product_brands'] =  page_obj
        
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_inv_brands', 200)
        return render(request, templatespath.template_r_inv_brands, context) 
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                name = request.POST.get('name')

                # Create Product Brands record
                ProductBrands.objects.create(
                    garage_id=context['garage_id'],
                    name=name
                )
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_inv_brands', 200) 
                messages.success(request,"Product Brands created successfully")
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        return redirect(request.path)
                

@managesession.check_session_timeout
def u_inv_brands(request, context, id):   
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_brands_obj = get_object_or_404(ProductBrands, id=id)

                updated = False  # Flag to track changes

                # Helper function to update fields only if changed
                def update_field(obj, field, new_value):
                    nonlocal updated
                    if getattr(obj, field) != new_value:
                        setattr(obj, field, new_value)
                        updated = True

                # Extract form data and update only if changed
                update_field(product_brands_obj, 'name', request.POST.get('name'))

                # Save only if any field was updated
                if updated:
                    product_brands_obj.save()
                    messages.success(request, "Product Brands updated successfully!")
                else:
                    messages.info(request, "No changes were made.")
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_inv_brands', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        return redirect('r-inv-brands')


@managesession.check_session_timeout
def d_inv_brands(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    product_brands_obj = ProductBrands.objects.filter(id=id).first()
                    if product_brands_obj:
                        deleted_data.append(product_brands_obj.id) 
                        product_brands_obj.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} product brands deleted"
                    sts = True
                else:
                    msg = "Failed to delete product brands"
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