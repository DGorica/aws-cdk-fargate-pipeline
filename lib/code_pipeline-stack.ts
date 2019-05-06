import cdk = require("@aws-cdk/cdk");
import codebuild = require("@aws-cdk/aws-codebuild");
import codepipeline = require("@aws-cdk/aws-codepipeline");
import pipeactions = require("@aws-cdk/aws-codepipeline-actions");
import s3 = require("@aws-cdk/aws-s3");
import sns = require("@aws-cdk/aws-sns");
import ecr = require("@aws-cdk/aws-ecr");
import ecs = require("@aws-cdk/aws-ecs");

export class ECSPipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const artifactBucket = new s3.Bucket(this, "Artifact", {
      versioned: true
    });

    const containerRepo = ecr.Repository.import(this, "ECR", {
      repositoryName: "fargate-ecr"
    });
    const repouri = containerRepo.repositoryUri.toString();

    const buildProject = new codebuild.PipelineProject(this, "Build", {
      description: "Build project for the Fargate pipeline",
      environment: {
        buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_DOCKER_18_09_0
      },
      buildSpec: {
        version: "0.2",
        phases: {
          pre_build: {
            commands: [
              "echo logging in to AWS ECR...",
              "$(aws ecr get -login --no-include-email --region ap-southeast-2)"
            ]
          },
          build: {
            commands: [
              "echo build Docker image on `date`",
              "cd app",
              "DOCKER_BUILDKIT=1 docker build --progress=plain -t go-app:latest .",
              "docker tag go-app:latest $RepoName/go-app:latest"
            ]
          },
          post_build: {
            commands: [
              "echo build Docker image complete`date`",
              "echo push latest Docker images to ECR...",
              "docker push $RepoName/go-app:latest"
            ]
          }
        }
      }
    });

    const sourceOutput = new codepipeline.Artifact("Source");

    const SourceAction = new pipeactions.S3SourceAction({
      actionName: "Source",
      bucketKey: "/app/*",
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
      notifyEmails: ["<email>"]
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
