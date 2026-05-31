import { state, getPlayerStats } from './state';
import { GAME_DATA } from './data';
import { SkillId } from './types';

// Declare window globals for onclick handlers
declare global {
    interface Window {
        startAction: (skillId: string, itemId: string) => void;
        plantSeed: (seedId: string) => void;
        setEnemy: (enemyId: string) => void;
        enterDungeon: (dunId: string) => void;
        sellItem: (key: string, qty: number | 'all') => void;
        buyUpgrade: (upgId: string) => void;
        buyCompanion: (compId: string) => void;
        equipItem: (key: string) => void;
    }
}

export function renderActionLists() {
    const renderList = (skillId: SkillId, containerId: string) => {
        const container = document.getElementById(containerId);
        if(!container) return;
        container.innerHTML = '';
        GAME_DATA[skillId].forEach(act => {
            const unlocked = state.skills[skillId].level >= act.reqLevel;
            const el = document.createElement('div');
            el.className = `action-item ${unlocked ? '' : 'locked'}`;
            el.innerHTML = `
                <div>
                    <h3>${act.name}</h3>
                    <p>Nv. ${act.reqLevel} | ${act.time}s | +${act.xp} XP</p>
                    ${act.reqItem ? `<p style="color:var(--color-hp)">Custo: ${act.reqCost} ${act.reqItem}</p>` : ''}
                </div>
                <button class="action-btn" id="btn-${act.id}" onclick="${skillId==='farming' ? `window.plantSeed('${act.id}')` : `window.startAction('${skillId}', '${act.id}')`}" ${unlocked ? '' : 'disabled'}>
                    ${skillId==='farming' ? 'PLANTAR' : 'INICIAR'}
                </button>
            `;
            container.appendChild(el);
        });
    };
    
    renderList('woodcutting', 'wood-list');
    renderList('mining', 'mine-list');
    renderList('fishing', 'fish-list');
    renderList('cooking', 'cook-list');
    renderList('smithing', 'smith-list');
    if(GAME_DATA.farming) renderList('farming', 'farm-list');
    
    renderSpells();
    
    // Enemies
    const enemyContainer = document.getElementById('enemy-list');
    if(enemyContainer) {
        enemyContainer.innerHTML = '';
        GAME_DATA.enemies.forEach(en => {
            const unlocked = state.skills.combat.level >= en.reqLevel;
            const el = document.createElement('div');
            el.className = `action-item ${unlocked ? '' : 'locked'}`;
            el.innerHTML = `
                <div>
                    <h3>${en.name}</h3>
                    <p>Nv. ${en.reqLevel} | HP: ${en.hp} | Dano: ${en.dmg[0]}-${en.dmg[1]}</p>
                </div>
                <button class="action-btn" onclick="window.setEnemy('${en.id}'); window.startAction('combat', '${en.id}')" ${unlocked ? '' : 'disabled'}>LUTAR</button>
            `;
            enemyContainer.appendChild(el);
        });
    }

    // Dungeons
    if(GAME_DATA.dungeons) {
        const dunContainer = document.getElementById('dungeon-list');
        if(dunContainer) {
            dunContainer.innerHTML = '';
            GAME_DATA.dungeons.forEach(dun => {
                const unlocked = state.skills.combat.level >= dun.reqLevel;
                const el = document.createElement('div');
                el.className = `action-item ${unlocked ? '' : 'locked'}`;
                el.innerHTML = `
                    <div>
                        <h3>🏰 ${dun.name}</h3>
                        <p>Nv. ${dun.reqLevel} | Ondas: ${dun.waves}</p>
                        <p style="color:var(--color-gold)">Prêmio: ${dun.reward}</p>
                    </div>
                    <button class="action-btn" style="background:#b100e8; color:white;" onclick="window.enterDungeon('${dun.id}')" ${unlocked ? '' : 'disabled'}>ENTRAR</button>
                `;
                dunContainer.appendChild(el);
            });
        }
    }
}

export function renderSpells() {
    const container = document.getElementById('spells-container');
    if(!container) return;
    container.innerHTML = '';
    GAME_DATA.magic.forEach(sp => {
        if(state.skills.magic.level >= sp.reqLevel) {
            const cdObj = state.cooldowns[sp.id];
            const isOnCd = cdObj > 0;
            const el = document.createElement('button');
            el.className = `action-btn ${isOnCd ? 'locked' : ''}`;
            el.onclick = () => window.startAction('magic', sp.id);
            el.disabled = isOnCd;
            el.innerHTML = `✨ ${sp.name} <br><small>${isOnCd ? (cdObj/1000).toFixed(1)+'s' : sp.desc}</small>`;
            container.appendChild(el);
        }
    });
}

export function renderCompanions() {
    const container = document.getElementById('companion-shop');
    if(!container) return;
    container.innerHTML = '';
    GAME_DATA.companions.forEach(c => {
        const owned = state.companions.includes(c.id);
        const el = document.createElement('div');
        el.className = `action-item ${owned ? 'locked' : ''}`;
        el.innerHTML = `
            <div>
                <h3>${c.name}</h3>
                <p>${c.desc}</p>
                <p style="color:var(--color-gold)">Custo: ${c.cost}g</p>
            </div>
            <button class="action-btn" onclick="window.buyCompanion('${c.id}')" ${owned ? 'disabled' : ''}>
                ${owned ? 'Comprado' : 'COMPRAR'}
            </button>
        `;
        container.appendChild(el);
    });
}

