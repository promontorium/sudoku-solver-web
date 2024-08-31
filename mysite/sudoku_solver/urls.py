from django.contrib.auth import views as auth_views
from django.urls import path

from . import views

app_name = "sudoku-solver"

urlpatterns = [
    path("", views.HomePageView.as_view(), name="index"),
    path("login/", views.LoginPageView.as_view(next_page="sudoku-solver:index"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(next_page="sudoku-solver:index"), name="logout"),
    path("signup/", views.SignUpView.as_view(), name="signup"),
    path("solve-step/", views.solve_step, name="solve-step"),
]
