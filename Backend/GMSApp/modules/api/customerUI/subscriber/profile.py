from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist
from GMSApp.models import Subscriber

class SubscriberSerializer(serializers.ModelSerializer):
    """
    Serializer for subscriber details
    """
    name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    
    def get_name(self, obj):
        return obj.name if obj.name else 'N/A'
        
    def get_email(self, obj):
        return obj.email if obj.email else 'N/A'
    
    class Meta:
        model = Subscriber
        fields = ['id', 'phone', 'name', 'email']
        read_only_fields = ['id', 'phone']

class SubscriberProfileAPIView(APIView):
    """
    API endpoint to get or update subscriber information.
    
    GET: Retrieve subscriber details by subscriber_id
    Query Parameters:
        - subscriber_id: ID of the subscriber to retrieve
    
    PATCH: Partially update subscriber information
    Request Body:
        {
            "subscriber_id": 1,
            "name": "Updated Name",  # Optional
            "email": "updated@example.com"  # Optional
        }
    """
    
    def get(self, request, format=None):
        subscriber_id = request.query_params.get('subscriber_id')
        
        if not subscriber_id:
            return Response({
                'status': False,
                'message': 'subscriber_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            subscriber = Subscriber.objects.get(id=subscriber_id)
            serializer = SubscriberSerializer(subscriber)
            
            return Response({
                'status': True,
                'message': 'Subscriber details retrieved successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except (ValueError, ObjectDoesNotExist):
            return Response({
                'status': False,
                'message': 'Subscriber not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def patch(self, request, format=None):
        data = request.data
        subscriber_id = data.get('subscriber_id')
        
        if not subscriber_id:
            return Response({
                'status': False,
                'message': 'subscriber_id is required in request body'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            subscriber = Subscriber.objects.get(id=subscriber_id)
            
            # Update fields if they are provided in the request
            update_fields = {}
            if 'name' in data:
                subscriber.name = data['name']
                update_fields['name'] = data['name']
            if 'email' in data:
                subscriber.email = data['email']
                update_fields['email'] = data['email']
            
            if update_fields:
                subscriber.save()
                
                return Response({
                    'status': True,
                    'message': 'Subscriber updated successfully',
                    'data': {
                        'subscriber_id': subscriber.id,
                        'updated_fields': update_fields
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'status': True,
                    'message': 'No fields to update'
                }, status=status.HTTP_204_NO_CONTENT)
            
        except (ValueError, ObjectDoesNotExist):
            return Response({
                'status': False,
                'message': 'Subscriber not found'
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            return Response({
                'status': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)