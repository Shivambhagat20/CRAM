Time: 3:30-5:00 pm

## Agenda

### Implementing the CD Pipeline
- Finalize the `cd.yml` workflow for GitHub Actions.
- Ensure cross-repo secrets are properly configured.

## Notes

### CD Workflow Finalized
- GitHub Actions workflow now correctly logs into GHCR, builds backend/frontend images, and pushes them with appropriate tags.
- Secrets handling: Configured `secrets.MONGO_URI` and `secrets.SESSION_SECRET` for the environment.
- Multi-branch support confirmed for `main` and `development`.
- Monitoring: Pipeline alerts enabled for build failures to ensure stability.
