import ecs = require("@aws-cdk/aws-ecs");
import cdk = require("@aws-cdk/cdk");
import elbv2 = require("@aws-cdk/aws-elasticloadbalancingv2");

// Interface for public ecs service
export interface IECSClusterProps {
  cluster: ecs.Cluster;
  serviceName: string;
  port: number;
}

export class EcsService extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: IECSClusterProps) {
    super(scope, id);

    // Create an Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, "ALB", {
      vpc: props.cluster.vpc,
      internetFacing: true
    });
    const tg = new elbv2.ApplicationTargetGroup(this, "default", {
      vpc: props.cluster.vpc,
      port: props.port,
      targetType: elbv2.TargetType.Ip,
      healthCheck: {
        path: "/",
        port: props.port.toString(),
        protocol: elbv2.Protocol.Http,
        intervalSecs: 60,
        timeoutSeconds: 5
      }
    });
    const listener = alb.addListener("Listen", {
      port: props.port
    });
    listener.addTargetGroups("TG", {
      targetGroups: [tg]
    });

    // create a task definition with CloudWatch Logs
    const logging = new ecs.AwsLogDriver(this, "AppLogging", {
      streamPrefix: "webapp"
    });

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
    const container = fargateTaskDefinition
      .addContainer("WebContainer", {
        image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
        logging
      })
      .addPortMappings({
        containerPort: 80,
        hostPort: 80,
        protocol: ecs.Protocol.Tcp
      });

    // Create service
    const service = new ecs.FargateService(this, "Service", {
      cluster: props.cluster,
      assignPublicIp: true,
      taskDefinition: fargateTaskDefinition,
      desiredCount: 2,
      serviceName: props.serviceName
    });

    tg.addTarget(service);

    // Setup AutoScaling policies
    const scaling = service.autoScaleTaskCount({ maxCapacity: 4 });
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
    scaling.scaleOnRequestCount("CountScaling", {
      requestsPerTarget: 100,
      targetGroup: tg
    });

    // Output the DNS where you can access your service
    // tslint:disable-next-line: no-unused-expression
    new cdk.CfnOutput(this, "loadbalancerDNS", { value: alb.dnsName });
  }
}