export function renderMarket() {
    const sellGrid = document.getElementById('market-sell-grid');
    if(sellGrid) {
        sellGrid.innerHTML = '';
        for(let key in state.inventory) {
            if(state.inventory[key] > 0 && GAME_DATA.prices[key]) {
                const price = GAME_DATA.prices[key];
                const div = document.createElement('div');
                div.className = 'inv-slot';
                div.innerHTML = `
                    <span class="inv-name" style="font-size:0.85rem">${key}</span>
                    <span class="inv-qty">${state.inventory[key]}</span>
                    <span style="color:var(--color-gold); font-size:0.8rem">${price}g cada</span>
                    <div class="sell-btn-group">
                        <button class="sell-btn" onclick="window.sellItem('${key}', 1)">Vender 1</button>
                        <button class="sell-btn" onclick="window.sellItem('${key}', 'all')">Tudo</button>
                    </div>
                `;
                sellGrid.appendChild(div);
            }
        }
    }

    const upgGrid = document.getElementById('market-upgrade-grid');
    if(upgGrid) {
        upgGrid.innerHTML = '';
        GAME_DATA.upgrades.forEach(u => {
            const owned = state.upgrades.includes(u.id);
            const el = document.createElement('div');
            el.className = `action-item ${owned ? 'locked' : ''}`;
            el.innerHTML = `
                <div>
                    <h3>${u.name}</h3>
                    <p>${u.desc}</p>
                    <p style="color:var(--color-gold)">Custo: ${u.cost}g</p>
                </div>
                <button class="action-btn" onclick="window.buyUpgrade('${u.id}')" ${owned ? 'disabled' : ''}>
                    ${owned ? 'Comprado' : 'COMPRAR'}
                </button>
            `;
            upgGrid.appendChild(el);
        });
    }
}

export function renderHero() {
    const stats = getPlayerStats();

    const classSel = document.getElementById('class-selection');
    const charStats = document.getElementById('character-stats');
    
    if(state.playerClass === 'none') {
        if(classSel) classSel.style.display = 'block';
        if(charStats) charStats.style.display = 'none';
    } else {
        if(classSel) classSel.style.display = 'none';
        if(charStats) charStats.style.display = 'block';
        
        const title = document.getElementById('char-class-title');
        if(title) {
            if(state.playerClass === 'warrior') title.textContent = '🗡️ Guerreiro';
            if(state.playerClass === 'mage') title.textContent = '🔮 Mago';
            if(state.playerClass === 'rogue') title.textContent = '🥷 Ladino';
        }
        
        const lvl = document.getElementById('char-level');
        if(lvl) lvl.textContent = state.playerLevel.toString();
        
        const elDmg = document.getElementById('hero-dmg');
        const elDef = document.getElementById('hero-def');
        const elLs = document.getElementById('hero-lifesteal');
        const elCr = document.getElementById('hero-crit');
        const elDo = document.getElementById('hero-dodge');
        
        if(elDmg) elDmg.textContent = `${stats.dmgMin}-${stats.dmgMax}`;
        if(elDef) elDef.textContent = `${stats.def}`;
        if(elLs) elLs.textContent = `${(stats.lifesteal * 100).toFixed(0)}`;
        if(elCr) elCr.textContent = `${(stats.critChance * 100).toFixed(0)}`;
        if(elDo) elDo.textContent = `${(stats.dodgeChance * 100).toFixed(0)}`;
    }

    const gearGrid = document.getElementById('equipment-grid');
    if(gearGrid) {
        gearGrid.innerHTML = '';
        
        // Render Active Equipment
        const activeBox = document.createElement('div');
        activeBox.style.background = 'rgba(0,0,0,0.5)';
        activeBox.style.padding = '10px';
        activeBox.style.borderRadius = '5px';
        activeBox.innerHTML = `
            <h4 style="color:var(--color-gold); margin-bottom:10px;">Equipados</h4>
            <div style="margin-bottom:5px;">Arma: <span style="color:#00d2ff">${state.equipment.weapon ? GAME_DATA.gear[state.equipment.weapon].name : 'Nenhuma'}</span></div>
            <div style="margin-bottom:5px;">Armadura: <span style="color:#00d2ff">${state.equipment.armor ? GAME_DATA.gear[state.equipment.armor].name : 'Nenhuma'}</span></div>
            <div>Acessório: <span style="color:#00d2ff">${state.equipment.accessory ? GAME_DATA.gear[state.equipment.accessory].name : 'Nenhum'}</span></div>
        `;
        gearGrid.appendChild(activeBox);
        
        // Render Inventory Gear
        for(let key in state.inventory) {
            if(state.inventory[key] > 0 && GAME_DATA.gear && GAME_DATA.gear[key]) {
                const g = GAME_DATA.gear[key];
                const div = document.createElement('div');
                div.className = 'inv-slot';
                div.style.display = 'flex';
                div.style.flexDirection = 'column';
                div.style.justifyContent = 'space-between';
                div.innerHTML = `
                    <div style="margin-bottom:10px;">
                        <span class="inv-name" style="color:var(--color-gold)">${g.name}</span>
                        <br><small style="color:gray">${g.type === 'weapon' ? 'Dano: ' + g.dmgBonus[0] + '-' + g.dmgBonus[1] : g.type === 'armor' ? 'Def: ' + g.defBonus : 'Acessório'}</small>
                    </div>
                    <button class="sell-btn" onclick="window.equipItem('${key}')">Equipar</button>
                `;
                gearGrid.appendChild(div);
            }
        }
    }
}
