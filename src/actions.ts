import { state, getPlayerStats } from './state';
import { GAME_DATA } from './data';
import { UI, updateInventoryUI, updateLevelUI, updateCombatUI, createFloatingText, playSound } from './ui';
import { renderActionLists, renderMarket, renderHero, renderCompanions, renderSpells } from './render';
import { SkillId } from './types';

export function stopAction() {
    if(state.activeAction) {
        const oldBtn = document.getElementById(`btn-${state.activeAction.id}`);
        if(oldBtn) {
            oldBtn.classList.remove('active');
            oldBtn.textContent = 'INICIAR';
        }
    }
    
    // Clear progress bars
    document.querySelectorAll('.progress-fill').forEach(el => (el as HTMLElement).style.width = '0%');
    document.querySelectorAll('.status-text').forEach(el => el.textContent = 'Inativo');
    
    state.activeAction = null;
    state.actionTimer = 0;
}

export function startAction(skillId: SkillId, itemId: string) {
    if(skillId === 'magic') {
        const sp = GAME_DATA.magic.find(x => x.id === itemId);
        if(!sp) return;
        if(state.mp < sp.manaCost) {
            createFloatingText(`Sem Mana!`, 'player', '#00d2ff');
            return;
        }
        
        state.cooldowns[sp.id] = sp.cooldown * 1000;
        state.mp -= sp.manaCost;
        
        if(sp.effect === 'dmg' && state.combatState.enemyId) {
            state.combatState.enemyHp -= sp.val;
            createFloatingText(`-${sp.val}`, 'enemy', '#ff7b00');
            playSound(UI.sfxMagic);
        } else if(sp.effect === 'heal') {
            state.hp = Math.min(state.maxHp, state.hp + sp.val);
            createFloatingText(`+${sp.val}`, 'player', '#00ff00');
            playSound(UI.sfxMagic);
            updateInventoryUI();
        }
        renderSpells();
        return;
    }

    if(state.activeAction && state.activeAction.id === itemId) {
        stopAction();
        return;
    }

    stopAction();

    state.activeAction = { skill: skillId, id: itemId };
    state.actionTimer = 0;
    
    let itemData;
    if(skillId === 'farming') return;
    
    if(skillId === 'combat') {
        itemData = GAME_DATA.enemies.find(e => e.id === itemId);
        state.actionMaxTime = 2000;
    } else {
        itemData = GAME_DATA[skillId as keyof typeof GAME_DATA].find((i: any) => i.id === itemId);
        state.actionMaxTime = itemData.time * 1000;
    }
    
    state.actionData = itemData;
    
    const newBtn = document.getElementById(`btn-${itemId}`);
    if(newBtn) {
        newBtn.classList.add('active');
        newBtn.textContent = 'PARAR';
    }
}

export function completeActionTick() {
    if(!state.activeAction) return;
    const act = state.activeAction;
    const data = state.actionData;
    
    if(act.skill === 'combat') {
        const stats = getPlayerStats();
        // Player hits
        let isCrit = Math.random() < stats.critChance;
        let baseDmg = Math.floor(Math.random() * (stats.dmgMax - stats.dmgMin + 1)) + stats.dmgMin;
        let dmg = isCrit ? Math.floor(baseDmg * 2.0) : baseDmg;
        state.combatState.enemyHp -= dmg;
        createFloatingText(isCrit ? `CRÍTICO! -${dmg}` : `-${dmg}`, 'enemy', isCrit ? '#ff0000' : 'white');
        playSound(UI.sfxHit);
        
        if (stats.lifesteal > 0 && dmg > 0) {
            let heal = Math.floor(dmg * stats.lifesteal);
            if(heal > 0) {
                state.hp = Math.min(state.maxHp, state.hp + heal);
                createFloatingText(`+${heal}`, 'player', '#00ff00');
            }
        }
        
        // Enemy hits
        if(state.combatState.enemyHp > 0) {
            let dodged = Math.random() < stats.dodgeChance;
            if(dodged) {
                createFloatingText(`ESQUIVA!`, 'player', '#00d2ff');
            } else {
                let rawDmg = Math.floor(Math.random() * (data.dmg[1]-data.dmg[0]+1)) + data.dmg[0];
                let eDmg = Math.max(0, rawDmg - stats.def);
                state.hp -= eDmg;
                if(eDmg > 0) createFloatingText(`-${eDmg}`, 'player', '#ef233c');
            }
        }
        
        if(state.hp <= 30) {
            if(state.inventory['cooked_salmon'] > 0) { state.hp += 50; state.inventory['cooked_salmon']--; }
            else if(state.inventory['cooked_shrimp'] > 0) { state.hp += 20; state.inventory['cooked_shrimp']--; }
            state.hp = Math.min(state.maxHp, state.hp);
        }
        
        if(state.hp <= 0) {
            state.hp = state.maxHp;
            stopAction();
            alert("Você foi derrotado!");
        }
        
        if(state.combatState.enemyHp <= 0) {
            const e = GAME_DATA.enemies.find(x => x.id === state.combatState.enemyId);
            if(e) {
                state.combatState.enemyHp = state.combatState.enemyMaxHp;
                grantXp('combat', e.xp);
                let dropChance = e.lootChance;
                let dropAmount = 1 + (state.upgrades.includes('upg_backpack') ? 1 : 0);
                if(state.upgrades.includes('upg_wealth')) {
                    dropChance += 0.3;
                    dropAmount += 1;
                }

                if(Math.random() <= dropChance) {
                    state.inventory[e.loot] = (state.inventory[e.loot] || 0) + dropAmount;
                }
                
                // 15% de chance de dropar um Equipamento (Arma, Armadura ou Anel) baseado no nível do monstro
                if(Math.random() <= 0.15) {
                    const tier = Math.min(19, Math.floor(e.reqLevel / 4));
                    const gearTypes = ['wep_', 'arm_', 'acc_'];
                    const gType = gearTypes[Math.floor(Math.random() * gearTypes.length)];
                    const gearId = gType + tier;
                    if(GAME_DATA.gear && GAME_DATA.gear[gearId]) {
                        state.inventory[gearId] = (state.inventory[gearId] || 0) + 1;
                        createFloatingText(`Loot Raro!`, 'player', '#b100e8');
                    }
                }
            }
        }
        updateInventoryUI();
        updateCombatUI();
    } else {
        if(data.reqItem) {
            if((state.inventory[data.reqItem] || 0) < (data.reqCost || 1)) {
                stopAction();
                alert(`Falta: ${data.reqItem}`);
                return;
            }
            state.inventory[data.reqItem] -= (data.reqCost || 1);
        }
        
        if(act.skill === 'woodcutting') playSound(UI.sfxChop);
        else if(act.skill === 'mining') playSound(UI.sfxMine);
        
        const baseYield = 1 + (state.upgrades.includes('upg_backpack') ? 1 : 0);
        state.inventory[data.id] = (state.inventory[data.id] || 0) + baseYield;
        
        createFloatingText(`+${baseYield} ${data.name}`, 'center', '#00ff00');
        
        grantXp(act.skill, data.xp);
        updateInventoryUI();
        renderMarket();
        renderHero();
    }
}

