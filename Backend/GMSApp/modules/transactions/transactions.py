
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import Estimate
from GMSApp.modules import templatespath, managesession, audit
import logging


@managesession.check_session_timeout
def r_transactions(request, context):
    if request.method == 'GET':   

        context['estimate_count'] = Estimate.objects.filter(garage_id=context['garage_id']).count()  
        
        # Get invoice counts by status
        from GMSApp.models import Invoice
        from django.db.models import Count
        
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

        # Add counts to context
        context['job_sheet_counts'] = {
            'created': 0,
            'dispatched': 0,
            'payment_pending': 0,
            'complete': 0,
            'total': 0
        }
        
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_transactions', 200)
        return render(request, templatespath.template_r_transactions, context) 
    