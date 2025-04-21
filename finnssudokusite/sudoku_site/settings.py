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
    'sudoku',
]
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
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
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
ALLOWED_HOSTS = ['*']
ROOT_URLCONF = 'sudoku_site.urls'
