from math import atan2, cos, radians, sin, sqrt

from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from GMSApp.models import City, Garage, RelGarageServiceCategory, RelGarageVehicleType


class GarageSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    image = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    distance = serializers.SerializerMethodField()
    rating = serializers.FloatField(required=False, default=0.0)
    city = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    is_exclusive = serializers.SerializerMethodField()
    is_verified = serializers.SerializerMethodField()
    is_offer = serializers.SerializerMethodField()
    offer_text = serializers.SerializerMethodField()
    vehicle_types = serializers.SerializerMethodField()
    
    def get_distance(self, obj):
        # Return the distance as is (could be float or None)
        if isinstance(obj, dict):
            return obj.get('distance')
        return getattr(obj, 'distance', None)
        
    def get_city(self, obj):
        # Handle both model instance and dictionary
        if isinstance(obj, dict):
            return obj.get('city', '')
        return obj.city.name if hasattr(obj, 'city') and obj.city else ''
        
    def get_location(self, obj):
        # Handle location field for both model instance and dictionary
        if isinstance(obj, dict):
            return obj.get('location', '')
        return obj.location if hasattr(obj, 'location') else ''
        
    def get_is_exclusive(self, obj):
        if isinstance(obj, dict):
            return obj.get('is_exclusive', False)
        return getattr(obj, 'is_exclusive', False)
        
    def get_is_verified(self, obj):
        if isinstance(obj, dict):
            return obj.get('is_verified', False)
        return getattr(obj, 'is_verified', False)
        
    def get_is_offer(self, obj):
        if isinstance(obj, dict):
            return obj.get('is_offer', False)
        return getattr(obj, 'is_offer', False)
        
    def get_offer_text(self, obj):
        if isinstance(obj, dict):
            return obj.get('offer_text')
        return getattr(obj, 'offer_text', None)
    
    def get_address(self, obj):
        # Handle both model instance and dictionary
        if isinstance(obj, dict):
            address = obj.get('address', '')
            state = obj.get('state', '')
            postal_code = obj.get('postal_code', '')
            landmark = obj.get('landmark', '')
            city = obj.get('city', {})
            city_name = city.get('name', '') if isinstance(city, dict) else str(city) if city else ''
        else:
            # For model instance, get the related city name
            city_name = ''
            if hasattr(obj, 'city') and obj.city:
                city_name = obj.city.name if hasattr(obj.city, 'name') else str(obj.city)
                
            address = obj.address if hasattr(obj, 'address') else ''
            state = obj.state if hasattr(obj, 'state') else ''
            postal_code = obj.postal_code if hasattr(obj, 'postal_code') else ''
            landmark = obj.landmark if hasattr(obj, 'landmark') else ''
        
        # Build the address components list, filtering out empty values
        address_parts = [
            str(address) if address else None,
            str(landmark) if landmark else None,
            str(city_name) if city_name else None,
            str(state) if state else None,
            str(postal_code) if postal_code else None
        ]
        
        # Filter out None values and empty strings, then join with comma and space
        full_address = ', '.join(filter(None, [str(part).strip() for part in address_parts if part and str(part).strip()]))
        return full_address
    
    def get_image(self, obj):
        request = self.context.get('request')
        # Get logo from either dictionary or model instance
        logo = obj.get('logo') if isinstance(obj, dict) else obj.logo
        if logo and request:
            clean_path = logo.lstrip('/')
            # Build the base URL (scheme + host + port)
            base_url = f"{request.scheme}://{request.get_host()}"
            # Combine base URL with the clean image path
            return f"{base_url}/{clean_path}"
        return None
    
    def get_vehicle_types(self, obj):
        if isinstance(obj, dict):
            return obj.get('vehicle_types', [])
        return getattr(obj, 'vehicle_types', [])


def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula 
    dlat = lat2 - lat1 
    dlon = lon2 - lon1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a)) 
    r = 6371  # Radius of earth in kilometers
    return c * r


