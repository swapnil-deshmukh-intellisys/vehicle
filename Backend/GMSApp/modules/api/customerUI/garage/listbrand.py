from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from GMSApp.models import Brand

class BrandSerializer(serializers.ModelSerializer):
    """
    Serializer for Brand model
    """
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Brand
        fields = ['id', 'name', 'image']
        read_only_fields = ['id']
    
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image_path and request:
            clean_path = obj.image_path.lstrip('/')
            # Build the base URL (scheme + host + port)
            base_url = f"{request.scheme}://{request.get_host()}"
            # Combine base URL with the clean image path
            return f"{base_url}/{clean_path}"
        return None

class BrandListAPIView(APIView):
    """
    API endpoint that lists all active brands
    
    Returns:
        List of active brands with their details
    """
    def get_serializer_context(self):
        """
        Extra context provided to the serializer class.
        """
        return {
            'request': self.request
        }
            
    def get(self, request, format=None):
        try:
            # Get all active brands ordered by creation date
            brands = Brand.objects.filter(status='active').order_by('-created_at')
            
            # Serialize the data with request context
            serializer = BrandSerializer(
                brands, 
                many=True,
                context=self.get_serializer_context()
            )
            
            return Response({
                'success': True,
                'message': 'Brands retrieved successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Error retrieving brands',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
