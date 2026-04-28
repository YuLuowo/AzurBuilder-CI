import path from 'path'
import fs from 'fs/promises'

export type ShipTransInfo = {
    group_id: number;
    skill_id: number;
    skin_id: number;
    transform_list: number[][][];
};

export type ShipTransData = Record<string, ShipTransInfo>;

export async function checkShipTrans(groupType: number): Promise<boolean> {
    const filePath = path.join(process.cwd(), 'data', 'raw', 'ship_data_trans.json')

    try {
        const content = await fs.readFile(filePath, 'utf-8')
        const data: ShipTransData = JSON.parse(content)

        return Object.prototype.hasOwnProperty.call(data, groupType.toString())
    } catch (err) {
        console.error('Error:', err)
        return false
    }
}