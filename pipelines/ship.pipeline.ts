import path from "path";
import fs from "fs/promises";
import { resolveNameCode } from "../utils/resolveNameCode.js";
import { checkShipTrans } from "../utils/checkShipTrans.js";
import { prisma } from "../services/database.js";
import type { Ship, ShipEquip, ShipStat } from "../types/ship.js";

export async function runShipPipeline() {
    console.log("Start Ship Pipeline ...");

    await fetchAndSaveData();
    await saveToDatabase();

    console.log("Done !");
}

async function fetchAndSaveData() {
    const dataPath = path.join(process.cwd(), "data/raw");

    const [groupJson, templateJson, statisticsJson, skinJson] =
        await Promise.all([
            fs.readFile(path.join(dataPath, "ship_data_group.json"), "utf-8"),
            fs.readFile(path.join(dataPath, "ship_data_template.json"), "utf-8"),
            fs.readFile(path.join(dataPath, "ship_data_statistics.json"), "utf-8"),
            fs.readFile(path.join(dataPath, "ship_skin_template.json"), "utf-8"),
        ]);

    const groupData = JSON.parse(groupJson) as Record<number, { group_type: number }>;

    const templateData = JSON.parse(templateJson) as Record<number, ShipEquip>;

    const statisticsData = JSON.parse(statisticsJson) as Record<number, ShipStat>;

    const skinData = JSON.parse(skinJson) as Record<number, { painting: string }>;

    const groupTypes = Object.values(groupData).map(
        (ship) => ship.group_type
    );

    const groupToShips: Record<number, number[]> = {};
    Object.values(templateData).forEach((ship) => {
        const shipsInGroup = groupToShips[ship.group_type] ??= [];
        shipsInGroup.push(ship.id);
    });

    const selectedIds = groupTypes
        .map((type) => {
            const ids = groupToShips[type] || [];
            return ids.length >= 2 ? ids[1] : ids[0];
        })
        .filter((id) => id !== undefined);

    const ships = await Promise.all(
        selectedIds.map(async (id) => {
            const shipStat = statisticsData[id];
            const shipEquip = templateData[id];

            if (!shipStat || !shipEquip) return null;

            const resolvedName = await resolveNameCode(shipStat.name);
            const trans = await checkShipTrans(shipEquip.group_type);

            return {
                key: `ship_${id}`,
                name: resolvedName,
                group_type: shipEquip.group_type,
                nationality: shipStat.nationality,
                rarity: shipStat.rarity,
                type: shipStat.type,
                tag_list: shipStat.tag_list,
                painting:
                    skinData[shipStat.skin_id]?.painting || "unknown",
                trans,
                ship_equip: [
                    shipEquip.equip_1,
                    shipEquip.equip_2,
                    shipEquip.equip_3,
                    shipEquip.equip_4,
                    shipEquip.equip_5,
                ],
            } as Ship;
        })
    );

    const finalShips = ships.filter(
        (s): s is Ship => s !== null
    );

    finalShips.sort((a, b) => b.rarity - a.rarity);

    const outputPath = path.join(
        process.cwd(),
        "data/processed/ship.json"
    );

    await fs.writeFile(
        outputPath,
        JSON.stringify(finalShips, null, 2)
    );
}

async function saveToDatabase() {
    const BATCH_SIZE = 500;

    const filePath = path.join(
        process.cwd(),
        "data/processed/ship.json"
    );

    const data = JSON.parse(await fs.readFile(filePath, "utf-8"));

    try {
        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const chunk = data.slice(i, i + BATCH_SIZE);

            await prisma.ship.createMany({
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