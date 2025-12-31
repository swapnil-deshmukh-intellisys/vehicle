
import logging

from django.contrib import messages
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render

from GMSApp.models import (
    ProductBrands,
    ProductCatalogues,
    ProductCategories,
    ProductModel,
    RelProductCataloguesBrands,
    RelProductCataloguesModel,
    Suppliers,
)
from GMSApp.modules import audit, managesession, templatespath


@managesession.check_session_timeout
def get_models_by_brand(request, context, brand_id):
    if request.method == 'GET':
        try:
            models = ProductModel.objects.filter(brand_id=brand_id).values('id', 'name')
            return JsonResponse({'status': 'success', 'models': list(models)})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

@managesession.check_session_timeout
def r_inv_current_stock(request, context):
    if request.method == 'GET':
        product_catalogues_objs = ProductCatalogues.objects.filter(garage_id=context['garage_id'])
        product_catalogues = ProductCatalogues.objects.filter(garage_id=context['garage_id']).only('id', 'name', 'model')
        suppliers = Suppliers.objects.filter(garage_id=context['garage_id']).only('id', 'supplier')
        
        # Add calculated amounts to each product
        # for product in product_catalogues_objs:
        #     product.gst_amount = (product.price * product.gst) / 100
        #     product.discount_amount = (product.price * product.discount) / 100
        
        # Pagination
        paginator = Paginator(product_catalogues_objs, 100)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        context['product_catalogues_objs'] =  page_obj
        context['product_catalogues'] = product_catalogues
        context['suppliers'] = suppliers
        
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_inv_current_stock', 200)
        return render(request, templatespath.template_r_inv_current_stock, context) 


@managesession.check_session_timeout
def c_inv_current_stock(request, context):
    if request.method == 'GET':
        context['product_categories'] =  ProductCategories.objects.filter(garage_id=context['garage_id'])
        context['product_brands'] =  ProductBrands.objects.filter(garage_id=context['garage_id'])
        context['product_model_objs'] = ProductModel.objects.filter(brand__garage_id=context['garage_id'])
        
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_inv_current_stock', 200)
        return render(request, templatespath.template_c_inv_current_stock, context) 

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                code = request.POST.get('code')
                part_number = request.POST.get('part_number')
                model = request.POST.get('model')
                cc = request.POST.get('cc')
                name = request.POST.get('name')
                category_id = request.POST.get('category')
                sub_category = request.POST.get('sub_category')
                brand_id = request.POST.get('brand')
                description = request.POST.get('description')

                # Convert numerical values safely
                price = float(request.POST.get('price') or 0.00)
                gst = float(request.POST.get('gst') or 0.00)
                discount = float(request.POST.get('discount') or 0.00)
                purchase_price = float(request.POST.get('purchase_price') or 0.00)
                min_stock = int(request.POST.get('min_stock') or 0)
                price_includes_gst = bool(request.POST.get('price_includes_gst'))

                measuring_unit = request.POST.get('measuring_unit')

                # Ensure category ID is provided
                if not category_id:
                    raise ValueError("Category is required.")
                
                # Validate pricing: Purchase Price - Discount cannot be negative
                discount_amount = (purchase_price * discount) / 100
                if discount_amount > purchase_price:
                    raise ValueError(f"Discount amount ({discount_amount:.2f}) cannot exceed purchase price ({purchase_price:.2f})")
                
                expected_mrp = purchase_price - discount_amount
                if expected_mrp < 0:
                    raise ValueError("Purchase price minus discount cannot be negative")
                
                if price > 0 and price < expected_mrp:
                    raise ValueError(f"MRP should equal Purchase Price - Discount ({expected_mrp:.2f})")

                # Fetch foreign key objects
                category = get_object_or_404(ProductCategories, id=category_id)
                
                # Get brand instance if brand_id is provided
                brand = None
                if brand_id:
                    brand = get_object_or_404(ProductBrands, id=brand_id, garage_id=context['garage_id'])

                # Create product record
                product_catalogues_obj = ProductCatalogues.objects.create(
                    garage_id=context['garage_id'],
                    code=code,
                    part_number=part_number,
                    model=model,
                    cc=cc,
                    name=name,
                    category=category,
                    sub_category=sub_category,
                    brand=brand,
                    description=description,
                    price=price,
                    gst=gst,
                    discount=discount,
                    purchase_price=purchase_price,
                    measuring_unit=measuring_unit,
                    min_stock=min_stock,
                    price_includes_gst=price_includes_gst
                )

                product_model_ids = request.POST.getlist("product_model")
                if product_model_ids:
                    for product_model_id in product_model_ids:
                        product_model_obj = get_object_or_404(ProductModel, id=product_model_id)
                        # Create the relationship
                        RelProductCataloguesModel.objects.create(
                            product_catalogues=product_catalogues_obj,
                            product_model=product_model_obj
                        ) 

                
                product_brands_ids = request.POST.getlist("product_brands")
                if product_brands_ids:
                    for product_brands_id in product_brands_ids:
                        product_brands_obj = get_object_or_404(ProductBrands, id=product_brands_id)
                        # Create the relationship
                        RelProductCataloguesBrands.objects.create(
                            product_catalogues=product_catalogues_obj,
                            product_brands=product_brands_obj
                        )    
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_inv_current_stock', 200) 
                messages.success(request,"Stock created successfully")
                return redirect('r-inv-current-stock')
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)
                

