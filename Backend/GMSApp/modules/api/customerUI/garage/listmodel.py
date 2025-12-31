from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from GMSApp.models import Model

class ModelSerializer(serializers.ModelSerializer):
    """
    Serializer for Model model
    """
    image = serializers.SerializerMethodField()
    cc_id = serializers.IntegerField(source='cc.id', read_only=True)
    
    class Meta:
        model = Model
        fields = ['id', 'name', 'image', 'cc_id']
        read_only_fields = ['id', 'cc_id']
    
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image_path and request:
            clean_path = obj.image_path.lstrip('/')
            # Build the base URL (scheme + host + port)
            base_url = f"{request.scheme}://{request.get_host()}"
            # Combine base URL with the clean image path
            return f"{base_url}/{clean_path}"
        return None

class ModelListAPIView(APIView):
    """
    API endpoint that lists all active models filtered by brand ID
    
    Query Parameters:
    - id: The ID of the brand to filter models (required)
    
    Example: /api/models/?id=1
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
            brand_id = request.query_params.get('id')
            
            if not brand_id:
                return Response({
                    'success': False,
                    'message': 'id parameter is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get all active models for the specified brand, ordered by name
            models = Model.objects.filter(
                brand_id=brand_id,
                status='active'
            ).order_by('name')
            
            # Serialize the data with request context
            serializer = ModelSerializer(
                models, 
                many=True,
                context=self.get_serializer_context()
            )
            
            return Response({
                'success': True,
                'message': 'Models retrieved successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Error retrieving models',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
