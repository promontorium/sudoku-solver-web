import json

from django.contrib.auth import login
from django.contrib.auth.views import LoginView
from django.http import HttpRequest, HttpResponse, HttpResponseNotAllowed, JsonResponse
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views.generic import FormView, TemplateView

from . import forms, solver, sudoku
from .utils import board_utils


class HomePageView(TemplateView):
    template_name = "index.html"


class LoginPageView(LoginView):
    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect(self.next_page)
        return super().dispatch(request, *args, **kwargs)


class SignUpView(FormView):
    form_class = forms.SignUpForm
    template_name = "registration/signup.html"
    success_url = reverse_lazy("sudoku-solver:index")

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect(self.success_url)
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form) -> HttpResponse:
        user = form.save()
        login(self.request, user)
        return super().form_valid(form)


def solve_step(request: HttpRequest):
    if request.method != "POST":
        return HttpResponseNotAllowed(("POST",))
    # TODO handle exception
    data = json.loads(request.body)
    request_board = data.get("board")
    try:
        grid = board_utils.decode_board(request_board)
        if solver.Solver(grid).solve_step():
            return JsonResponse({"result": board_utils.encode_board(grid)})
        else:
            return JsonResponse({"reason": "No step progress"})
    except sudoku.exceptions.SudokuException as e:
        return JsonResponse({"error": "Bad request", "details": str(e)}, status=400)
