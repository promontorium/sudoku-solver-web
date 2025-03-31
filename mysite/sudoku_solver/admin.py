from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from . import forms, models

admin.site.register(models.User, UserAdmin)


@admin.register(models.Board)
class BoardAdmin(admin.ModelAdmin):
    form = forms.AdminBoardForm
    list_display = ("id", "user", "description", "created", "changed")
    list_filter = (("created", admin.DateFieldListFilter), ("changed", admin.DateFieldListFilter))
    search_fields = ("id", "description", "created", "changed")
    list_display_links = ("description",)