class ListGarageAPIView(APIView):
    """
    API endpoint that lists garages by service category ID with location filtering
    
    Request body:
    {
    "location": "pune",
    "latitude": 17.74162000,
    "longitude": 73.8567,
    "filter": {
        "sort": [], // [1,2] 1 for highest rating and 2 for nearest garages
        "rating": [], // [1,2,3,4] 1 for 4.5+ stars and 2 for 4.0+ stars and 3 for 3.5+ stars and 4 for 3.0+ stars
        "distence": [], // [1] or [2] or [3] 1 for 1km and 2 for 3km and 3 for 5km
        "service": [] // [1,2,3,5] service category IDs
        }
    }
    """
    
    def post(self, request, format=None):
        location = request.data.get('location')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        # Validate all required fields
        if not all([location, latitude is not None, longitude is not None]):
            missing_fields = []
            if not location:
                missing_fields.append('location')
            if latitude is None:
                missing_fields.append('latitude')
            if longitude is None:
                missing_fields.append('longitude')
                
            return Response(
                {
                    'status': 'error',
                    'message': f'Missing required fields: {", ".join(missing_fields)}',
                    'data': []
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Convert coordinates to float
            user_lat = float(latitude)
            user_lon = float(longitude)
            
            # First get the city ID for the location
            try:
                city = City.objects.get(name__iexact=location)
            except City.DoesNotExist:
                return Response(
                    {
                        'status': 'error',
                        'message': f'City {location} not found',
                        'data': []
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Apply filters if provided
            filters = request.data.get('filter', {})
            wheeler_values = request.data.get('vehicle_type_wheeler', None)
            # Build garage query filters
            garage_filters = {'city': city, 'displayed': True}
            
            # Filter by vehicle_type_wheeler if specified
            if wheeler_values:
                garage_ids_with_wheelers = RelGarageVehicleType.objects.filter(
                    vehicletype__wheeler=wheeler_values
                ).values_list('garage_id', flat=True)
                garages = Garage.objects.filter(
                    id__in=garage_ids_with_wheelers,
                    **garage_filters
                ).order_by('position')
            else:
                garages = Garage.objects.filter(**garage_filters).order_by('position')
            
            garage_data_list = []
            for garage in garages:
                # Create a dictionary with garage data and address information
                city_name = garage.city.name if hasattr(garage, 'city') and garage.city and hasattr(garage.city, 'name') else ''
                
                # Get vehicle types for this garage
                vehicle_types = []
                for rel in garage.rel_garage_vehicletype.select_related('vehicletype').all():
                    vehicle_types.append({
                        'id': rel.vehicletype.id,
                        'name': rel.vehicletype.name,
                        'wheeler': rel.vehicletype.wheeler,
                        'is_ev': rel.vehicletype.is_ev
                    })
                
                garage_data = {
                    'id': garage.id,
                    'name': garage.name,
                    'logo': garage.logo,
                    'city': city_name,
                    'address': garage.address if hasattr(garage, 'address') else '',
                    'landmark': garage.landmark if hasattr(garage, 'landmark') else '',
                    'state': garage.state if hasattr(garage, 'state') else '',
                    'postal_code': garage.postal_code if hasattr(garage, 'postal_code') else '',
                    'latitude': garage.latitude,
                    'longitude': garage.longitude,
                    'distance': None,  # Default to None for missing distances
                    'rating': float(garage.rating) if hasattr(garage, 'rating') and garage.rating is not None else 0.0,
                    'location': garage.location if hasattr(garage, 'location') else '',
                    'is_exclusive': garage.is_exclusive if hasattr(garage, 'is_exclusive') else False,
                    'is_verified': garage.is_verified if hasattr(garage, 'is_verified') else False,
                    'is_offer': garage.is_offer if hasattr(garage, 'is_offer') else False,
                    'offer_text': garage.offer_text if hasattr(garage, 'offer_text') else None,
                    'vehicle_types': vehicle_types
                }
                
                # Only calculate distance if both coordinates are valid
                if garage.latitude is not None and garage.longitude is not None:
                    try:
                        distance = haversine(
                            user_lat, 
                            user_lon,
                            float(garage.latitude),
                            float(garage.longitude)
                        )
                        garage_data['distance'] = round(distance, 2)
                    except (ValueError, TypeError):
                        pass  # Keep None as distance
                
                garage_data_list.append(garage_data)
            
            # Filter by rating if specified
            if 'rating' in filters and filters['rating']:
                # Map rating filter values to minimum rating thresholds
                rating_map = {
                    1: 4.5,  # 4.5+ stars
                    2: 4.0,  # 4.0+ stars
                    3: 3.5,  # 3.5+ stars
                    4: 3.0   # 3.0+ stars
                }
                # Get all selected rating thresholds
                selected_thresholds = [rating_map[r] for r in filters['rating']]
                # Filter garages that match ANY of the selected rating thresholds
                garage_data_list = [g for g in garage_data_list 
                                 if g['rating'] is not None 
                                 and any(g['rating'] >= threshold for threshold in selected_thresholds)]
            
            # Filter by distance if specified
            if 'distence' in filters and filters['distence']:
                distance_filter = filters['distence'][0]  # Get the first (and only) value from the array
                max_distance = 0                
                # Map filter values to actual distances in km
                if distance_filter == 1:
                    max_distance = 1.0  # Within 1 km
                elif distance_filter == 2:
                    max_distance = 3.0  # Within 3 km
                elif distance_filter == 3:
                    max_distance = 5.0  # Within 5 km                
                # Filter garages within the specified distance
                garage_data_list = [g for g in garage_data_list 
                                 if g['distance'] is not None 
                                 and g['distance'] <= max_distance]
            
            # Filter by service if specified
            if 'service' in filters and filters['service']:
                service_ids = filters['service']
                garage_ids_with_services = set(RelGarageServiceCategory.objects.filter(
                    servicecategory_id__in=service_ids
                ).values_list('garage_id', flat=True))
                garage_data_list = [g for g in garage_data_list 
                                 if g['id'] in garage_ids_with_services]               
            
            # Apply sorting if specified
            if 'sort' in filters and filters['sort']:
                sort_options = filters['sort']                
                # Define a key function for sorting
                def get_sort_key(garage):
                    key_parts = []         
                    for option in sort_options:
                        if option == 1:  # Sort by rating (highest first)
                            key_parts.append(-garage['rating'] if garage['rating'] is not None and garage['rating'] > 0 else float('inf'))
                        elif option == 2:  # Sort by distance (nearest first)
                            key_parts.append(garage['distance'] if garage['distance'] is not None else float('inf'))                    
                    # Always use ID as the final tiebreaker
                    key_parts.append(garage['id'])
                    return tuple(key_parts)                
                # Sort the list using our key function
                garage_data_list.sort(key=get_sort_key)

            else:
                # Default sort by distance if no sort specified
                garage_data_list.sort(key=lambda x: (float('inf') if x['distance'] is None else x['distance'], x['id']))
            
            # Serialize the data
            serializer = GarageSerializer(
                garage_data_list,
                many=True,
                context={'request': request}
            )
            
            # Format the response
            response_data = {
                'status': 'success',
                'message': f'Garages in {location} retrieved successfully',
                'data': serializer.data  # Directly use the serialized garage data
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {
                    'status': 'error',
                    'message': str(e),
                    'data': []
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )