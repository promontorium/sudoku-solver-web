## Sudoku Solver Web App

### Technologies Used
- Python
- Django
- PostgreSQL
- TypeScript
- Docker & Docker Compose

### .env file example
```dosini
DJANGO_SECRET_KEY=your-key...
DJANGO_ALLOWED_HOSTS=localhost
DJANGO_DEBUG=False

POSTGRES_ENGINE=django.db.backends.postgresql
POSTGRES_HOST=postgres-db
POSTGRES_PORT=5432
POSTGRES_DB=mydb
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
```

### docker-compose.override.yml
For debugging. VS Code laucnch config example:
```json
{
    "name": "Docker: Debug Django",
    "type": "debugpy",
    "request": "attach",
    "connect": {
        "host": "localhost",
        "port": 5678,
    },
    "pathMappings": [
        {
            "localRoot": "${workspaceFolder}/mysite",
            "remoteRoot": "/app/mysite",
        }
    ]
}
```

## Implemented Strategies
- Basic Strategies
    - Naked Subsets
        - Naked Single
        - Naked Pair
        - Naked Triple
        - Naked Quadruple
    - Hidden Subsets
        - Hidden Single
        - Hidden Pair
        - Hidden Triple
        - Hidden Quadruple
    - Intersections
        - Pointing Pair
        - Pointing Triple
        - Box/Line Reduction
- Basic Fish
    - X-Wing
    - Swordfish
    - Jellyfish
    - Squirmbag
    - Whale
    - Leviathan
- Wings
    - Y-Wing/XY-Wing
    - XYZ-Wing
- Coloring
    - Single Chain/Simple Coloring
- Chains and Loops
    - X-Chain