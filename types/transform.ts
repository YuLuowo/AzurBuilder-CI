export type ShipTransformStep = {
    descrip: string
    id: number
    level_limit: number
    max_level: number
    name: string
    star_limit: number
    use_gold: number
    use_item: number[][][]
    use_ship: number
}

export type ShipTransInfo = {
    group_id: number;
    skill_id: number;
    skin_id: number;
    transform_list: number[][][];
}