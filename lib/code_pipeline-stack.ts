import cdk = require("@aws-cdk/cdk");
import codebuild = require("@aws-cdk/aws-codebuild");
import codepipeline = require("@aws-cdk/aws-codepipeline");
import pipeactions = require("@aws-cdk/aws-codepipeline-actions");
import s3 = require("@aws-cdk/aws-s3");
import sns = require("@aws-cdk/aws-sns");
import ecr = require("@aws-cdk/aws-ecr");

export class ECSPipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const artifactBucket = new s3.Bucket(this, "Artifact", {
      bucketName: "fargate-cdk-artifactpipelinebucket"
    });

    const containerRepo = ecr.Repository.import(this, "ECR", {
      repositoryName: "fargate-ecr"
    });

    const buildProject = new codebuild.PipelineProject(this, "Build", {
      description: "Build project for the Fargate pipeline",
      environment: {
        buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_OPEN_JDK_9
      }
    });

    const pushECR = new codebuild.PipelineProject(this, "PushECR", {
      description: "Push to ECR project for Fargate pipeline",
      environment: {
        buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_OPEN_JDK_9
      }
    });

    const sourceOutput = new codepipeline.Artifact("Source");

    const SourceAction = new pipeactions.S3SourceAction({
      actionName: "Source",
      bucketKey: "/file.zip",
      bucket: artifactBucket,
      output: sourceOutput,
      pollForSourceChanges: false
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
      notifyEmails: ["<email>"]
    });

    /*
    const EcrAction = new pipeactions.CodeBuildAction({
      actionName: "PushECR",
      project: pushECR,
      input: BuildAction.outputs
    });

  
    const DeployAction = new codepipeline_actions.EcsDeployAction({
      actionName: "DeployAction",
      service,
      // if your file is called imagedefinitions.json,
      // use the `input` property,
      // and leave out the `imageFile` property
      input: buildOutput,
      // if your file name is _not_ imagedefinitions.json,
      // use the `imageFile` property,
      // and leave out the `input` property
      imageFile: buildOutput.atPath("imageDef.json")
    });
    */

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
  }
}
