from GMSApp.models import AuditLog

def create_audit_log(user, action, event, result_code):
    AuditLog.objects.create(
        username=user,
        action=action,
        event=event,
        result_code=result_code
    )  