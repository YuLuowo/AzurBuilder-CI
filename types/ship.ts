export type Ship = {
    key: string;
    name: string;
    group_type: number;
    nationality: number;
    rarity: number;
    type: number;
    tag_list: string[];
    painting: string;
    trans: boolean;
    ship_equip: number[][];
};

export type ShipTemplate = {
    id: number
    group_type: number
    buff_list_display?: number[] | undefined
}

export type ShipStat = {
    name: string;
    skin_id: number;
    nationality: number;
    rarity: number;
    type: number;
    tag_list: string[];
};

export type ShipEquip = {
    id: number;
    group_type: number;
    equip_1: number[];
    equip_2: number[];
    equip_3: number[];
    equip_4: number[];
    equip_5: number[];
};