export function grantXp(skillId: SkillId, amount: number) {
    const s = state.skills[skillId];
    s.xp += amount;
    const req = s.level * 100;
    if(s.xp >= req) {
        s.xp -= req;
        s.level++;
        createFloatingText(`Level UP! ${skillId} Nv.${s.level}`, 'center', '#b100e8');
        playSound(UI.sfxLevelUp);
        updateLevelUI();
        renderActionLists();
        renderSpells();
    }
}

export function plantSeed(seedId: string) {
    const data = GAME_DATA.farming.find(x => x.id === seedId);
    if(!data) return;
    
    let plotIdx = state.farmPlots.findIndex(p => p === null);
    if(plotIdx === -1) {
        alert("Todos os lotes estão ocupados!");
        return;
    }
    
    state.farmPlots[plotIdx] = {
        seedId: seedId,
        endTime: Date.now() + (data.time * 1000)
    };
    createFloatingText(`Semente plantada!`, 'center', '#00ff00');
}

export function sellItem(key: string, qty: number | 'all') {
    let amount = state.inventory[key] || 0;
    if(amount <= 0) return;
    
    if(qty !== 'all') {
        amount = Math.min(amount, qty as number);
    }
    
    const price = GAME_DATA.prices[key] * amount;
    state.inventory[key] -= amount;
    state.gold += price;
    
    createFloatingText(`+${price}g`, 'center', 'var(--color-gold)');
    playSound(UI.sfxCoin);
    updateInventoryUI();
    renderMarket();
    renderHero();
}

export function buyCompanion(compId: string) {
    const c = GAME_DATA.companions.find(x => x.id === compId);
    if(c && state.gold >= c.cost && !state.companions.includes(compId)) {
        state.gold -= c.cost;
        state.companions.push(compId);
        playSound(UI.sfxCoin);
        updateInventoryUI();
        renderCompanions();
    }
}

export function buyUpgrade(upgId: string) {
    const u = GAME_DATA.upgrades.find(x => x.id === upgId);
    if(u && state.gold >= u.cost && !state.upgrades.includes(upgId)) {
        state.gold -= u.cost;
        state.upgrades.push(upgId);
        playSound(UI.sfxCoin);
        updateInventoryUI();
        renderMarket();
    }
}

export function setEnemy(enemyId: string) {
    const e = GAME_DATA.enemies.find(x => x.id === enemyId);
    if(e) {
        state.combatState = { enemyId: e.id, enemyHp: e.hp, enemyMaxHp: e.hp };
        updateCombatUI();
    }
}

export function enterDungeon(dunId: string) {
    stopAction();
    const dun = GAME_DATA.dungeons.find(d => d.id === dunId);
    if(dun) {
        state.dungeon = { active: true, id: dunId, progress: 0, enemyHp: dun.mobHp, maxHp: dun.mobHp, timer: 0 };
        document.getElementById('dungeon-arena')!.style.display = 'block';
    }
}

export function equipItem(key: string) {
    const g = GAME_DATA.gear[key];
    if(g) {
        if(g.type === 'weapon') state.equipment.weapon = key;
        else if(g.type === 'armor') state.equipment.armor = key;
        else if(g.type === 'accessory') state.equipment.accessory = key;
        
        renderHero();
        createFloatingText(`Equipado!`, 'center', '#b100e8');
    }
}
