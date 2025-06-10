import os
from pathlib import Path
from django.utils.translation import gettext_lazy as _
from dotenv import load_dotenv
load_dotenv()

# === Base Paths ===
BASE_DIR = Path(__file__).resolve().parent.parent

# === Security & Debug ===
SECRET_KEY    = os.environ.get("DJANGO_SECRET_KEY"   , "pi2jx+*ku8#*+f@v5yd7xe^%7(408vdlfv640oxdthuc!o14s!")
DEBUG         = os.environ.get("DJANGO_DEBUG"        , "True").lower() == "true"
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "*").split(",")

# === Installed Apps ===
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'widget_tweaks',
    'sudoku',
    'corsheaders',
]

# === Middleware ===
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

# === Authentication ===
AUTHENTICATION_BACKENDS = [
    'sudoku.auth_backends.EmailOrUsernameBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# === Templates ===
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
                'sudoku.context_processors.login_form_context',
            ],
        },
    },
]

# === Database ===
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# === Internationalization ===
LANGUAGE_CODE = 'en'

LANGUAGES = [
    ('en', _('English')),
    ('de', _('Deutsch')),
    ('ja', _('日本語')),
    # ('fr', _('Français')),
    # ('es', _('Español')),
    # ('it', _('Italiano')),
    # ('zh-hans', _('中文 (简体)')),
    # ('ru', _('Русский')),
    # ('pt-br', _('Português (Brasil)')),
]

LOCALE_PATHS = [BASE_DIR / 'locale']

USE_I18N = True
USE_L10N = True
USE_TZ   = True

# === Static Files ===
STATIC_URL       = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'sudoku' / 'static']
STATIC_ROOT      = BASE_DIR / 'staticfiles'

# === CORS & CSRF ===
CORS_ALLOW_ALL_ORIGINS = True

CSRF_TRUSTED_ORIGINS = os.environ.get(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    "http://localhost,http://127.0.0.1"
).split(",")

# === Other ===
DEFAULT_AUTO_FIELD  = 'django.db.models.BigAutoField'
LOGIN_REDIRECT_URL  = '/'
LOGOUT_REDIRECT_URL = '/'
ROOT_URLCONF        = 'sudoku_site.urls'


# === EMAIL ===

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

EMAIL_HOST = 'smtp.strato.de'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'noreply@sudokusphere.com'
EMAIL_HOST_PASSWORD = os.environ.get("DJANGO_EMAIL_PASSWORD")
DEFAULT_FROM_EMAIL = 'SudokuSphere <noreply@sudokusphere.com>'

import ssl
import certifi
EMAIL_SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())