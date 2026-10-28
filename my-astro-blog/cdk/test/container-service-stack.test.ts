import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ContainerServiceStack } from '../lib/container-service-stack';

test('creates a public ALB and configurable healthy Fargate service', () => {
  const app = new cdk.App();
  const stack = new ContainerServiceStack(app, 'TestContainerServiceStack', {
    env: { account: '765332975113', region: 'us-east-1' },
    repositoryName: 'test-repository',
    imageTag: 'test-image-tag',
    desiredCount: 2,
    cpu: 512,
    memoryLimitMiB: 1024,
    healthCheckPath: '/custom-health',
  });
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Scheme: 'internet-facing',
    Type: 'application',
  });
  expect(Object.keys(template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer')))
    .toContain('BlogServiceLB2819D33B');
  expect(Object.keys(template.findResources('AWS::EC2::VPC')))
    .toContain('DevVpc4A77049E');

  template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
    HealthCheckPath: '/custom-health',
    Matcher: { HttpCode: '200' },
  });

  template.hasResourceProperties('AWS::ECS::Service', {
    DesiredCount: 2,
    LaunchType: 'FARGATE',
  });

  template.hasResourceProperties('AWS::ECS::TaskDefinition', {
    Cpu: '512',
    Memory: '1024',
    RequiresCompatibilities: ['FARGATE'],
    ContainerDefinitions: Match.arrayWith([Match.objectLike({ Image: Match.anyValue() })]),
  });

  const synthesizedTemplate = JSON.stringify(template.toJSON());
  expect(synthesizedTemplate).toContain('test-repository');
  expect(synthesizedTemplate).toContain('test-image-tag');

  template.hasResourceProperties('AWS::Events::Rule', {
    EventPattern: {
      source: ['aws.ecr'],
      'detail-type': ['ECR Image Action'],
      detail: {
        'action-type': ['PUSH'],
        result: ['SUCCESS'],
        'repository-name': ['test-repository'],
        'image-tag': ['latest'],
      },
    },
  });

  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'python3.12',
    Code: {
      ZipFile: Match.stringLikeRegexp('forceNewDeployment=True'),
    },
  });

  template.hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: 'ecs:UpdateService',
          Effect: 'Allow',
        }),
      ]),
    },
  });
});
