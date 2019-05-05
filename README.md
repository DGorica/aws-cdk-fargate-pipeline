# Project FargateCDK

- Build an ECS Fargate cluster inc all latest feature //Done
- Deploy at least 2 services (Make the ecs service a separate class)
- Deploy App Mesh
- Build a pipeline to test diff deployment methods

## Pipeline Design

- Use git as source
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