@managesession.check_session_timeout
def u_inv_current_stock(request, context, id): 
    product_catalogues_obj = get_object_or_404(ProductCatalogues, id=id)
    context['product_catalogues_obj'] = product_catalogues_obj
    
    if request.method == 'GET':
        context['selected_product_model_ids'] = list(product_catalogues_obj.rel_product_catalogues_model.values_list('product_model_id', flat=True))
        context['selected_product_brands_ids'] = list(product_catalogues_obj.rel_product_catalogues_brands.values_list('product_brands_id', flat=True))
        context['product_categories'] =  ProductCategories.objects.filter(garage_id=context['garage_id'])
        context['product_brands'] =  ProductBrands.objects.filter(garage_id=context['garage_id'])
        context['product_model_objs'] = ProductModel.objects.filter(brand__garage_id=context['garage_id'])
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_inv_current_stock', 200)
        return render(request, templatespath.template_u_inv_current_stock, context) 

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

                # Extract form data and update only if changed
                update_field(product_catalogues_obj, 'code', request.POST.get('code'))
                update_field(product_catalogues_obj, 'part_number', request.POST.get('part_number'))
                update_field(product_catalogues_obj, 'model', request.POST.get('model'))
                update_field(product_catalogues_obj, 'cc', request.POST.get('cc'))
                update_field(product_catalogues_obj, 'name', request.POST.get('name'))
                update_field(product_catalogues_obj, 'description', request.POST.get('description'))

                # Convert numerical values safely
                update_field(product_catalogues_obj, 'price', float(request.POST.get('price') or 0.00))
                update_field(product_catalogues_obj, 'gst', float(request.POST.get('gst') or 0.00))
                update_field(product_catalogues_obj, 'discount', float(request.POST.get('discount') or 0.00))
                update_field(product_catalogues_obj, 'purchase_price', float(request.POST.get('purchase_price') or 0.00))
                update_field(product_catalogues_obj, 'measuring_unit', request.POST.get('measuring_unit'))
                update_field(product_catalogues_obj, 'sub_category', request.POST.get('sub_category'))
                update_field(product_catalogues_obj, 'min_stock', int(request.POST.get('min_stock') or 0))
                update_field(product_catalogues_obj, 'price_includes_gst', bool(request.POST.get('price_includes_gst')))

                # Update foreign key fields only if changed
                category_id = request.POST.get('category')
                if category_id and product_catalogues_obj.category_id != int(category_id):
                    product_catalogues_obj.category = get_object_or_404(ProductCategories, id=category_id)
                    updated = True

                brand_id = request.POST.get('brand')
                if brand_id and product_catalogues_obj.brand_id != int(brand_id):
                    product_catalogues_obj.brand = get_object_or_404(ProductBrands, id=brand_id)
                    updated = True

                # Extract selected product_model
                product_model_ids = request.POST.getlist("product_model")
                # Convert the product_model_ids to a set for easier comparison
                new_product_model_ids = set(map(int, product_model_ids))
                # Fetch existing product_model_ids for the product_catalogues
                existing_product_model_ids = set(
                    RelProductCataloguesModel.objects.filter(product_catalogues=product_catalogues_obj).values_list('product_model_id', flat=True)
                )
                # Determine the IDs to add and remove
                product_model_ids_to_add = new_product_model_ids - existing_product_model_ids
                product_model_ids_to_remove = existing_product_model_ids - new_product_model_ids             
                # Remove IDs that are no longer needed
                if product_model_ids_to_remove:
                    RelProductCataloguesModel.objects.filter(product_catalogues=product_catalogues_obj, product_model_id__in=product_model_ids_to_remove).delete()
                    updated = True 
                # Add new IDs 
                for product_model_id in product_model_ids_to_add:
                    product_model_obj = get_object_or_404(ProductModel, id=product_model_id)
                    # Create the relationship
                    RelProductCataloguesModel.objects.get_or_create(
                        product_catalogues=product_catalogues_obj,
                        product_model=product_model_obj
                    )   
                    updated = True  

                # Extract selected product_brands
                product_brands_ids = request.POST.getlist("product_brands")
                # Convert the product_brands_ids to a set for easier comparison
                new_product_brands_ids = set(map(int, product_brands_ids))
                # Fetch existing product_brands_ids for the product_catalogues
                existing_product_brands_ids = set(
                    RelProductCataloguesBrands.objects.filter(product_catalogues=product_catalogues_obj).values_list('product_brands_id', flat=True)
                )
                # Determine the IDs to add and remove
                product_brands_ids_to_add = new_product_brands_ids - existing_product_brands_ids
                product_brands_ids_to_remove = existing_product_brands_ids - new_product_brands_ids             
                # Remove IDs that are no longer needed
                if product_brands_ids_to_remove:
                    RelProductCataloguesBrands.objects.filter(product_catalogues=product_catalogues_obj, product_brands_id__in=product_brands_ids_to_remove).delete()
                    updated = True 
                # Add new IDs 
                for product_brands_id in product_brands_ids_to_add:
                    product_brands_obj = get_object_or_404(ProductBrands, id=product_brands_id)
                    # Create the relationship
                    RelProductCataloguesBrands.objects.create(
                        product_catalogues=product_catalogues_obj,
                        product_brands=product_brands_obj
                    )   
                    updated = True  

                # Validate pricing before saving
                purchase_price = float(request.POST.get('purchase_price') or 0.00)
                discount = float(request.POST.get('discount') or 0.00)
                price = float(request.POST.get('price') or 0.00)
                
                discount_amount = (purchase_price * discount) / 100
                if discount_amount > purchase_price:
                    raise ValueError(f"Discount amount ({discount_amount:.2f}) cannot exceed purchase price ({purchase_price:.2f})")
                
                expected_mrp = purchase_price - discount_amount
                if expected_mrp < 0:
                    raise ValueError("Purchase price minus discount cannot be negative")
                
                if price > 0 and price < expected_mrp:
                    raise ValueError(f"MRP should equal Purchase Price - Discount ({expected_mrp:.2f})")
                
                # Save only if any field was updated
                if updated:
                    product_catalogues_obj.save()
                    messages.success(request, "Stock updated successfully!")
                else:
                    messages.info(request, "No changes were made.")
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_inv_current_stock', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        return redirect('r-inv-current-stock')


