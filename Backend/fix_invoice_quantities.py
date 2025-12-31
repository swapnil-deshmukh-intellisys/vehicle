#!/usr/bin/env python3
"""
This script updates the invoice update view to properly handle quantity fields
for both services and parts. It ensures that quantities are correctly saved
and retrieved when updating an invoice.
"""

import os
import django
import sys

# Set up Django environment
sys.path.append('/home/garagesathi')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'advayCRM.settings')
django.setup()

from GMSApp.models import relInvoiceService, relInvoiceProductCatalogues, Invoice

# Update existing records to have a default quantity of 1
relInvoiceService.objects.filter(quantity__isnull=True).update(quantity=1)

relInvoiceProductCatalogues.objects.filter(quantity__isnull=True).update(quantity=1)

