# Node.js tools stage
FROM node:23-alpine3.20 AS node-builder
WORKDIR /build
RUN npm install -g typescript
COPY mysite/sudoku_solver/static/tsconfig.json .
COPY mysite/sudoku_solver/static/ts ts
RUN tsc -b

# Python builder stage
FROM python:3.13.2-alpine3.21 AS python-builder
WORKDIR /app
# Disable __pycache__ \ install packages globally
ENV PYTHONDONTWRITEBYTECODE=1 \
    UV_PROJECT_ENVIRONMENT=/usr/local
RUN apk add --no-cache uv
COPY . .
COPY --from=node-builder /build/js mysite/sudoku_solver/static/js
ARG DJANGO_DEBUG
RUN rm -rf mysite/sudoku_solver/static/tsconfig.json mysite/sudoku_solver/static/ts && \
    uv sync ${DJANGO_DEBUG:+--group debug} --no-dev --frozen && \
    python mysite/manage.py collectstatic --noinput && \
    rm -rf uv.lock pyproject.toml mysite/sudoku_solver/static

# Final image stage
FROM python:3.13.2-alpine3.21
# Python environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
# Create non-root user
RUN adduser -D appuser
# Dependencies and Project files
COPY --from=python-builder /usr/local/lib/python3.13/site-packages/ /usr/local/lib/python3.13/site-packages/
COPY --from=python-builder /usr/local/bin/ /usr/local/bin/
COPY --from=python-builder --chown=appuser /app /app
# Make entry point executable and switch to non-root user
RUN chmod +x /app/entrypoint.sh
USER appuser
WORKDIR /app/mysite
EXPOSE 8000
CMD ["/app/entrypoint.sh"]