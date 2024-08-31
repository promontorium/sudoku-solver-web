import json

from django.contrib.auth.views import LoginView
from django.http import HttpRequest, HttpResponseNotAllowed, JsonResponse
from django.shortcuts import redirect
from django.views.generic import TemplateView

from . import solver, sudoku
from .utils import board_utils


class LoginPageView(LoginView):
    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect("sudoku-solver:index")
        return super().dispatch(request, *args, **kwargs)


class HomePageView(TemplateView):
    template_name = "index.html"


def solve(request: HttpRequest):
    if request.method != "POST":
        return HttpResponseNotAllowed(("POST",))
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
