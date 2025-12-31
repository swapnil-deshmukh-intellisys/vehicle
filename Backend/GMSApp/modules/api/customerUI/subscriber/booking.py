import logging

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.validators import UniqueTogetherValidator
from rest_framework.views import APIView

from GMSApp.models import (
    BookingStatus,
    BookingTimeline,
    Customer,
    Garage,
    JobcardBrands,
    JobcardModels,
    Subscriber,
    SubscriberAddress,
    SubscriberBooking,
    SubscriberVehicle,
    Vehicle,
)

logger = logging.getLogger(__name__)

class BookingTimelineSerializer(serializers.ModelSerializer):
    booking = serializers.PrimaryKeyRelatedField(queryset=SubscriberBooking.objects.all())
    status = serializers.PrimaryKeyRelatedField(queryset=BookingStatus.objects.all())
    
    class Meta:
        model = BookingTimeline
        fields = ['id', 'booking', 'status', 'remark', 'created_at']
        read_only_fields = ['created_at']

class SubscriberBookingSerializer(serializers.ModelSerializer):
    subscriber = serializers.PrimaryKeyRelatedField(queryset=Subscriber.objects.all())
    subscribervehicle = serializers.PrimaryKeyRelatedField(queryset=SubscriberVehicle.objects.all())
    subscriberaddress = serializers.PrimaryKeyRelatedField(queryset=SubscriberAddress.objects.all())
    garage = serializers.PrimaryKeyRelatedField(queryset=Garage.objects.all())
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all(), required=False, allow_null=True)
    vehicle = serializers.PrimaryKeyRelatedField(queryset=Vehicle.objects.all(), required=False, allow_null=True)
    current_status = serializers.SerializerMethodField()
    timeline = serializers.SerializerMethodField()
    
    class Meta:
        model = SubscriberBooking
        fields = [
            'id', 'subscriber', 'subscribervehicle', 'subscriberaddress',
            'garage', 'customer', 'vehicle', 'booking_date', 'booking_slot', 'suggestion', 
            'booking_amount', 'promo_code', 'required_estimate', 'total_amount', 
            'current_status', 'timeline', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'total_amount': {'read_only': True},
            'required_estimate': {'required': False, 'default': False},
            'suggestion': {'required': False, 'allow_blank': True},
            'promo_code': {'required': False, 'allow_blank': True}
        }
        validators = [
            UniqueTogetherValidator(
                queryset=SubscriberBooking.objects.all(),
                fields=['subscriber', 'subscribervehicle', 'garage', 'booking_date', 'booking_slot'],
                message='A booking already exists with these details.'
            )
        ]
    
    def get_current_status(self, obj):
        latest_timeline = obj.bookingtimeline.order_by('-created_at').first()
        if latest_timeline and hasattr(latest_timeline, 'status'):
            return {
                'status': latest_timeline.status.name,  # Use name field instead of status
                'displayname': latest_timeline.status.displayname,  # Use displayname field
                'created_at': latest_timeline.created_at
            }
        return None
    
    def get_timeline(self, obj):
        # Use the correct related name 'bookingtimeline' (all lowercase)
        timeline = obj.bookingtimeline.order_by('-created_at')
        return BookingTimelineSerializer(timeline, many=True).data
    
    def validate_booking_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Booking date cannot be in the past.")
        return value
    
    def validate_booking_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Booking amount must be greater than 0.")
        return value
    
    def create(self, validated_data):
        # Set default total_amount to booking_amount if not provided
        if 'total_amount' not in validated_data:
            validated_data['total_amount'] = validated_data['booking_amount']
            
        # Create the booking
        booking = super().create(validated_data)
        
        # Create initial timeline entry with 'booking_confirmed' status
        try:
            status_obj = BookingStatus.objects.get(name='booking_confirmed')
            BookingTimeline.objects.create(
                booking=booking,
                status=status_obj
            )
        except BookingStatus.DoesNotExist:
            pass
            
        return booking

