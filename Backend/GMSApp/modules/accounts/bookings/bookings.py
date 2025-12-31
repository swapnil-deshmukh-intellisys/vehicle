import logging
from decimal import Decimal

from django.contrib import messages
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import OuterRef, Subquery
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from GMSApp.models import (
    BookingStatus,
    BookingTimeline,
    Customer,
    GarageStaff,
    Jobcard,
    JobcardMechanic,
    SubscriberBooking,
)
from GMSApp.modules import audit, managesession, templatespath

# @managesession.check_session_timeout
# def r_accounts_bookings(request, context):
#     if request.method == 'GET':
#         # Base filter for bookings
#         filter_bookings_data = {}
        
#         # Apply additional filters based on user type
#         if context['usertype'] == 'admin':
#             filter_bookings_data['subscriberaddress__city_id__in'] = context['allowed_city_ids']
#         elif context['usertype'] != 'business':  # For other user types (e.g., garage users)
#             filter_bookings_data['garage_id__in'] = context['allowed_garage_ids']
        
#         # Optimize query by selecting related fields and only what's needed
#         bookings_queryset = SubscriberBooking.objects.filter(**filter_bookings_data)
        
#         # Get the latest timeline entry for each booking in a single query
#         latest_timeline = (
#             BookingTimeline.objects
#             .filter(booking_id=OuterRef('pk'))
#             .order_by('-created_at')
#             .values('status__displayname', 'status__name')[:1]
#         )
        
#         # Annotate the bookings with their latest status in a single query
#         bookings_objs = bookings_queryset.select_related(
#                     'subscriber',
#                     'subscribervehicle__model',
#                     'subscribervehicle__model__brand',
#                     'subscribervehicle__model__cc',
#                     'subscriberaddress__city'
#                 ).annotate(
#             latest_status=Subquery(latest_timeline.values('status__displayname')[:1]),
#             latest_status_name=Subquery(latest_timeline.values('status__name')[:1])
#         ).select_related('subscriber', 'subscribervehicle', 'subscriberaddress', 'garage')
        
#         # Get counts before pagination (for all)
#         context['total_booking'] = bookings_objs.count()
#         context['new_booking'] = bookings_objs.filter(latest_status_name='booking_confirmed').count()
#         context['inprogress_booking'] = bookings_objs.exclude(
#             latest_status_name__in=['booking_confirmed', 'work_completed']
#         ).count()
#         context['completed_booking'] = bookings_objs.filter(latest_status_name='work_completed').count()


#         # Check for filter parameter in URL
#         status_filter = request.GET.get('filter')
#         if status_filter == 'new':
#             bookings_objs = bookings_objs.filter(latest_status_name='booking_confirmed')
#         elif status_filter == 'inprogress':
#             bookings_objs = bookings_objs.exclude(latest_status_name__in=['booking_confirmed', 'work_completed'])
#         elif status_filter == 'completed':
#             bookings_objs = bookings_objs.filter(latest_status_name='work_completed')   
        
#         # Paginate the results with a reasonable page size
#         paginator = Paginator(bookings_objs, 100)
#         page_number = request.GET.get('page')
#         page_obj = paginator.get_page(page_number)

#         # Update context
#         context.update({
#             'bookings_objs': page_obj,
#         }) 
        
#         # calling functions
#         audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_accounts_bookings', 200)
#         return render(request, templatespath.template_accounts_bookings_r_bookings, context) 


@managesession.check_session_timeout
def r_accounts_bookings(request, context):
    if request.method == 'GET':    

        # ---- 1️⃣ Base Filter Setup ----
        filter_bookings_data = {}

        usertype = context.get('usertype')
        if usertype == 'admin':
            filter_bookings_data['subscriberaddress__city_id__in'] = context.get('allowed_city_ids', [])
        elif usertype != 'business':  # e.g. garage users
            filter_bookings_data['garage_id__in'] = context.get('allowed_garage_ids', [])

        # ---- 2️⃣ Query Optimization ----
        # Build base queryset
        bookings_queryset = (
            SubscriberBooking.objects
            .filter(**filter_bookings_data)
            .select_related(
                'subscriber',
                'subscribervehicle__model',
                'subscribervehicle__model__brand',
                'subscribervehicle__model__cc',
                'subscriberaddress__city',
                'garage'
            )
        )

        # ---- 3️⃣ Annotate Latest Status ----
        latest_timeline = (
            BookingTimeline.objects
            .filter(booking_id=OuterRef('pk'))
            .order_by('-created_at')
        )

        bookings_objs = bookings_queryset.annotate(
            latest_status=Subquery(latest_timeline.values('status__displayname')[:1]),
            latest_status_name=Subquery(latest_timeline.values('status__name')[:1])
        )

        # ---- 4️⃣ Compute Status Counts ----
        context.update({
            'total_booking': bookings_objs.count(),
            'new_booking': bookings_objs.filter(latest_status_name='booking_confirmed').count(),
            'inprogress_booking': bookings_objs.exclude(
                latest_status_name__in=['booking_confirmed', 'work_completed']
            ).count(),
            'completed_booking': bookings_objs.filter(latest_status_name='work_completed').count(),
        })

        # ---- 5️⃣ Apply URL Filter (if any) ----
        status_filter = request.GET.get('filter')
        if status_filter == 'new':
            bookings_objs = bookings_objs.filter(latest_status_name='booking_confirmed')
        elif status_filter == 'inprogress':
            bookings_objs = bookings_objs.exclude(latest_status_name__in=['booking_confirmed', 'work_completed'])
        elif status_filter == 'completed':
            bookings_objs = bookings_objs.filter(latest_status_name='work_completed')

        # ---- 6️⃣ Pagination ----
        page_obj = Paginator(bookings_objs, 100).get_page(request.GET.get('page'))

        # ---- 7️⃣ Update Context & Render ----
        context['bookings_objs'] = page_obj

        audit.create_audit_log(
            context['useremail'],
            f'USER: {context["useremail"]}, {request.method}: {request.path}',
            'r_accounts_bookings',
            200
        )

        return render(request, templatespath.template_accounts_bookings_r_bookings, context)


@managesession.check_session_timeout
def v_accounts_bookings(request, context, id):    
    # Get the booking with its latest status from the timeline
    latest_timeline = BookingTimeline.objects.filter(
        booking_id=OuterRef('pk')
    ).order_by('-created_at')
    
    # Get the booking with its latest status annotated
    booking_obj = get_object_or_404(
        SubscriberBooking.objects.select_related(
                    'subscriber',
                    'subscribervehicle__model',
                    'subscribervehicle__model__brand',
                    'subscribervehicle__model__cc',
                    'subscriberaddress__city'
                ).annotate(
            latest_status_id=Subquery(latest_timeline.values('status_id')[:1]),
            latest_status=Subquery(latest_timeline.values('status__displayname')[:1]),
            latest_status_name=Subquery(latest_timeline.values('status__name')[:1])
        ),
        id=id
    )

    is_jobcard = False
    if booking_obj.jobcard_id:        
        jobcard = Jobcard.objects.filter(id=booking_obj.jobcard_id).first()
        context['jobcard_id'] = booking_obj.jobcard_id
        if jobcard:
            context['jobcard_status'] = jobcard.status
            context['jobcard_number'] = jobcard.jobcard_number
            is_jobcard = True
        else:
            context['jobcard_status'] = None
            context['jobcard_number'] = None


    
    context['booking_obj'] = booking_obj
    context['is_jobcard'] = is_jobcard
    
    # Get the booking timeline entries in reverse chronological order (newest first)
    timeline_entries = BookingTimeline.objects.filter(
        booking=booking_obj
    ).select_related('status').order_by('-created_at')

    # Process each entry to update the remark if needed
    for entry in timeline_entries:
        # 2:'pickup_assigned', 5:'mechanic_assigned'
        if entry.status and entry.status.id in [2, 5] and entry.remark:
            try:
                # Try to get the staff member's name
                staff = GarageStaff.objects.filter(id=int(entry.remark)).first()
                if staff:
                    # Update the remark with the staff's full name
                    entry.remark = f"{staff.firstname} {staff.middlename or ''} {staff.lastname}".strip()
            except (ValueError, TypeError):
                # If remark is not a valid ID, leave it as is
                pass
    
    # Add to context
    context['timeline_entries'] = timeline_entries
    context['booking_status_choices'] = BookingStatus.objects.all().order_by('id')
    context['crew'] = GarageStaff.get_active_and_available_crew_for_garage(garage_id=context['garage_id'])
    context['mechanic'] =  GarageStaff.get_active_and_available_mechanic_for_garage(garage_id=context['garage_id'])

    if request.method == 'GET': 
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'v_accounts_bookings', 200)
        return render(request, templatespath.template_accounts_bookings_v_bookings, context) 


