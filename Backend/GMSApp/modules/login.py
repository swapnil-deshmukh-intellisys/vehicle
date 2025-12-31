from django.shortcuts import render, redirect, get_object_or_404
from django.core.exceptions import ValidationError
from GMSApp.modules import templatespath, encryption_util, managesession, audit
from django.contrib import messages
from GMSApp.models import Users,RelGarageUser
from GMSApp.modules.acl import acls
from django.utils import timezone
from datetime import timedelta
import logging, random
from django.db import transaction
from django.conf import settings


def login(request):
    if request.method == "GET":
        context = {}
        return render(request, templatespath.template_login, context)
     
    if request.method == 'POST':
        try:
            with transaction.atomic():
                login_email = request.POST.get('login-email')
                login_password = request.POST.get('login-password')

                user = Users.objects.filter(email=login_email).first()  

                if not user:
                    messages.warning(request, 'User does not exist. Please check your email.')
                    return redirect('login')
                
                new_password_reset_duration = user.password_reset_duration + timedelta(days=user.password_reset_interval)            
                current_datetime = timezone.now()

                if user.password_reset_flag or new_password_reset_duration < current_datetime:
                    messages.warning(request, 'Please reset your password.')
                    return redirect('reset-password')
                
                if user.status != 'active':
                        messages.warning(request, f'User is {user.status}. Please contact the admin.')
                        return redirect('login')

                if user.expiry and user.expiry < timezone.now():
                    messages.warning(request, 'Your account has expired. Please renew your subscription.')
                    return redirect('login')

                # calling functions
                if  encryption_util.decrypt(user.password) != login_password:
                    messages.warning(request, 'Incorrect password. Please try again.')
                    return redirect('login')

                # set_session_keys
                from datetime import date
                end_date = date.today()
                start_date = end_date - timedelta(days=7)
                
                keys_to_set = {                      
                    'userid': user.id,             
                    'useremail': user.email,
                    'username': user.name,
                    'usermobile': user.mobile,
                    'userrole': user.roles.name, 
                    'usertype': user.usertype,
                    'userstatus': user.status,
                    'userexpiry': str(user.expiry),
                    'garagegroup_id':user.garagegroup.id if user.garagegroup else None,
                    'date_range_start': start_date.isoformat(),
                    'date_range_end': end_date.isoformat()
                }
                
                if user.usertype == 'garage':
                    rel_garage_user = RelGarageUser.objects.filter(user=user).first()
                    keys_to_set['business_logo'] = rel_garage_user.garage.logo 
                
                # calling functions 
                keys_to_set['useruiacl'] = acls.fetchRolesAcl(user.roles.id)  # Store structured ACL
                
                # Get garage_ids if conditions are met, otherwise use empty list
                garage_ids = (list(user.rel_garage_user.values_list('garage_id', flat=True).distinct())
                            if hasattr(user, 'rel_garage_user') else [])
                # Store non-null garage_ids as strings
                keys_to_set['allowed_garage_ids'] = [g_id for g_id in garage_ids if g_id]
                
                # Get city_ids if conditions are met, otherwise use empty list
                keys_to_set['allowed_city_ids'] = list(user.rel_city_user.values_list('city_id', flat=True)) if hasattr(user, 'rel_city_user') else []
                
                # Set garage_id based on availability
                if garage_ids:
                    # Check if user has any existing garage access
                    existing_access = user.users_accesses.filter(
                        module='garage_id', 
                        value__in=garage_ids
                    ).first()
                    
                    if existing_access:
                        # Use existing garage_id
                        garage_id = existing_access.value
                    else:
                        # Create new access with random garage_id
                        garage_id = random.choice(garage_ids)
                        user.users_accesses.create(
                            module='garage_id',
                            value=garage_id
                        )
                else:
                    # If no garage_ids available, set to None
                    garage_id = None
                
                # Set the garage_id in session
                keys_to_set['garage_id'] = int(garage_id) if garage_id  else None


                # calling functions
                audit.create_audit_log(user.email, f'USER: {user.email}, {request.method}: {request.path}', 'login successfully', 200)
                
                if user.usertype == 'admin' or user.usertype == 'business':
                    response=redirect('r-garage-summary')
                else:
                    response=redirect('r-home')    
                    
                response = managesession.set_session_keys(keys_to_set, response)
                return response
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(user.email, f'USER: {user.email}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect('login')
