export type Skills = {
    id: number
    icon: number
    name: string
    desc: string
    desc_get: string
    desc_get_add: [string, string?][]
}

export type SkillsResponse = {
    shipName: string;
    group_type: number;
    skills: Skills[];
    trans_skills: Skills[];
}