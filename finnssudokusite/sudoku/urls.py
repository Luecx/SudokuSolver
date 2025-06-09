"""
urls.py

Defines URL routes for the Sudoku web application.

The application is organized into the following functional groups:
- Core views: Main game, puzzle list, user profiles, registration
- Help: Static help/info pages
- Activation: Email-based user activation
- Authentication: Login/logout and password reset flows
- State management: Saving and loading ongoing and completed game states

Each path is named for reverse resolution in templates and views.
"""

from django.urls import path, reverse_lazy
from django.contrib.auth import views as auth_views
from sudoku.forms import UsernameOrEmailPasswordResetForm
from . import views as views
from sudoku.views.contact import kontaktformular_view

urlpatterns = [
    # --- Core Views ---
    path(''                             , views.index               , name='index'),
    path('creator/'                     , views.creator             , name='creator'),
    path('game/'                        , views.game                , name='game'),
    path('game_selection/'              , views.game_selection_view , name='game_selection'),
    path('leaderboard/'                 , views.leaderboard         , name='leaderboard'),
    path('play-sudoku/<int:sudoku_id>/' , views.play_sudoku         , name='play_sudoku'),
    path('profile/'                     , views.profile             , name='profile'),
    path('puzzles/'                     , views.puzzles_view        , name='puzzles'),
    path('register/'                    , views.register            , name='register'),
    path('save-sudoku/'                 , views.save_sudoku         , name='save_sudoku'),
    path('user/<str:username>/'         , views.user_profile        , name='user_profile'),

    # --- Help ---
    path('help/', views.help, name='help'),

    # --- Activation ---
    path('activate/<uid>/<token>/', views.activate, name='activate'),

    # --- Authentication ---
    path('login/', auth_views.LoginView.as_view(
        template_name='sudoku/login/login.html'
    ), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),

    # --- Password Reset Workflow ---
    path('password_reset/', auth_views.PasswordResetView.as_view(
        template_name='sudoku/password/password_reset.html',
        form_class=UsernameOrEmailPasswordResetForm,
        email_template_name='sudoku/password/password_reset_email.html',
        subject_template_name='sudoku/password/password_reset_subject.txt',
        success_url=reverse_lazy('password_reset_done'),
    ), name='password_reset'),
    path('password_reset_done/', auth_views.PasswordResetDoneView.as_view(
        template_name='sudoku/password/password_reset_done.html'
    ), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(
        template_name='sudoku/password/password_reset_confirm.html',
        success_url=reverse_lazy('password_reset_complete'),
    ), name='password_reset_confirm'),
    path('reset_done/', auth_views.PasswordResetCompleteView.as_view(
        template_name='sudoku/password/password_reset_complete.html'
    ), name='password_reset_complete'),

    # --- State Management ---
    path('complete/'                        , views.mark_sudoku_completed   , name='mark_sudoku_completed'),
    path('has-solved/<int:sudoku_id>/'      , views.has_solved              , name='has_solved'),
    path('load-state/<int:sudoku_id>/'      , views.load_puzzle_state       , name='load_puzzle_state'),  # legacy
    path('ongoing-state/<int:sudoku_id>/'   , views.get_ongoing_state       , name='get_ongoing_state'),
    path('save-ongoing/'                    , views.save_ongoing_state      , name='save_ongoing_state'),

    path("kontakt/", kontaktformular_view, name="kontaktformular"),
]

