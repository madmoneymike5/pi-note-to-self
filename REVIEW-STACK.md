# Review Stack

This repository uses the reviewed immutable commit of the centrally managed review stack.

## What runs where

1. **GitHub Actions (CI):** native repository checks, then OpenGrep, Gitleaks, and Trivy blocking checks.
2. **Weekly/manual security:** TruffleHog scans full history separately.
3. **Advisory review:** Kodus and CodeRabbit can review changes but do not block CI.
4. **Manual review:** Greptile is disabled for automatic review and may be requested after earlier checks pass.

The native bootstrap check currently validates tracked JSON, relative Markdown links, and trailing whitespace. It should be expanded to the project's type, lint, test, and build commands when those commands exist; it must never be replaced with a silent no-op.

## Local commands

```text
python3 scripts/check_repository.py
bash .review-stack/coderabbit-review.sh
```

The CodeRabbit CLI requires its own browser login. This repository stores no review-service credentials.

## CD status

Continuous delivery is not configured yet. The project has no approved package or release artifact. Add publishing only after the release format, registry, permissions, and publication checks are specified.

The weekly TruffleHog workflow is separate from normal pull-request checks.
