import ec2 = require("@aws-cdk/aws-ec2");
import { VpcNetwork } from "@aws-cdk/aws-ec2";
import ecr = require("@aws-cdk/aws-ecr");
import ecs = require("@aws-cdk/aws-ecs");
import cdk = require("@aws-cdk/cdk");
import EcsService from "./ecs-service";

const clusterName: string = "CDK-ECSCluster";

export class AwsCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Select VPC via tags
    const provider = new ec2.VpcNetworkProvider(this, {
      tags: {
        "tag:State": "Default"
      }
    });
    const vpc = VpcNetwork.import(this, "VPC", provider.vpcProps);
    vpc.export();

    // Create an ECR resource and clean-up lifecycle rule
    const repository = new ecr.Repository(this, "ECR", {
      repositoryName: "fargate-ecr"
    });
    repository.addLifecycleRule({ tagPrefixList: ["dev"], maxImageCount: 10 });
    repository.addLifecycleRule({ maxImageAgeDays: 7 });
    repository.export();

    // Create an ECS cluster
    const cluster = new ecs.Cluster(this, clusterName, { vpc });
    cluster.export();

    // Instantiate Amazon ECS Service with an automatic load balancer
    const ecsService1 = new ecs.LoadBalancedFargateService(
      this,
      "FargateService1",
      {
        cluster,
        memoryMiB: "512",
        image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
        createLogs: true,
        publicTasks: true
      }
    );

    // Create a new service
    const service2 = new EcsService(this, "service2", {
      cluster,
      serviceName: "Service2"
    });
  }
}
