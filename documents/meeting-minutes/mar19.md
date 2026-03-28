Time: 3:30-5:00 pm

## Agenda

### Containerization Strategy
- Consolidate backend and frontend into a unified local development environment.
- Review `Dockerfile` and `docker-compose.yml` configurations.

## Notes

### Implementation Details
- **Dockerization**: Successfully created `Dockerfile` for both services.
- **Local Orchestration**: `docker-compose.yml` set up to run MongoDB alongside the React frontend and Express backend.
- Port Configuration:
    - Frontend: `5173`
    - Backend: `5000`
- Decision: Use `.dockerignore` to exclude `node_modules` and local artifacts from image builds to keep them slim.
