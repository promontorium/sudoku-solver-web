from django import forms
from django.contrib.auth.forms import AuthenticationForm, PasswordChangeForm, UserCreationForm
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.contrib.auth.password_validation import password_validators_help_text_html

from . import models, widgets

type User = AbstractBaseUser | AnonymousUser


class SignInForm(AuthenticationForm):
    password = forms.CharField(
        strip=False, label="Password", widget=widgets.PasswordWidget(attrs={"autocomplete": "current-password"})
    )


class SignUpForm(UserCreationForm):
    password1 = forms.CharField(
        strip=False,
        label="Password",
        help_text=password_validators_help_text_html(),
        widget=widgets.PasswordWidget(attrs={"autocomplete": "new-password"}),
    )
    password2 = forms.CharField(
        strip=False,
        label="Repeat password",
        help_text="Enter the same password as before, for verification.",
        widget=widgets.PasswordWidget(attrs={"autocomplete": "new-password"}),
    )

    class Meta:
        model = models.User
        fields = ("username", "email", "password1", "password2")


class ChangePasswordForm(PasswordChangeForm):
    old_password = forms.CharField(
        strip=False,
        label="Old password",
        widget=widgets.PasswordWidget(attrs={"autocomplete": "current-password", "autofocus": True}),
    )
    new_password1 = forms.CharField(
        strip=False,
        label="New password",
        help_text=password_validators_help_text_html(),
        widget=widgets.PasswordWidget(attrs={"autocomplete": "new-password"}),
    )
    new_password2 = forms.CharField(
        strip=False,
        label="Repeat password",
        help_text="Enter the same password as before, for verification.",
        widget=widgets.PasswordWidget(attrs={"autocomplete": "new-password"}),
    )


class CreateBoardForm(forms.ModelForm):
    description = forms.CharField(required=True)

    class Meta:
        model = models.Board
        fields = ("description",)

    def save(self, commit: bool = True, user: User | None = None) -> models.Board:
        board = super().save(commit=False)
        if user:
            board.user = user
        if commit:
            board.save()
        return board


class AdminBoardForm(forms.ModelForm):
    class Meta:
        model = models.Board
        fields = "__all__"
        widgets = {"board": widgets.BoardWidget()}
