import ec2 = require("@aws-cdk/aws-ec2");
import { VpcNetwork } from "@aws-cdk/aws-ec2";
import ecr = require("@aws-cdk/aws-ecr");
import ecs = require("@aws-cdk/aws-ecs");
import cdk = require("@aws-cdk/cdk");
import { EcsService } from "./ecs-service";

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

    // Create an ECS cluster
    const cluster = new ecs.Cluster(this, clusterName, { vpc });
    cluster.export();

    // Create a new service
    const service1 = new EcsService(this, "FService", {
      cluster,
      serviceName: "Service1",
      port: 80
    });
  }
}
