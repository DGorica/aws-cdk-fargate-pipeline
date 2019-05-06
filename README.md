# Project FargateCDK

- Build an ECS Fargate cluster
- Deploy a new defined service construct
- Deploy App Mesh
- Build a pipeline to test diff deployment methods
- Enable monitoring / Increase resiliance

## Pipeline Design

- Use S3 as source
- Build container image, scan and push to ECR
- Build Fargate cluster
- Deploy first service and test endpoint
- Deploy second service in a controlled way and test endpoint
- Send notification to admin

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
