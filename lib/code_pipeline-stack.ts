import cdk = require("@aws-cdk/cdk");
import codebuild = require("@aws-cdk/aws-codebuild");
import codepipeline = require("@aws-cdk/aws-codepipeline");
import pipeactions = require("@aws-cdk/aws-codepipeline-actions");
import s3 = require("@aws-cdk/aws-s3");
import sns = require("@aws-cdk/aws-sns");
import ecr = require("@aws-cdk/aws-ecr");
import iam = require("@aws-cdk/aws-iam");

export class ECSPipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Artifact bucket
    const artifactBucket = new s3.Bucket(this, "Artifact", {
      versioned: true
    });

    // Create an ECR resource and clean-up lifecycle rule
    const repository = new ecr.Repository(this, "ECR", {
      repositoryName: "basicrepo"
    });
    repository.addLifecycleRule({ tagPrefixList: ["dev"], maxImageCount: 10 });
    repository.addLifecycleRule({ maxImageAgeDays: 7 });

    // Code Build project - Build container and push to repo
    const buildProject = new codebuild.PipelineProject(this, "Build", {
      description: "Build project for the Fargate pipeline",
      environment: {
        buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_NODEJS_10_14_1,
        privileged: true
      },
      buildSpec: {
        version: "0.2",
        phases: {
          install: {
            commands: ["echo Installing source NPM dependencies", "npm install"]
          },
          pre_build: {
            commands: [
              "echo Logging in to Amazon ECR...",
              "$(aws ecr get-login --region $AWS_DEFAULT_REGION --no-include-email)",
              "REPOSITORY_URI=375519225043.dkr.ecr.ap-southeast-2.amazonaws.com/basicrepo",
              "COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)",
              "IMAGE_TAG=${COMMIT_HASH:=latest}"
            ]
          },
          build: {
            commands: [
              "echo Build started on`date`",
              "npm run build",
              "echo Build the image",
              "docker build -t $REPOSITORY_URI:latest .",
              "docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG"
            ]
          },
          post_build: {
            commands: ["echo Build completed on`date`"]
          }
        },
        artifacts: {
          files: ["**/*"]
        }
      }
    });

    const sourceOutput = new codepipeline.Artifact("Source");

    const SourceAction = new pipeactions.S3SourceAction({
      actionName: "Source",
      bucketKey: "app.zip",
      bucket: artifactBucket,
      output: sourceOutput,
      pollForSourceChanges: true
    });

    const BuildAction = new pipeactions.CodeBuildAction({
      actionName: "Build",
      project: buildProject,
      input: sourceOutput
    });

    const ApprovalAction = new pipeactions.ManualApprovalAction({
      actionName: "Approve",
      additionalInformation: "Deployment has been assessed",
      notificationTopic: new sns.Topic(this, "ApprovalTopic", {
        displayName: "ApprovalTopic",
        topicName: "PipelineApproval"
      }),
      notifyEmails: ["EMAIL"]
    });

    /*
    const DeployAction = new codepipeline_actions.EcsDeployAction({
      actionName: "ECSAction",
      service: new ecs.FargateService(this, "Service2", {
        taskDefinition: ,
        assignPublicIp: true,
        cluster: ecs.Cluster.import(this, "cluster", {
          clusterName: "CDK-ECSCluster",
          vpc: ec2.VpcNetworkProvider.name
        })
      })
      imageFile: buildOutput.atPath("imageDef.json")
    });
    */

    const allowECR = new iam.PolicyStatement()
      .addAction("ecr:*")
      .addResource(repository.repositoryArn).allow;

    const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
      pipelineName: "FargatePipeline",
      stages: [
        {
          name: "Source",
          actions: [SourceAction]
        },
        {
          name: "Build",
          actions: [BuildAction]
        },
        {
          name: "Approval",
          actions: [ApprovalAction]
        }
      ]
    });
    //pipeline.addToRolePolicy(allowECR());
  }
}
