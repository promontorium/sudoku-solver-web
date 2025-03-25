from typing import Any, Callable, Protocol

from django.core.exceptions import ImproperlyConfigured
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect

type Url = str | Callable[..., Any] | SupportsGetAbsoluteUrl


# reverse lazy uls
class SupportsGetAbsoluteUrl(Protocol):
    def get_absolute_url(self) -> str: ...


class RedirectAuthenticatedMixin:
    authenticated_url: Url

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        if request.user.is_authenticated:
            return redirect(self._get_url())
        return super().dispatch(request, *args, **kwargs)  # type: ignore

    def _get_url(self) -> Url:
        if not self.authenticated_url:
            raise ImproperlyConfigured("No URL to redirect to. Provide a authenticated_url.")
        return self.authenticated_url
