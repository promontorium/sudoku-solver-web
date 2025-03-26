from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser

from . import models, widgets

type User = AbstractBaseUser | AnonymousUser


class SignUpForm(UserCreationForm):
    password1 = forms.CharField(label="Password", widget=widgets.PasswordWidget)
    password2 = forms.CharField(label="Repeat password", widget=widgets.PasswordWidget)

    class Meta:
        model = models.User
        fields = ("username", "email", "password1", "password2")


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
