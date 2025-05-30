from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('django.contrib.auth.urls')),  # login/logout
    path('', include('sudoku.urls')),
    path('i18n/', include('django.conf.urls.i18n')),  # für set_language view
#     path('accounts/', include('allauth.urls')),
]