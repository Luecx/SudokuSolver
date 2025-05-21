from pathlib import Path

DEBUG = True

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'pi2jx+*ku8#*+f@v5yd7xe^%7(408vdlfv640oxdthuc!o14s!'
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
DEFAULT_FROM_EMAIL = 'noreply@finnssudokuapp.com'

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_extensions',
    'sudoku',
    'corsheaders',
]

USE_I18N = True
USE_L10N = True
USE_TZ = True

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.locale.LocaleMiddleware',
]

AUTHENTICATION_BACKENDS = [
    'sudoku.auth_backends.EmailOrUsernameBackend',
    'django.contrib.auth.backends.ModelBackend',
]


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.static',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'sudoku' / 'static',
    ]
CSRF_TRUSTED_ORIGINS = ['http://finny.ccrl.live', 'https://finny.ccrl.live']
CORS_ALLOW_ALL_ORIGINS = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
ALLOWED_HOSTS = ['*']
ROOT_URLCONF = 'sudoku_site.urls'

LANGUAGE_CODE = 'en'

from django.utils.translation import gettext_lazy as _

LANGUAGES = [
    ('en', _('English')),
    ('de', _('Deutsch')),
    ('ja', _('日本語')),  # Japanisch
#     ('fr', _('Français')),
#     ('es', _('Español')),
#     ('it', _('Italiano')),
#     ('zh-hans', _('中文 (简体)')),  # Chinesisch (vereinfacht)
#     ('ru', _('Русский')),
#     ('pt-br', _('Português (Brasil)')),
]

LOCALE_PATHS = [BASE_DIR / 'locale']

import os
BASE_DIR = Path(__file__).resolve().parent.parent
LOCALE_PATHS = [os.path.join(BASE_DIR, 'locale')]
