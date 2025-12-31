from GMSApp.models import Jobcard


def get_or_create_jobcard(jobcard_number, context):
    check_jobcard = Jobcard.objects.filter(jobcard_number=jobcard_number, garage_id=context['garage_id']).first()    
    if check_jobcard:
        jobcard_id = check_jobcard.id
    else:
        # Create a new jobcard
        jobcard = Jobcard.objects.create(
            garage_id=context['garage_id'],
            jobcard_number=jobcard_number,
            created_by_id=context['userid']
        )
        jobcard_id = jobcard.id    
    return jobcard_id