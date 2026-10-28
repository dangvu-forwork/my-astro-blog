# Welcome to your CDK TypeScript project

This project defines the blog's AWS infrastructure with CDK and TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   type-check the project
* `npm run watch`   watch for changes and type-check
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

## Reusable container service stack

`ContainerServiceStack` defines the container website infrastructure as code and can be instantiated with separate settings for development and production:

* A VPC with public subnets and no NAT gateways. The Fargate task receives a public IP; its security group only allows inbound application traffic from the load balancer.
* An internet-facing Application Load Balancer.
* A configurable Fargate service using the specified ECR repository and image tag, desired task count, CPU, and memory.
* An ALB health check on `/api/health` and rollback on failed ECS deployments. Replacements can briefly run a second task to keep the one-task service healthy.

The stack outputs the HTTP website URL as `WebsiteUrl`. The current stack is HTTP-only; add an ACM certificate and HTTPS listener before using it for production.

The `DevVpc`, `DevCluster`, and `BlogService` construct IDs are deliberately stable to preserve the existing `Dev-ContainerStack` CloudFormation logical IDs, including its ALB. Keep those IDs and the stack name unchanged when updating that deployment. CDK updates the existing ALB as part of the same stack; it does not search for or adopt unrelated load balancers.

### One-time account setup

CDK must be bootstrapped once per account and region. From this directory, with AWS credentials for the account configured:

```powershell
npx cdk bootstrap aws://765332975113/us-east-1
```

The GitHub Actions credentials need permission to describe/create the ECR repository and push images. The credentials used for CDK deployment also need permission to manage CloudFormation, IAM roles, VPC networking, ECS, Elastic Load Balancing, Lambda, and EventBridge.

### Deploy an image

The app reads these environment variables when creating the container stack:

| Variable | Purpose | Default |
| --- | --- | --- |
| `CDK_STACK_NAME` | CloudFormation stack name | `Dev-ContainerStack` |
| `ECR_REPOSITORY` | Existing ECR repository name | `dev-server` |
| `IMAGE_TAG` | ECR image tag | `latest` |
| `DESIRED_COUNT` | Number of running Fargate tasks | `1` |
| `CONTAINER_CPU` | CPU units per task | `256` |
| `CONTAINER_MEMORY_MIB` | Memory in MiB per task | `512` |
| `HEALTH_CHECK_PATH` | ALB health check route | `/api/health` |

The stack's service uses the mutable `latest` tag. An EventBridge rule listens for a successful push of that tag and invokes a Lambda function to force a new ECS deployment. ECS starts tasks from the new image, and the ALB routes traffic to the healthy tasks. Older commit-SHA-tagged images remain in ECR for rollback but do not continue receiving traffic.

Run this local build-and-push command from the repository root:

```powershell
$env:AWS_REGION = "us-east-1"
$env:ECR_REPOSITORY = "dev-server"
$env:ECR_REGISTRY = "765332975113.dkr.ecr.us-east-1.amazonaws.com"
$env:IMAGE_TAG = "$(git rev-parse --short HEAD)-$(Get-Date -Format yyyyMMddHHmmss)"

aws ecr get-login-password --region $env:AWS_REGION | docker login --username AWS --password-stdin $env:ECR_REGISTRY

docker buildx build --platform linux/amd64 --push `
  -f my-astro-blog/Dockerfile `
  --tag "$($env:ECR_REGISTRY)/$($env:ECR_REPOSITORY):$($env:IMAGE_TAG)" `
  --tag "$($env:ECR_REGISTRY)/$($env:ECR_REPOSITORY):latest" `
  my-astro-blog
```

The command pushes both a unique tag and `latest` directly to ECR without storing the built image in the local Docker image store. The development GitHub Actions workflow does the same on pushes to the `dev-server` branch. ECR retains the unique tags for older images.

After the updated workflow has pushed a `latest` image, deploy the CDK stack once from this directory to add the ECR push trigger and move the service to `latest`:

```powershell
$env:CDK_STACK_NAME = "Dev-ContainerStack"
$env:IMAGE_TAG = "latest"
npx cdk deploy "$env:CDK_STACK_NAME" --require-approval never
```

For manual rollback, use an earlier unique image tag to update the service's task definition. Keep the stack name unchanged so CDK updates the existing service and load balancer.

To deploy a separate production service, instantiate `ContainerServiceStack` again in `bin/cdk.ts` with a distinct ID and production values, for example:

```ts
new ContainerServiceStack(app, 'Prod-ContainerStack', {
  env: environment,
  repositoryName: 'my-astro-blog',
  imageTag: process.env.IMAGE_TAG || 'latest',
  desiredCount: 2,
  cpu: 512,
  memoryLimitMiB: 1024,
  healthCheckPath: '/api/health',
});
```

In the production workflow, set `CDK_STACK_NAME` to `Prod-ContainerStack` and `ECR_REPOSITORY` to the production repository. Stack names must be valid CloudFormation stack names and unique in the AWS account and region. Changing a deployed stack's ID creates a separate stack; it does not rename or remove the existing one.

### Cost and cleanup

An ALB and a Fargate task incur ongoing charges while deployed. This development stack uses one small task and no NAT gateway, but the ALB and public IPv4 still have costs. During deployments, a second task may briefly run. To remove the development service and its load balancer:

```powershell
$env:CDK_STACK_NAME = "Dev-ContainerStack"
npx cdk destroy "$env:CDK_STACK_NAME"
```
