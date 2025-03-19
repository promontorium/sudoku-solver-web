# Node.js tools stage
FROM node:23-alpine AS node-builder
COPY . /app
RUN npm install -g typescript && \
    tsc -p /app/mysite/sudoku_solver/static/tsconfig.json && \
    find /app/mysite/sudoku_solver/static -type f -name "*.ts" -delete && \
    rm /app/mysite/sudoku_solver/static/tsconfig.json

# Python builder stage
FROM python:3.13-alpine AS python-builder
COPY --from=node-builder /app /app
WORKDIR /app
# Disable __pycache__ creation since it will not be skipped by .dockerignore x_x
ENV PYTHONDONTWRITEBYTECODE=1
# Install globally
ENV UV_PROJECT_ENVIRONMENT=/usr/local
# Get uv from image
COPY --from=ghcr.io/astral-sh/uv:0.6.7-alpine /usr/local/bin/uv /bin/
ARG DJANGO_DEBUG=False
RUN if [ "$DJANGO_DEBUG" = "True" ]; then \
        uv sync --no-dev --frozen --group debug; \
    else \
        uv sync --no-dev --frozen; \
    fi && \
    rm uv.lock pyproject.toml && \
    python mysite/manage.py collectstatic --noinput && \
    rm -rf mysite/sudoku_solver/static

# Final image stage
FROM python:3.13-alpine
# Create non-root user
RUN adduser -D appuser
# Python environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
# Python dependencies from the builder stage
COPY --from=python-builder /usr/local/lib/python3.13/site-packages/ /usr/local/lib/python3.13/site-packages/
COPY --from=python-builder /usr/local/bin/ /usr/local/bin/
# Project files
COPY --from=python-builder --chown=appuser /app /app
# Make entry point executable
RUN chmod +x /app/entrypoint.sh
# Run as non-root user
USER appuser
WORKDIR /app/mysite
EXPOSE 8000
CMD ["/app/entrypoint.sh"]