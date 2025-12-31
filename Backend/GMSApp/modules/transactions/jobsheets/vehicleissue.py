from GMSApp.modules import managesession
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from GMSApp.models import GarageVehicleIssue
from django.db import transaction


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["GET"])
def list_vehicle_issues(request, context):
    try:
        # Get vehicle type filter if provided
        vehicletype = request.GET.get('vehicletype')

        if not vehicletype:
            return JsonResponse({
                'status': 'error',
                'message': 'Missing required fields: vehicletype'
            }, status=400)
        
        # Query vehicle issues for the current garage
        issues = GarageVehicleIssue.objects.filter(garage_id=context['garage_id'], vehicletype=vehicletype)
            
        # Format the response
        data = [{
            'id': issue.id,
            'text': issue.vehicle_issue
        } for issue in issues]
        
        return JsonResponse({
            'status': 'success',
            'data': data
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Failed to fetch vehicle issues: {str(e)}'
        }, status=400)


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def save_vehicle_issue(request, context):
    try:
        with transaction.atomic():
            # Get all required fields from the request
            required_fields = [
                'vehicle_issue', 'vehicletype'
            ]
            
            # Check for missing required fields
            missing_fields = [field for field in required_fields if not request.POST.get(field)]
            if missing_fields:
                return JsonResponse({
                    'status': 'error',
                    'message': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=400)

            # Create new vehicle issue
            vehicle_issue = GarageVehicleIssue.objects.create(
                garage_id=context['garage_id'],
                vehicle_issue=request.POST.get('vehicle_issue'),
                vehicletype=request.POST.get('vehicletype')
            )

            # Return the created issue data in the expected format
            return JsonResponse({
                'status': 'success',
                'message': 'Vehicle issue created successfully',
                'data': {
                    'id': vehicle_issue.id,
                    'text': vehicle_issue.vehicle_issue
                }
            })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Failed to create vehicle issue: {str(e)}'
        }, status=400)