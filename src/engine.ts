import { state } from './state';
import { GAME_DATA } from './data';
import { updateInventoryUI, createFloatingText, playSound, UI } from './ui';
import { completeActionTick, stopAction, grantXp } from './actions';
import { renderSpells } from './render';

let lastTime = 0;

export function gameLoop(time: number) {
    if (!lastTime) lastTime = time;
    const dt = time - lastTime;
    
    // Passive Regen (1% HP and 2% MP per second)
    state.hp = Math.min(state.maxHp, state.hp + (state.maxHp * 0.01 * (dt / 1000)));
    state.mp = Math.min(state.maxMp, state.mp + (state.maxMp * 0.02 * (dt / 1000)));
    
    // Progress Bar
    if (state.activeAction) {
        state.actionTimer += dt;
        
        let modifier = 1.0;
        if(state.upgrades.includes('upg_boots')) modifier *= 0.9;
        if(state.upgrades.includes('upg_astral')) modifier *= 0.85;
        if(state.upgrades.includes('upg_axe') && state.activeAction.skill === 'woodcutting') modifier *= 0.75;
        
        let currentMaxTime = state.actionMaxTime * modifier;
        let progress = (state.actionTimer / currentMaxTime) * 100;
        
        const skill = state.activeAction.skill;
        const bar = document.getElementById(`prog-${skill}`);
        const text = document.getElementById(`status-${skill}`);
        if(bar) {
            bar.style.width = `${Math.min(100, progress)}%`;
            if(text) text.textContent = `Progresso... ${(state.actionTimer/1000).toFixed(1)}s`;
        }
        
        if (state.actionTimer >= currentMaxTime) {
            state.actionTimer = 0;
            completeActionTick();
        }
    }
    
    // Cooldowns
    for(let sp in state.cooldowns) {
        if(state.cooldowns[sp] > 0) {
            state.cooldowns[sp] -= dt;
            if(state.cooldowns[sp] <= 0) {
                state.cooldowns[sp] = 0;
                renderSpells();
            }
        }
    }
    
    // Companions
    state.companions.forEach(cId => {
        const petData = GAME_DATA.companions.find(x => x.id === cId);
        if(!petData) return;
        
        if(cId === 'pet_wolf' && state.combatState.enemyId) {
            if(!state.cooldowns[cId]) state.cooldowns[cId] = 0;
            state.cooldowns[cId] += dt;
            if(state.cooldowns[cId] >= 3000) {
                state.cooldowns[cId] = 0;
                state.combatState.enemyHp -= petData.dmg;
                createFloatingText(`-${petData.dmg}`, 'enemy', '#ff00ff');
            }
        }
        else if(cId === 'pet_golem') {
            if(!state.cooldowns[cId]) state.cooldowns[cId] = 0;
            state.cooldowns[cId] += dt;
            if(state.cooldowns[cId] >= 10000 && petData.autoGather) {
                state.cooldowns[cId] = 0;
                state.inventory[petData.autoGather] = (state.inventory[petData.autoGather] || 0) + 1;
                createFloatingText(`+1 ${petData.autoGather} (Golem)`, 'center', 'gray');
                updateInventoryUI();
            }
        }
    });

    // Regen HP
    if(state.hp < state.maxHp && state.activeAction?.skill !== 'combat' && !state.dungeon.active) {
        state.hp = Math.min(state.maxHp, state.hp + (state.maxHp * 0.05 * (dt/1000)));
        updateInventoryUI();
    }
    
    processDungeon(dt);
    processFarming();
    
    lastTime = time;
    requestAnimationFrame(gameLoop);
}

function processFarming() {
    const now = Date.now();
    for(let i=0; i<state.farmPlots.length; i++) {
        const plot = state.farmPlots[i];
        const el = document.getElementById(`plot-${i+1}`);
        if(!el) continue;
        
        if(!plot) {
            el.innerHTML = `Lote ${i+1}: <span style="color:var(--text-muted)">Vazio</span>`;
        } else {
            const data = GAME_DATA.farming.find(x => x.id === plot.seedId);
            if(!data) continue;

            if(now >= plot.endTime) {
                el.innerHTML = `Lote ${i+1}: <span style="color:#00ff00">PRONTO!</span> <button class="action-btn" onclick="window.harvestSeed(${i}, '${data.id}', ${data.xp})">Colher</button>`;
            } else {
                const left = Math.ceil((plot.endTime - now) / 1000);
                el.innerHTML = `Lote ${i+1}: <span style="color:var(--color-gold)">${data.name}</span> (${left}s)`;
            }
        }
    }
}

// Global harvest function
declare global { interface Window { harvestSeed: (idx: number, seedId: string, xp: number) => void; } }
window.harvestSeed = (idx: number, seedId: string, xp: number) => {
    state.farmPlots[idx] = null;
    let itemId = seedId.replace('seed_', 'crop_');
    state.inventory[itemId] = (state.inventory[itemId] || 0) + 1;
    grantXp('farming', xp);
    updateInventoryUI();
};

function processDungeon(dt: number) {
    if(!state.dungeon.active) return;
    state.dungeon.timer += dt;
    
    const uiArena = document.getElementById('dungeon-arena');
    const dunHp = document.getElementById('bar-dun-enemy-hp');
    const plHp = document.getElementById('bar-dun-player-hp');
    const txt = document.getElementById('dun-status-text');
    
    if(!uiArena || !dunHp || !plHp || !txt) return;

    if(state.dungeon.timer >= 2000) {
        state.dungeon.timer = 0;
        
        const dunData = GAME_DATA.dungeons.find(d => d.id === state.dungeon.id);
        if(!dunData) return;

        let dmg = Math.floor(Math.random() * 5) + 2; 
        state.dungeon.enemyHp -= dmg;
        createFloatingText(`-${dmg}`, 'enemy', 'white');
        playSound(UI.sfxHit);
        
        let eDmg = Math.floor(Math.random() * (dunData.mobDmg[1]-dunData.mobDmg[0]+1)) + dunData.mobDmg[0];
        state.hp -= eDmg;
        createFloatingText(`-${eDmg}`, 'player', '#ef233c');
        
        if(state.hp <= 30) {
            if(state.inventory['cooked_salmon'] > 0) { state.hp += 50; state.inventory['cooked_salmon']--; }
            else if(state.inventory['cooked_shrimp'] > 0) { state.hp += 20; state.inventory['cooked_shrimp']--; }
            state.hp = Math.min(state.maxHp, state.hp);
        }

        if(state.hp <= 0) {
            state.hp = state.maxHp;
            state.dungeon.active = false;
            uiArena.style.display = 'none';
            alert("Você foi expulso da Masmorra!");
        }

        if(state.dungeon.enemyHp <= 0) {
            state.dungeon.progress++;
            if(state.dungeon.progress >= dunData.waves) {
                state.dungeon.active = false;
                uiArena.style.display = 'none';
                state.inventory[dunData.reward] = (state.inventory[dunData.reward] || 0) + 1;
                alert(`Masmorra Concluída! Recompensa: ${dunData.reward}`);
            } else {
                state.dungeon.enemyHp = dunData.mobHp;
                state.dungeon.maxHp = dunData.mobHp;
            }
        }
    }
    
    plHp.style.width = `${(state.hp/state.maxHp)*100}%`;
    dunHp.style.width = `${(state.dungeon.enemyHp/state.dungeon.maxHp)*100}%`;
    txt.textContent = `Onda ${state.dungeon.progress} / 10 | HP Inimigo: ${state.dungeon.enemyHp}`;
}
