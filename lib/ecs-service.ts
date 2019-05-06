import ecs = require("@aws-cdk/aws-ecs");
import cdk = require("@aws-cdk/cdk");
import { ServiceNamespace } from "@aws-cdk/aws-applicationautoscaling";

interface IECSClusterProps {
  clusterImport: ecs.Cluster;
  serviceName: string;
}

export class EcsService extends cdk.Construct {
  // allow access to the cluster props
  public readonly clusterImport: ecs.Cluster;

  constructor(scope: cdk.Construct, id: string, props: IECSClusterProps) {
    super(scope, id);

    // Define Task Def
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TaskDef",
      {
        memoryMiB: "512",
        cpu: "256"
      }
    );

    // Associate container to task def
    const container = fargateTaskDefinition.addContainer("WebContainer", {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      privileged: true,
      hostname: "ServiceName"
    });

    // Create service
    const service = new ecs.FargateService(this, "Service", {
      clusterImport
      taskDefinition: fargateTaskDefinition,
      desiredCount: 3,
      serviceName,
    });
  }
}
