from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import  Garage, GarageGroup, RelGarageGarageGroup
from GMSApp.modules import templatespath, managesession, audit
import logging


@managesession.check_session_timeout
def r_accounts_garagegroup(request, context):

    if request.method == 'GET': 
        # Fetch and paginate accounts
        garagegroup_objs = GarageGroup.objects.all()
        page_obj = Paginator(garagegroup_objs, 100).get_page(request.GET.get('page'))
        context['garagegroup_objs'] = page_obj

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_accounts_garagegroup', 200)
        return render(request, templatespath.template_accounts_garagegroup_r_garagegroup, context) 


@managesession.check_session_timeout
def c_accounts_garagegroup(request, context):

    if request.method == 'GET': 
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_garagegroup', 200)
        return render(request, templatespath.template_accounts_garagegroup_c_garagegroup, context)

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                name = request.POST.get('name')
                # Prepare garagegroup data
                insert_garagegroup_data = {   
                    'name': name,
                }                
                # Create garagegroup
                garagegroup = GarageGroup.objects.create(**insert_garagegroup_data)
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_accounts_garagegroup', 200) 
                messages.success(request,"Garage Group created successfully")
                return redirect('r-accounts-garagegroup')
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)


@managesession.check_session_timeout
def u_accounts_garagegroup(request, context, id):
    garagegroup_obj = get_object_or_404(GarageGroup, id=id)
    context['garagegroup_obj'] =  garagegroup_obj

    if request.method == 'GET': 
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_garagegroup', 200)
        return render(request, templatespath.template_accounts_garagegroup_u_garagegroup, context)        

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
                # Update garagegroup fields
                update_garagegroup_data = {
                    "name": name,
                }
                # Apply all updates
                for field, value in update_garagegroup_data.items():
                    update_field(garagegroup_obj, field, value)

                # Save only if any field was updated
                if updated:
                    garagegroup_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.")   
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_garagegroup', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path)  


@managesession.check_session_timeout
def u_accounts_garagegroup_mapping(request, context, id):
    garagegroup_obj = get_object_or_404(GarageGroup, id=id)
    context['garagegroup_obj'] =  garagegroup_obj

    if request.method == 'GET': 
        context['garage_objs'] = Garage.objects.all()
        context['selected_garage_ids'] = list(garagegroup_obj.rel_garage_garagegroup.values_list('garage_id', flat=True))
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_garagegroup_mapping', 200)
        return render(request, templatespath.template_accounts_garagegroup_u_garagegroup_mapping, context)        

    if request.method == 'POST':
        try:
            with transaction.atomic():                 
                updated = False  # Flag to track if any value is updated

                # Handle garage assignments
                new_garage_ids = set(map(int, request.POST.getlist("garage_id", [])))
                existing_garage_ids = set(
                    RelGarageGarageGroup.objects.filter(garagegroup=garagegroup_obj)
                    .values_list('garage_id', flat=True)
                )
                # Get IDs to add/remove
                garage_ids_to_add = new_garage_ids - existing_garage_ids
                garage_ids_to_remove = existing_garage_ids - new_garage_ids
                # Bulk delete removed garages
                if garage_ids_to_remove:
                    RelGarageGarageGroup.objects.filter( 
                        garage_id__in=garage_ids_to_remove,
                        garagegroup=garagegroup_obj
                    ).delete()
                    updated = True
                # Bulk create new garage assignments
                if garage_ids_to_add:
                    new_assignments = [
                        RelGarageGarageGroup(garage_id=garage_id, garagegroup=garagegroup_obj)
                        for garage_id in garage_ids_to_add
                    ]
                    RelGarageGarageGroup.objects.bulk_create(new_assignments)
                    updated = True    

                # Save only if any field was updated
                if updated:
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.")  
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_garagegroup_mapping', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            
        return redirect(request.path)


@managesession.check_session_timeout
def d_accounts_garagegroup(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    garagegroup_obj = get_object_or_404(GarageGroup, id=id)
                    if garagegroup_obj:
                        deleted_data.append(garagegroup_obj.id) 
                        garagegroup_obj.delete()

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