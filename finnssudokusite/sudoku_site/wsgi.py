"""
WSGI config for sudoku_site project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see:
https://docs.djangoproject.com/en/stable/howto/deployment/wsgi/
"""

import os
from django.core.wsgi import get_wsgi_application

# Set the default settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sudoku_site.settings')

application = get_wsgi_application()
