Time: 3:30-5:00 pm

## Agenda

### Continuous Deployment (CD) Infrastructure
- Planning the transition from basic CI checks to fully automated deployments.
- Discussing the use of GitHub Container Registry (GHCR).

## Notes

### Automated Deployment Strategy
- Decided to implement a CD pipeline that triggers on pushes to `main` and `development`.
- Multi-branch deployments: `main` branch will build production-ready images, while `development` will build images for testing and staging.
- Goal: Minimize manual steps for deployment and ensure environment parity across branches.
