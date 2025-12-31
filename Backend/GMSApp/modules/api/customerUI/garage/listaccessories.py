from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from GMSApp.models import Accessories

class AccessorySerializer(serializers.ModelSerializer):
    """
    Serializer for accessories
    """
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Accessories
        fields = ['id', 'name', 'price', 'gst', 'image', 'description']
    
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image_path and request:
            clean_path = obj.image_path.lstrip('/')
            # Build the base URL (scheme + host + port)
            base_url = f"{request.scheme}://{request.get_host()}"
            # Combine base URL with the clean image path
            return f"{base_url}/{clean_path}"
        return None

class AccessoryListAPIView(APIView):
    """
    API endpoint that lists all active accessories
    
    Response:
    {
        "status": "success",
        "message": "Accessories retrieved successfully",
        "data": [
            {
                "id": 1,
                "name": "Accessory Name",
                "price": "100.00",
                "gst": "18.00",
                "image": "http://example.com/path/to/image.jpg",
                "description": "Accessory description"
            },
            ...
        ]
    }
    """
    
    def get_serializer_context(self):
        return {'request': self.request}
    
    def get(self, request, format=None):
        try:
            # Get all active accessories ordered by creation date (newest first)
            accessories = Accessories.objects.filter(
                status='active'
            ).order_by('-created_at')
            
            # Serialize the data
            serializer = AccessorySerializer(
                accessories,
                many=True,
                context=self.get_serializer_context()
            )
            
            return Response({
                'status': 'success',
                'message': 'Accessories retrieved successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e),
                'data': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
