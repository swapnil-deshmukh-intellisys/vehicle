from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist

from GMSApp.models import SubscriberBookingReview, SubscriberBooking


class SubscriberBookingReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for SubscriberBookingReview model.
    """
    class Meta:
        model = SubscriberBookingReview
        fields = [
            'id',
            'subscriberbooking',
            'review',
            'review_title',
            'rating',
            'image_path'
        ]
        read_only_fields = ['id']
    
    def validate_rating(self, value):
        """
        Check that the rating is between 0 and 5.
        """
        if value < 0 or value > 5:
            raise serializers.ValidationError("Rating must be between 0 and 5")
        return value


class SubscriberBookingReviewAPIView(APIView):
    """
    API endpoint to manage booking review.
    
    GET: Retrieve review for a specific booking
    Query Parameters:
        - booking_id: ID of the booking to retrieve review for
    
    POST: Create a new review for a booking
    Request Body:
        {
            "booking_id": 1,
            "review": "Great service!",
            "review_title": "Excellent",
            "rating": 5.0,
            "image_path": "path/to/image.jpg"  // optional
        }
    """

    def get(self, request, format=None):
        """Get review for a specific booking"""
        booking_id = request.query_params.get('booking_id')
        
        if not booking_id:
            return Response({
                'status': False,
                'message': 'booking_id is required as a query parameter'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            review = SubscriberBookingReview.objects.get(
                subscriberbooking_id=booking_id
            )
            serializer = SubscriberBookingReviewSerializer(review)
            
            return Response({
                'status': True,
                'message': 'Review retrieved successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except (ValueError, ObjectDoesNotExist):
            return Response({
                'status': False,
                'message': 'Review not found.'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request, format=None):
        """Create a new review for a booking"""
        data = request.data
        booking_id = data.get('booking_id')
        
        if not booking_id:
            return Response({
                'status': False,
                'message': 'booking_id is required in request body'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Check if the booking exists
            booking = SubscriberBooking.objects.get(
                id=booking_id
            )
            
            # Check if review already exists for this booking
            if SubscriberBookingReview.objects.filter(subscriberbooking=booking).exists():
                return Response({
                    'status': False,
                    'message': 'A review already exists for this booking'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Map booking_id to subscriberbooking for the serializer
            serializer_data = data.copy()
            serializer_data['subscriberbooking'] = booking_id
            
            # Validate and save the review
            serializer = SubscriberBookingReviewSerializer(
                data=serializer_data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'status': True,
                    'message': 'Review created successfully',
                    'data': serializer.data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'status': False,
                    'message': 'Validation error',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except (ValueError, ObjectDoesNotExist):
            return Response({
                'status': False,
                'message': 'Booking not found.'
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            return Response({
                'status': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)