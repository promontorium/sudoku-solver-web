from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Board(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    board = models.CharField(max_length=323)
    description = models.TextField(blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)
    changed = models.DateTimeField(auto_now=True, null=True)

    def __str__(self) -> str:
        return f"Board of {self.user.username} {self.description}. Created: {self.created}. Changed: {self.changed}"

    class Meta:
        ordering = ["-changed", "created"]
