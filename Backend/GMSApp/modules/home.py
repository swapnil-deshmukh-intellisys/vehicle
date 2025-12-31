import json
from datetime import datetime, timedelta
from decimal import Decimal

from dateutil.relativedelta import relativedelta
from django.db import connection
from django.db.models import Count, OuterRef, Subquery
from django.shortcuts import render

from GMSApp.models import (
    BookingStatus,
    BookingTimeline,
    Estimate,
    Invoice,
    Jobcard,
    ProductBrands,
    ProductCatalogues,
    ProductCategories,
    ProductModel,
    StockInwards,
    StockOutwards,
    SubscriberBooking,
    Suppliers,
    Vehicle,
)
from GMSApp.modules import audit, managesession, templatespath


@managesession.check_session_timeout
def r_home(request, context):
    if request.method == 'GET':
        job_cards = Jobcard.objects.filter(garage_id=context['garage_id'])
        products = ProductCatalogues.objects.filter(garage_id=context['garage_id'])

        context['revenue'] = 0
        context['pending_balance'] = Decimal('0')
        context['purchase'] = 0
        context['open_jobcard_count'] = 0
        context['finalized_jobcard_count'] = 0
        context['total_jobcard_count'] = 0
        context['product_catalogues_count'] = 0
        context['total_revenue'] = 0
        context['total_payments'] = 0

        # Initialize chart data structures
        today = datetime.now().date()
        weekly_jobs = [0] * 7
        weekly_revenue = [0] * 7
        monthly_jobs = [0] * 4
        monthly_revenue = [0] * 4
        six_months_jobs = [0] * 6
        six_months_revenue = [0] * 6
        
        # Generate labels
        weekly_labels = [(today - timedelta(days=6-i)).strftime('%a') for i in range(7)]
        monthly_labels = [f'Week {i+1}' for i in range(4)]
        six_months_labels = [(today - relativedelta(months=5-i)).strftime('%b') for i in range(6)]

        for job_card in job_cards:
            context['total_jobcard_count'] += 1
            if job_card.status == 'open':
                context['open_jobcard_count'] += 1
            elif job_card.status == 'finalized':
                context['finalized_jobcard_count'] += 1
            
            # Get payment info from jobcard payment view
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM garage.vw_jobcard_payment 
                    WHERE garage_id = %s AND jobcard_id = %s 
                """, [context['garage_id'], job_card.id])
                    
                columns = [col[0] for col in cursor.description]
                results = [dict(zip(columns, row)) for row in cursor.fetchall()]
                
                if results:
                    payment_info = results[0]
                    service_total = Decimal(str(payment_info.get('service_total', 0) or 0))
                    parts_total = Decimal(str(payment_info.get('parts_total', 0) or 0))
                    payment_total = Decimal(str(payment_info.get('payment_total', 0) or 0))
                    payment = float(payment_total)
                    pending = float(service_total + parts_total - payment_total)
                else:
                    payment = 0.0
                    pending = 0.0
            
            context['total_payments'] += payment
            context['revenue'] += payment
            context['total_revenue'] += payment
            context['pending_balance'] += Decimal(str(pending))
            
            if job_card.current_date:
                job_date = job_card.current_date
                
                # Weekly data (last 7 days)
                days_diff = (today - job_date).days
                if 0 <= days_diff < 7:
                    weekly_jobs[6 - days_diff] += 1
                    weekly_revenue[6 - days_diff] += int(payment)
                
                # Monthly data (last 4 weeks)
                weeks_diff = days_diff // 7
                if 0 <= weeks_diff < 4:
                    monthly_jobs[3 - weeks_diff] += 1
                    monthly_revenue[3 - weeks_diff] += int(payment)
                
                # 6 months data
                months_diff = (today.year - job_date.year) * 12 + (today.month - job_date.month)
                if 0 <= months_diff < 6:
                    six_months_jobs[5 - months_diff] += 1
                    six_months_revenue[5 - months_diff] += int(payment)
        
        # Store chart data in context (as JSON strings for template)
        context['chart_data'] = {
            'weekly': {
                'labels': json.dumps(weekly_labels),
                'jobs': json.dumps(weekly_jobs),
                'revenue': json.dumps(weekly_revenue),
            },
            'monthly': {
                'labels': json.dumps(monthly_labels),
                'jobs': json.dumps(monthly_jobs),
                'revenue': json.dumps(monthly_revenue),
            },
            'sixMonths': {
                'labels': json.dumps(six_months_labels),
                'jobs': json.dumps(six_months_jobs),
                'revenue': json.dumps(six_months_revenue),
            }
        }

        for item in products:
            context['purchase'] += item.purchase_price * item.inward_stock
            context['product_catalogues_count'] += 1
        
        # Inventory
        context['stock_outwards_count'] = StockOutwards.objects.filter(garage_id=context['garage_id']).count()
        context['stock_inwards_count'] = StockInwards.objects.filter(garage_id=context['garage_id']).count()
        context['suppliers_count'] = Suppliers.objects.filter(garage_id=context['garage_id']).count()
        context['product_categories_count'] = ProductCategories.objects.filter(garage_id=context['garage_id']).count()
        context['product_brands_count'] = ProductBrands.objects.filter(garage_id=context['garage_id']).count()
        context['product_model_count'] = ProductModel.objects.filter(brand__garage_id=context['garage_id']).count()
        context['estimate_count'] = Estimate.objects.filter(garage_id=context['garage_id']).count()  
        
        # Get all invoices and their statuses
        invoice_status_counts = Invoice.objects.filter(garage_id=context['garage_id']).values('status').annotate(count=Count('id'))
        
        # Initialize counters for the specific statuses
        created_count = 0
        dispatched_count = 0
        payment_pending_count = 0
        complete_count = 0
        
        # Count invoices by status
        for status_count in invoice_status_counts:
            status = status_count['status'].lower()
            count = status_count['count']
            
            if status == 'created':
                created_count += count
            elif status == 'dispatched':
                dispatched_count += count
            elif status == 'payment pending':
                payment_pending_count += count
            elif status == 'complete':
                complete_count += count
        
        # Add counts to context
        context['invoice_counts'] = {
            'created': created_count,
            'dispatched': dispatched_count,
            'payment_pending': payment_pending_count,
            'complete': complete_count,
            'total': created_count + dispatched_count + payment_pending_count + complete_count
        }
        
        # Get booking status counts
        # Get the latest status for each booking
        latest_timeline = BookingTimeline.objects.filter(
            booking_id=OuterRef('pk')
        ).order_by('-created_at')

        # Get bookings with their latest status
        bookings_with_status = SubscriberBooking.objects.filter(
            garage_id=context['garage_id']
        ).annotate(
            latest_status_id=Subquery(latest_timeline.values('status_id')[:1])
        )

        # Define all possible statuses with their display names
        all_statuses = [
            'booking_confirmed', 'pickup_assigned', 'bike_picked_up',
            'bike_reached_garage', 'mechanic_assigned', 'job_card_created'
            # 'estimate_shared', 'estimate_revised', 'service_on_hold',
            # 'parts_ordered', 'work_in_progress', 'rework_in_progress',
            # 'etd_updated', 'work_completed', 'bike_ready_for_delivery',
            # 'bike_delivered', 'invoice_generated', 'payment_pending',
            # 'payment_completed', 'feedback_requested', 'repeat_service_scheduled'
        ]
        
        # Status display names mapping
        status_display_names = {
            'booking_confirmed': 'Booking Confirmed',
            'pickup_assigned': 'Pickup Assigned',
            'bike_picked_up': 'Bike Picked Up',
            'bike_reached_garage': 'Bike Reached Garage',
            'mechanic_assigned': 'Mechanic Assigned',
            'job_card_created': 'Job Card Created'
            # 'estimate_shared': 'Estimate Shared',
            # 'estimate_revised': 'Estimate Revised',
            # 'service_on_hold': 'Service on Hold',
            # 'parts_ordered': 'Parts Ordered',
            # 'work_in_progress': 'Work in Progress',
            # 'rework_in_progress': 'Rework in Progress',
            # 'etd_updated': 'ETD Updated',
            # 'work_completed': 'Work Completed',
            # 'bike_ready_for_delivery': 'Bike Ready for Delivery',
            # 'bike_delivered': 'Bike Delivered',
            # 'invoice_generated': 'Invoice Generated',
            # 'payment_pending': 'Payment Pending',
            # 'payment_completed': 'Payment Completed',
            # 'feedback_requested': 'Feedback Requested',
            # 'repeat_service_scheduled': 'Repeat Service Scheduled'
        }

        # Get all statuses with their counts and ensure all statuses are included with 0 counts
        all_status_counts = {status: 0 for status in all_statuses}
        
        # Update counts for existing statuses
        for status_obj in BookingStatus.objects.all():
            if status_obj.name in all_status_counts:
                all_status_counts[status_obj.name] = bookings_with_status.filter(
                    latest_status_id=status_obj.id
                ).count()
        
        # Prepare status data with display names and counts
        status_data = [
            {
                'code': status_code,
                'name': status_display_names.get(status_code, status_code.replace('_', ' ').title()),
                'count': all_status_counts.get(status_code, 0)
            }
            for status_code in all_statuses
        ]
        
        # Add to context
        context['booking_statuses'] = status_data
        context['total_bookings'] = sum(all_status_counts.values())
        
        # Convert pending_balance to float for template
        context['pending_balance'] = float(context['pending_balance'])
        
        # Vehicle vehicle-wise data for pie chart
        vehicles = Vehicle.objects.filter(garage_id=context['garage_id']).values('make').annotate(count=Count('id')).order_by('-count')
        
        vehicle_labels = []
        vehicle_counts = []
        for vehicle in vehicles:
            brand_name = vehicle['make'] or 'Unknown'
            vehicle_labels.append(brand_name)
            vehicle_counts.append(vehicle['count'])
        
        context['vehicle_chart_data'] = {
            'labels': json.dumps(vehicle_labels),
            'data': json.dumps(vehicle_counts)
        }
        
        # Inventory stock summary data for bar chart (already available in context)
        context['inventory_chart_data'] = {
            'labels': json.dumps(['Current Stock', 'Stock Inward', 'Stock Outward']),
            'data': json.dumps([
                context['product_catalogues_count'],
                context['stock_inwards_count'], 
                context['stock_outwards_count']
            ])
        }

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_home', 200)
        return render(request, templatespath.template_r_home, context)
