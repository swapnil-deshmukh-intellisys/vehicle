from django.shortcuts import render, redirect
from django.core.exceptions import ValidationError
from GMSApp.modules import templatespath, managesession, audit
from django.contrib import messages
from datetime import datetime
from GMSApp.models import AuditLog
from django.http import JsonResponse
import logging
from django.core.paginator import Paginator
from django.db import transaction


@managesession.check_session_timeout
def r_auditlog(request, context):  
    if request.method == 'GET':
        auditlog = AuditLog.objects.filter(username=context['useremail'])
        # Pagination
        paginator = Paginator(auditlog, 100)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        context['auditlog'] =  page_obj
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'auditlog', 200)
        return render(request, templatespath.template_r_auditlog, context) 
    

@managesession.check_session_timeout
def d_auditlog(request, context):
    if request.method == 'POST':
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist('id[]')
                deleted_data = []
                for id in product_ids:
                    auditlog = AuditLog.objects.filter(pk=id).first()
                    if auditlog:
                        deleted_data.append(auditlog.id) 
                        auditlog.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} auditlog  deleted"
                    sts = True
                else:
                    msg = "Failed to delete auditlog"
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