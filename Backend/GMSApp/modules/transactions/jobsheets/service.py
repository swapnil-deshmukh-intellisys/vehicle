from GMSApp.modules import managesession
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from GMSApp.models import Jobcard, JobcardServices
from GMSApp.modules.transactions.jobsheets import jobcard_utils


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def save_jobcard_service(request, context):
    try:
        jobcard_number = request.POST.get('jobcard_number')
        service_id = request.POST.get('service_id') or None  # Updated: Explicitly handle empty strings
        service_source = request.POST.get('service_source', 'internal')
        service_name = request.POST.get('service_name')
        quantity = int(request.POST.get('quantity', 1))
        service_value = float(request.POST.get('service_value', 0))
        service_tax = float(request.POST.get('service_tax', 0))
        service_discount = float(request.POST.get('service_discount', 0))
        code = request.POST.get('code', '')

        # get jobcard id
        jobcardid = jobcard_utils.get_or_create_jobcard(jobcard_number, context)

        service = JobcardServices.objects.create(
            jobcard_id=jobcardid,
            service_id=service_id,
            service_source=service_source,
            service_name=service_name,
            code=code,
            quantity=quantity,
            service_value=service_value,
            service_tax=service_tax,
            service_discount=service_discount
        )

        return JsonResponse({
            'status': 'success',
            'id': service.id,
            'message': 'Service saved successfully'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def update_jobcard_service(request, context):
    try:
        jobcard_number = request.POST.get('jobcard_number')
        item_id = request.POST.get('item_id')
        service_id = request.POST.get('service_id')
        service_source = request.POST.get('service_source', 'internal')
        service_name = request.POST.get('service_name')
        quantity = int(request.POST.get('quantity', 1))
        service_value = float(request.POST.get('service_value', 0))
        service_tax = float(request.POST.get('service_tax', 0))
        service_discount = float(request.POST.get('service_discount', 0))
        code = request.POST.get('code', '')

        # Update the service
        service = JobcardServices.objects.get(id=item_id)
        service.service_id = service_id if service_id else None
        service.service_source = service_source
        service.service_name = service_name
        service.code = code
        service.quantity = quantity
        service.service_value = service_value
        service.service_tax = service_tax
        service.service_discount = service_discount
        service.save()

        return JsonResponse({
            'status': 'success',
            'id': service.id,
            'message': 'Service updated successfully'
        })
    except JobcardServices.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Service not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)


@managesession.check_session_timeout
@require_http_methods(["GET"])
def get_jobcard_services(request, context):
    jobcard_number = request.GET.get('jobcard_number')
    jobcard_data = Jobcard.objects.filter(jobcard_number=jobcard_number, garage_id=context['garage_id']).first()
    if jobcard_data:
        jobcard_id = jobcard_data.id
        services = JobcardServices.objects.filter(jobcard_id=jobcard_id).values(
        'id', 'service_source', 'service_id', 'service_name', 'quantity', 'service_value', 'service_tax', 'service_discount'
        )
        return JsonResponse({
            'status': 'success',
            'services': list(services)
        })
    else:
        return JsonResponse({
            'status': 'success',
            'services': []
        })       


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def delete_jobcard_service(request, context):
    try:
        jobcard_number = request.POST.get('jobcard_number')
        item_id = request.POST.get('item_id')
        JobcardServices.objects.filter(id=item_id).delete()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)    