from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import urllib.parse
import random
from django.shortcuts import get_object_or_404
from GMSApp.models import SendOtp

@method_decorator(csrf_exempt, name='dispatch')
class SendSMSAPI(APIView):
    permission_classes = []  # Temporarily removing authentication for testing
    
    def post(self, request, *args, **kwargs):
        """
        Send SMS with OTP to a single mobile number and save to SendOtp model
        Expected POST data:
        {
            "mobile": "98xxxxxxxx"
        }
        """
        mobile = request.data.get('mobile')
        
        if not all([mobile]):
            return Response(
                {"error": "Business ID and mobile number are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Generate 6-digit OTP
        otp = str(random.randint(1000, 9999))
        
        SENDER_ID = "PVYINF"
        AUTH_KEY = "8f461d3fef716d11e81141753a55eda"

        # Construct the full URL with parameters
        base_url = "http://msg.pvyinfotech.com/rest/services/sendSMS/sendGroupSms"
        full_url = (
            f"{base_url}?"
            f"AUTH_KEY={AUTH_KEY}&"
            f"message=Dear%20user%20of%20BIKEDOOT,%20Your%20Login%20OTP%20is%20{otp}.%20Pls%20do%20not%20share%20it%20with%20anyone.%20Regards%20PVY%20INFOTECH&"
            f"senderId={SENDER_ID}&"
            "routeId=1&"
            f"mobileNos={mobile}&"
            "smsContentType=english"
        )
        
        # Set headers
        headers = {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
        }
        
        try:
            # Make the GET request to the SMS gateway
            response = requests.get(full_url, headers=headers)
            response.raise_for_status()
            
            # Parse the response
            result = response.json()
            
            # Check if the SMS was sent successfully
            if isinstance(result, dict) and result.get('responseCode') == '3001':
                # Save OTP to database
                SendOtp.objects.create(
                    phone=mobile,
                    otp=otp
                )
                return Response({
                    "status": True, 
                    "message": "SMS with OTP sent successfully"
                })
            else:
                return Response(
                    {                        
                        "status": False,
                        "message": "Failed to send SMS"
                    }, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except requests.exceptions.RequestException as e:
            return Response(
                {
                               
                    "status": False,
                    "message": f"Failed to send SMS: {str(e)}"
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
