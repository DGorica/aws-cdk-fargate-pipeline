import ec2 = require("@aws-cdk/aws-ec2");
import ecs = require("@aws-cdk/aws-ecs");
import cdk = require("@aws-cdk/cdk");
import { EcsService } from "./ecs-service";
import { CfnMesh } from "@aws-cdk/aws-appmesh";
import serviced = require("@aws-cdk/aws-servicediscovery");
import { RoutingPolicy } from "@aws-cdk/aws-servicediscovery";

export const clusterName: string = "CDK-ECSCluster";

export class AwsCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Select VPC via tags
    const provider = new ec2.VpcNetworkProvider(this, {
      tags: {
        "tag:State": "Default"
      }
    });
    const vpc = ec2.Vpc.fromVpcAttributes(this, "VPC", provider.vpcProps);

    // Create a service dicovery namespace
    const namespace = new serviced.PrivateDnsNamespace(this, "ServiceMap", {
      vpc,
      name: "Microservices"
    });

    // Create an ECS cluster
    const cluster = new ecs.Cluster(this, clusterName, { vpc });

    // Create an App Mesh
    const mesh = new CfnMesh(this, "AppMesh", {
      meshName: clusterName
    });

    // Create a new service in Cloud Map
    const micromap = new serviced.Service(this, "MicroMap", {
      namespace,
      loadBalancer: true,
      routingPolicy: RoutingPolicy.Weighted
    });

    // Create a new ECS service
    const service = new EcsService(this, "FService", {
      cluster,
      namespace: micromap,
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      serviceName: "MicroUno",
      port: 80
    });
  }
}
