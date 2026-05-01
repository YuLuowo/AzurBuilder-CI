import path from "path";
import fs from "fs/promises";
import type { Ship, ShipTemplate } from "../types/ship.js";
import type { Skills } from "../types/skill.js";
import { resolveNameCode } from "../utils/resolveNameCode.js";
import { getBuffIconById } from "../utils/getSkillDetails.js";
import { checkShipTrans } from "../utils/checkShipTrans.js";
import { prisma } from "../services/database.js";

export async function runSkillPipeline() {
    console.log("Start Ship Skill Pipeline ...");

    await fetchAndSaveData();
    await saveToDatabase();

    console.log("Done !");
}

async function fetchAndSaveData() {
    const dataPath = path.join(process.cwd(), "data/raw");

    const [shipTemplate, skillTemplate, shipProcessedJson] =
        await Promise.all([
            fs.readFile(path.join(dataPath, "ship_data_template.json"), "utf-8"),
            fs.readFile(path.join(dataPath, "skill_data_template.json"), "utf-8"),
            fs.readFile(path.join(process.cwd(), "data/processed/ship.json"), "utf-8"),
        ]);

    const shipJson = JSON.parse(shipTemplate) as Record<string, ShipTemplate>;
    const skillData = JSON.parse(skillTemplate) as Record<string, Skills>;
    const ships: Ship[] = JSON.parse(shipProcessedJson);

    const results = [];

    for (const ship of ships) {
        const matchingShip = Object.values(shipJson).find(
            (item: any) => item.group_type === ship.group_type
        ) as any;

        if (!matchingShip?.buff_list_display?.length) {
            results.push({
                key: `skill_${ship.group_type}`,
                shipName: ship.name,
                group_type: ship.group_type,
                skills: [],
                trans_skills: [],
            });
            continue;
        }

        const skills = await Promise.all(
            matchingShip.buff_list_display.map(async (buffId: number) => {
                const skill = skillData[buffId.toString()];
                if (!skill) return null;

                const icon = getBuffIconById(skill.id);
                if (!icon) return null;

                const name = resolveNameCode(skill.name);

                let desc = !skill.desc_get_add?.length ? skill.desc_get : skill.desc;

                skill.desc_get_add?.forEach(
                    (replacements: [string, string?], index: number) => {
                        const value = replacements[1] || "";
                        desc = desc.replace(new RegExp(`\\$${index + 1}`, "g"), value);
                    }
                );

                desc = await resolveNameCode(desc);

                return { id: skill.id, icon, name, desc };
            })
        );

        const hasTrans = await checkShipTrans(ship.group_type);

        let trans_skills: any[] = [];

        if (hasTrans) {
            const allMatchingShips = Object.entries(shipJson)
                .filter(
                    ([key, item]: any) =>
                        item.group_type === ship.group_type && !key.startsWith("900")
                )
                .map(([, item]) => item);

            const lastShip = allMatchingShips[allMatchingShips.length - 1];

            if (lastShip?.buff_list_display?.length) {
                trans_skills = await Promise.all(
                    lastShip.buff_list_display.map(async (buffId: number) => {
                        const skill = skillData[buffId.toString()];
                        if (!skill) return null;

                        const icon = getBuffIconById(skill.id);
                        if (!icon) return null;

                        const name = resolveNameCode(skill.name);

                        let desc =
                            !skill.desc_get_add?.length ? skill.desc_get : skill.desc;

                        skill.desc_get_add?.forEach(
                            (replacements: [string, string?], index: number) => {
                                const value = replacements[1] || "";
                                desc = desc.replace(
                                    new RegExp(`\\$${index + 1}`, "g"),
                                    value
                                );
                            }
                        );

                        desc = await resolveNameCode(desc);

                        return { id: skill.id, icon, name, desc };
                    })
                );

                trans_skills = trans_skills.filter(Boolean);
            }
        }

        results.push({
            key: `skill_${ship.group_type}`,
            shipName: ship.name,
            group_type: ship.group_type,
            skills: skills.filter(Boolean),
            trans_skills,
        });
    }

    const outputPath = path.join(
        process.cwd(),
        "data/processed/ship-skill.json"
    );

    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
}

async function saveToDatabase() {
    const BATCH_SIZE = 500;

    const filePath = path.join(
        process.cwd(),
        "data/processed/ship-skill.json"
    );

    const data = JSON.parse(await fs.readFile(filePath, "utf-8"));

    try {
        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const chunk = data.slice(i, i + BATCH_SIZE);

            await prisma.shipSkill.createMany({
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