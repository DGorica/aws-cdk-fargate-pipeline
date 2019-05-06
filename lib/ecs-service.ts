import ecs = require("@aws-cdk/aws-ecs");
import cdk = require("@aws-cdk/cdk");

export interface IECSClusterProps {
  cluster: ecs.Cluster;
  serviceName: string;
}

export class EcsService extends cdk.Construct {
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
      hostname: props.serviceName
    });

    // Create service
    const service = new ecs.FargateService(this, "Service", {
      cluster: props.cluster,
      taskDefinition: fargateTaskDefinition,
      desiredCount: 3,
      serviceName: props.serviceName
    });

    // Setup AutoScaling policy
    const scaling = service.autoScaleTaskCount({ maxCapacity: 3 });
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
