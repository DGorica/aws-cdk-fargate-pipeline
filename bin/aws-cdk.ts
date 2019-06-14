import cdk = require("@aws-cdk/cdk");
import { AwsCdkStack } from "../lib/aws-cdk-stack";
import { ECSPipelineStack } from "../lib/code_pipeline-stack";

const app = new cdk.App();
const fargatecdk = new AwsCdkStack(app, "CDK-Fargate-Stack", {
  env: { region: "ap-southeast-2" }
});

//fargatecdk.node.applyAspect(new cdk.Tag("StackType", "AWS-CDK"));

const pipeline = new ECSPipelineStack(app, "CDK-Pipeline-Stack", {
  env: { region: "ap-southeast-2" }
});
//pipeline.node.applyAspect(new cdk.Tag("StackType", "AWS-CDK"));
