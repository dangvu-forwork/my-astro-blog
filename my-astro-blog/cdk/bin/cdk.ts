#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { StaticSiteStack } from '../lib/cdk-stack';
import { ContainerServiceStack } from '../lib/container-service-stack';

const app = new cdk.App();
const environment        = { account: '765332975113', region: 'us-east-1' };

const containerStackName = process.env.CDK_STACK_NAME    || 'Dev-ContainerStack';
const repositoryName     = process.env.ECR_REPOSITORY    || 'dev-server';
const imageTag           = process.env.IMAGE_TAG         || app.node.tryGetContext('imageTag') || 'latest';
const healthCheckPath    = process.env.HEALTH_CHECK_PATH || '/api/health';

const desiredCount       = Number(process.env.DESIRED_COUNT        || 1);
const cpu                = Number(process.env.CONTAINER_CPU        || 256);
const memoryLimitMiB     = Number(process.env.CONTAINER_MEMORY_MIB || 512);

new StaticSiteStack(app, 'Dev-StaticStack', {
  env: environment,
});

new ContainerServiceStack(app, containerStackName, {
  env: environment,
  repositoryName,
  imageTag,
  desiredCount,
  cpu,
  memoryLimitMiB,
  healthCheckPath,
});
