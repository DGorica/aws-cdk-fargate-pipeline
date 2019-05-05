import ec2 = require("@aws-cdk/aws-ec2");
import { VpcNetwork } from "@aws-cdk/aws-ec2";
import ecr = require("@aws-cdk/aws-ecr");
import ecs = require("@aws-cdk/aws-ecs");
import cdk = require("@aws-cdk/cdk");

const clusterName: string = "FirstCDK-ECSCluster";

export class AwsCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Select VPC via tags
    const provider = new ec2.VpcNetworkProvider(this, {
      tags: {
        "tag:State": "Default"
      }
    });
    const vpc = VpcNetwork.import(this, "VPC", provider.vpcProps);

    // Create an ECR resource and clean-up lifecycle rule
    const repository = new ecr.Repository(this, "ECR");
    repository.addLifecycleRule({ tagPrefixList: ["dev"], maxImageCount: 10 });
    repository.addLifecycleRule({ maxImageAgeDays: 7 });

    // Create an ECS cluster
    const cluster = new ecs.Cluster(this, clusterName, { vpc });

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

    // Setup AutoScaling policy
    const scaling = ecsService1.service.autoScaleTaskCount({ maxCapacity: 3 });
    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 70,
      scaleInCooldownSec: 60,
      scaleOutCooldownSec: 60
    });
    scaling.scaleOnMemoryUtilization("MemoryScaling", {
      targetUtilizationPercent: 50,
      scaleInCooldownSec: 60,
      scaleOutCooldownSec: 60
    });
  }
}
