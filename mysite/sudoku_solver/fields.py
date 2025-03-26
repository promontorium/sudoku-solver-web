from typing import Any

from django.forms.fields import CharField

from . import widgets


class PasswordField(CharField):
    def __init__(self, *, widget_attrs: dict[str, Any] | None = None, **kwargs: Any):
        super().__init__(strip=False, widget=widgets.PasswordWidget(attrs=widget_attrs), **kwargs)
