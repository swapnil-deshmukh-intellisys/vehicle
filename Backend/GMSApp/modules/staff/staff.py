
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import GarageStaff
from GMSApp.modules import templatespath, managesession, audit
from django.conf import settings
from datetime import datetime, timedelta
import logging, json, os

@managesession.check_session_timeout
def r_staff(request, context):
    if request.method == 'GET':
        staff_objs = GarageStaff.objects.filter(garage_id=context['garage_id'])        
        # Pagination
        paginator = Paginator(staff_objs, 100)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        context['staff_objs'] =  page_obj        
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_staff', 200)
        return render(request, templatespath.template_staff_r_staff, context)


@managesession.check_session_timeout
def c_staff(request, context):
    if request.method == 'GET':
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_staff', 200)
        return render(request, templatespath.template_staff_c_staff, context)

    if request.method == 'POST':
        try:
            with transaction.atomic():
                # Extract form data
                firstname = request.POST.get('firstname')
                middlename = request.POST.get('middlename')
                lastname = request.POST.get('lastname')
                phone = request.POST.get('phone')
                email = request.POST.get('email')
                aadhar = request.POST.get('aadhar')
                role = request.POST.getlist('role')
                status = request.POST.get('status')
                availability = True if request.POST.get('availability') == 'on' else False
                year_of_experience = request.POST.get('year_of_experience')
                past_experience = request.POST.get('past_experience')
                specialization = request.POST.get('specialization')
                reference_by_name = request.POST.get('reference_by_name')
                reference_by_phone = request.POST.get('reference_by_phone')
                reference_by_email = request.POST.get('reference_by_email')
                

                # Prepare data
                insert_garagestaff_data = {                    
                    'garage_id': context['garage_id'],
                    'firstname': firstname,
                    'middlename': middlename,
                    'lastname': lastname,
                    'phone': phone,
                    'email': email,
                    'aadhar': aadhar,
                    'role': json.dumps(role),
                    'reference_by_name': reference_by_name,
                    'reference_by_phone': reference_by_phone,
                    'reference_by_email': reference_by_email,
                    'year_of_experience': year_of_experience,
                    'past_experience': past_experience,
                    'specialization': specialization,
                    'status': status,
                    'availability': availability
                } 

                # Handle attachment upload
                if 'attachment' in request.FILES:
                    attachment = request.FILES['attachment']
                    trimmed_filename = attachment.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"{phone}_attachment_{current_datetime}{ext}"
                    directory = 'static/custom-assets/staff/attachment/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in attachment.chunks():
                            destination.write(chunk)
                    insert_garagestaff_data['attachment'] = file_path 

                # Create
                GarageStaff.objects.create(**insert_garagestaff_data)
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_staff', 200) 
                messages.success(request,"Staff created successfully")
                return redirect('r-staff')
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)  



