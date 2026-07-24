# Deploy via GitHub OIDC → AWS (Stubbed)

The [`deploy.yml`](../../.github/workflows/deploy.yml) workflow is wired to deploy to AWS using **GitHub OIDC** — a short-lived assumed IAM role, with **no long-lived access keys or secrets**. For this demo repo it is **intentionally stubbed**: it runs on every push to `main` but performs **no AWS calls** until you wire it up. This doc explains the design and exactly how to un-stub it.

## Why OIDC (no static keys)

GitHub Actions can present a signed OIDC token to AWS STS and assume a role you trust. Benefits: no `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` stored in GitHub, credentials are short-lived, and trust is scoped to your specific repo. The workflow declares the token permission:

```yaml
permissions:
  id-token: write   # request the OIDC token
  contents: read
```

## How the stub works

The job has a guard step that checks whether the `AWS_ROLE_ARN` repository variable is set:

- **Not set (default, demo):** a single "stub" step prints what a real deploy *would* do and exits successfully — so `main` stays green and the branch protection's presence of a deploy run is satisfied without touching AWS.
- **Set:** the real steps run — assume the role, log in to ECR, build & push both images, roll the ECS services.

```yaml
- name: Detect AWS wiring
  id: guard
  run: |
    if [ -n "${{ vars.AWS_ROLE_ARN }}" ]; then echo "configured=true"  >> "$GITHUB_OUTPUT";
    else echo "configured=false" >> "$GITHUB_OUTPUT"; fi
# ...real steps use  if: steps.guard.outputs.configured == 'true'
# ...stub step uses   if: steps.guard.outputs.configured == 'false'
```

## Un-stubbing: the checklist

Nothing here is provisioned for the demo — these are the steps a real deployment would need.

### 1. Provision AWS (out of scope for this repo)
- Two **ECR** repositories: `notes-backend`, `notes-frontend`.
- An **ECS** cluster + two services named `notes-backend`, `notes-frontend` (behind a load balancer / the nginx reverse proxy — see [NGINX.md](NGINX.md)).
- An **OIDC provider** for `token.actions.githubusercontent.com` and a deploy **role** (below).

### 2. Create the OIDC deploy role

**Trust policy** — allow this repo's Actions to assume the role:
```json
{
  "Effect": "Allow",
  "Principal": { "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com" },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
    "StringLike":   { "token.actions.githubusercontent.com:sub": "repo:heyitsnatewithwgu/notes_interview_app:*" }
  }
}
```

**Permissions policy** — least privilege for ECR push + ECS roll:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "EcrAuth", "Effect": "Allow", "Action": ["ecr:GetAuthorizationToken"], "Resource": "*" },
    { "Sid": "EcrPush", "Effect": "Allow",
      "Action": ["ecr:BatchCheckLayerAvailability","ecr:GetDownloadUrlForLayer","ecr:BatchGetImage",
                 "ecr:PutImage","ecr:InitiateLayerUpload","ecr:UploadLayerPart","ecr:CompleteLayerUpload"],
      "Resource": ["arn:aws:ecr:*:ACCOUNT_ID:repository/notes-backend",
                   "arn:aws:ecr:*:ACCOUNT_ID:repository/notes-frontend"] },
    { "Sid": "EcsRoll", "Effect": "Allow",
      "Action": ["ecs:UpdateService","ecs:DescribeServices","ecs:DescribeClusters","ecs:RegisterTaskDefinition"],
      "Resource": "*" }
  ]
}
```
`ecr:GetAuthorizationToken` needs `Resource: "*"` (it has no resource scoping); the rest is scoped to this app's repos/services.

### 3. Set the repository variables

Settings → Secrets and variables → Actions → **Variables** (not secrets — OIDC needs no secret keys):

| Variable | Example |
|----------|---------|
| `AWS_ROLE_ARN` | `arn:aws:iam::ACCOUNT_ID:role/github-actions-notes-deploy` |
| `AWS_REGION` | `us-west-2` |
| `AWS_ACCOUNT_ID` | `123456789012` |
| `ECS_CLUSTER` | `notes-prod` |
| `VITE_API_URL` | `https://api.example.com` (baked into the frontend image build) |

Setting `AWS_ROLE_ARN` alone flips the workflow out of stub mode.

### 4. Verify
Push to `main` → the `deploy` job assumes the role, pushes both images, and rolls the ECS services.

## Before a real production deploy

The images/stack still carry the demo caveats: `synchronize: true` (no migrations), no auth, default DB creds. Address these first — see [DEPLOYMENT.md](DEPLOYMENT.md) and [../guides/SECURITY.md](../guides/SECURITY.md).

## Rules
- **Do not modify `deploy.yml`** (or add AWS secrets) without asking. OIDC means there should be **no** `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` secrets in this repo — keep it that way.
