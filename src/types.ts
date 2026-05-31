export type SkillId = 'woodcutting' | 'mining' | 'fishing' | 'cooking' | 'smithing' | 'combat' | 'magic' | 'farming';
export type PlayerClass = 'none' | 'warrior' | 'mage' | 'rogue';

export interface ActionItem {
    id: string;
    name: string;
    time: number; // in seconds
    xp: number;
    reqLevel: number;
    reqItem?: string;
    reqCost?: number;
}

export interface Enemy {
    id: string;
    name: string;
    hp: number;
    dmg: [number, number];
    time: number;
    xp: number;
    reqLevel: number;
    loot: string;
    lootChance: number;
}

export interface Dungeon {
    id: string;
    name: string;
    waves: number;
    mobHp: number;
    mobDmg: [number, number];
    bossHp: number;
    bossDmg: [number, number];
    reqLevel: number;
    reward: string;
}

export interface Gear {
    type: 'weapon' | 'armor' | 'accessory';
    name: string;
    dmgBonus: [number, number];
    defBonus: number;
    hpMult: number;
    mpMult?: number;
    lifesteal?: number; // 0.0 to 1.0
    critChance?: number; // 0.0 to 1.0
    dodgeChance?: number; // 0.0 to 1.0
}

export interface Companion {
    id: string;
    name: string;
    desc: string;
    cost: number;
    dmg: number;
    autoGather?: string;
}

export interface Spell {
    id: string;
    name: string;
    desc: string;
    cooldown: number;
    manaCost: number;
    effect: 'dmg' | 'heal';
    val: number;
    reqLevel: number;
}

export interface GameData {
    woodcutting: ActionItem[];
    mining: ActionItem[];
    fishing: ActionItem[];
    cooking: ActionItem[];
    smithing: ActionItem[];
    farming: ActionItem[];
    enemies: Enemy[];
    dungeons: Dungeon[];
    companions: Companion[];
    upgrades: { id: string; name: string; desc: string; cost: number }[];
    prices: Record<string, number>;
    gear: Record<string, Gear>;
    magic: Spell[];
}

export interface PlayerStats {
    dmgMin: number;
    dmgMax: number;
    def: number;
    hpMult: number;
    mpMult: number;
    lifesteal: number;
    critChance: number;
    dodgeChance: number;
}

export interface FarmPlot {
    seedId: string;
    endTime: number;
}

export interface GameState {
    playerClass: PlayerClass;
    playerLevel: number; // Global Level based on total XP
    gold: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    inventory: Record<string, number>;
    skills: Record<SkillId, { xp: number; level: number }>;
    companions: string[];
    upgrades: string[];
    equipment: {
        weapon: string | null;
        armor: string | null;
        accessory: string | null;
    };
    farmPlots: (FarmPlot | null)[];
    
    // Runtime transient state
    dungeon: {
        active: boolean;
        id: string | null;
        progress: number;
        enemyHp: number;
        maxHp: number;
        timer: number;
    };
    activeAction: { skill: SkillId; id: string } | null;
    actionTimer: number;
    actionMaxTime: number;
    actionData: any | null;
    cooldowns: Record<string, number>;
    combatState: {
        enemyId: string | null;
        enemyHp: number;
        enemyMaxHp: number;
    };
}
