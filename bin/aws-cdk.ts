#!/usr/bin/env node
import cdk = require("@aws-cdk/cdk");
import "source-map-support/register";
import { AwsCdkStack } from "../lib/aws-cdk-stack";
import { ECSPipelineStack } from "../lib/code_pipeline-stack";

const app = new cdk.App();
const fargatecdk = new AwsCdkStack(app, "CDK-Fargate-Stack");
fargatecdk.node.apply(new cdk.Tag("StackType", "AWS-CDK"));

const pipeline = new ECSPipelineStack(app, "CDK-Pipeline-Stack");
pipeline.node.apply(new cdk.Tag("StackType", "AWS-CDK"));

if (fargatecdk.region !== "au-southeast-2") {
  fargatecdk.node.addError("myStack is not in Sydney");
}
