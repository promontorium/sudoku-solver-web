from django import forms
from django.contrib.auth.forms import AuthenticationForm, PasswordChangeForm, UserCreationForm
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.contrib.auth.password_validation import password_validators_help_text_html
from django.core.validators import RegexValidator

from . import fields, models, widgets

type User = AbstractBaseUser | AnonymousUser


class SignInForm(AuthenticationForm):
    password = fields.PasswordField(label="Password", widget_attrs={"autocomplete": "current-password"})


class SignUpForm(UserCreationForm):
    password1 = fields.PasswordField(
        label="Password", help_text=password_validators_help_text_html(), widget_attrs={"autocomplete": "new-password"}
    )
    password2 = fields.PasswordField(
        label="Repeat password",
        help_text="Enter the same password as before, for verification.",
        widget_attrs={"autocomplete": "new-password"},
    )

    class Meta:
        model = models.User
        fields = ("username", "email", "password1", "password2")


class ChangePasswordForm(PasswordChangeForm):
    old_password = fields.PasswordField(
        label="Old password", widget_attrs={"autocomplete": "current-password", "autofocus": True}
    )
    new_password1 = fields.PasswordField(
        label="New password",
        help_text=password_validators_help_text_html(),
        widget_attrs={"autocomplete": "new-password"},
    )
    new_password2 = fields.PasswordField(
        label="Repeat password",
        help_text="Enter the same password as before, for verification.",
        widget_attrs={"autocomplete": "new-password"},
    )


class CreateBoardForm(forms.ModelForm):
    description = forms.CharField(required=True)
    board = forms.CharField(
        required=True, validators=[RegexValidator(regex=r"^\d{81}$", message="Board must be exactly 81 digits (0-9).")]
    )

    class Meta:
        model = models.Board
        fields = ("description", "board")


class AdminBoardForm(forms.ModelForm):
    class Meta:
        model = models.Board
        fields = "__all__"
        widgets = {"board": widgets.BoardWidget()}
