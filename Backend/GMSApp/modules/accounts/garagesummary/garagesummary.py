from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.contrib import messages
from django.db import transaction
from GMSApp.models import Brand, Customer, Garage, Model, SubscriberBooking, Subscriber, SubscriberVehicle, Vehicle
from GMSApp.modules import templatespath, managesession, audit
from GMSApp.modules.acl import acls
from django.conf import settings
from datetime import datetime
import logging, os


@managesession.check_session_timeout
def r_garage_summary(request, context):
    if request.method == 'GET':            
        if context.get('usertype') == 'garage':
            return redirect('r-accounts-garage') 

        filter_garage_data = {}
        if context['usertype'] == 'business':
            context['garage_count'] = Garage.objects.filter(**filter_garage_data).count()
        elif context['usertype'] == 'admin':
            filter_garage_data['city_id__in']=context['allowed_city_ids']
            context['garage_count'] = Garage.objects.filter(**filter_garage_data).count()
        else:
            filter_garage_data['pk__in']=context['allowed_garage_ids']
            context['garage_count'] = Garage.objects.filter(**filter_garage_data).count()   

        filter_bookings_data = {}
        if context['usertype'] == 'business':
            context['booking_count'] = SubscriberBooking.objects.filter(**filter_bookings_data).count()  
        elif context['usertype'] == 'admin':
            filter_bookings_data['subscriberaddress__city_id__in']=context['allowed_city_ids']
            context['booking_count'] = SubscriberBooking.objects.filter(**filter_bookings_data).count()  
        else:        
            filter_bookings_data['garage_id__in']=context['allowed_garage_ids']
            context['booking_count'] = SubscriberBooking.objects.filter(**filter_bookings_data).count()  

        context['customer_count'] = Subscriber.objects.all().count()

        vehicles_objs = SubscriberVehicle.objects.all()
        context['vehicle_count'] = vehicles_objs.count()
        context['vehicle_model_count'] = vehicles_objs.values('model_id').distinct().count()


        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_accounts', 200)
        return render(request, templatespath.template_accounts_garagesummary_r_garage_summary, context) 


@managesession.check_session_timeout
def u_garage_summary(request, context,*args, **kwargs):

    if request.method == 'GET':
        # Fetch and paginate vehicles for this business
        vehicle_objs = Vehicle.objects.all()
        vehicle_data = []
        for v in vehicle_objs:
            model_obj = Model.objects.filter(name__icontains=v.model).first()
            vehicle_data.append({
                'id': v.id,
                'make': v.make or '',
                'model': v.model or '',
                'model_id': model_obj.id if model_obj else None,
                'customer_name': v.customer.name if v.customer else '',
                'customer_id': v.customer.id if v.customer else None,
                'customer_address': v.customer.address if v.customer else None,
                'customer_phone': v.customer.phone if v.customer else 'N/A',
                'created_at': v.created_at,
                'updated_at': v.updated_at,
                'image_path': model_obj.image_path if model_obj and model_obj.image_path else '',
            })
        page_obj = Paginator(vehicle_data, 100).get_page(request.GET.get('page'))
        context['vehicle_objs'] = page_obj
        for v in vehicle_data:
            print("Page object:", v["image_path"])
        if not model_obj or not model_obj.image_path:
            print(f"Missing image for model: {v['model']}")

        # Audit log
        audit.create_audit_log(
            context['useremail'],
            f'USER: {context["useremail"]}, {request.method}: {request.path}',
            'u_garage_summary',
            200
        )
        return render(request, templatespath.template_accounts_garagesummary_u_garage_summary, context)
   