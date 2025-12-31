from django.shortcuts import render, redirect, get_object_or_404
from django.core.exceptions import ValidationError
from GMSApp.modules import templatespath, managesession, audit
from django.contrib import messages
from django.http import JsonResponse
from GMSApp.models import Roles, RolesPermissions, AccessPermissions
from GMSApp.modules.acl import acls
from django.db import transaction
import logging


@managesession.check_session_timeout
def r_roles(request, context): 
    if request.method == 'GET': 
        context['roles'] = Roles.objects.all()

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_roles', 200)
        return render(request, templatespath.template_r_roles, context)
    

@managesession.check_session_timeout
def c_roles(request, context):
    if request.method == 'GET':   
        # Fetch all Business ACL data using the function
        context['modules'] = acls.fetchAllBusinessAcl()

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_roles', 200) 
        return render(request, templatespath.template_c_roles, context)
    
    if request.method == 'POST':
        try: 
            with transaction.atomic():
                role = request.POST.get('role')
                # Check if the role already exists
                if Roles.objects.filter(name=role).exists():
                    raise ValueError("Role already exists")         

                # Create the role
                role = Roles.objects.create(
                    name=role
                )

                # Extract selected permissions
                selected_permissions = request.POST.getlist("permissions")
                # Add new assignments
                for permission_id in selected_permissions:
                    # check and create
                    if AccessPermissions.objects.filter(id=permission_id).exists():
                        RolesPermissions.objects.create(
                            role=role,
                            permission_id=permission_id,
                            value="1"
                        )

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_roles', 200)
                messages.success(request, "Role created successfully")
                return redirect("r-roles")
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)


@managesession.check_session_timeout
def u_roles(request, context, id): 
    role_obj = get_object_or_404(Roles, id=id)
    if request.method == 'GET':
        context['role_obj'] = role_obj
        
        # Fetch all Business ACL data using the function
        context['modules'] = acls.fetchAllBusinessAcl()

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_roles', 200)
        return render(request, templatespath.template_u_roles, context)  
    
    if request.method == 'POST':
        try: 
            with transaction.atomic():                
                # Extract selected permissions
                selected_permissions = request.POST.getlist("permissions")

                # Convert the assigned IDs to a set for easier comparison
                new_permission_ids = set(map(int, selected_permissions))
                
                existing_permission_ids = set(
                    RolesPermissions.objects.filter(role=role_obj).values_list('permission_id', flat=True)
                )

                # Determine the IDs to add and remove
                ids_to_add = new_permission_ids - existing_permission_ids
                ids_to_remove = existing_permission_ids - new_permission_ids               
                
                # Remove assignments that are no longer needed
                if ids_to_remove:
                    RolesPermissions.objects.filter(role=role_obj, permission_id__in=ids_to_remove).delete()
                # Add new assignments
                for permission_id in ids_to_add:
                    # check and create
                    if AccessPermissions.objects.filter(id=permission_id).exists():
                        RolesPermissions.objects.create(
                            role=role_obj,
                            permission_id=permission_id,
                            value="1"
                        )

                messages.success(request, "Roles permissions updated successfully.")
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_roles', 200)
                return redirect('r-roles') 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")        
            return redirect(request.path)


@managesession.check_session_timeout
def d_roles(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    roles_obj = get_object_or_404(Roles, id=id)
                    if roles_obj:
                        deleted_data.append(roles_obj.id) 
                        roles_obj.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} roles deleted"
                    sts = True
                else:
                    msg = "Failed to roles accounts"
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