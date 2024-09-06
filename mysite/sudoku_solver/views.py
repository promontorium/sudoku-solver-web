import json
from typing import Any

from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import LoginView, PasswordChangeView
from django.db.models.query import QuerySet
from django.http import (
    HttpRequest,
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseNotAllowed,
    JsonResponse,
)
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views.generic import FormView, ListView, TemplateView

from . import forms, models, solver, sudoku
from .utils import board_utils


class HomePageView(TemplateView):
    template_name = "index.html"

    def dispatch(self, request: HttpRequest, *args, **kwargs) -> HttpResponse:
        if request.user.is_authenticated:
            return redirect("sudoku-solver:board-list")
        return super().dispatch(request, *args, **kwargs)


class SignInView(LoginView):
    def dispatch(self, request, *args, **kwargs) -> HttpResponse:
        if request.user.is_authenticated:
            return redirect(self.next_page)
        return super().dispatch(request, *args, **kwargs)


class SignUpView(FormView):
    form_class = forms.SignUpForm
    template_name = "registration/signup.html"
    success_url = reverse_lazy("sudoku-solver:index")

    def dispatch(self, request: HttpRequest, *args, **kwargs) -> HttpResponse:
        if request.user.is_authenticated:
            return redirect(self.success_url)
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form) -> HttpResponse:
        user = form.save()
        login(self.request, user)
        return super().form_valid(form)


class ChangePasswordView(PasswordChangeView):
    # TODO login url
    # registration/password_change_form.html
    template_name = "registration/change-password.html"
    success_url = reverse_lazy("sudoku-solver:index")


class BoardList(LoginRequiredMixin, ListView):
    model = models.Board
    template_name = "board-list.html"
    login_url = reverse_lazy("sudoku-solver:login")
    paginate_by = 10
    context_object_name = "board_list"

    def get_queryset(self) -> QuerySet[Any]:
        return models.Board.objects.filter(user=self.request.user)

    def get_context_data(self, **kwargs) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context["form"] = forms.CreateBoardForm()
        return context


class BoardDetail(LoginRequiredMixin, TemplateView):
    template_name = "index.html"
    login_url = reverse_lazy("sudoku-solver:login")

    def get_context_data(self, **kwargs) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        board_id = self.kwargs.get("board_id")
        board = self._get_board(board_id)
        context["board"] = board.board
        return context

    def post(self, request: HttpRequest, *args, **kwargs) -> HttpResponse:
        board_data = self._get_board(kwargs.get("board_id"))
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        request_board = data.get("board")
        if request_board == board_data.board:
            return JsonResponse({}, status=200)
        try:
            board_utils.decode_board(request_board)
        except sudoku.exceptions.SudokuException as e:
            return JsonResponse({"error": str(e)}, status=400)
        board_data.board = request_board
        board_data.save()
        return JsonResponse({}, status=200)

    def _get_board(self, id: int) -> models.Board:
        if self.request.user.is_superuser:
            return get_object_or_404(models.Board, id=id)
        else:
            return get_object_or_404(models.Board, id=id, user=self.request.user)


@login_required(login_url=reverse_lazy("sudoku-solver:login"))
def create_board(request: HttpRequest, *args, **kwargs) -> HttpResponse:
    if request.method != "POST":
        return HttpResponseNotAllowed(("POST",))
    form = forms.CreateBoardForm(request.POST)
    if not form.is_valid():
        return HttpResponseBadRequest("Invalid form data")
    board = form.save(user=request.user)
    return redirect("sudoku-solver:board-detail", board_id=board.id)


@login_required(login_url=reverse_lazy("sudoku-solver:login"))
def solve_step(request: HttpRequest, *args, **kwargs) -> HttpResponse:
    if request.method != "POST":
        return HttpResponseNotAllowed(("POST",))
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    request_board = data.get("board")
    try:
        grid = board_utils.decode_board(request_board)
        if solver.Solver(grid).solve_step():
            return JsonResponse({"result": board_utils.encode_board(grid)})
        else:
            return JsonResponse({"reason": "No step progress"})
    except sudoku.exceptions.SudokuException as e:
        return JsonResponse({"error": str(e)}, status=400)
