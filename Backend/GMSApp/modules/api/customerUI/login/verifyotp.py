from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.shortcuts import get_object_or_404
from django.db import transaction
from GMSApp.models import  Subscriber, SendOtp
from GMSApp.modules.api.utils.utils import create_jwt_token  # JWT utility

@method_decorator(csrf_exempt, name='dispatch')
class VerifyOTPAPI(APIView):
    permission_classes = []  # No authentication required for OTP verification
    
    def post(self, request, *args, **kwargs):
        """
        Verify OTP for a mobile number and create/update subscriber
        Expected POST data:
        {
            "mobile": "98xxxxxxxx",
            "otp": "123456"
        }
        """
        mobile = request.data.get('mobile')
        otp = request.data.get('otp')
        
        if not all([mobile, otp]):
            return Response(
                {           
                    "status": False,
                    "message": "Business ID, mobile and OTP are required"
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:            
            # Get the latest OTP for this mobile number and business
            latest_otp = (
                SendOtp.objects
                .filter(phone=mobile)
                .order_by('-created_at')
                .first()
            )
            
            # Verify OTP
            if not latest_otp or latest_otp.otp != otp:
                return Response(
                    {
                        "status": False,
                        "message": "Invalid OTP"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if subscriber exists, if not create one
            with transaction.atomic():
                subscriber, created = Subscriber.objects.get_or_create(
                    phone=mobile,
                    defaults={
                        'email': request.data.get('email')  # Optional email if provided
                    }
                )
            
            # Generate JWT token with user info
            user_data = {
                "subscriber_id": subscriber.id,
                "mobile": mobile,
                "is_new": created
            }
            token = create_jwt_token(user_data)
            
            return Response({
                "status": True,
                "message": "Login successful",
                "data": {
                    "subscriber_id": subscriber.id,
                    "mobile": mobile,
                    "is_new": created,
                    "token": token
                }
            })
            
        except Business.DoesNotExist:
            return Response(
                {
                    "status": False,
                    "message": "Business not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )
