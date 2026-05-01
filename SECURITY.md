# Security policy

## Reporting a vulnerability

Email security disclosures privately to the maintainer; do not file
public issues for security findings. Acknowledgement within 72 hours.

## Threat model

- **Browser-trust:** the bearer token reaches the browser via build-time
  `VITE_ANALYTICS_TOKEN`. In production, replace this with a per-user
  short-lived token issued by the tenant SSO; do not bake long-lived
  tokens into the bundle.
- **CORS:** the analytics service must allowlist this origin via
  `ANALYTICS_CORS_ORIGINS`.
- **No PII:** the dashboard only renders what the analytics API
  returns — pillar scores, finding messages, repo names. Do not add
  client-side storage of anything richer.

## Out of scope

- DoS, abuse-rate-limiting — handled by the API ingress.
- Token issuance — out of scope for this repo; coordinate with the
  tenant identity provider.
