from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from GMSApp.models import RelGarageService

class GarageServiceSerializer(serializers.ModelSerializer):
    """
    Serializer for garage services with only the requested fields
    """
    name = serializers.CharField(source='service.name')
    description = serializers.CharField(source='service.description')
    service_type = serializers.CharField(source='service.service_type.name')
    
    class Meta:
        model = RelGarageService
        fields = ['id', 'service_type', 'name', 'description', 'price']

class GarageServiceListAPIView(APIView):
    """
    API endpoint that lists garage services filtered by garage ID and CC ID
    
    Request body:
    {
        "garageid": 1,
        "ccid": 8
    }
    """
    def post(self, request, format=None):
        garage_id = request.data.get('garageid')
        cc_id = request.data.get('ccid')
        
        # Validate required fields
        if not all([garage_id, cc_id]):
            return Response({
                'status': 'error',
                'message': 'Both garageid and ccid are required',
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get active garage services for the specified garage and CC
            services = RelGarageService.objects.filter(
                garage_id=garage_id,
                cc_id=cc_id,
                status='active'
            ).select_related('service', 'cc')
            
            # Serialize the data
            serializer = GarageServiceSerializer(services, many=True)
            
            return Response({
                'status': 'success',
                'message': 'Garage services retrieved successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e),
                'data': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
