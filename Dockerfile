# Use Python base image
FROM python:3.13-slim

# Install Node.js (for TypeScript compilation)
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Install TypeScript globally
RUN npm install -g typescript

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Copy ALL project files
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Compile TypeScript
RUN tsc -p mysite/sudoku_solver/static/tsconfig.json

# Navigate to the subdirectory containing manage.py
WORKDIR /app/mysite

# Collect static files
RUN python manage.py collectstatic --noinput

EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]