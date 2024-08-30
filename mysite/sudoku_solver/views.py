import json

from django.contrib.auth.views import LoginView
from django.http import HttpResponseNotAllowed, JsonResponse
from django.shortcuts import redirect
from django.views.generic import TemplateView

from . import solver, sudoku


class LoginPageView(LoginView):
    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect("sudoku-solver:index")
        return super().dispatch(request, *args, **kwargs)


class HomePageView(TemplateView):
    template_name = "index.html"


def solve(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(("POST",))
    data = json.loads(request.body)
    request_board = data.get("board")
    try:
        grid = sudoku.Grid.from_encoded(request_board)
        if solver.Solver(grid).solve_step():
            return JsonResponse({"result": grid.encode()})
        else:
            return JsonResponse({"reason": "No step progress"})
    except sudoku.exceptions.SudokuException as e:
        return JsonResponse({"error": "Bad request", "details": str(e)}, status=400)
