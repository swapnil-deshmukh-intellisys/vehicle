from django.shortcuts import render
from GMSApp.modules import templatespath


# custome error handling
def custom_bad_request_view(request, exception):
    return render(request, templatespath.template_error, {'error_msg':'400 Bad Request'})

def custom_permission_denied_view(request, exception=None):
    return render(request, templatespath.template_error, {'error_msg':'403 Permission Denied'})

def custom_page_not_found_view(request, exception=None):
    return render(request, templatespath.template_error, {'error_msg':'404 Page Not Found'})

def custom_error_view(request, exception=None):
    return render(request, templatespath.template_error, {'error_msg':'500 Error'})


# importing modules
from GMSApp.modules.login import *  

from GMSApp.modules.resetpassword import *

from GMSApp.modules.home import * 

from GMSApp.modules.logout import * 

from GMSApp.modules.roles.roles import *

from GMSApp.modules.users.users import *

from GMSApp.modules.userauditlog import *

from GMSApp.modules.transactions.transactions import *
from GMSApp.modules.transactions.invoices import *
from GMSApp.modules.transactions.jobsheets.jobsheet import *
from GMSApp.modules.transactions.jobsheets.jobtype import *
from GMSApp.modules.transactions.jobsheets.servicehistory import *
from GMSApp.modules.transactions.jobsheets.customervoice import *
from GMSApp.modules.transactions.jobsheets.part import *
from GMSApp.modules.transactions.jobsheets.service import *
from GMSApp.modules.transactions.jobsheets.vehicleissue import *
from GMSApp.modules.transactions.jobsheets.vehicledamage import *
from GMSApp.modules.transactions.jobsheets.vehicleaccessories import *
from GMSApp.modules.transactions.jobsheets.payment import *
from GMSApp.modules.transactions.jobsheets.export import *
from GMSApp.modules.transactions.estimates import *
from GMSApp.modules.transactions.services import *
from GMSApp.modules.transactions.payments import *
from GMSApp.modules.transactions.dailyreports import *

from GMSApp.modules.inventory.inventory import *
from GMSApp.modules.inventory.suppliers.suppliers import *
from GMSApp.modules.inventory.currentstock.currentstock import *
from GMSApp.modules.inventory.currentstock.bulkuploadcurrentstock import *
from GMSApp.modules.inventory.stockinward.stockinward import *
from GMSApp.modules.inventory.stockinward.bulkuploadstockinward import *
from GMSApp.modules.inventory.stockoutward.stockoutward import *
from GMSApp.modules.inventory.stockoutward.bulkuploadstockoutward import *
from GMSApp.modules.inventory.categories.categories import *
from GMSApp.modules.inventory.brands.brands import *
from GMSApp.modules.inventory.model.model import *
from GMSApp.modules.inventory.services import *
from GMSApp.modules.inventory.exports import *

from GMSApp.modules.profile.summary import *
from GMSApp.modules.profile.customers import *
from GMSApp.modules.profile.vehicles import *
from GMSApp.modules.profile.amcs import *
from GMSApp.modules.profile.bookings import *

from GMSApp.modules.accounts.garagesummary.garagesummary import *
from GMSApp.modules.accounts.garage.garage import *
from GMSApp.modules.accounts.garage.garageservice import *
from GMSApp.modules.accounts.garage.garagebanner import *
from GMSApp.modules.accounts.garagegroup.garagegroup import *
from GMSApp.modules.accounts.bookings.bookings import *
from GMSApp.modules.accounts.servicetype.servicetype import *
from GMSApp.modules.accounts.service.service import *
from GMSApp.modules.accounts.servicecategory.servicecategory import *
from GMSApp.modules.accounts.city.city import *
from GMSApp.modules.accounts.brand.brand import *
from GMSApp.modules.accounts.cc.cc import *
from GMSApp.modules.accounts.model.model import *
from GMSApp.modules.accounts.accessories.accessories import *
from GMSApp.modules.accounts.banner.banner import *

from GMSApp.modules.staff.staff import *

# Previous code
from GMSApp.modules.mongodbconnection import *
######

# Date Range Session Management
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from datetime import datetime, timedelta

@csrf_exempt
@require_http_methods(["POST"])
def set_date_range(request):
    """Set date range in session"""
    try:
        data = json.loads(request.body)
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date:
            request.session['date_range_start'] = start_date
            request.session['date_range_end'] = end_date
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'error': 'Missing start_date or end_date'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
