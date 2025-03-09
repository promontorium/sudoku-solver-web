# Stage 1: Build dependencies
FROM python:3.13-slim AS builder

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Install Node.js for TypeScript
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Compile TypeScript
WORKDIR /app
COPY . .
RUN npm install -g typescript && \
    tsc -p mysite/sudoku_solver/static/tsconfig.json

WORKDIR /app/mysite

# Stage 2: Final image
FROM python:3.13-slim

# Copy built dependencies from builder
COPY --from=builder /usr/local /usr/local

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Copy project files
COPY --from=builder /app .

WORKDIR /app/mysite

# Collect static files
RUN python manage.py collectstatic --noinput

# Security: Create user and fix permissions
RUN useradd -m myuser && chown -R myuser /app

# Copy entrypoint.sh and set permissions
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && \
    chown myuser:myuser /entrypoint.sh

# Switch to non-root user
USER myuser

EXPOSE 8000

CMD ["/entrypoint.sh"]