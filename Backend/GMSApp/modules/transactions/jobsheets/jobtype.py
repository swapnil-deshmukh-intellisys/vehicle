from GMSApp.modules import managesession
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from GMSApp.models import JobType


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def create_jobtype(request, context):
    try:
        name = request.POST.get('name')
        vehicletype = request.POST.get('vehicletype')
        
        if not all([name, vehicletype]):
            return JsonResponse({
                'status': 'error',
                'message': 'Missing required fields: name, or vehicletype'
            }, status=400)
            
        jobtype = JobType.objects.create(
            garage_id=context['garage_id'], 
            name=name, 
            vehicletype=vehicletype
        )
        
        return JsonResponse({
            'status': 'success',
            'id': jobtype.id,
            'message': 'Jobtype created successfully'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["GET"])
def list_jobtypes(request, context):
    """
    List all job types for the current garage and vehicle type
    """
    try:
        # Get vehicle_type from request parameters
        vehicle_type = request.GET.get('vehicle_type')
        if not vehicle_type:
            return JsonResponse({
                'status': 'error',
                'message': 'Vehicle type is required'
            }, status=400)
            
        jobtypes = JobType.objects.filter(
            garage_id=context['garage_id'],
            vehicletype=vehicle_type
        ).values('id', 'name')
        
        return JsonResponse({
            'status': 'success',
            'data': list(jobtypes)
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)        