@managesession.check_session_timeout
def u_accounts_bookings(request, context, id):
    booking_obj = get_object_or_404(SubscriberBooking.objects.select_related('booking_status'), id=id)
    context['booking_obj'] = booking_obj
    
    # Get all booking statuses ordered by ID for consistent display
    context['booking_status_choices'] = BookingStatus.objects.all().order_by('id')
    
    # Define payment status choices
    context['payment_status_choices'] = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded')
    ]
    
    if request.method == 'GET':
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_bookings', 200)
        return render(request, templatespath.template_accounts_bookings_u_bookings, context) 

    if request.method == 'POST':
        try:
            with transaction.atomic():
                updated = False  # Flag to track if any value is updated
                
                # Helper function to update fields only if changed
                def update_field(field, new_value):
                    nonlocal updated
                    if getattr(booking_obj, field) != new_value:
                        setattr(booking_obj, field, new_value)
                        return True
                    return False
                
                # # Handle booking status update
                # booking_status_id = request.POST.get('booking_status')
                # if booking_status_id and booking_status_id != str(booking_obj.booking_status_id):
                #     try:
                #         new_status = BookingStatus.objects.get(id=booking_status_id)
                #         if update_field('booking_status', new_status):
                #             updated = True
                            
                #             # Handle cancellation reason for cancelled status
                #             if new_status.name.lower() == 'cancelled':
                #                 cancel_reason = request.POST.get('cancel_reason', '').strip()
                #                 if not cancel_reason:
                #                     messages.error(request, 'Cancellation reason is required when cancelling a booking')
                #                     return redirect('u-accounts-bookings', id=booking_obj.id)
                #                 if update_field('cancel_reason', cancel_reason):
                #                     updated = True
                #             # Clear cancellation reason if status is changed from cancelled
                #             elif booking_obj.cancel_reason is not None:
                #                 booking_obj.cancel_reason = None
                #                 updated = True
                                
                #     except (BookingStatus.DoesNotExist, ValueError):
                #         messages.error(request, 'Invalid booking status selected')
                #         return redirect('u-accounts-bookings', id=booking_obj.id)
                
                # Handle payment status update
                payment_status = request.POST.get('payment_status')
                if payment_status and payment_status != booking_obj.payment_status:
                    if update_field('payment_status', payment_status):
                        updated = True
                        # Update payment date if status changed to completed and no payment date is set
                        if payment_status == 'completed' and not booking_obj.payment_date:
                            booking_obj.payment_date = timezone.now()
                            updated = True
                
                # Handle amount updates with proper decimal conversion
                try:
                    booking_amount = Decimal(str(request.POST.get('booking_amount', booking_obj.booking_amount or 0)))
                    if update_field('booking_amount', booking_amount):
                        updated = True
                        
                    total_amount = Decimal(str(request.POST.get('total_amount', booking_obj.total_amount or 0)))
                    if update_field('total_amount', total_amount):
                        updated = True
                except (InvalidOperation, TypeError, ValueError):
                    messages.error(request, 'Invalid amount format')
                    return redirect('u-accounts-bookings', id=booking_obj.id)
                
                # Update other fields
                payment_method = request.POST.get('payment_method', '').strip()
                if payment_method != booking_obj.payment_method:
                    booking_obj.payment_method = payment_method
                    updated = True
                
                suggestion = request.POST.get('suggestion', '').strip()
                if update_field('suggestion', suggestion):
                    updated = True
                
                required_estimate = 'required_estimate' in request.POST
                if booking_obj.required_estimate != required_estimate:
                    booking_obj.required_estimate = required_estimate
                    updated = True
                
                # Save changes if any field was updated
                if updated:
                    booking_obj.save()
                    messages.success(request, 'Booking updated successfully!')
                else:
                    messages.info(request, 'No changes were made to the booking.')
                
                # calling functions
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts_bookings', 200) 
                return redirect('v-accounts-bookings', id=booking_obj.id)
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            # calling functions
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)  


