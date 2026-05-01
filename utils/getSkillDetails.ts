import path from 'path';
import fs from 'fs/promises';

export async function getBuffIconById(id: number): Promise<number | null> {
    const dataPath = path.join(process.cwd(), 'data', 'raw');

    const buffJson = await fs.readFile(path.join(dataPath, 'buff.json'), 'utf-8');
    const buffData = JSON.parse(buffJson);

    const key = `buff_${id}`;
    const buff = buffData[key];

    if (!buff || typeof buff.icon !== 'number') return 0;

    return buff.icon;
}