
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import ProductModel, ProductBrands
from GMSApp.modules import templatespath, managesession, audit
import logging


@managesession.check_session_timeout
def r_inv_model(request, context):
    if request.method == 'GET':
        product_model_objs = ProductModel.objects.filter(brand__garage_id=context['garage_id'])

        # Pagination
        paginator = Paginator(product_model_objs, 100)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        context['product_model_objs'] =  page_obj        
        
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_inv_model', 200)
        return render(request, templatespath.template_r_inv_model, context) 
    

@managesession.check_session_timeout
def c_inv_model(request, context):
    if request.method == 'GET':          
        context['product_brands'] = ProductBrands.objects.filter(garage_id=context['garage_id'])

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_inv_model', 200)
        return render(request, templatespath.template_c_inv_model, context) 

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                product_brand_id = request.POST.get('product_brand')
                name = request.POST.get('name')

                # Ensure required fields are provided
                if not product_brand_id:
                    raise ValueError("Brand is required.")

                # Fetch related objects
                product_brand = get_object_or_404(ProductBrands, id=product_brand_id) 

                # Create record
                product_model = ProductModel.objects.create(
                    brand=product_brand,
                    name=name
                )   

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_inv_model', 200) 
                messages.success(request,"Model created successfully")
                return redirect('r-inv-model')
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)              


@managesession.check_session_timeout           
def u_inv_model(request, context, id):
    product_model_obj = get_object_or_404(ProductModel, id=id)
    context['product_model_obj'] = product_model_obj
    
    if request.method == 'GET':
        context['product_brands'] = ProductBrands.objects.filter(garage_id=context['garage_id'])
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_inv_model', 200)
        return render(request, templatespath.template_u_inv_model, context) 

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
                product_brand_id = request.POST.get('product_brand')
                name = request.POST.get('name')

                # Ensure required fields are provided
                if not product_brand_id:
                    raise ValueError("Brand is required.")

                # Fetch related objects
                product_brand = get_object_or_404(ProductBrands, id=product_brand_id) 
                
                # Update fields if changed
                update_field(product_model_obj, "brand", product_brand)
                update_field(product_model_obj, "name", name)                    

                # Save only if any field was updated
                if updated:                  
                    product_model_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.")     

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_inv_model', 200)
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path)   


@managesession.check_session_timeout
def d_inv_model(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    product_model_obj = get_object_or_404(ProductModel, id=id)
                    if product_model_obj:
                        deleted_data.append(product_model_obj.id) 
                        product_model_obj.delete()

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