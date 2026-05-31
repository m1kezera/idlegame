import { GameState, PlayerStats, SkillId } from './types';
import { GAME_DATA } from './data';

export const state: GameState = {
    playerClass: 'none',
    playerLevel: 1,
    gold: 0,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    inventory: {},
    skills: {
        woodcutting: { xp: 0, level: 1 },
        mining: { xp: 0, level: 1 },
        fishing: { xp: 0, level: 1 },
        cooking: { xp: 0, level: 1 },
        smithing: { xp: 0, level: 1 },
        combat: { xp: 0, level: 1 },
        magic: { xp: 0, level: 1 },
        farming: { xp: 0, level: 1 }
    },
    companions: [],
    upgrades: [],
    equipment: {
        weapon: null,
        armor: null,
        accessory: null
    },
    farmPlots: [null, null],
    
    dungeon: { active: false, id: null, progress: 0, enemyHp: 0, maxHp: 0, timer: 0 },
    activeAction: null,
    actionTimer: 0,
    actionMaxTime: 0,
    actionData: null,
    cooldowns: {},
    combatState: { enemyId: null, enemyHp: 0, enemyMaxHp: 0 }
};

export function getPlayerStats(): PlayerStats {
    let stats: PlayerStats = {
        dmgMin: 1 + Math.floor(state.playerLevel / 2),
        dmgMax: 3 + Math.floor(state.playerLevel / 2),
        def: 0 + Math.floor(state.playerLevel / 4),
        hpMult: 1.0,
        mpMult: 1.0,
        lifesteal: 0.0,
        critChance: 0.0,
        dodgeChance: 0.0
    };
    
    // Equipments
    const weapon = state.equipment.weapon ? GAME_DATA.gear[state.equipment.weapon] : null;
    const armor = state.equipment.armor ? GAME_DATA.gear[state.equipment.armor] : null;
    const accessory = state.equipment.accessory ? GAME_DATA.gear[state.equipment.accessory] : null;
    
    [weapon, armor, accessory].forEach(g => {
        if(g) {
            stats.dmgMin += g.dmgBonus[0];
            stats.dmgMax += g.dmgBonus[1];
            stats.def += g.defBonus;
            stats.hpMult *= g.hpMult;
            if(g.mpMult) stats.mpMult *= g.mpMult;
            if(g.lifesteal) stats.lifesteal += g.lifesteal;
            if(g.critChance) stats.critChance += g.critChance;
            if(g.dodgeChance) stats.dodgeChance += g.dodgeChance;
        }
    });

    // Class Passives
    if(state.playerClass === 'warrior') {
        stats.hpMult *= 1.2; // +20% HP
        stats.dmgMin += 2;
        stats.dmgMax += 2;
    } else if(state.playerClass === 'mage') {
        stats.mpMult *= 1.5; // +50% Mana
    } else if(state.playerClass === 'rogue') {
        stats.critChance += 0.10; // +10% Crit
        stats.dodgeChance += 0.10; // +10% Dodge
    }

    // Apply multiplier to MaxHP and MaxMP
    state.maxHp = Math.floor(100 * stats.hpMult + (state.playerLevel * 5));
    state.maxMp = Math.floor(50 * stats.mpMult + (state.playerLevel * 2));
    
    // Bound current HP/MP
    state.hp = Math.min(state.hp, state.maxHp);
    state.mp = Math.min(state.mp, state.maxMp);

    return stats;
}

export function recalculateGlobalLevel() {
    let totalXp = 0;
    for(let k in state.skills) {
        totalXp += state.skills[k as SkillId].xp;
        let lvXp = 0;
        for(let i=1; i<state.skills[k as SkillId].level; i++) {
            lvXp += i * 100;
        }
        totalXp += lvXp;
    }
    // Simple global level formula based on total XP
    state.playerLevel = Math.max(1, Math.floor(Math.sqrt(totalXp / 50)));
}
