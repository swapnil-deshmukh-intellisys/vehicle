from django.http import JsonResponse
from django.db import connection
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
@require_http_methods(["POST"])
def get_service_history(request):
    try:
        data = json.loads(request.body)
        customer_id = data.get('customer_id')
        vehicle_id = data.get('vehicle_id')
        
        query = "SELECT id, jobcard_number, created_at FROM jobcard WHERE "
        params = []
        
        if customer_id and vehicle_id:
            query += "customer_id = %s AND vehicle_id = %s"
            params = [customer_id, vehicle_id]
        elif customer_id:
            query += "customer_id = %s"
            params = [customer_id]
        elif vehicle_id:
            query += "vehicle_id = %s"
            params = [vehicle_id]
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Either customer_id or vehicle_id is required'
            }, status=400)
            
        query += " ORDER BY created_at DESC"
        
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            columns = [col[0] for col in cursor.description]
            history = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]
            
        return JsonResponse({
            'status': 'success',
            'data': history
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)