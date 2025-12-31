from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.modules import templatespath, managesession, audit
import logging


@managesession.check_session_timeout
def r_txn_dailyreports(request, context):
    if request.method == 'GET':   
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_txn_dailyreports', 200)
        return render(request, templatespath.template_r_txn_dailyreports, context) 