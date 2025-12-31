from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from GMSApp.models import Garage, City, GarageBanner, RelGarageService, GarageService, GarageServicetype


class GarageBannerSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = GarageBanner
        fields = ['image']
    
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image_path and request:
            clean_path = obj.image_path.lstrip('/')
            # Build the base URL (scheme + host + port)
            base_url = f"{request.scheme}://{request.get_host()}"
            # Combine base URL with the clean image path
            return f"{base_url}/{clean_path}"
        return None


class GarageServiceSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='service.name', read_only=True)
    price = serializers.FloatField()
    cc = serializers.CharField(source='cc.name', read_only=True)
    
    class Meta:
        model = RelGarageService
        fields = ['name', 'price', 'cc']
        read_only_fields = fields

class GarageDetailSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    banners = serializers.SerializerMethodField()
    description = serializers.CharField(source='about')
    services = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    owner = serializers.CharField(source='contact_person', read_only=True)
    
    class Meta:
        model = Garage
        fields = ['name', 'image', 'address', 'description', 'location', 'banners', 'services', 'contact_person', 'owner', 'phone', 'email']
        read_only_fields = fields
    
    def get_location(self, obj):
        return {
            'latitude': float(obj.latitude) if obj.latitude else None,
            'longitude': float(obj.longitude) if obj.longitude else None
        }
    
    def get_services(self, obj):
        # Get all active garage services with related data
        garage_services = RelGarageService.objects.filter(
            garage=obj,
            status='active'
        ).select_related('service', 'service__service_type', 'cc')
        
        # Group services and addons by CC
        services_by_cc = {}
        addons_by_cc = {}
        
        for rel_service in garage_services:
            cc_name = rel_service.cc.name if rel_service.cc else 'Other'
            service_data = {
                'name': rel_service.service.name,
                'price': float(rel_service.price)
            }
            
            if rel_service.service.service_type.name.lower() == 'add-on':
                if cc_name not in addons_by_cc:
                    addons_by_cc[cc_name] = []
                addons_by_cc[cc_name].append(service_data)
            else:
                if cc_name not in services_by_cc:
                    services_by_cc[cc_name] = []
                services_by_cc[cc_name].append(service_data)
        
        # Format the response
        result = {}
        
        # Add services grouped by CC
        result['service'] = [
            {cc_name: services}
            for cc_name, services in services_by_cc.items()
        ]
        
        # Add addons grouped by CC
        result['addon'] = [
            {cc_name: addons}
            for cc_name, addons in addons_by_cc.items()
        ]
        
        return result
    
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.logo and request:
            clean_path = obj.logo.lstrip('/')
            # Build the base URL (scheme + host + port)
            base_url = f"{request.scheme}://{request.get_host()}"
            # Combine base URL with the clean image path
            return f"{base_url}/{clean_path}"
        return None
    
    def get_address(self, obj):
        address_parts = [
            obj.address if obj.address else None,
            obj.landmark if obj.landmark else None,
            obj.city.name if hasattr(obj, 'city') and obj.city and hasattr(obj.city, 'name') else None,
            obj.state if obj.state else None,
            str(obj.postal_code) if obj.postal_code else None
        ]
        # Filter out None and empty strings, then join with comma and space
        full_address = ', '.join(filter(None, [str(part).strip() for part in address_parts if part and str(part).strip()]))
        return full_address
    
    def get_banners(self, obj):
        # Get active banners for the garage, ordered by 'order' field
        banners = obj.garage_banner.filter(status='active').order_by('order')
        return GarageBannerSerializer(
            banners, 
            many=True,
            context={'request': self.context.get('request')}
        ).data


class GarageDetailAPIView(APIView):
    """
    API endpoint to fetch garage details by ID
    
    Query Parameters:
    - id: The ID of the garage to fetch (required)
    
    Example: /api/garage/?id=1
    """
    
    def get_serializer_context(self):
        return {'request': self.request}
    
    def get(self, request, format=None):
        garage_id = request.query_params.get('id')
        
        if not garage_id:
            return Response({
                'status': 'error',
                'message': 'Garage ID is required as a query parameter (e.g., ?id=1)',
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            garage = get_object_or_404(Garage, id=garage_id)
            serializer = GarageDetailSerializer(garage, context=self.get_serializer_context())
            
            # Get the serialized data
            response_data = serializer.data
            
            # Ensure banners key exists in the response
            if 'banners' not in response_data:
                response_data['banners'] = []
            
            # Get service categories for the garage
            service_categories = garage.rel_garage_servicecategory.select_related('servicecategory').all()
            
            # Get request from context for URL building
            request = self.get_serializer_context().get('request')
            
            service_provided = []
            for rel in service_categories:
                if hasattr(rel.servicecategory, 'image_path') and rel.servicecategory.image_path:
                    # Build full URL for the image
                    clean_path = rel.servicecategory.image_path.lstrip('/')
                    if request:
                        image_url = f"{request.scheme}://{request.get_host()}/{clean_path}"
                    else:
                        # Fallback if no request in context
                        image_url = f"/{clean_path}"
                    
                    service_provided.append({
                        'name': rel.servicecategory.name,
                        'image': image_url
                    })
            
            # Add service_provided to response data
            response_data['service_provided'] = service_provided
            
            # Add dummy reviews data
            response_data['reviews'] = [
                {
                    "name": "Ajay",
                    "rating": 4.5,
                    "image": "http://127.0.0.1:8000/static/custom-assets/images/profile-icon.png"
                },
                {
                    "name": "Ajayks",
                    "rating": 4.2,
                    "image": "http://127.0.0.1:8000/static/custom-assets/images/profile-icon.png"
                }
            ]
                
            return Response({
                'status': 'success',
                'message': 'Garage details retrieved successfully',
                'data': response_data
            })
            
        except ValueError:
            return Response({
                'status': 'error',
                'message': 'Invalid garage ID format. ID must be a number.',
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e),
                'data': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)