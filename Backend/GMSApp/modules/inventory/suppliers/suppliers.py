
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import Suppliers
from GMSApp.modules import templatespath, managesession, audit
from datetime import datetime, timedelta
import logging


@managesession.check_session_timeout
def r_inv_suppliers(request, context):
    if request.method == 'GET':
        suppliers = Suppliers.objects.filter(garage_id=context['garage_id'])

        # Pagination
        paginator = Paginator(suppliers, 100)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        context['suppliers'] =  page_obj
        
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_inv_suppliers', 200)
        return render(request, templatespath.template_r_inv_suppliers, context) 
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                code = request.POST.get('code')
                supplier = request.POST.get('supplier')
                name = request.POST.get('name')
                email = request.POST.get('email')
                mobile = request.POST.get('mobile')
                location = request.POST.get('location')
                address = request.POST.get('address')

                # Create supplier record
                Suppliers.objects.create(
                    garage_id=context['garage_id'],
                    code=code,
                    supplier=supplier,
                    name=name,
                    email=email,
                    mobile=mobile,
                    location=location,
                    address=address
                )
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_inv_suppliers', 200) 
                messages.success(request,"Supplier created successfully")
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        return redirect(request.path)
                

@managesession.check_session_timeout
def u_inv_suppliers(request, context, id):   
    if request.method == 'POST':
        try:
            with transaction.atomic():
                supplier_obj = get_object_or_404(Suppliers, id=id)

                updated = False  # Flag to track changes

                # Helper function to update fields only if changed
                def update_field(obj, field, new_value):
                    nonlocal updated
                    if getattr(obj, field) != new_value:
                        setattr(obj, field, new_value)
                        updated = True

                # Extract form data and update only if changed
                update_field(supplier_obj, 'code', request.POST.get('code'))
                update_field(supplier_obj, 'supplier', request.POST.get('supplier'))
                update_field(supplier_obj, 'name', request.POST.get('name'))
                update_field(supplier_obj, 'email', request.POST.get('email'))
                update_field(supplier_obj, 'mobile', request.POST.get('mobile'))
                update_field(supplier_obj, 'location', request.POST.get('location'))
                update_field(supplier_obj, 'address', request.POST.get('address'))

                # Save only if any field was updated
                if updated:
                    supplier_obj.save()
                    messages.success(request, "Supplier updated successfully!")
                else:
                    messages.info(request, "No changes were made.")
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_inv_suppliers', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        return redirect('r-inv-suppliers')


@managesession.check_session_timeout
def d_inv_suppliers(request, context):
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    supplier_obj = Suppliers.objects.filter(id=id).first()
                    if supplier_obj:
                        deleted_data.append(supplier_obj.id) 
                        supplier_obj.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} suppliers deleted"
                    sts = True
                else:
                    msg = "Failed to delete suppliers"
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