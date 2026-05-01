import { runShipPipeline } from "./ship.pipeline.js";
import { runSkillPipeline } from "./skill.pipeline.js";
import { runTransformPipeline } from "./transform.pipeline.js";
import { runEquipmentPipeline } from "./equipment.pipeline.js";
import { runItemPipeline } from "./item.pipeline.js";

export async function runMainPipeline() {
    console.log("Running ALL pipelines...\n");

    await runShipPipeline();
    await runSkillPipeline();
    await runTransformPipeline();
    await runEquipmentPipeline();
    await runItemPipeline();

    console.log("\n All pipelines finished");
}