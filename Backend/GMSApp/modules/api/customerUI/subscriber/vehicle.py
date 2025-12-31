from django.core.exceptions import ValidationError
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from GMSApp.models import Model, Subscriber, SubscriberVehicle


class ModelSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Model
        fields = ('id', 'name', 'image', 'cc_id')
        read_only_fields = ('id', 'name', 'image', 'cc_id')
    
    def get_image(self, obj):
        request = self.context.get('request')
        
        if not hasattr(obj, 'image_path') or not obj.image_path or not request:
            return None
            
        clean_path = obj.image_path.lstrip('/')
        # Build the base URL (scheme + host + port)
        base_url = f"{request.scheme}://{request.get_host()}"
        # Combine base URL with the clean image path
        return f"{base_url}/{clean_path}"

class SubscriberVehicleSerializer(serializers.ModelSerializer):
    model = ModelSerializer(read_only=True)
    
    class Meta:
        model = SubscriberVehicle
        fields = ('id', 'subscriber', 'model')
        read_only_fields = ('id', 'subscriber', 'model')

class SubscriberVehicleAPI(APIView):
    def get(self, request, id=None):
        try:
            # Get ID from URL parameter or query string
            vehicle_id = id or request.query_params.get('id')
            
            # If ID is provided, return single item
            if vehicle_id:
                try:
                    subscriber_vehicle = SubscriberVehicle.objects.get(id=vehicle_id)
                    serializer = SubscriberVehicleSerializer(
                        subscriber_vehicle,
                        context={'request': request}  # Pass the request to the serializer
                    )
                    return Response({
                        'status': True,
                        'message': 'Vehicle retrieved successfully',
                        'data': serializer.data
                    })
                except SubscriberVehicle.DoesNotExist:
                    return Response(
                        {
                            'status': False,
                            'message': 'Subscriber vehicle not found'
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # If no ID, return filtered list
            queryset = SubscriberVehicle.objects.all()
            
            # Apply filters if provided
            subscriber_id = request.query_params.get('subscriberid')
            model_id = request.query_params.get('modelid')
            
            if subscriber_id:
                queryset = queryset.filter(subscriber_id=subscriber_id)
            if model_id:
                queryset = queryset.filter(model_id=model_id)
                
            # Order by most recent first
            queryset = queryset.order_by('-created_at')
            
            # Serialize and return with request context
            serializer = SubscriberVehicleSerializer(
                queryset, 
                many=True,
                context={'request': request}  # Pass request to serializer
            )
            return Response({
                'status': True,
                'message': 'Vehicles retrieved successfully',
                'data': serializer.data
            })
            
        except Exception as e:
            return Response(
                {
                    'status': False,
                    'message': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def post(self, request):
        try:
            data = request.data
            
            # Validate required fields
            required_fields = ['businessid', 'subscriberid', 'model']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return Response(
                    {
                        'status': False,
                        'message': f'Missing required fields: {", ".join(missing_fields)}'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get related objects with error handling
            try:
                subscriber = Subscriber.objects.get(id=data['subscriberid'])
                model = Model.objects.get(id=data['model'])
            except (Subscriber.DoesNotExist, Model.DoesNotExist):
                return Response(
                    {
                        'status': False,
                        'message': 'One or more related objects not found'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if the subscriber already has this vehicle model
            if SubscriberVehicle.objects.filter(
                subscriber=subscriber,
                model=model
            ).exists():
                return Response(
                    {
                        'status': False,
                        'message': 'This vehicle model already exists for the subscriber'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create the subscriber vehicle
            subscriber_vehicle = SubscriberVehicle.objects.create(
                subscriber=subscriber,
                model=model
            )
            
            # Serialize the response
            serializer = SubscriberVehicleSerializer(
                subscriber_vehicle,
                context={'request': request}
            )
            return Response({
                'status': True,
                'message': 'Vehicle added successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {
                    'status': False,
                    'message': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, id=None):
        try:
            # Get ID from URL parameter or query string
            vehicle_id = id or request.query_params.get('id')
            
            # Validate ID is provided
            if not vehicle_id:
                return Response(
                    {
                        'status': False,
                        'message': 'Missing required parameter: id'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the subscriber vehicle by ID
            try:
                subscriber_vehicle = SubscriberVehicle.objects.get(id=vehicle_id)
            except SubscriberVehicle.DoesNotExist:
                return Response(
                    {
                        'status': False,
                        'message': 'Subscriber vehicle not found'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Try to delete the vehicle
            try:
                subscriber_vehicle.delete()
                return Response(
                    {
                        'status': True,
                        'message': 'Vehicle deleted successfully'
                    },
                    status=status.HTTP_200_OK
                )
            except ValidationError as e:
                return Response(
                    {
                        'status': False,
                        'message': str(e)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {
                    'status': False,
                    'message': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ListSubscriberVehicleAPI(APIView):
    """
    API endpoint to list all vehicles for a given subscriber ID.
    
    GET Parameters:
    - subscriber_id: (required) ID of the subscriber
    """
    
    def get(self, request):
        try:
            subscriber_id = request.query_params.get('subscriber_id')
            
            if not subscriber_id:
                return Response(
                    {
                        'status': False,
                        'message': 'subscriber_id parameter is required',
                        'data': []
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get all vehicles for the subscriber
            vehicles = SubscriberVehicle.objects.filter(subscriber_id=subscriber_id)
            
            if not vehicles.exists():
                return Response(
                    {
                        'status': True,
                        'message': 'No vehicles found for this subscriber',
                        'data': []
                    },
                    status=status.HTTP_200_OK
                )
            
            # Pass request context to the serializer for URL construction
            serializer = SubscriberVehicleSerializer(
                vehicles, 
                many=True,
                context={'request': request}  # Pass the request to the serializer
            )
            
            return Response(
                {
                    'status': True,
                    'message': 'Vehicles retrieved successfully',
                    'data': serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {
                    'status': False,
                    'message': f'Error retrieving vehicles: {str(e)}',
                    'data': []
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )