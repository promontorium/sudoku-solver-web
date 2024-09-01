from django.contrib.auth import views as auth_views
from django.urls import path

from . import views

app_name = "sudoku-solver"

urlpatterns = [
    path("", views.HomePageView.as_view(), name="index"),
    path("login/", views.SignInView.as_view(next_page="sudoku-solver:index"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(next_page="sudoku-solver:index"), name="logout"),
    path("signup/", views.SignUpView.as_view(), name="signup"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change-password"),
    path("solve-step/", views.solve_step, name="solve-step"),
]
