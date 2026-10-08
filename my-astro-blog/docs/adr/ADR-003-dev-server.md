# ADR-003: Creation of a Dev Environment

## Status: Accepted (Date: 2026-10-08)

## Context
Well, let's say we are going to do risky and invasive stuff (e.g. editing databases, AWS, CDK, etc.)
We want to test it by publishing to Production, but again, it's deployment. 
If it errors, that will cost us a great amount
So we make a dev server to make sure whatever breaks on it doesnt affect main production.

## Decision
Create a dev branch (dev-server) and its respective deployment workflow (development.yml)
When making new changes, PR exclusively to dev-server branch. When things are good the way they are, PR from dev-server to main.
This keeps main (Production) and dev-server (Development) separate.

## Consequences
- Positives: Separating Production from Development
- Negatives: Extra incurred costs from having to set up 2 simultaneous addresses