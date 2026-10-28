# ADR-004: Revival of SSG

## Status: Accepted (Date: 2026-10-28)

## Context
Unfortunately, the DevOps project requires us to have both SSG and SSR. So unfortunately we must bring the static site back from the dead. As a separate deployment this time, I assume.

## Decision
Well, unfortunately, Static Site Generation and Server-Side Rendering cannot co-exist together without massively configuring everything again, unless they are separated into different folders or put under the same folder... just renamed to know which is which.
This just adds extra operational complexity, and while it is generally true that a blog should just be statically generated, having it be Server-Side Rendered is more flexible as you can add more features such as logins, comments, communities, etc. Therefore, the old static site generation workflow on GitHub will just be rerun, and this website will continue to remain Server-Side Rendered. No one would probably complain if a random blog made by some random kid took like 2 more seconds to load.
Refer to (Fix29/cd broken (#32) #7) if anyone want to know the workflow that has been run.

## Consequences
- Positives: Faster load time? Less calculation?
- Negatives: Small overhead cost, absolute redundancy could possibly be an issue.