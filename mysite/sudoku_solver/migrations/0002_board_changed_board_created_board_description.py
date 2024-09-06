# Generated by Django 5.1 on 2024-09-06 14:40

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sudoku_solver', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='board',
            name='changed',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='board',
            name='created',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='board',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
    ]