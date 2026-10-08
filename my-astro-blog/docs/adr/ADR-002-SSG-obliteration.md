# ADR-002: Complete and Total Extermination of Static Site Generation

## Status: Accepted (Date: 2026-10-08)

## Context
As we have successfully transitioned to Server-Side Rendering and container packaging using Docker,
Static Site Generation (and its respective pipeline in .github > workflows) are no longer necessasry.
So, just remove it.

## Decision
We will remove static-deployment.yml under .github > workflows.
Additionally, this ADR file will be made to inform others of the change.

## Consequences
- Positives: Less redundancy, as SSG is a separate pipeline step from backend-deploy.yml that just does nothing.
- Negatives: SSG (Static Site Generation) becomes completely redundant.