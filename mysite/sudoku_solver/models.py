from django.contrib.auth.models import User
from django.db import models


class Board(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    board = models.CharField(max_length=323)
    description = models.TextField(blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)
    changed = models.DateTimeField(auto_now=True, null=True)

    def __str__(self):
        return f"Board of {self.user.username} {self.description}. Created: {self.created}. Changed: {self.changed}"

    class Meta:
        ordering = ["-changed", "created"]
