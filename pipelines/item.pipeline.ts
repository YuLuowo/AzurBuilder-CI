import fs from "fs/promises";
import path from "path";
import type { Item } from "../types/item.js";
import { prisma } from "../services/database.js";
import { resolveNameCode } from "../utils/resolveNameCode.js";

export async function runItemPipeline() {
    console.log("Start Item Pipeline ...");

    await fetchAndSaveData();
    await saveToDatabase();

    console.log("Done !");
}

async function fetchAndSaveData() {
    const dataPath = path.join(process.cwd(), "data/raw");

    const [statisticJson] =
        await Promise.all([
            fs.readFile(path.join(dataPath, "item_data_statistics.json"), "utf-8"),
        ]);

    const statisticData = JSON.parse(statisticJson) as Record<number, Item>;

    const items = await Promise.all(
        Object.values(statisticData).map(async item => {
            let itemName = item.name;

            if (itemName.includes("namecode")) {
                itemName = await resolveNameCode(item.name);
            }

            return {
                key: `item_${item.id}`,
                id: item.id,
                name: itemName,
                icon: item.icon,
                rarity: item.rarity,
                type: item.type,
            };
        })
    );

    const outputPath = path.join(
        process.cwd(),
        "data/processed/item.json"
    );

    await fs.writeFile(outputPath, JSON.stringify(items, null, 2));
}

async function saveToDatabase() {
    const BATCH_SIZE = 500;

    const filePath = path.join(
        process.cwd(),
        "data/processed/item.json"
    );

    const data = JSON.parse(await fs.readFile(filePath, "utf-8"));

    try {
        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const chunk = data.slice(i, i + BATCH_SIZE);

            await prisma.item.createMany({
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