@managesession.check_session_timeout
def u_staff(request, context, id):
    staff_obj = get_object_or_404(GarageStaff, id=id)
    context['staff_obj'] = staff_obj
    if request.method == 'GET':
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_staff', 200)
        return render(request, templatespath.template_staff_u_staff, context)

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
                firstname = request.POST.get('firstname')
                middlename = request.POST.get('middlename')
                lastname = request.POST.get('lastname')
                email = request.POST.get('email')
                aadhar = request.POST.get('aadhar')
                role = request.POST.getlist('role')
                status = request.POST.get('status')
                availability = True if request.POST.get('availability') == 'on' else False
                year_of_experience = request.POST.get('year_of_experience')
                past_experience = request.POST.get('past_experience')
                specialization = request.POST.get('specialization')
                reference_by_name = request.POST.get('reference_by_name')
                reference_by_phone = request.POST.get('reference_by_phone')
                reference_by_email = request.POST.get('reference_by_email')

                # Update fields
                update_garagestaff_data = {          
                    'firstname': firstname,
                    'middlename': middlename,
                    'lastname': lastname,
                    'email': email,
                    'aadhar': aadhar,
                    'role': json.dumps(role),
                    'reference_by_name': reference_by_name,
                    'reference_by_phone': reference_by_phone,
                    'reference_by_email': reference_by_email,
                    'year_of_experience': year_of_experience,
                    'past_experience': past_experience,
                    'specialization': specialization,
                    'status': status,
                    'availability': availability
                } 

                # Handle attachment upload
                if 'attachment' in request.FILES:
                    attachment = request.FILES['attachment']
                    trimmed_filename = attachment.name.strip().replace(' ', '_')
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    _name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"{staff_obj.phone}_attachment_{current_datetime}{ext}"
                    directory = 'static/custom-assets/staff/attachment/'  # Target directory
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Delete old file if exists
                    if staff_obj.attachment:
                        old_attachment_path = os.path.join(settings.BASE_DIR, staff_obj.attachment)
                        if os.path.exists(old_attachment_path):
                            os.remove(old_attachment_path)
                    # Save the uploaded file to the filesystem
                    with open(file_path, 'wb+') as destination:
                        for chunk in attachment.chunks():
                            destination.write(chunk)
                    update_garagestaff_data['attachment'] = file_path 

                # Apply all updates
                for field, value in update_garagestaff_data.items():
                    update_field(staff_obj, field, value)

                # Save only if any field was updated
                if updated:
                    staff_obj.save()
                    messages.success(request, "Data updated successfully!")
                else:
                    messages.info(request, "No changes were made.")  

                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_staff', 200) 
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        return redirect(request.path)     


@managesession.check_session_timeout
def d_staff(request, context):
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    staff_obj = GarageStaff.objects.filter(id=id).first()
                    if staff_obj:
                        deleted_data.append(staff_obj.id) 
                        staff_obj.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} staff deleted"
                    sts = True
                else:
                    msg = "Failed to delete staff"
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
@csrf_exempt
@require_http_methods(["GET"])
def list_staff(request, context):
    try:
        role = request.GET.get('role')
        if not role:
            return JsonResponse({
                'status': 'error',
                'message': 'Role is required'
            }, status=400)

        # Get active and available supervisors for the garage
        staff_queryset = GarageStaff.objects.filter(
            garage_id=context['garage_id'],
            status='active',
            availability=True
        )
        staff = [staff for staff in staff_queryset if role in staff.roles]

        # Format the response
        staff_list = [{
            'id': sup.id,
            'name': f"{sup.firstname} {getattr(sup, 'lastname', '')}".strip()
        } for sup in staff]

        return JsonResponse({
            'status': 'success',
            'data': staff_list
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)        


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def create_staff(request, context):
    try:
        with transaction.atomic():
            role = request.POST.get('role')
            if role not in ['mechanic', 'supervisor']:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid role'
                }, status=400)

            # Get all required fields from the request
            required_fields = [
                f'{role}firstname', f'{role}lastname', f'{role}phone', f'{role}aadhar', 
                f'{role}year_of_experience', f'{role}reference_by_name', f'{role}reference_by_phone'
            ]
            
            # Check for missing required fields
            missing_fields = [field for field in required_fields if not request.POST.get(field)]
            if missing_fields:
                return JsonResponse({
                    'status': 'error',
                    'message': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=400)

            # Create new staff
            staff = GarageStaff.objects.create(
                firstname=request.POST.get(f'{role}firstname'),
                lastname=request.POST.get(f'{role}lastname'),
                phone=request.POST.get(f'{role}phone'),
                aadhar=request.POST.get(f'{role}aadhar'),
                role=request.POST.get('role'),
                reference_by_name=request.POST.get(f'{role}reference_by_name'),
                reference_by_phone=request.POST.get(f'{role}reference_by_phone'),
                year_of_experience=request.POST.get(f'{role}year_of_experience', 0),
                status='active',
                garage_id=context['garage_id']
            )

            return JsonResponse({
                'status': 'success',
                'data': {
                    'id': staff.id,
                    'name': f"{staff.firstname} {staff.lastname}",
                    'phone': staff.phone,
                    'aadhar': staff.aadhar,
                    'year_of_experience': staff.year_of_experience,
                    'status': staff.status
                },
                'message': f'{role} created successfully'
            })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Failed to create {role}: {str(e)}'
        }, status=400)        