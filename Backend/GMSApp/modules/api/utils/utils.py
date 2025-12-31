import jwt
import datetime
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed

# Set a secret key for JWT (should be in your Django settings for production)
SECRET_KEY = getattr(settings, 'SECRET_KEY', 'your_default_secret_key')
ALGORITHM = 'HS256'
EXPIRY_MINUTES = 60 * 24 * 7  # 7 days

def create_jwt_token(user_data):
    """
    Generate a JWT token with user info (e.g., mobile, active).
    """
    payload = user_data.copy()
    payload['exp'] = datetime.datetime.utcnow() + datetime.timedelta(minutes=EXPIRY_MINUTES)
    payload['iat'] = datetime.datetime.utcnow()
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def decode_jwt_token(token):
    """
    Decode a JWT token and return the payload (user info).
    Raises AuthenticationFailed if invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Token has expired')
    except jwt.InvalidTokenError:
        raise AuthenticationFailed('Invalid token')

def get_user_from_token(request):
    """
    Extract user info from JWT token in request headers.
    Usage: user = get_user_from_token(request)
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise AuthenticationFailed('Authorization header missing or invalid')
    token = auth_header.split(' ')[1]
    return decode_jwt_token(token)

# Example usage for other APIs:
# from GMSApp.modules.api.utils.utils import get_user_from_token
# def get(self, request, *args, **kwargs):
#     user = get_user_from_token(request)
#     mobile = user['mobile']
#     ...
