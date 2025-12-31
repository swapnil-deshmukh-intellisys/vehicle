from django import template
from num2words import num2words
from datetime import datetime, timedelta

register = template.Library()

@register.filter
def calculate_amount(value, tax_percentage):
    """Calculate the amount with tax included"""
    try:
        value = float(value)
        tax_percentage = float(tax_percentage)
        tax_amount = value * (tax_percentage / 100)
        return value + tax_amount
    except (ValueError, TypeError):
        return 0

@register.filter
def num_to_words(value):
    """Convert number to words with Indian Rupee format"""
    try:
        value = float(value)
        words = num2words(int(value), lang='en_IN')
        # Format: "One Thousand Two Hundred Thirty Five Rupees and Forty Six Paise"
        rupees = words.title()
        paise = int((value - int(value)) * 100)
        if paise > 0:
            return f"{rupees} Rupees and {num2words(paise).title()} Paise"
        else:
            return f"{rupees} Rupees"
    except (ValueError, TypeError):
        return ""

@register.filter
def multiply(value, arg):
    """Multiply the value by the argument"""
    try:
        return float(value) * float(arg)
    except (ValueError, TypeError):
        return 0

@register.filter
def divide(value, arg):
    """Divide the value by the argument"""
    try:
        arg = float(arg)
        if arg == 0:
            return 0
        return float(value) / arg
    except (ValueError, TypeError):
        return 0

@register.filter
def subtract(value, arg):
    """Subtract the argument from the value"""
    try:
        return float(value) - float(arg)
    except (ValueError, TypeError):
        return 0

@register.filter
def add(value, arg):
    """Add the argument to the value"""
    try:
        return float(value) + float(arg)
    except (ValueError, TypeError):
        return 0

@register.filter
def add_days(date_str, days):
    """Add days to a date string"""
    try:
        # Try to parse the date string
        if isinstance(date_str, str):
            date_obj = datetime.strptime(date_str, '%d/%m/%Y')
        else:
            # If it's already a date object
            date_obj = date_str
            
        # Add the specified number of days
        new_date = date_obj + timedelta(days=int(days))
        
        # Return the new date in the same format
        return new_date.strftime('%d/%m/%Y')
    except (ValueError, TypeError):
        return date_str
