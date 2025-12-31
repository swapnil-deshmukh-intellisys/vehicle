from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from GMSApp.models import Jobcard, JobcardCustomerVoice
from GMSApp.modules import managesession
from GMSApp.modules.transactions.jobsheets import jobcard_utils


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def save_jobcard_customer_voice(request, context):
    try:
        jobcard_number = request.POST.get('jobcard_number')
        customer_voice = request.POST.get('customer_voice')

        # get jobcard id
        jobcardid = jobcard_utils.get_or_create_jobcard(jobcard_number, context)

        jobcard_customer_voice = JobcardCustomerVoice.objects.create(
            jobcard_id=jobcardid,
            customer_voice=customer_voice
        )

        return JsonResponse({
            'status': 'success',
            'id': jobcard_customer_voice.id,
            'message': 'Customer voice saved successfully'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)


@managesession.check_session_timeout
@require_http_methods(["GET"])
def get_jobcard_customer_voice(request, context):
    jobcard_number = request.GET.get('jobcard_number')
    jobcard_data = Jobcard.objects.filter(jobcard_number=jobcard_number, garage_id=context['garage_id']).first()
    if jobcard_data:
        jobcard_id = jobcard_data.id
        customer_voice = JobcardCustomerVoice.objects.filter(jobcard_id=jobcard_id).values(
        'id', 'customer_voice'
        )
        return JsonResponse({
            'status': 'success',
            'customer_voice': list(customer_voice)
        })
    else:
        return JsonResponse({
            'status': 'success',
            'customer_voice': []
        })       


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def delete_jobcard_customer_voice(request, context):
    try:
        item_id = request.POST.get('item_id')
        JobcardCustomerVoice.objects.filter(id=item_id).delete()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)    