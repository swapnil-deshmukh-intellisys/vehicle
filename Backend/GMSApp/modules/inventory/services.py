
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.db import transaction
from GMSApp.models import TXNService
from GMSApp.modules import templatespath, managesession, audit
from datetime import datetime
import logging


@managesession.check_session_timeout
def g_inv_service(request, context, service_id):
    if request.method == 'GET':
        try:
            with transaction.atomic():
                service = TXNService.objects.get(id=service_id)
                data = {
                    'price': float(service.price),
                    'gst': float(service.gst),
                    'discount': float(service.discount),
                }

                # Audit logging
                audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'g_inv_service', 200)
                return JsonResponse({'status': True, 'data': data})      

        except (ValidationError, Exception) as e:
            error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
            audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return JsonResponse({'status': False, 'message': error_msg}) 