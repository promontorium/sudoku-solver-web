import json
from typing import Any

from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import LoginView, PasswordChangeView
from django.db.models.query import QuerySet
from django.http import HttpRequest, HttpResponse, HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views import generic
from django.views.decorators.http import require_http_methods

from . import forms, mixins, models
from .solver import BruteForcer, Solver, SolverException, StepSolver
from .sudoku import SudokuException
from .utils import board_utils


class HomePageView(mixins.RedirectAuthenticatedMixin, generic.TemplateView):
    template_name = "index.html"
    authenticated_url = reverse_lazy("sudoku-solver:board-list")


class SignInView(LoginView):
    form_class = forms.SignInForm
    next_page = reverse_lazy("sudoku-solver:index")
    redirect_authenticated_user = True


class ChangePasswordView(PasswordChangeView):
    form_class = forms.ChangePasswordForm
    success_url = reverse_lazy("sudoku-solver:index")


class SignUpView(mixins.RedirectAuthenticatedMixin, generic.FormView):
    form_class = forms.SignUpForm
    template_name = "registration/signup.html"
    success_url = reverse_lazy("sudoku-solver:index")
    authenticated_url = success_url

    def form_valid(self, form: forms.SignUpForm) -> HttpResponse:
        login(self.request, form.save())
        return super().form_valid(form)


class BoardList(LoginRequiredMixin, generic.ListView):
    model = models.Board
    template_name = "board-list.html"
    paginate_by = 10
    # context_object_name = "board_list"

    def get_queryset(self) -> QuerySet[models.Board]:
        return models.Board.objects.filter(user=self.request.user)

    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context["create_board_form"] = forms.CreateBoardForm()
        return context


class BoardDetail(LoginRequiredMixin, generic.TemplateView):
    template_name = "index.html"

    def get_context_data(self, **kwargs: Any) -> dict[str, str]:
        context = super().get_context_data(**kwargs)
        board_id = self.kwargs.get("board_id")
        board = self._get_board(board_id)
        context["board"] = board.board
        return context

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        board_id = kwargs.get("board_id")
        if not isinstance(board_id, int):
            return JsonResponse({"error": f"incorrect board id {board_id}"}, status=400)
        board_data = self._get_board(board_id)
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        request_board = data.get("board")
        if request_board == board_data.board:
            return JsonResponse({"detail": "no changes"}, status=200)
        try:
            board_utils.decode_board(request_board)
        except SudokuException as e:
            return JsonResponse({"error": str(e)}, status=400)
        board_data.board = request_board
        board_data.save()
        return JsonResponse({"detail": "saved"}, status=200)

    def _get_board(self, id: int) -> models.Board:
        if self.request.user.is_superuser:
            return get_object_or_404(models.Board, id=id)
        return get_object_or_404(models.Board, id=id, user=self.request.user)


@login_required()
@require_http_methods(["POST"])
def create_board(request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
    form = forms.CreateBoardForm(request.POST)
    if not form.is_valid():
        return HttpResponseBadRequest("Invalid form data")
    board = form.save(user=request.user)
    return redirect("sudoku-solver:board-detail", board_id=board.id)


@login_required()
@require_http_methods(["POST"])
def solve_step(request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
    return _solve_helper(StepSolver, request)


@login_required()
@require_http_methods(["POST"])
def solve(request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
    return _solve_helper(BruteForcer, request)


def _solve_helper(solver_class: type[Solver], request: HttpRequest) -> JsonResponse:
    try:
        grid = board_utils.decode_board(json.loads(request.body).get("board"))
        if solver_class(grid).solve():
            return JsonResponse({"result": board_utils.encode_board(grid)})
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except (SudokuException, SolverException) as e:
        return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"reason": "No solution found"})
