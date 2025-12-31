from django.shortcuts import redirect
from GMSApp.modules import managesession, audit


def logout(request):      
    # get_session_key
    session = managesession.get_session_key(request)
    useremail = session.get('useremail', None)

    if request.method == 'GET':
        # calling functions
        audit.create_audit_log(useremail, f'USER: {useremail}, {request.method}: {request.path}', 'logout success', 200)
        # clear_all_session
        response = redirect('login')
        response = managesession.clear_all_session(request, response)
        return response 