@managesession.check_session_timeout
def d_inv_current_stock(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    product_catalogues_obj = ProductCatalogues.objects.filter(id=id).first()
                    if product_catalogues_obj:
                        deleted_data.append(product_catalogues_obj.id) 
                        product_catalogues_obj.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} stock deleted"
                    sts = True
                else:
                    msg = "Failed to delete stock"
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


@managesession.check_session_timeout
def g_inv_current_stock(request, context, product_id):
    if request.method == 'GET':
        try:
            with transaction.atomic():
                product = ProductCatalogues.objects.select_related('brand', 'category').get(id=product_id)
                
                # Calculate selling price and purchase price
                base_price = product.price / (1 + product.gst / 100) if product.price_includes_gst else product.price
                discount_amount = (base_price * product.discount) / 100
                selling_price = base_price - discount_amount
                
                data = {
                    'name': product.name,
                    'brand': product.brand.name if product.brand else '',
                    'code': product.code or '',
                    'category': product.category.name if product.category else '',
                    'part_number': product.part_number or '',
                    'model': product.model or '',
                    'description': product.description or '',
                    'current_stock': product.inward_stock - product.outward_stock,
                    'mrp': float(product.price),
                    'gst': float(product.gst),
                    'discount': float(product.discount),
                    'selling_price': float(selling_price),
                    'purchase_price': float(product.purchase_price),
                    'price_includes_gst': product.price_includes_gst,
                }

                # Audit logging
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'g_inv_current_stock', 200)
                return JsonResponse({'status': True, 'product': data})      

        except ProductCatalogues.DoesNotExist:
            return JsonResponse({'status': False, 'message': 'Product not found'})
        except (ValidationError, Exception) as e:
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return JsonResponse({'status': False, 'message': error_msg})           