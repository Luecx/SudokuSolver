from functools import wraps
from django.http import JsonResponse

def login_required_json(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"status": "error", "message": "Authentication required"}, status=403)
        return view_func(request, *args, **kwargs)
    return _wrapped_view
