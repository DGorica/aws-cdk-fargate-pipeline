import cdk = require("@aws-cdk/cdk");
import codecommit = require("@aws-cdk/aws-codecommit");
import codebuild = require("@aws-cdk/aws-codebuild");
import codepipeline = require("@aws-cdk/aws-codepipeline");
import pipeactions = require("@aws-cdk/aws-codepipeline-actions");
import s3 = require("@aws-cdk/aws-s3");
import sns = require("@aws-cdk/aws-sns");

export class ECSPipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const artifactBucket = new s3.Bucket(this, "Artifact", {
      bucketName: "cdk-artifactpipelinebucket"
    });

    const repo = new codecommit.Repository(this, "Repository", {
      repositoryName: "FargateECSRepository",
      description: "A fargate deployment."
    });

    const buildProject = new codebuild.PipelineProject(this, "Build", {
      description: "Build project for the Fargate service",
      environment: {
        buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_OPEN_JDK_9
      }
    });

    const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
      pipelineName: "FargatePipeline",
      artifactBucket
    });

    const SourceAction = new pipeactions.CodeCommitSourceAction({
      actionName: "Source",
      branch: "master",
      repository: repo,
      pollForSourceChanges: true,
      output: new codepipeline.Artifact("Test1")
    });

    const BuildAction = new pipeactions.CodeBuildAction({
      actionName: "Build",
      project: buildProject,
      input: ,
    });

    const ApprovalAction = new pipeactions.ManualApprovalAction({
      actionName: "Approve",
      additionalInformation: "Deployment has been assessed",
      notificationTopic: new sns.Topic(this, "ApprovalTopic", {
        displayName: "ApprovalTopic",
        topicName: "PipelineApproval"
      }),
      notifyEmails: ["dnsgorica@gmail.com"]
    });

    /*
    const DeployAction = new pipeactions.EcsDeployAction({
      actionName: "Deploy",
      imageFile:
        service:
    })
    */
    
    // add source stage
    const sourceStage = pipeline
      .addStage({ name: "Source" })
      .addAction(SourceAction);
    // add build stage
    const buildStage = pipeline
      .addStage({ name: "Build" })
      .addAction(BuildAction);
    // add approval stage
    const approvalStage = pipeline
      .addStage({ name: "Approval" })
      .addAction(ApprovalAction);
  }
}
