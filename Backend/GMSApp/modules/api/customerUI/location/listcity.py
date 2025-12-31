from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from GMSApp.models import Banner, City, RelCityServiceCategory, ServiceCategory


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'name', 'status']
        read_only_fields = ['id', 'name', 'status']

class BannerSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Banner
        fields = ['id', 'order', 'image']
        read_only_fields = fields
    
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image_path and request:
            clean_path = obj.image_path.lstrip('/')
            # Build the base URL (scheme + host + port)
            base_url = f"{request.scheme}://{request.get_host()}"
            # Combine base URL with the clean image path
            return f"{base_url}/{clean_path}"
        return None


class ServiceCategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = ServiceCategory
        fields = ['id','name', 'image']
        read_only_fields = fields
    
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image_path and request:
            clean_path = obj.image_path.lstrip('/')
            # Build the base URL (scheme + host + port)
            base_url = f"{request.scheme}://{request.get_host()}"
            # Combine base URL with the clean image path
            return f"{base_url}/{clean_path}"
        return None



class ActiveCityListAPIView(APIView):
    """
    API endpoint that handles:
    - GET /api/active-cities/ - Lists all active cities
    - GET /api/active-cities/?city=pune - Gets all active cities and banners for the specified city
    """
    def get(self, request, format=None):
        city_name = request.query_params.get('city', '').strip().lower()
        response_data = {}
        
        # Get all active cities with both id and name
        cities = City.objects.filter(status='active').order_by('name').values('id', 'name')
        response_data['cities'] = list(cities)
        
        # If city parameter is provided, add banners for that city to the response
        if city_name:
            try:
                # Get the city by name (case-insensitive match)
                city = City.objects.get(name__iexact=city_name, status='active')
                
                # Get active banners for the city, ordered by 'order' field
                banners = Banner.objects.filter(
                    city=city,
                    status='active'
                ).order_by('order')
                
                # Get all active service categories for the city with their display status
                city_service_relations = RelCityServiceCategory.objects.filter(
                    city=city,
                    servicecategory__status='active'
                ).select_related('servicecategory').order_by('servicecategory__name')
                
                # Pass request to serializers to build absolute URLs
                banner_serializer = BannerSerializer(
                    banners, 
                    many=True,
                    context={'request': request}
                )
                
                # Get serialized service data
                service_serializer = ServiceCategorySerializer(
                    context={'request': request}
                )
                service_data = []
                for relation in city_service_relations:
                    if relation.display:    
                        service_data.append({
                            'id': relation.servicecategory.id,
                            'name': relation.servicecategory.name,
                            'image': service_serializer.get_image(relation.servicecategory)
                        })
                
                response_data['current_city'] = city_name
                response_data['banners'] = banner_serializer.data
                
                # Add services under filter object
                response_data['filter'] = {
                    'sort': [
                        {'id': 1, 'name': 'Highest Rating', 'display': False},
                        {'id': 2, 'name': 'Nearest Garages', 'display': False}
                    ],
                    'ratings': [
                        {'id': 1, 'name': 'Ratings 4.5+', 'display': False},
                        {'id': 2, 'name': 'Ratings 4+', 'display': False},
                        {'id': 3, 'name': 'Ratings 3.5+', 'display': False},
                        {'id': 4, 'name': 'Ratings 3.5+', 'display': False}
                    ],
                    'distence': [
                        {'id': 1, 'name': 'Within 1 km'},
                        {'id': 2, 'name': 'Within 3 km'},
                        {'id': 3, 'name': 'Within 5 km'}
                    ],
                    'services': service_data
                }
                
                message = f'Active cities, banners and services for {city_name} retrieved successfully'
                
            except City.DoesNotExist:
                return Response(
                    {
                        'status': 'error', 
                        'message': 'City not found or inactive',
                        'data': {
                            'cities': city_name
                        }
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            message = 'Active cities retrieved successfully'
        
        return Response({
            'status': 'success',
            'message': message,
            'data': response_data
        }, status=status.HTTP_200_OK)