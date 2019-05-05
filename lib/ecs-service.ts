import ecs = require("@aws-cdk/aws-ecs");
import cdk = require("@aws-cdk/cdk");

interface ECSClusterProps {
  clusterImport: ecs.Cluster;
}

export class EcsService extends cdk.Construct {
  // allow access to the cluster props
  public readonly cluster: ecs.Cluster;

  constructor(scope: cdk.Construct, id: string, props: ECSClusterProps) {
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
      // Use an image from DockerHub
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample")
      // ... other options here ...
    });

    // Create service
    const service = new ecs.FargateService(this, "Service", {
      cluster
      taskDefinition: fargateTaskDefinition,
      desiredCount: 3
    });
  }
}
