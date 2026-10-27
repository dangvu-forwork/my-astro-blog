import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';

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
    const vpc = new ec2.Vpc(this, 'ServiceVpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const cluster = new ecs.Cluster(this, 'ServiceCluster', { vpc });
    const repository = ecr.Repository.fromRepositoryName(this, 'AppRepository', repositoryName);

    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'AppService', {
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

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: `http://${service.loadBalancer.loadBalancerDnsName}`,
      description: 'Public URL for the container service',
    });
  }
}
