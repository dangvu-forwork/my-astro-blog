import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface ContainerServiceStackProps extends cdk.StackProps {
  repositoryName: string;
  imageTag: string;
  desiredCount?: number;
  cpu?: number;
  memoryLimitMiB?: number;
  healthCheckPath?: string;
}

export class ContainerServiceStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: ContainerServiceStackProps) {
    super(scope, id, props);

    const {
      repositoryName,
      imageTag,
      desiredCount = 1,
      cpu = 256,
      memoryLimitMiB = 512,
      healthCheckPath = '/api/health',
    } = props;

    if (!Number.isInteger(desiredCount) || desiredCount < 1) {
      throw new Error('desiredCount must be a positive integer.');
    }

    // Public Fargate tasks avoid NAT gateway costs; their security group only accepts app traffic from the ALB.
    const vpc = new ec2.Vpc(this, 'DevVpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const cluster = new ecs.Cluster(this, 'DevCluster', { vpc });
    const repository = ecr.Repository.fromRepositoryName(this, 'BlogRepository', repositoryName);

    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'BlogService', {
      cluster,
      publicLoadBalancer: true,
      assignPublicIp: true,
      desiredCount,
      cpu,
      memoryLimitMiB,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      taskSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      circuitBreaker: { rollback: true },
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(repository, imageTag),
        containerPort: 4321,
        environment: {
          HOST: '0.0.0.0',
          PORT: '4321',
        },
      },
    });

    service.targetGroup.configureHealthCheck({
      path: healthCheckPath,
      healthyHttpCodes: '200',
    });

    const deployLatestImage = new lambda.Function(this, 'DeployLatestImage', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(30),
      code: lambda.Code.fromInline([
        'import os',
        'import boto3',
        '',
        'ecs = boto3.client("ecs")',
        '',
        'def handler(event, context):',
        '    detail = event["detail"]',
        '    if detail.get("repository-name") != os.environ["ECR_REPOSITORY"] or detail.get("image-tag") != "latest":',
        '        raise ValueError("Event does not describe the configured latest image.")',
        '    print(f"Deploying ECR image {detail.get(\'image-digest\')}")',
        '    ecs.update_service(',
        '        cluster=os.environ["ECS_CLUSTER"],',
        '        service=os.environ["ECS_SERVICE"],',
        '        forceNewDeployment=True,',
        '    )',
      ].join('\n')),
      environment: {
        ECR_REPOSITORY: repositoryName,
        ECS_CLUSTER: cluster.clusterName,
        ECS_SERVICE: service.service.serviceName,
      },
    });

    deployLatestImage.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ecs:UpdateService'],
      resources: [service.service.serviceArn],
    }));

    const latestImagePush = new events.Rule(this, 'DeployOnLatestImagePush', {
      eventPattern: {
        source: ['aws.ecr'],
        detailType: ['ECR Image Action'],
        detail: {
          'action-type': ['PUSH'],
          result: ['SUCCESS'],
          'repository-name': [repositoryName],
          'image-tag': ['latest'],
        },
      },
    });
    latestImagePush.addTarget(new targets.LambdaFunction(deployLatestImage));

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: `http://${service.loadBalancer.loadBalancerDnsName}`,
      description: 'Public URL for the container service',
    });
  }
}
