# Node.js tools stage
FROM node:23-alpine AS node-builder
COPY . /app
RUN npm install -g typescript && \
    tsc -p /app/mysite/sudoku_solver/static/tsconfig.json

# Python builder stage
FROM python:3.13-alpine AS python-builder
COPY --from=node-builder /app /app
RUN pip install -r /app/requirements.txt && \
    python /app/mysite/manage.py collectstatic --noinput

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
# Entry point, set permissions and make it executable
COPY --chown=appuser --chmod=+x entrypoint.sh /entrypoint.sh
# Switch to non-root user
USER appuser
# Run
WORKDIR /app/mysite
EXPOSE 8000
CMD ["/entrypoint.sh"]