import { runShipPipeline } from "./ship.pipeline.js";

export async function runMainPipeline() {
    console.log("Running ALL pipelines...\n");

    await runShipPipeline();

    // 未來擴展
    // await runDeployPipeline();

    console.log("\n All pipelines finished");
}