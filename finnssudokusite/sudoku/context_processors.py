from django.contrib.auth.forms import AuthenticationForm

def login_form_context(request):
    return {'login_form': AuthenticationForm(request)}
