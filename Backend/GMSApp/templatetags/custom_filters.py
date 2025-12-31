from django import template
from django.utils import timezone
from django.template.defaultfilters import stringfilter
from GMSApp.modules import customfunctions
import os
from datetime import timedelta

register = template.Library()


# USECASE: {{note.created_at|utc_to_ist|date:'M d, Y H:i:s'}}
@register.filter
def utc_to_ist(utc_datetime):
    return customfunctions.convert_utc_to_ist(utc_datetime)


# USECASE: {{note.created_at|ist_to_utc|date:'M d, Y H:i:s'}}
@register.filter
def ist_to_utc(ist_datetime):
    return customfunctions.convert_ist_to_utc(ist_datetime)


# USECASE: {{ file.filepath|extract_filename }}
@register.filter
def extract_filename(value):
    """Extracts the filename from a file path."""
    return os.path.basename(value)


# USECASE: {% with file.filepath|extract_file_extension as file_extension %}{% endwith %}
SUPPORTED_EXTENSIONS = ["doc", "xls", "txt", "pdf", "jpg"]
@register.filter
def extract_file_extension(filepath):
    if not filepath:
        return "unknown"
    _, ext = os.path.splitext(filepath)
    ext = ext[1:].lower()  # Remove the dot and convert to lowercase
    return ext if ext in SUPPORTED_EXTENSIONS else "unknown"    


# USECASE1: {% if 'add' in useruiacl.Inventory|get_item:"Stock Outward" %}{% endif %}
# USECASE2: {% if 'Stock Outward' in useruiacl|get_item:"Inventory" %}{% endif %}
@register.filter
def get_item(dictionary, key):
    """ Get dictionary value by key in Django templates """
    return dictionary.get(key, {})


# USECASE: {{ "a,b,c"|split:"," }}
@register.filter
def split(value, delimiter=','):
    """
    Split a string by the given delimiter and return a list.
    If value is None or not a string, returns an empty list.
    """
    if value is None:
        return []
    if not isinstance(value, str):
        value = str(value)
    return value.split(delimiter)


# USECASE: {% get_color forloop.counter0 as module_color %}
COLORS = [
    "form-check-primary",
    "form-check-secondary",
    "form-check-success",
    "form-check-danger",
    "form-check-warning",
    "form-check-info",
    "form-check-dark",
]
@register.simple_tag
def get_color(index):
    """Returns a color class based on index."""
    return COLORS[index % len(COLORS)]


@register.filter
def initials(value):
    if not value:
        return ""
    return "".join(word[0].upper() for word in value.split() if word)


@register.filter
def is_within_24_hours(booking_datetime):
    """
    Check if the booking was created within the last 24 hours
    Usage: {% if booking.created_at|is_within_24_hours %}
    """
    if not booking_datetime:
        return False
    now = timezone.now()
    time_difference = now - booking_datetime
    return time_difference <= timedelta(hours=24)


@register.filter
def replace_underscore_with_space(value):
    """
    Replaces all underscores with spaces in a string
    Usage: {{ value|replace_underscore_with_space }}
    """
    if not value:
        return value
    return str(value).replace('_', ' ')