from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.forms import ModelForm

from . import models, widgets


class SignUpForm(UserCreationForm):
    # TODO usable_password field
    email = forms.EmailField(required=False)

    class Meta:
        model = models.User
        fields = ("username", "email", "password1", "password2")


class CreateBoardForm(ModelForm):
    description = forms.CharField(required=True)

    class Meta:
        model = models.Board
        fields = ("description",)

    def save(self, commit: bool = True, user: AbstractBaseUser | AnonymousUser | None = None) -> models.Board:
        board = super().save(commit=False)
        if user:
            board.user = user
        if commit:
            board.save()
        return board


class AdminBoardForm(ModelForm):
    class Meta:
        model = models.Board
        fields = "__all__"
        widgets = {"board": widgets.BoardWidget()}
