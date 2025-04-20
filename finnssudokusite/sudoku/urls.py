from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
from sudoku.forms import UsernameOrEmailPasswordResetForm
from django.urls import reverse_lazy

urlpatterns = [
    # Core views
    path('', views.index, name='index'),
    path('puzzles/', views.puzzles_view, name='puzzles'),
    path('profile/', views.profile, name='profile'),
    path('register/', views.register, name='register'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    path('creator/', views.creator, name='creator'),

    # Activation
    path('activate/<uid>/<token>/', views.activate, name='activate'),

    # Authentication
    path('login/', auth_views.LoginView.as_view(
        template_name='sudoku/login.html'
    ), name='login'),

    path('logout/', auth_views.LogoutView.as_view(), name='logout'),

    # Password Reset Workflow
    path('password_reset/', auth_views.PasswordResetView.as_view(
        template_name='sudoku/password_reset.html',
        form_class=UsernameOrEmailPasswordResetForm,
        email_template_name='sudoku/password_reset_email.html',
        subject_template_name='sudoku/password_reset_subject.txt',
        success_url=reverse_lazy('password_reset_done'),
    ), name='password_reset'),

    path('password_reset_done/', auth_views.PasswordResetDoneView.as_view(
        template_name='sudoku/password_reset_done.html'
    ), name='password_reset_done'),

    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(
        template_name='sudoku/password_reset_confirm.html',
        success_url=reverse_lazy('password_reset_complete'),
    ), name='password_reset_confirm'),

    path('reset_done/', auth_views.PasswordResetCompleteView.as_view(
        template_name='sudoku/password_reset_complete.html'
    ), name='password_reset_complete'),
]
