import { state } from './state';
import { GAME_DATA } from './data';

export const UI = {
    get gold() { return document.getElementById('res-gold') as HTMLElement; },
    get hp() { return document.getElementById('res-hp') as HTMLElement; },
    get maxHp() { return document.getElementById('res-maxhp') as HTMLElement; },
    get mp() { return document.getElementById('mp-text') as HTMLElement; },
    get mpFill() { return document.getElementById('mp-fill') as HTMLElement; },
    get invGrid() { return document.getElementById('inventory-grid') as HTMLElement; },
    get tabs() { return document.querySelectorAll('.tab-content'); },
    get navBtns() { return document.querySelectorAll('.nav-btn'); },
    
    // Combat
    get playerHpBar() { return document.getElementById('bar-player-hp') as HTMLElement; },
    get enemyHpBar() { return document.getElementById('bar-enemy-hp') as HTMLElement; },
    get statDmg() { return document.getElementById('stat-dmg') as HTMLElement; },
    get enemyName() { return document.getElementById('combat-enemy-name') as HTMLElement; },
    
    // Audio
    get bgm() { return document.getElementById('bgm') as HTMLAudioElement; },
    get sfxChop() { return document.getElementById('sfx-chop') as HTMLAudioElement; },
    get sfxMine() { return document.getElementById('sfx-mine') as HTMLAudioElement; },
    get sfxHit() { return document.getElementById('sfx-hit') as HTMLAudioElement; },
    get sfxCoin() { return document.getElementById('sfx-coin') as HTMLAudioElement; },
    get sfxLevelUp() { return document.getElementById('sfx-levelup') as HTMLAudioElement; },
    get sfxMagic() { return document.getElementById('sfx-magic') as HTMLAudioElement; }
};

export function updateInventoryUI() {
    if(!UI.gold) return; // Wait for DOM load
    UI.gold.textContent = Math.floor(state.gold).toString();
    UI.hp.textContent = Math.floor(state.hp).toString();
    UI.maxHp.textContent = state.maxHp.toString();
    
    if(UI.playerHpBar) {
        UI.playerHpBar.style.width = `${(state.hp / state.maxHp) * 100}%`;
    }
    
    const hpFill = document.getElementById('hp-fill');
    if(hpFill) hpFill.style.width = `${(state.hp / state.maxHp) * 100}%`;

    if(UI.mp) UI.mp.textContent = `${Math.floor(state.mp)}/${state.maxMp}`;
    if(UI.mpFill) UI.mpFill.style.width = `${(state.mp / state.maxMp) * 100}%`;

    UI.invGrid.innerHTML = '';
    for(let key in state.inventory) {
        if(state.inventory[key] > 0) {
            const div = document.createElement('div');
            div.className = 'inv-slot';
            div.innerHTML = `
                <span class="inv-name">${key}</span>
                <span class="inv-qty">${state.inventory[key]}</span>
            `;
            UI.invGrid.appendChild(div);
        }
    }
}

export function updateLevelUI() {
    const setLvl = (id: string, val: number) => {
        const el = document.getElementById(id);
        if(el) el.textContent = `Nível ${val}`;
    };
    
    setLvl('lvl-wood', state.skills.woodcutting.level);
    setLvl('lvl-mine', state.skills.mining.level);
    setLvl('lvl-fish', state.skills.fishing.level);
    setLvl('lvl-cook', state.skills.cooking.level);
    setLvl('lvl-smith', state.skills.smithing.level);
    setLvl('lvl-combat', state.skills.combat.level);
    setLvl('lvl-farm', state.skills.farming.level);
}

export function updateCombatUI() {
    if(!UI.enemyName) return;
    if(state.combatState.enemyId) {
        const en = GAME_DATA.enemies.find(x => x.id === state.combatState.enemyId);
        UI.enemyName.textContent = en ? `👹 ${en.name}` : 'Nenhum Inimigo';
    } else {
        UI.enemyName.textContent = 'Nenhum Inimigo';
    }
    if(UI.enemyHpBar) {
        UI.enemyHpBar.style.width = state.combatState.enemyMaxHp > 0 ? `${(state.combatState.enemyHp / state.combatState.enemyMaxHp) * 100}%` : '0%';
    }
}

export function createFloatingText(text: string | number, type: 'player' | 'enemy' | 'center', color: string) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text.toString();
    el.style.color = color;
    
    if(type === 'player') el.style.left = '20%';
    else if(type === 'enemy') el.style.left = '70%';
    else el.style.left = '50%';
    
    el.style.top = '40%';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

export function playSound(audioEl: HTMLAudioElement) {
    if(audioEl) {
        const clone = audioEl.cloneNode(true) as HTMLAudioElement;
        clone.volume = 0.6;
        clone.play().catch(()=>{});
    }
}
