from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from GMSApp.models import Jobcard, JobcardParts
from GMSApp.modules import managesession
from GMSApp.modules.transactions.jobsheets import jobcard_utils


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def save_jobcard_part(request, context):
    try:
        jobcard_number = request.POST.get('jobcard_number')
        part_id = request.POST.get('part_id') or None  # Updated: Explicitly handle empty strings
        part_source = request.POST.get('part_source', 'internal')
        part_name = request.POST.get('part_name')
        quantity = int(request.POST.get('quantity', 1))
        part_value = float(request.POST.get('part_value', 0))
        part_tax = float(request.POST.get('part_tax', 0))
        part_discount = float(request.POST.get('part_discount', 0))
        part_number = request.POST.get('part_number', '')
        code = request.POST.get('code', '')

        # get jobcard id
        jobcardid = jobcard_utils.get_or_create_jobcard(jobcard_number, context)

        part = JobcardParts.objects.create(
            jobcard_id=jobcardid,
            part_id=part_id,
            part_source=part_source,
            part_name=part_name,
            part_number=part_number,
            code=code,
            quantity=quantity,
            part_value=part_value,
            part_tax=part_tax,
            part_discount=part_discount
        )

        return JsonResponse({
            'status': 'success',
            'id': part.id,
            'message': 'Part saved successfully'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)


@managesession.check_session_timeout
@require_http_methods(["GET"])
def get_jobcard_parts(request, context):
    jobcard_number = request.GET.get('jobcard_number')
    jobcard_data = Jobcard.objects.filter(jobcard_number=jobcard_number, garage_id=context['garage_id']).first()
    if jobcard_data:
        jobcard_id = jobcard_data.id
        parts = JobcardParts.objects.filter(jobcard_id=jobcard_id).values(
            'id', 'part_source', 'part_id', 'part_name', 'part_number', 'code', 'quantity', 'part_value', 'part_tax', 'part_discount'
        )
        return JsonResponse({
            'status': 'success',
            'parts': list(parts)
        })
    else:
        return JsonResponse({
            'status': 'success',
            'parts': []
        })    


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def update_jobcard_part(request, context):
    try:
        jobcard_number = request.POST.get('jobcard_number')
        item_id = request.POST.get('item_id')
        part_id = request.POST.get('part_id')
        part_source = request.POST.get('part_source', 'internal')
        part_name = request.POST.get('part_name')
        quantity = int(request.POST.get('quantity', 1))
        part_value = float(request.POST.get('part_value', 0))
        part_tax = float(request.POST.get('part_tax', 0))
        part_discount = float(request.POST.get('part_discount', 0))
        part_number = request.POST.get('part_number', '')
        code = request.POST.get('code', '')

        # Update the part
        part = JobcardParts.objects.get(id=item_id)
        part.part_id = part_id if part_id else None
        part.part_source = part_source
        part.part_name = part_name
        part.part_number = part_number
        part.code = code
        part.quantity = quantity
        part.part_value = part_value
        part.part_tax = part_tax
        part.part_discount = part_discount
        part.save()

        return JsonResponse({
            'status': 'success',
            'id': part.id,
            'message': 'Part updated successfully'
        })
    except JobcardParts.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Part not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def delete_jobcard_part(request, context):
    try:
        jobcard_number = request.POST.get('jobcard_number')
        item_id = request.POST.get('item_id')
        JobcardParts.objects.filter(id=item_id).delete()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)            