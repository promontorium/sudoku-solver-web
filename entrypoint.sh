#!/bin/sh

# Apply migrations
python manage.py migrate --noinput

# Start Gunicorn
exec gunicorn mysite.wsgi:application --bind 0.0.0.0:8000 --workers 2