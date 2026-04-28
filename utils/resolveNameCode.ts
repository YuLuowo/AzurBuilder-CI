import path from 'path'
import fs from 'fs/promises'

type NameCodeEntry = {
    code: string
    id: number
    name: string
    nation: number
    type: number
}

type NameCodeCache = Record<string, NameCodeEntry>

let cache: NameCodeCache | null = null

export async function resolveNameCode(text: string): Promise<string> {
    try {
        if (!cache) {
            const dataPath = path.join(process.cwd(), 'data', 'raw', 'name_code.json')
            const json = await fs.readFile(dataPath, 'utf-8')
            cache = JSON.parse(json) as NameCodeCache
        }

        return text.replace(/{namecode:(\d+)}/g, (_, id: string) => {
            return cache?.[id]?.name || `{namecode:${id}}`
        })
    } catch (error) {
        console.error('Error loading name_code.json:', error)
        return text
    }
}

