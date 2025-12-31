from django.core.exceptions import ValidationError
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from GMSApp.models import City, Subscriber, SubscriberAddress


class SubscriberAddressSerializer(serializers.ModelSerializer):
    # Return the related City's name in the `city` key instead of the id
    city = serializers.CharField(source='city.name', read_only=True)
    class Meta:
        model = SubscriberAddress
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class SubscriberAddressAPI(APIView):
    def get(self, request, id=None):
        try:
            # Get ID from URL parameter or query string
            address_id = id or request.query_params.get('id')
            
            # If ID is provided, return single item
            if address_id:
                try:
                    subscriber_address = SubscriberAddress.objects.get(id=address_id)
                    serializer = SubscriberAddressSerializer(subscriber_address)
                    return Response({
                        'status': True,
                        'message': 'Address retrieved successfully',
                        'data': serializer.data
                    })
                except SubscriberAddress.DoesNotExist:
                    return Response(
                        {
                            'status': False,
                            'message': 'Subscriber address not found'
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # If no ID, return filtered list (implement list functionality if needed)
            return Response(
                {
                    'status': False,
                    'message': 'Address ID is required'
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
    
    def post(self, request):
        try:
            data = request.data
            
            # Validate required fields
            required_fields = ['subscriberid', 'city', 'address', 'pincode']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return Response(
                    {
                        'success': False,
                        'message': f'Missing required fields: {", ".join(missing_fields)}'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get related objects with error handling
            try:
                subscriber = Subscriber.objects.get(id=data['subscriberid'])
                city = City.objects.get(id=data['city'])
            except (Subscriber.DoesNotExist, City.DoesNotExist):
                return Response(
                    {
                        'success': False,
                        'message': 'One or more related objects not found (subscriber, or city)'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check for duplicate address
            if SubscriberAddress.objects.filter(
                subscriber=subscriber,
                city=city,
                address=data['address'],
                pincode=data['pincode']
            ).exists():
                return Response(
                    {
                        'success': False,
                        'message': 'This address already exists for the subscriber'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create the subscriber address
            try:
                subscriber_address = SubscriberAddress.objects.create(
                    subscriber=subscriber,
                    city=city,
                    address=data['address'],
                    pincode=data['pincode']
                )
                
                # Serialize the response
                serializer = SubscriberAddressSerializer(subscriber_address)
                return Response({
                    'success': True,
                    'message': 'Address added successfully',
                    'data': serializer.data
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response(
                    {
                        'success': False,
                        'message': f'Error creating address: {str(e)}'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {
                    'success': False,
                    'message': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request, id=None):
        try:
            # Get ID from URL parameter or request data
            address_id = id or request.data.get('id')
            
            # Validate ID is provided
            if not address_id:
                return Response(
                    {
                        'status': False,
                        'message': 'Missing required parameter: id'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the subscriber address by ID
            try:
                subscriber_address = SubscriberAddress.objects.get(id=address_id)
            except SubscriberAddress.DoesNotExist:
                return Response(
                    {
                        'status': False,
                        'message': 'Subscriber address not found'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Update the address fields if provided in request
            update_fields = {}
            
            if 'city' in request.data:
                try:
                    city = City.objects.get(id=request.data['city'])
                    update_fields['city'] = city
                except City.DoesNotExist:
                    return Response(
                        {
                            'status': False,
                            'message': 'City not found'
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            if 'address' in request.data:
                update_fields['address'] = request.data['address']
                
            if 'pincode' in request.data:
                update_fields['pincode'] = request.data['pincode']
            
            # Check if any fields to update
            if not update_fields:
                return Response(
                    {
                        'status': False,
                        'message': 'No valid fields provided for update'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update the address
            for field, value in update_fields.items():
                setattr(subscriber_address, field, value)
            
            try:
                subscriber_address.save()
                serializer = SubscriberAddressSerializer(subscriber_address)
                return Response({
                    'status': True,
                    'message': 'Address updated successfully',
                    'data': serializer.data
                })
                
            except Exception as e:
                return Response(
                    {
                        'status': False,
                        'message': f'Error updating address: {str(e)}'
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

    def delete(self, request, id=None):
        try:
            # Get ID from URL parameter or query string
            address_id = id or request.query_params.get('id')
            
            # Validate ID is provided
            if not address_id:
                return Response(
                    {
                        'status': False,
                        'message': 'Missing required parameter: id'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the subscriber address by ID
            try:
                subscriber_address = SubscriberAddress.objects.get(id=address_id)
            except SubscriberAddress.DoesNotExist:
                return Response(
                    {
                        'status': False,
                        'message': 'Subscriber address not found'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Try to delete the address (this will trigger the model's delete method)
            try:
                subscriber_address.delete()
                return Response(
                    {
                        'status': True,
                        'message': 'Address deleted successfully'
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


class ListSubscriberAddressAPI(APIView):
    """
    API endpoint to list all addresses for a given subscriber ID.
    
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
            
            # Get all active addresses for the subscriber
            addresses = SubscriberAddress.objects.filter(
                subscriber_id=subscriber_id
            ).select_related('city').order_by('-created_at')
            
            # Serialize the data
            address_data = [{
                'id': addr.id,
                'address': addr.address,
                'pincode': addr.pincode,
                'city_id': addr.city_id,
                'city': addr.city.name,
            } for addr in addresses]
            
            return Response({
                'status': True,
                'message': 'Subscriber addresses retrieved successfully',
                'data': address_data
            })
            
        except Exception as e:
            return Response(
                {
                    'status': False,
                    'message': f'Error retrieving subscriber addresses: {str(e)}',
                    'data': []
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )            