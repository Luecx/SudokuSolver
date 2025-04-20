
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm

from django import forms
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth import get_user_model


class UserRegisterForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        help_text="Required. Enter a valid email address."
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("This email address is already in use.")
        return email

UserModel = get_user_model()
class UsernameOrEmailPasswordResetForm(PasswordResetForm):
    email = forms.CharField(  # ← changed from EmailField to CharField
        label="Email or Username",
        max_length=254,
        widget=forms.TextInput(attrs={"autocomplete": "username"}),
    )

    def get_users(self, input_value):
        input_value = input_value.strip()
        return UserModel._default_manager.filter(
            **({'email__iexact': input_value} if '@' in input_value else {'username__iexact': input_value}),
            is_active=True,
    )

    def clean(self):
        cleaned_data = super().clean()
        value = self.cleaned_data.get("email")
        if not list(self.get_users(value)):
            raise forms.ValidationError("No user found with the given email or username.")
        return cleaned_data