from django.contrib.auth.views import LogoutView
from django.urls import path, reverse_lazy

from . import views

app_name = "sudoku-solver"

urlpatterns = [
    path("", views.HomePageView.as_view(), name="index"),
    path("login/", views.SignInView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(next_page=reverse_lazy("sudoku-solver:index")), name="logout"),
    path("signup/", views.SignUpView.as_view(), name="signup"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change-password"),
    path("boards/", views.BoardList.as_view(), name="board-list"),
    path("boards/create", views.create_board, name="create-board"),
    path("board/<int:board_id>/", views.BoardDetail.as_view(), name="board-detail"),
    path("solve/", views.solve, name="solve"),
    path("board/<int:board_id>/solve/", views.solve, name="solve"),
    path("solve-step/", views.solve_step, name="solve-step"),
    path("board/<int:board_id>/solve-step/", views.solve_step, name="solve-step"),
]
