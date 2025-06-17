from django.contrib import admin
from django.urls import path, include
from sudoku import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('sudoku.urls')),
    path('i18n/', include('django.conf.urls.i18n')),    # für set_language view
    path('accounts/', include('allauth.urls')),         # for login with...

    path("auth/login/", views.modal_login, name="modal_login"),
    path("auth/register/", views.register, name="modal_register"),
    # path("auth/password_reset/", views.password_reset, name="modal_password_reset"),

]