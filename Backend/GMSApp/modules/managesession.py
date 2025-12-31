from functools import wraps
from django.shortcuts import redirect
from django.http import HttpResponseRedirect
from django.contrib import messages
from django.contrib.sessions.backends.db import SessionStore
from datetime import timedelta, datetime
from dateutil.parser import parse
from django.utils import timezone

# Define the maximum inactivity duration (1 hour)
MAX_INACTIVITY_DURATION = timedelta(hours=1)

def set_session_keys(keys, response):
    """ Sets session keys and stores last activity timestamp. """
    session = SessionStore()
    for key, value in keys.items():
        session[key] = value

    session['last_activity'] = str(timezone.now())
    session.create()
    response.set_cookie('session_key', session.session_key)
    return response

def get_session_key(request):
    """ Retrieves session using the session key from cookies. """
    session_key = request.COOKIES.get('session_key')
    return SessionStore(session_key=session_key) if session_key else None

def clear_all_session(request, response):
    """ Clears all session data and removes session cookie. """
    request.session.flush()
    response.delete_cookie('session_key')
    return response

def check_inactivity_timeout(request):
    """ Checks if the user session has expired due to inactivity. """
    session = get_session_key(request)
    if not session:
        return True  # No session found, treat as expired

    last_activity_str = session.get('last_activity')
    if last_activity_str:
        last_activity = parse(last_activity_str)
        if timezone.now() - last_activity > MAX_INACTIVITY_DURATION:
            request.session.flush()
            return True  # Session expired

        # Update last activity time
        session['last_activity'] = str(timezone.now())
        session.save()

    return False  # Session is still valid

def get_user_session(request):
    """
    Retrieves user session data. If any required value is missing,
    redirects to login.
    """
    session = get_session_key(request)  
    if not session:
        return redirect('login')

    try:
        # Create context with all required keys, setting None as default for missing ones
        context = {
            'userid': session.get('userid'),
            'useremail': session.get('useremail'),
            'username': session.get('username'),
            'usermobile': session.get('usermobile'),
            'userrole': session.get('userrole'),
            'usertype': session.get('usertype'),
            'userstatus': session.get('userstatus'),
            'userexpiry': datetime.strptime(session.get('userexpiry', '')[:19], "%Y-%m-%d %H:%M:%S") if session.get('userexpiry') else None,
            'useruiacl': session.get('useruiacl', {}),
            'garage_id': session.get('garage_id'),
            'allowed_garage_ids': session.get('allowed_garage_ids', []),
            'allowed_city_ids': session.get('allowed_city_ids', []),
            'business_logo': session.get('business_logo', '#'),
            'garagegroup_id': session.get('garagegroup_id')
        }
        return context
    except Exception as e:
        messages.warning(request, "Error processing session data. Please login again.")
        return redirect('login')

def check_session_timeout(view_func):
    """
    Decorator to check session timeout and retrieve session data
    before processing a view. Redirects to login if session has expired.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if check_inactivity_timeout(request):
            messages.warning(request, 'You have been logged out due to inactivity, Please login again.')
            return redirect('login')

        context = get_user_session(request)
        if isinstance(context, HttpResponseRedirect): # Redirect if session is invalid
            return context

        return view_func(request, context, *args, **kwargs)

    return wrapper
