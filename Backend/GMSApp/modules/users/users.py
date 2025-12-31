from django.shortcuts import render, redirect, get_object_or_404
from django.core.exceptions import ValidationError
from GMSApp.modules import templatespath, encryption_util, managesession, audit
from django.contrib import messages
from django.http import JsonResponse
from GMSApp.models import Users, Roles, Garage, GarageGroup, RelGarageGarageGroup, RelGarageUser, City, RelCityUser
from datetime import datetime
from django.utils import timezone
import logging, json
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator
from django.views.decorators.http import require_GET

@require_GET
def get_garages_by_group(request):
    garagegroup_id = request.GET.get('garagegroup_id')
    if not garagegroup_id:
        return JsonResponse({'status': 'error', 'message': 'Garage group ID is required'}, status=400)
    
    try:
        # Get all garage IDs in this group
        garage_relations = RelGarageGarageGroup.objects.filter(
            garagegroup_id=garagegroup_id
        ).select_related('garage')
        
        # Prepare response data
        garages = [{
            'id': rel.garage.id,
            'name': rel.garage.name
        } for rel in garage_relations]
        
        return JsonResponse({
            'status': 'success',
            'garages': garages
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@managesession.check_session_timeout
def r_users(request, context): 
    if request.method == 'GET':
        filter_users_data = {}
        
        if (context['usertype'] != 'admin' and 
            context.get('garagegroup_id')):
            filter_users_data['garagegroup_id'] = context['garagegroup_id']

        user_objs = Users.objects.filter(**filter_users_data)

        # Pagination
        paginator = Paginator(user_objs, 100)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        context['users'] = page_obj

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'users', 200)
        return render(request, templatespath.template_r_users, context)
    

@managesession.check_session_timeout
def c_users(request, context):     
    
    if request.method == 'GET':      
        context['roles_objs'] = Roles.objects.all()   
        context['garagegroup_objs'] = GarageGroup.objects.all()       
        context['city_objs'] = City.objects.filter(status='active')

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'Create users', 200)
        return render(request, templatespath.template_c_users, context)
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                email = request.POST.get('email')
                name = request.POST.get('name')
                mobile = request.POST.get('mobile')
                password = request.POST.get('password')
                role_id = request.POST.get('role_id')
                garagegroup_id = request.POST.get('garagegroup_id')
                status = request.POST.get('status')
                usertype = request.POST.get('usertype')
                expiry = request.POST.get('expiry') 
                pri = request.POST.get('pri') 
                prf = bool(request.POST.get('prf')) 

                # Ensure required fields are provided
                if not role_id:
                    raise ValueError("Role are required.")

                # Fetch related objects
                role_obj = get_object_or_404(Roles, id=role_id)
                            
                # Prepare user data
                insert_user_data = {
                    'email': email,
                    'name': name,
                    'mobile': mobile,
                    'password': encryption_util.encrypt(password),
                    'roles': role_obj,
                    'status': status,
                    'expiry': expiry,
                    'password_reset_interval': int(pri),
                    'password_reset_flag': prf,
                    'password_reset_duration': timezone.now()
                }
                
                # Add usertype
                insert_user_data['usertype'] = usertype
                
                # Handle garage group and garage assignments for garage/partner users
                if usertype in ['garage', 'partner'] and garagegroup_id:
                    garagegroup_obj = get_object_or_404(GarageGroup, id=garagegroup_id)
                    insert_user_data['garagegroup'] = garagegroup_obj
                
                # Create user
                user = Users.objects.create(**insert_user_data)

                
                # Handle garage assignments for garage/partner users
                if usertype in ['garage', 'partner']:
                    garage_ids = request.POST.getlist("garage_id")
                    if garage_ids and garage_ids[0]:  # Check if garage_ids is not empty and first element is not empty
                        for garage_id in garage_ids:
                            RelGarageUser.objects.create(
                                garage_id=garage_id,
                                user=user
                            )
                
                # Handle city assignments for admin users
                if usertype == 'admin':
                    city_ids = request.POST.getlist("city_id")
                    if city_ids and city_ids[0]:  # Check if city_ids is not empty and first element is not empty
                        for city_id in city_ids:
                            RelCityUser.objects.create(
                                city_id=city_id,
                                user=user
                            ) 

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'User created successfully', 200)
                messages.success(request, "User created successfully")
                return redirect("r-users")
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect("c-users")


@managesession.check_session_timeout
def u_users(request, context, id):
    user_obj = get_object_or_404(Users, id=id)
    context['user_obj'] = user_obj 

    if request.method == 'GET':        
        context['roles_objs'] = Roles.objects.all()            
        context['garagegroup_objs'] = GarageGroup.objects.all()
        context['city_objs'] = City.objects.filter(status='active')
        context['selected_user_city_ids'] = list(user_obj.rel_city_user.values_list('city_id', flat=True))

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'Update users', 200)
        return render(request, templatespath.template_u_users, context)  
    
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
                mobile = request.POST.get('mobile')
                role_id = request.POST.get('role_id')
                status = request.POST.get('status')
                usertype = request.POST.get('usertype')
                expiry = request.POST.get('expiry') 
                pri = request.POST.get('pri') 
                prf = bool(request.POST.get('prf')) 

                # Ensure required fields are provided
                if not role_id:
                    raise ValueError("Role is required.")

                # Fetch related objects
                role_obj = get_object_or_404(Roles, id=role_id)

                # Update user fields
                update_user_data = {
                    "name": name,
                    "mobile": mobile,
                    "roles": role_obj,
                    "status": status,
                    "expiry": datetime.strptime(expiry, "%Y-%m-%dT%H:%M"),
                    "password_reset_interval": int(pri),
                    "password_reset_flag": prf
                }
                
                # Update usertype
                update_user_data["usertype"] = usertype
                
                # Apply all updates
                for field, value in update_user_data.items():
                    update_field(user_obj, field, value)
                
                # Handle garage group and garage assignments for garage/partner users
                if usertype in ['garage', 'partner']:
                    # Update garage group if changed
                    garagegroup_id = request.POST.get('garagegroup_id')
                    if garagegroup_id:
                        garagegroup_obj = get_object_or_404(GarageGroup, id=garagegroup_id)
                        if user_obj.garagegroup_id != garagegroup_obj.id:
                            user_obj.garagegroup = garagegroup_obj
                            updated = True
                    elif user_obj.garagegroup_id is not None:
                        # If no garage group is selected but user previously had one, clear it
                        user_obj.garagegroup = None
                        updated = True
                    
                    # Handle garage assignments
                    new_garage_ids = set(map(int, request.POST.getlist("garage_id", [])))
                    existing_garage_ids = set(
                        RelGarageUser.objects.filter(user=user_obj)
                        .values_list('garage_id', flat=True)
                    )
                    # Get IDs to add/remove
                    garage_ids_to_add = new_garage_ids - existing_garage_ids
                    garage_ids_to_remove = existing_garage_ids - new_garage_ids
                    # Bulk delete removed garages
                    if garage_ids_to_remove:
                        RelGarageUser.objects.filter(
                            user=user_obj, 
                            garage_id__in=garage_ids_to_remove
                        ).delete()
                        updated = True
                    # Bulk create new garage assignments
                    if garage_ids_to_add:
                        new_assignments = [
                            RelGarageUser(garage_id=garage_id, user=user_obj)
                            for garage_id in garage_ids_to_add
                        ]
                        RelGarageUser.objects.bulk_create(new_assignments)
                        updated = True
                else:
                    # Clear garage group and garage assignments if user type is not garage/partner
                    if user_obj.garagegroup_id is not None:
                        user_obj.garagegroup = None
                        updated = True
                    # Remove all garage assignments
                    existing_garage_count = RelGarageUser.objects.filter(user=user_obj).count()
                    if existing_garage_count > 0:
                        RelGarageUser.objects.filter(user=user_obj).delete()
                        updated = True
                
                # Handle city assignments for admin users
                if usertype == 'admin':
                    new_city_ids = set(map(int, request.POST.getlist("city_id", [])))
                    existing_city_ids = set(
                        RelCityUser.objects.filter(user=user_obj)
                        .values_list('city_id', flat=True)
                    )
                    # Get IDs to add/remove
                    city_ids_to_add = new_city_ids - existing_city_ids
                    city_ids_to_remove = existing_city_ids - new_city_ids
                    # Bulk delete removed cities
                    if city_ids_to_remove:
                        RelCityUser.objects.filter(
                            user=user_obj, 
                            city_id__in=city_ids_to_remove
                        ).delete()
                        updated = True
                    # Bulk create new city assignments
                    if city_ids_to_add:
                        new_assignments = [
                            RelCityUser(city_id=city_id, user=user_obj)
                            for city_id in city_ids_to_add
                        ]
                        RelCityUser.objects.bulk_create(new_assignments)
                        updated = True
                elif user_obj.usertype == 'admin' and usertype != 'admin':
                    # If changing from admin to non-admin, remove all city assignments
                    existing_city_count = RelCityUser.objects.filter(user=user_obj).count()
                    if existing_city_count > 0:
                        RelCityUser.objects.filter(user=user_obj).delete()
                        updated = True           

                # Save only if any field was updated
                if updated:
                    user_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.")  

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'User updated successfully', 200)
                return redirect(request.path)
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)       


@managesession.check_session_timeout
def u_users_password(request, context, id):
    user_obj = get_object_or_404(Users, id=id)
    context['user'] = user_obj

    if request.method == 'GET':  
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'Update users password', 200)
        return render(request, templatespath.template_u_users_password, context)      
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                password = request.POST.get('password') 
                cpassword = request.POST.get('cpassword')  

                if password != cpassword:
                    messages.warning(request, 'Passwords do not match')
                    return redirect(request.path)
                
                user_obj.password = encryption_util.encrypt(password)
                user_obj.save()  # Save the changes to the database

                # calling functions                
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'User password changed successfully', 200)
                messages.success(request, "User password changed successfully")
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        
        return redirect(request.path)


@managesession.check_session_timeout
def d_users(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                if not product_ids:
                    return JsonResponse({'status': False, 'message': 'No user IDs provided.'})
                success_count = 0
                failure_count = 0
                errormsg = []
                for user_id in product_ids:
                    user_obj = get_object_or_404(Users, id=user_id)
                    if user_obj:
                        try:
                            # Delete the user record
                            user_obj.delete()
                            success_count += 1
                        except (ValidationError, Exception) as e:
                            # Determine error message based on exception type
                            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
                            errormsg.append(error_msg)
                            failure_count += 1
                            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
                # Show Messages
                if errormsg:
                    msg = f"Users deleted: {success_count} success, {failure_count} failed. {', '.join(errormsg)}"
                else:           
                    msg = f"Users deleted: {success_count} success, {failure_count} failed."
                # Audit logging
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', msg, 200)
                return JsonResponse({'status': success_count != 0, 'message': msg})
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return JsonResponse({'status': False, 'message': error_msg})                  


@managesession.check_session_timeout
def r_users_profile(request, context): 
    user_obj = get_object_or_404(Users, email=context['useremail'])
    context['profile'] = user_obj 

    if request.method == 'GET':        
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_users_profile', 200) 
        return render(request, templatespath.template_r_users_profile, context)        