@managesession.check_session_timeout
def d_accounts_bookings(request, context): 
    if request.method == 'POST':
        try:
            with transaction.atomic():
                booking_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in booking_ids:
                    bookings_obj = get_object_or_404(SubscriberBooking, id=id)
                    if bookings_obj:
                        deleted_data.append(bookings_obj.id) 
                        bookings_obj.delete()

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


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def create_booking_jobcard(request, context):
    try:
        with transaction.atomic():
            # Input validation
            booking_id = request.POST.get('bookingid')
            if not booking_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Missing required field: bookingid'
                }, status=400)

            # Get booking with related data in a single query
            booking_obj = get_object_or_404(
                SubscriberBooking.objects.select_related(
                    'subscriber',
                    'subscriberaddress__city'
                ), 
                id=booking_id
            )

            # Get or create customer in a single query
            customer_obj, _ = Customer.objects.get_or_create(
                phone=booking_obj.subscriber.phone,
                garage_id=context['garage_id'],
                defaults={
                    'name': booking_obj.subscriber.name if booking_obj.subscriber.name else booking_obj.subscriber.phone,
                    'email': booking_obj.subscriber.email,
                    'address': f"{booking_obj.subscriberaddress.address}, {booking_obj.subscriberaddress.city.name}",
                    'pincode': booking_obj.subscriberaddress.pincode
                }
            )

            # Generate jobcard number
            last_jobcard = Jobcard.objects.filter(
                garage_id=context['garage_id']
            ).order_by('-jobcard_number').only('jobcard_number').first()
            
            new_jobcard_number = _generate_jobcard_number(last_jobcard) if last_jobcard else "JOB-101"

            # Create jobcard
            jobcard = Jobcard.objects.create(
                garage_id=context['garage_id'],
                booking=booking_obj,
                customer=customer_obj,
                current_date=timezone.now().date(),
                jobcard_number=new_jobcard_number,
                created_by_id=context['userid']
            )

            # Assign mechanic if available
            _assign_mechanic_to_jobcard(jobcard, booking_obj)

            # Update booking with jobcard reference
            booking_obj.jobcard_id = jobcard.id
            booking_obj.save(update_fields=['jobcard_id'])

            # Update booking status
            msg = _update_booking_status(booking_obj.id, jobcard.jobcard_number)

            return JsonResponse({
                'status': 'success',
                'id': jobcard.jobcard_number,
                'message': f'Job card created and {msg}'
            })

    except Exception as e:
        logging.getLogger(__name__).error(f"Error creating jobcard: {str(e)}", exc_info=True)
        return JsonResponse({
            'status': 'error',
            'message': 'An error occurred while processing your request'
        }, status=400)

def _generate_jobcard_number(last_jobcard):
    """Helper method to generate jobcard number"""
    try:
        prefix, number = last_jobcard.jobcard_number.split("-")
        return f"{prefix}-{int(number) + 1}"
    except (ValueError, AttributeError):
        return f"JOB-{last_jobcard.id + 1}"

def _assign_mechanic_to_jobcard(jobcard, booking_obj):
    """Helper method to assign mechanic to jobcard if available"""
    latest_timeline = (
        BookingTimeline.objects
        .filter(booking=booking_obj, status_id=5)
        .order_by('-created_at')
        .first()
    )
    
    if latest_timeline and latest_timeline.remark:
        try:
            mechanic_id = int(latest_timeline.remark)
            if GarageStaff.objects.filter(id=mechanic_id).exists():
                JobcardMechanic.objects.create(
                    jobcard=jobcard,
                    mechanic_id=mechanic_id
                )
        except (ValueError, TypeError):
            pass

def _update_booking_status(booking_id, jobcard_number):
    """Helper method to update booking status"""
    try:
        status_obj = BookingStatus.objects.get(name='job_card_created')
        BookingTimeline.objects.create(
            booking_id=booking_id,
            status=status_obj,
            remark=jobcard_number
        )
        return "Status updated successfully"
    except BookingStatus.DoesNotExist:
        return "Status update failed"