class BookingStatusUpdateView(APIView):
    def post(self, request):
        data = request.data.copy()
        booking_id = data.pop('booking_id', None)
        status_name = data.pop('status', None)
        remark = data.pop('remark', None)
        
        # Validate required fields
        if not booking_id or not status_name:
            missing_fields = []
            if not booking_id:
                missing_fields.append('booking_id')
            if not status_name:
                missing_fields.append('status')
                
            return Response(
                {
                    'status': False,
                    'message': f'Missing required fields: {", ".join(missing_fields)}',
                    'missing_fields': missing_fields
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            booking = SubscriberBooking.objects.get(id=booking_id)
        except SubscriberBooking.DoesNotExist:
            return Response(
                {
                    'status': False,
                    'message': f'Booking with ID {booking_id} not found'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            # Convert status_name to lowercase and replace spaces with underscores
            formatted_status = status_name.lower().replace(' ', '_')
            # Try exact match first
            try:
                status_obj = BookingStatus.objects.get(name=formatted_status)
            except BookingStatus.DoesNotExist:
                # If not found, try case-insensitive match
                status_obj = BookingStatus.objects.get(name__iexact=formatted_status)
            
            # Get the display name for the status
            status_display = status_obj.displayname
            
        except BookingStatus.DoesNotExist:
            # Get list of available statuses with their display names for the error message
            available_statuses = list(BookingStatus.objects.values('name', 'displayname'))
            return Response(
                {
                    'status': False,
                    'message': f'Status "{status_name}" not found',
                    'available_statuses': [
                        {'name': s['name'], 'display_name': s['displayname']} 
                        for s in available_statuses
                    ]
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            timeline = BookingTimeline.objects.create(
                booking=booking,
                status=status_obj,
                remark=remark
            )
            return Response(
                {
                    'status': True,
                    'message': 'Booking status updated successfully',
                    'data': {
                        'timeline': BookingTimelineSerializer(timeline).data
                    }
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {
                    'status': False,
                    'message': f'Failed to update booking status: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )        

class SubscriberBookingAPI(APIView):
    @action(detail=False, methods=['patch'])
    def patch(self, request):
        data = request.data.copy()
        booking_id = data.pop('booking_id', None)
        
        if not booking_id:
            return Response(
                {
                    'status': False,
                    'message': 'Booking ID is required in the request body'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove foreign key fields from the update data
        fk_fields = ['subscriber', 'subscribervehicle', 'subscriberaddress', 'garage']
        update_data = {k: v for k, v in data.items() if k not in fk_fields and k != 'id'}
        
        if not update_data:
            return Response(
                {
                    'status': False,
                    'message': 'No valid fields provided for update. Foreign key fields cannot be updated using this endpoint.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                try:
                    booking = SubscriberBooking.objects.select_for_update().get(id=booking_id)
                except SubscriberBooking.DoesNotExist:
                    return Response(
                        {
                            'status': False,
                            'message': f'Booking with ID {booking_id} not found'
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Update only the fields that were provided in the request
                for field, value in update_data.items():
                    if hasattr(booking, field):
                        setattr(booking, field, value)
                
                booking.save(update_fields=update_data.keys())
                
                # Return the updated booking data
                serializer = SubscriberBookingSerializer(booking)
                
                return Response(
                    {
                        'status': True,
                        'message': 'Booking updated successfully',
                        'data': serializer.data
                    },
                    status=status.HTTP_200_OK
                )
                
        except Exception as e:
            return Response(
                {
                    'status': False,
                    'message': f'Error updating booking: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['delete'])
    def delete(self, request):
        booking_id = request.query_params.get('booking_id')
        
        if not booking_id:
            return Response(
                {
                    'status': False,
                    'message': 'Booking ID is required as a query parameter (booking_id)'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                try:
                    booking = SubscriberBooking.objects.select_for_update().get(id=booking_id)
                except SubscriberBooking.DoesNotExist:
                    return Response(
                        {
                            'status': False,
                            'message': f'Booking with ID {booking_id} not found'
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Check if booking is already cancelled
                latest_status = booking.bookingtimeline.order_by('-created_at').first()
                if latest_status and latest_status.status.status == 'cancelled':
                    return Response(
                        {
                            'status': False,
                            'message': 'Booking is already cancelled'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create new timeline entry for cancellation
                try:
                    status_obj = BookingStatus.objects.get(name='cancelled')
                    BookingTimeline.objects.create(
                        booking=booking,
                        status=status_obj
                    )
                    
                    return Response(
                        {
                            'status': True,
                            'message': 'Booking cancelled successfully',
                            'data': {
                                'booking_id': booking.id,
                                'status': 'cancelled'
                            }
                        },
                        status=status.HTTP_200_OK
                    )
                except BookingStatus.DoesNotExist:
                    return Response(
                        {
                            'status': False,
                            'message': 'Error: Cancellation status not found'
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
        except Exception as e:
            return Response(
                {
                    'status': False,
                    'message': f'Error cancelling booking: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get(self, request):
        booking_id = request.query_params.get('booking_id')
        subscriber_id = request.query_params.get('subscriber_id')
        
        # Handle list of bookings by subscriber_id
        if not booking_id and subscriber_id:
            try:
                # Convert to integer and validate
                subscriber_id = int(subscriber_id)
                if subscriber_id <= 0:
                    raise ValueError("subscriber_id must be a positive integer")
                
                # Get all bookings for the subscriber
                bookings = SubscriberBooking.objects.filter(
                    subscriber_id=subscriber_id
                ).order_by('-booking_date', '-id')
                
                # Serialize the data
                serializer = SubscriberBookingSerializer(bookings, many=True)
                
                return Response(
                    {
                        'status': True,
                        'message': 'Subscriber Bookings retrieved successfully',
                        'data': serializer.data
                    },
                    status=status.HTTP_200_OK
                )
                
            except ValueError as ve:
                return Response(
                    {
                        'status': False,
                        'message': f'Invalid subscriber_id: {str(ve)}'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                return Response(
                    {
                        'status': False,
                        'message': f'Error retrieving bookings: {str(e)}'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Handle single booking by booking_id
        if not booking_id:
            return Response(
                {
                    'status': False,
                    'message': 'Either booking_id or subscriber_id is required as a query parameter'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            booking = SubscriberBooking.objects.get(id=booking_id)
            serializer = SubscriberBookingSerializer(booking)
            
            return Response(
                {
                    'status': True,
                    'message': 'Booking details retrieved successfully',
                    'data': serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except SubscriberBooking.DoesNotExist:
            return Response(
                {
                    'status': False,
                    'message': f'Booking with ID {booking_id} not found'
                },
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {
                    'status': False,
                    'message': f'Error retrieving booking: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    
    @action(detail=False, methods=['post'])
    def post(self, request):
        # Create a mutable copy of the request data
        data = request.data.copy()
        
        # Map the incoming field names to the serializer field names if needed
        field_mapping = {
            'subscriberid': 'subscriber',
            'subscribervehicleid': 'subscribervehicle',
            'subscriberaddressid': 'subscriberaddress',
            'garageid': 'garage',
            'customerid': 'customer',
            'vehicleid': 'vehicle',
            'bookingdate': 'booking_date',
            'bookingslot': 'booking_slot',
            'bookingamount': 'booking_amount',
            'promocode': 'promo_code',
            'requiredestimate': 'required_estimate'
        }
        
        # Transform the data keys to match the serializer fields
        transformed_data = {}
        for key, value in data.items():
            new_key = field_mapping.get(key, key)
            transformed_data[new_key] = value
        
        # Initialize the serializer with the transformed data
        serializer = SubscriberBookingSerializer(data=transformed_data)
        
        # Validate the data
        if not serializer.is_valid():
            return Response(
                {
                    'status': False,
                    'message': 'Validation error',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save the booking first without customer association
        booking = serializer.save()
        
        # Get or create customer from subscriber
        try:
            if (subscriber := booking.subscriber) and subscriber.phone:
                # Use get_or_create for atomic operation
                print(subscriber.name, subscriber)
                customer, _ = Customer.objects.get_or_create(
                    garage=booking.garage,
                    phone=subscriber.phone,
                    defaults={
                        'name': subscriber.name or '',
                        'address': booking.subscriberaddress.address,
                        'email': subscriber.email,
                        'pincode': booking.subscriberaddress.pincode,
                        'comments': booking.suggestion
                    }
                )
                # Update booking with customer if changed
                if booking.customer_id != customer.id:
                    booking.customer = customer
                    booking.save(update_fields=['customer'])
                    
        except Exception as e:
            logger.error(
                f"Customer association error for booking {getattr(booking, 'id', 'new')}: {str(e)}",
                exc_info=True
            )
        
        # Associate vehicle if not already set
        if booking.customer and booking.subscribervehicle and not booking.vehicle:
            try:
                # Get related data with select_related to reduce queries
                subscriber_vehicle = booking.subscribervehicle
                vehicle_model = subscriber_vehicle.model
                brand = vehicle_model.brand
                
                # Create or get job card brand and model in a single transaction
                with transaction.atomic():
                    # Create brand with normalized name for consistency
                    brand_name = brand.name.lower().replace(' ', '').replace('_', '')
                    jobcard_brand, _ = JobcardBrands.objects.get_or_create(
                        garage=booking.garage,
                        name=brand_name,
                        vehicletype='2',
                        defaults={'displayname': brand.name}
                    )
                    
                    # Create model with normalized name
                    model_name = vehicle_model.name.lower().replace(' ', '').replace('_', '')
                    jobcard_model, _ = JobcardModels.objects.get_or_create(
                        garage=booking.garage,
                        jobcardbrand=jobcard_brand,
                        name=model_name,
                        vehicletype='2',
                        defaults={'displayname': vehicle_model.name}
                    )
                    
                    # Get or create vehicle
                    vehicle, _ = Vehicle.objects.get_or_create(
                        garage=booking.garage,
                        customer=booking.customer,
                        jobcardbrand=jobcard_brand,
                        jobcardmodel=jobcard_model,
                        defaults={
                            'vehicletype': '2',
                            'model': vehicle_model.name,
                            'make': brand.name
                        }
                    )
                    
                    # Update booking with vehicle
                    booking.vehicle = vehicle
                    booking.save(update_fields=['vehicle'])
                    
            except Exception as e:
                # Log the error for debugging
                logger.error(f"Vehicle association error for booking {booking.id}: {str(e)}", 
                            exc_info=True)
        
        # Get the updated booking data
        serializer = SubscriberBookingSerializer(booking)
        response_data = serializer.data
        
        # Format the dates for better readability if needed
        if 'booking_date' in response_data:
            response_data['booking_date'] = booking.booking_date.strftime('%Y-%m-%d')
        
        return Response(
            {
                'status': True,
                'message': 'Booking created successfully',
                'data': response_data
            },
            status=status.HTTP_201_CREATED
        )
