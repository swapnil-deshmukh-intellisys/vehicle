from django.shortcuts import render, redirect
from django.core.exceptions import ValidationError
from GMSApp.modules import templatespath, audit, encryption_util
from django.contrib import messages
from GMSApp.models import Users
from django.utils import timezone
from datetime import timedelta
import logging
from django.db import transaction

def reset_password(request):

    if request.method == 'GET':
        return render(request, templatespath.template_reset_password) 
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                email = request.POST.get('reset-password-email')
                current_password = request.POST.get('reset-password-current')
                new_password = request.POST.get('reset-password-new')
                confirm_password = request.POST.get('reset-password-confirm')

                user = Users.objects.filter(email=email).first()

                if not user:
                    # calling functions
                    audit.create_audit_log(email, f'USER: {email}, {request.method}: {request.path}', 'User does not exist, Please check your email', 200)
                    messages.warning(request, 'User does not exist, Please check your email')
                    return redirect('reset-password') 
                
                decrypt_user_password= encryption_util.decrypt(user.password)

                if decrypt_user_password != current_password:
                    # calling functions
                    audit.create_audit_log(email, f'USER: {email}, {request.method}: {request.path}', 'Invalid current password', 200)
                    messages.warning(request, 'Invalid current password')
                    return redirect('reset-password')
                
                if decrypt_user_password == new_password:
                    # calling functions
                    audit.create_audit_log(email, f'USER: {email}, {request.method}: {request.path}', 'The new password cannot be the same as the current password', 200)
                    messages.warning(request, 'The new password cannot be the same as the current password')
                    return redirect('reset-password')

                if new_password != confirm_password:
                    # calling functions
                    audit.create_audit_log(email, f'USER: {email}, {request.method}: {request.path}', 'New password and confirm password should be same', 200)
                    messages.warning(request, 'New password and confirm password should be same')
                    return redirect('reset-password')            

                user.password = encryption_util.encrypt(confirm_password)

                if user.password_reset_flag: 
                    user.password_reset_flag = False
                
                user.password_reset_duration = timezone.now() 

                user.save()  # Save the changes to the database

                # calling functions
                audit.create_audit_log(email, f'USER: {email}, {request.method}: {request.path}', 'User password changed successfully', 200)
                messages.success(request, "User password changed successfully")
                return redirect('login')

        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(email, f'USER: {email}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect('reset-password')    