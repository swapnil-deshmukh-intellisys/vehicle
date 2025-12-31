from GMSApp.modules import managesession
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from GMSApp.models import GarageVehicleDamage
from django.db import transaction


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["GET"])
def list_vehicle_damages(request, context):
    try:
        # Get vehicle type filter if provided
        vehicletype = request.GET.get('vehicletype')

        if not vehicletype:
            return JsonResponse({
                'status': 'error',
                'message': 'Missing required fields: vehicletype'
            }, status=400)
        
        # Query vehicle damages for the current garage
        damages = GarageVehicleDamage.objects.filter(garage_id=context['garage_id'], vehicletype=vehicletype)
            
        # Format the response
        data = [{
            'id': damage.id,
            'text': damage.vehicle_damage
        } for damage in damages]
        
        return JsonResponse({
            'status': 'success',
            'data': data
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Failed to fetch vehicle damages: {str(e)}'
        }, status=400)


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def save_vehicle_damage(request, context):
    try:
        with transaction.atomic():
            # Get all required fields from the request
            required_fields = [
                'vehicle_damage', 'vehicletype'
            ]
            
            # Check for missing required fields
            missing_fields = [field for field in required_fields if not request.POST.get(field)]
            if missing_fields:
                return JsonResponse({
                    'status': 'error',
                    'message': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=400)

            # Create new vehicle damage
            vehicle_damage = GarageVehicleDamage.objects.create(
                garage_id=context['garage_id'],
                vehicle_damage=request.POST.get('vehicle_damage'),
                vehicletype=request.POST.get('vehicletype')
            )

            # Return the created damage data in the expected format
            return JsonResponse({
                'status': 'success',
                'message': 'Vehicle damage created successfully',
                'data': {
                    'id': vehicle_damage.id,
                    'text': vehicle_damage.vehicle_damage
                }
            })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Failed to create vehicle damage: {str(e)}'
        }, status=400)