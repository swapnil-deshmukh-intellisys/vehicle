from django.shortcuts import render
from GMSApp.modules import templatespath, managesession, audit
from GMSApp.models import Customer


@managesession.check_session_timeout
def r_prf_summary(request, context):
    if request.method == 'GET':
        # Fetch Customer with combined filters
        customer_objs = Customer.objects.filter(garage_id=context['garage_id']).order_by('-created_at')        
        # Get count of matched customers
        context['customer_count'] = customer_objs.count()
        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_prf_summary', 200)
        return render(request, templatespath.template_r_prf_summary, context)