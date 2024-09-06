from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.forms import ModelForm

from . import models


class SignUpForm(UserCreationForm):
    # TODO usable_password field
    email = forms.EmailField(required=False)

    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2")


class CreateBoardForm(ModelForm):
    description = forms.CharField(required=True)

    class Meta:
        model = models.Board
        fields = ("description",)

    def save(self, user=None, commit=True):
        board = super().save(commit=False)
        if user:
            board.user = user
        if commit:
            board.save()
        return board
