import path from "path";
import fs from "fs/promises";
import type { Ship } from "../types/ship.js";
import type {
    ShipTransformStep,
    ShipTransInfo,
} from "../types/transform.js";
import { checkShipTrans } from "../utils/checkShipTrans.js";
import { prisma } from "../services/database.js";

export async function runTransformPipeline() {
    console.log("Start Ship Transform Pipeline ...");

    await fetchAndSaveData();
    await saveToDatabase();

    console.log("Done !");
}

async function fetchAndSaveData() {
    const dataPath = path.join(process.cwd(), "data/raw");

    const [transShipJsonRaw, transformJsonRaw, shipProcessedJson] =
        await Promise.all([
            fs.readFile(path.join(dataPath, "ship_data_trans.json"), "utf-8"),
            fs.readFile(path.join(dataPath, "transform_data_template.json"), "utf-8"),
            fs.readFile(path.join(process.cwd(), "data/processed/ship.json"), "utf-8"),
        ]);

    const transShipJson = JSON.parse(transShipJsonRaw) as Record<string, ShipTransInfo>;
    const transformJson = JSON.parse(transformJsonRaw) as Record<string, ShipTransformStep>;

    const ships: Ship[] = JSON.parse(shipProcessedJson);
    const results = [];

    for (const ship of ships) {

        const hasTrans = await checkShipTrans(ship.group_type);

        if (!hasTrans) {
            results.push({
                key: `transform_${ship.group_type}`,
                shipName: ship.name,
                transforms: [],
            });
            continue;
        }

        const shipTrans = transShipJson[ship.group_type.toString()];

        if (
            !shipTrans ||
            !shipTrans.transform_list ||
            shipTrans.transform_list.length === 0
        ) {
            results.push({
                key: `transform_${ship.group_type}`,
                shipName: ship.name,
                transforms: [],
            });
            continue;
        }

        const transformIds = shipTrans.transform_list.flatMap((step) =>
            step.map((pair) => pair[1])
        );

        const transformDetails: ShipTransformStep[] = transformIds
            .filter((id): id is number => id !== undefined)
            .map((id) => transformJson[id.toString()])
            .filter((data): data is ShipTransformStep => data !== undefined)
            .map((data) => ({
                descrip: data.descrip,
                id: data.id,
                level_limit: data.level_limit,
                max_level: data.max_level,
                name: data.name,
                star_limit: data.star_limit,
                use_gold: data.use_gold,
                use_item: data.use_item,
                use_ship: data.use_ship,
            }));

        results.push({
            key: `transform_${ship.group_type}`,
            shipName: ship.name,
            transforms: transformDetails,
        });
    }

    const outputPath = path.join(
        process.cwd(),
        "data/processed/ship-transform.json"
    );

    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
}

async function saveToDatabase() {
    const BATCH_SIZE = 500;

    const filePath = path.join(
        process.cwd(),
        "data/processed/ship-transform.json"
    );

    const data = JSON.parse(await fs.readFile(filePath, "utf-8"));

    try {
        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const chunk = data.slice(i, i + BATCH_SIZE);

            await prisma.shipTransform.createMany({
                data: chunk,
                skipDuplicates: true,
            });
        }
    } catch (error) {
        console.log(error);
    } finally {
        await prisma.$disconnect();
        console.log("Finished saving to database.");
    }
}