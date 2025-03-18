# Node.js tools stage
FROM node:23-alpine AS node-builder
COPY . /app
# Remove typescript related files after compiling
RUN npm install -g typescript && \
    tsc -p /app/mysite/sudoku_solver/static/tsconfig.json && \
    find /app/mysite/sudoku_solver/static -type f -name "*.ts" -delete && \
    rm /app/mysite/sudoku_solver/static/tsconfig.json

# Python builder stage
FROM python:3.13-alpine AS python-builder
# Disable __pycache__ creation since it will not be skipped by .dockerignore x_x
ENV PYTHONDONTWRITEBYTECODE=1
COPY --from=node-builder /app /app
# Also remove requirements file and 'old' static folder
RUN pip install -r /app/requirements.txt && \
    rm /app/requirements.txt && \
    python /app/mysite/manage.py collectstatic --noinput && \
    rm -rf /app/mysite/sudoku_solver/static

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