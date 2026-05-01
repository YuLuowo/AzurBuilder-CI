import fs from "fs/promises";
import path from "path";
import type { EquipStat, EquipTemplate } from "../types/equipment.js";
import { prisma } from "../services/database.js";

export async function runEquipmentPipeline() {
    console.log("Start Equipment Pipeline ...");

    await fetchAndSaveData();
    await saveToDatabase();

    console.log("Done !");
}

async function fetchAndSaveData() {
    const dataPath = path.join(process.cwd(), "data/raw");

    const [templateJson, statisticsJson] =
        await Promise.all([
            fs.readFile(path.join(dataPath, "equip_data_template.json"), "utf-8"),
            fs.readFile(path.join(dataPath, "equip_data_statistics.json"), "utf-8"),
        ]);

    const templateData = JSON.parse(templateJson) as Record<number, EquipTemplate>;
    const statisticsData = JSON.parse(statisticsJson) as Record<number, EquipStat>;

    const filteredEquips = Object.values(templateData).filter(
        (equip) => equip.group !== undefined
    );

    const equipsWithDetails = filteredEquips
        .filter((equip) => equip !== null)
        .map((equip) => {
            const equipStats = statisticsData[equip.id];
            if (!equipStats) return null;

            return {
                key: `equip_${equip.id}`,
                name: equipStats.name,
                type: equipStats.type,
                rarity: equipStats.rarity,
                nationality: equipStats.nationality,
                icon: equipStats.icon,
            };
        })
        .filter((e): e is NonNullable<typeof e> => e !== null)
        .sort((a, b) => (b.rarity ?? 0) - (a.rarity ?? 0));

    const outputPath = path.join(
        process.cwd(),
        "data/processed/equipment.json"
    );

    await fs.writeFile(outputPath, JSON.stringify(equipsWithDetails, null, 2));
}

async function saveToDatabase() {
    const BATCH_SIZE = 500;

    const filePath = path.join(
        process.cwd(),
        "data/processed/equipment.json"
    );

    const data = JSON.parse(await fs.readFile(filePath, "utf-8"));

    try {
        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const chunk = data.slice(i, i + BATCH_SIZE);

            await prisma.equipment.createMany({
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