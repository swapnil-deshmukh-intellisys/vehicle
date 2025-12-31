from django.utils import timezone
from datetime import datetime, timedelta
from django.http import HttpResponse
from openpyxl import Workbook
from GMSApp.models import UsersAccesses, Garage

def convert_utc_to_ist(utc_datetime):
    """
    Converts a UTC datetime object to IST (Indian Standard Time).
    """
    if utc_datetime is None:
        return None
    # If the input is a string, parse it into a datetime object
    if isinstance(utc_datetime, str):
        utc_datetime = datetime.fromisoformat(utc_datetime)

    # Ensure the datetime is aware (in UTC)
    if utc_datetime.tzinfo is None:
        utc_datetime = timezone.make_aware(utc_datetime, timezone.utc)

    # IST is UTC+5:30
    ist_offset = timedelta(hours=5, minutes=30)
    ist_datetime = utc_datetime + ist_offset
    
    return ist_datetime

def convert_ist_to_utc(ist_datetime):
    """
    Converts a timezone-aware IST datetime object to UTC.
    """
    # If the input is a string, parse it into a datetime object
    if isinstance(ist_datetime, str):
        ist_datetime = datetime.fromisoformat(ist_datetime)

    # Ensure the datetime is timezone-aware
    if ist_datetime.tzinfo is None:
        # Localize the naive datetime as IST
        ist_timezone = timezone.get_current_timezone()  # Assuming your Django settings are configured for IST
        ist_datetime = timezone.make_aware(ist_datetime, ist_timezone)

    # IST is UTC+5:30
    ist_offset = timedelta(hours=5, minutes=30)
    utc_datetime = ist_datetime - ist_offset
    
    return utc_datetime


def get_current_financial_year():
    # Get the current date
    today = datetime.today()

    # Financial year runs from April to March
    if today.month >= 4:
        # If it's April or later, current financial year starts this year and ends next year
        start_year = today.year
        end_year = today.year + 1
    else:
        # If it's before April, financial year started last year and ends this year
        start_year = today.year - 1
        end_year = today.year

    # Format the financial year as "YYYY-YY"
    financial_year = f"{start_year}-{str(end_year)[-2:]}"
    return financial_year


def get_users_accesses_garage_id(user_id):
    # Get the garage ID associated with the user
    garage_id = UsersAccesses.objects.filter(
        user_id=user_id, module='garage_id'
    ).values_list('value', flat=True).first()

    if garage_id:
        # Retrieve both the ID and name from Garage
        garage = Garage.objects.filter(
            id=garage_id
        ).values('id', 'name').first()

        if garage:
            return {'id': garage['id'], 'name': garage['name']}
    
    return None  # Return None if no match is found

