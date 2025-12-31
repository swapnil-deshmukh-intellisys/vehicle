import csv
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from GMSApp.modules import managesession
from GMSApp.models import Jobcard


@managesession.check_session_timeout
@require_http_methods(["GET"])
def export_jobcards_csv(request, context):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="jobcards.csv"'
    
    writer = csv.writer(response)
    writer.writerow([
        'Jobcard Number', 'Date', 'Status', 'Customer Name', 'Customer Phone',
        'Vehicle Registration', 'Vehicle Model', 'Supervisor', 'Mechanic',
        'Amount', 'Paid', 'Pending'
    ])
    
    jobcards = Jobcard.objects.filter(garage_id=context['garage_id']).select_related(
        'customer', 'vehicle', 'supervisor'
    ).prefetch_related('jobcard_mechanic__mechanic')
    
    for jobcard in jobcards:
        mechanics = ', '.join([
            f"{m.mechanic.firstname or ''} {m.mechanic.lastname or ''}".strip()
            for m in jobcard.jobcard_mechanic.all() if m.mechanic
        ]) or '-'
        
        supervisor_name = '-'
        if jobcard.supervisor:
            supervisor_name = f"{jobcard.supervisor.firstname or ''} {jobcard.supervisor.lastname or ''}".strip()
        
        writer.writerow([
            jobcard.jobcard_number or '',
            jobcard.current_date or '',
            jobcard.status or '',
            jobcard.customer.name if jobcard.customer else '',
            jobcard.customer.phone if jobcard.customer else '',
            jobcard.vehicle.registration_no if jobcard.vehicle else '',
            jobcard.vehicle.model if jobcard.vehicle else '',
            supervisor_name,
            mechanics,
            getattr(jobcard, 'amount', 0),
            getattr(jobcard, 'paid', 0),
            getattr(jobcard, 'pending', 0)
        ])
    
    return response