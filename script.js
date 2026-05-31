let state = {
    gold: 0,
    hp: 100, maxHp: 100,
    inventory: {
        wood: 0, oak: 0, magic_wood: 0,
        copper_ore: 0, iron_ore: 0, mithril_ore: 0,
        raw_shrimp: 0, raw_salmon: 0,
        cooked_shrimp: 0, cooked_salmon: 0,
        copper_bar: 0, iron_bar: 0
    },
    skills: {
        woodcutting: { xp: 0, level: 1 },
        mining: { xp: 0, level: 1 },
        fishing: { xp: 0, level: 1 },
        cooking: { xp: 0, level: 1 },
        smithing: { xp: 0, level: 1 },
        combat: { xp: 0, level: 1 },
        magic: { xp: 0, level: 1 }
    },
    companions: [], // ['pet_wolf']
    upgrades: [], // ['upg_backpack']
    activeAction: null,
    actionTimer: 0, actionMaxTime: 0, actionData: null,
    
    combatState: {
        enemyId: 'goblin', enemyHp: 30, enemyMaxHp: 30
    },
    
    cooldowns: { spell_fireball: 0, spell_heal: 0 },
    petTimers: {}
};

// UI Elements mapping
const UI = {
    gold: document.getElementById('res-gold'),
    hp: document.getElementById('res-hp'), maxHp: document.getElementById('res-maxhp'),
    invGrid: document.getElementById('inventory-grid'),
    tabs: document.querySelectorAll('.tab-content'),
    navBtns: document.querySelectorAll('.nav-btn'),
    // Combat
    playerHpBar: document.getElementById('bar-player-hp'),
    enemyHpBar: document.getElementById('bar-enemy-hp'),
    statDmg: document.getElementById('stat-dmg'),
    enemyName: document.getElementById('combat-enemy-name'),
    // Audio
    bgm: document.getElementById('bgm'),
    sfxChop: document.getElementById('sfx-chop'),
    sfxMine: document.getElementById('sfx-mine'),
    sfxHit: document.getElementById('sfx-hit')
};

// --- Initialization ---
function init() {
    renderActionLists();
    renderCompanions();
    renderMarket();
    updateInventoryUI();
    updateLevelUI();
    requestAnimationFrame(gameLoop);
}

// --- Navigation ---
UI.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        UI.navBtns.forEach(b => b.classList.remove('active'));
        UI.tabs.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.target}`).classList.add('active');
    });
});

document.getElementById('btn-toggle-music').addEventListener('click', (e) => {
    if(UI.bgm.paused) { UI.bgm.play(); e.target.textContent = "🔊 Música On"; }
    else { UI.bgm.pause(); e.target.textContent = "🔈 Música Off"; }
});

// --- Dynamic Rendering ---
function renderActionLists() {
    renderList('woodcutting', 'wood-list');
    renderList('mining', 'mine-list');
    renderList('fishing', 'fish-list');
    renderList('cooking', 'cook-list');
    renderList('smithing', 'smith-list');
    renderEnemyList();
    renderSpells();
}

function renderList(skillId, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const level = state.skills[skillId].level;
    
    GAME_DATA[skillId].forEach(item => {
        const locked = level < item.reqLevel;
        const el = document.createElement('div');
        el.className = `action-card ${locked ? 'locked' : ''}`;
        
        let reqText = '';
        if(item.reqItem) reqText = `<br><span style="color:#ffb703; font-size:0.8rem">Requer: ${item.reqCost || 1}x ${item.reqItem}</span>`;
        
        el.innerHTML = `
            <div class="card-info">
                <h3>${item.name}</h3>
                <p>${locked ? `Nível ${item.reqLevel} necessário` : `Tempo: ${item.time}s | +${item.xp} XP`} ${reqText}</p>
            </div>
            <button class="action-btn" ${locked ? 'disabled' : ''} onclick="startAction('${skillId}', '${item.id}')">INICIAR</button>
        `;
        container.appendChild(el);
    });
}

function renderEnemyList() {
    const container = document.getElementById('enemy-list');
    container.innerHTML = '';
    GAME_DATA.enemies.forEach(e => {
        const locked = state.skills.combat.level < e.reqLevel;
        const btn = document.createElement('button');
        btn.className = `shop-btn ${locked ? 'locked' : ''}`;
        btn.textContent = `Lutar: ${e.name} (Lv ${e.reqLevel})`;
        if(!locked) btn.onclick = () => { setEnemy(e.id); startAction('combat', e.id); };
        container.appendChild(btn);
    });
}

function renderSpells() {
    const container = document.getElementById('spells-container');
    container.innerHTML = '';
    GAME_DATA.magic.forEach(sp => {
        if(state.skills.magic.level >= sp.reqLevel) {
            const btn = document.createElement('button');
            btn.className = 'action-btn magic-btn';
            btn.id = `spell-btn-${sp.id}`;
            btn.innerHTML = `${sp.name} <div class="cd-overlay" id="cd-${sp.id}"></div>`;
            btn.onclick = () => castSpell(sp.id);
            container.appendChild(btn);
        }
    });
}

function renderCompanions() {
    const container = document.getElementById('companion-shop');
    container.innerHTML = '';
    GAME_DATA.companions.forEach(c => {
        const owned = state.companions.includes(c.id);
        const el = document.createElement('div');
        el.className = `shop-item ${owned ? 'owned' : ''}`;
        el.innerHTML = `
            <h3>${c.name}</h3>
            <p>${c.desc}</p>
            ${!owned ? `<p class="cost">Custo: ${c.cost.gold} Ouro</p><button class="shop-btn upgrade-btn" onclick="buyCompanion('${c.id}')">CONTRATAR</button>` : `<p style="color:var(--color-gold)">Contratado</p>`}
        `;
        container.appendChild(el);
    });
}

function renderMarket() {
    const sellGrid = document.getElementById('market-sell-grid');
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
                    <button class="sell-btn" onclick="sellItem('${key}', 1)">Vender 1</button>
                    <button class="sell-btn" onclick="sellItem('${key}', 'all')">Tudo</button>
                </div>
            `;
            sellGrid.appendChild(div);
        }
    }

    const upgGrid = document.getElementById('market-upgrade-grid');
    upgGrid.innerHTML = '';
    GAME_DATA.upgrades.forEach(u => {
        const owned = state.upgrades.includes(u.id);
        const el = document.createElement('div');
        el.className = `shop-item ${owned ? 'owned' : ''}`;
        el.innerHTML = `
            <h3>${u.name}</h3>
            <p>${u.desc}</p>
            ${!owned ? `<p class="cost">Custo: ${u.cost} Ouro</p><button class="shop-btn upgrade-btn" onclick="buyUpgrade('${u.id}')">COMPRAR</button>` : `<p style="color:var(--color-gold)">Comprado</p>`}
        `;
        upgGrid.appendChild(el);
    });
}

// --- Action Logic ---
function startAction(skillId, itemId) {
    state.activeAction = { skill: skillId, id: itemId };
    state.actionTimer = 0;
    
    let itemData;
    if(skillId === 'combat') {
        itemData = GAME_DATA.enemies.find(e => e.id === itemId);
        state.actionMaxTime = 2000; // Attack speed 2s
    } else {
        itemData = GAME_DATA[skillId].find(i => i.id === itemId);
        state.actionMaxTime = itemData.time * 1000;
    }
    state.actionData = itemData;
    
    // UI Visuals (Reset all active buttons)
    document.querySelectorAll('.action-btn').forEach(b => {
        if(b.textContent === "PARAR") b.textContent = "INICIAR";
        b.classList.remove('active-state');
    });
    
    // Pulse Sidebar
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('is-running'));
    const navItem = document.getElementById(`nav-${skillId}`);
    if(navItem) navItem.classList.add('is-running');
}

function stopAction() {
    state.activeAction = null;
    document.querySelectorAll('.progress-fill').forEach(p => p.style.width = '0%');
    document.querySelectorAll('.progress-text').forEach(t => t.textContent = "Inativo");
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('is-running'));
}

function setEnemy(enemyId) {
    const e = GAME_DATA.enemies.find(x => x.id === enemyId);
    state.combatState = { enemyId: e.id, enemyHp: e.hp, enemyMaxHp: e.hp };
    UI.enemyName.textContent = `👹 ${e.name}`;
    updateCombatUI();
}

function castSpell(spellId) {
    if(state.cooldowns[spellId] > 0) return;
    if(state.activeAction?.skill !== 'combat') return; // Only in combat
    
    const sp = GAME_DATA.magic.find(x => x.id === spellId);
    
    // Apply effect
    if(sp.effect === 'dmg') {
        state.combatState.enemyHp -= sp.val;
        createFloatingText(`-${sp.val}`, 'enemy', '#ff00ea');
    } else if(sp.effect === 'heal') {
        state.hp = Math.min(state.maxHp, state.hp + sp.val);
        createFloatingText(`+${sp.val}`, 'player', '#80ed99');
    }
    
    state.cooldowns[spellId] = sp.cooldown * 1000; // Set CD
    giveXp('magic', 20);
    checkEnemyDeath();
}

// --- Main Loop ---
let lastTime = performance.now();
function gameLoop(currentTime) {
    const dt = currentTime - lastTime;
    lastTime = currentTime;
    
    // Process Active Action
    if (state.activeAction) {
        state.actionTimer += dt;
        
        let modifier = 1.0;
        if(state.upgrades.includes('upg_boots')) modifier = 0.9;
        
        let currentMaxTime = state.actionMaxTime * modifier;
        let progress = (state.actionTimer / currentMaxTime) * 100;
        
        // Update specific progress bar
        const skill = state.activeAction.skill;
        const bar = document.getElementById(`prog-${skill}`);
        const text = document.getElementById(`status-${skill}`);
        if(bar) {
            bar.style.width = `${Math.min(100, progress)}%`;
            text.textContent = `Progresso... (${(state.actionTimer/1000).toFixed(1)}s)`;
        }
        
        if (state.actionTimer >= currentMaxTime) {
            state.actionTimer = 0;
            completeActionTick();
        }
    }
    
    // Process Cooldowns
    for(let sp in state.cooldowns) {
        if(state.cooldowns[sp] > 0) {
            state.cooldowns[sp] -= dt;
            const cdEl = document.getElementById(`cd-${sp}`);
            if(cdEl) {
                const spData = GAME_DATA.magic.find(x=>x.id==sp);
                cdEl.style.height = `${(state.cooldowns[sp] / (spData.cooldown*1000)) * 100}%`;
            }
        }
    }
    
    // Process Companions (Automation)
    state.companions.forEach(cId => {
        if(!state.petTimers[cId]) state.petTimers[cId] = 0;
        state.petTimers[cId] += dt;
        const petData = GAME_DATA.companions.find(x=>x.id==cId);
        
        if(state.petTimers[cId] >= petData.tickTime * 1000) {
            state.petTimers[cId] = 0;
            if(petData.type === 'gather') {
                state.inventory[petData.resource] = (state.inventory[petData.resource] || 0) + petData.amount;
                createFloatingText(`+${petData.amount} ${petData.resource}`, 'center', '#ffb703');
            } else if(petData.type === 'combat' && state.activeAction?.skill === 'combat') {
                state.combatState.enemyHp -= petData.dmg;
                createFloatingText(`-${petData.dmg} (Lobo)`, 'enemy', '#ff00ea');
                checkEnemyDeath();
            }
        }
    });

    updateInventoryUI();
    requestAnimationFrame(gameLoop);
}

function completeActionTick() {
    const act = state.activeAction;
    const data = state.actionData;
    
    if(act.skill === 'combat') {
        // Player hits
        let dmg = Math.floor(Math.random() * 3) + 1; // base dmg
        state.combatState.enemyHp -= dmg;
        createFloatingText(`-${dmg}`, 'enemy', 'white');
        playSound(UI.sfxHit);
        
        // Enemy hits
        let eDmg = Math.floor(Math.random() * (data.dmg[1]-data.dmg[0]+1)) + data.dmg[0];
        state.hp -= eDmg;
        createFloatingText(`-${eDmg}`, 'player', '#ef233c');
        
        // Auto eat food if low
        if(state.hp <= 30) {
            if(state.inventory.cooked_salmon > 0) { state.hp += 50; state.inventory.cooked_salmon--; }
            else if(state.inventory.cooked_shrimp > 0) { state.hp += 20; state.inventory.cooked_shrimp--; }
            state.hp = Math.min(state.maxHp, state.hp);
        }
        
        if(state.hp <= 0) { state.hp = 0; stopAction(); alert("Você morreu!"); }
        
        checkEnemyDeath();
        updateCombatUI();
        giveXp('combat', 5);
        
    } else {
        // Gathering / Crafting
        if(data.reqItem) {
            if((state.inventory[data.reqItem] || 0) < (data.reqCost || 1)) {
                stopAction();
                alert(`Sem ${data.reqItem} suficiente!`);
                return;
            }
            state.inventory[data.reqItem] -= (data.reqCost || 1);
        }
        
        if(data.drop) {
            let chance = data.dropChance;
            let qty = 1;
            if(state.upgrades.includes('upg_backpack')) qty = 2; // Passiva 1
            
            if(Math.random() <= chance) {
                if(state.upgrades.includes('upg_luck') && Math.random() <= 0.05) qty *= 2; // Passiva 2
                
                state.inventory[data.drop] = (state.inventory[data.drop] || 0) + qty;
                createFloatingText(`+${qty} ${data.drop}`, 'center', 'white');
                
                if(act.skill === 'woodcutting') playSound(UI.sfxChop);
                if(act.skill === 'mining') playSound(UI.sfxMine);
            }
        }
        
        giveXp(act.skill, data.xp);
        
        // Visual Flash
        const section = document.getElementById(`tab-${act.skill}`);
        if(section) {
            const flash = document.createElement('div');
            flash.className = 'flash-effect';
            section.appendChild(flash);
            setTimeout(()=>flash.remove(), 200);
        }
    }
}

function checkEnemyDeath() {
    if(state.combatState.enemyHp <= 0) {
        const e = GAME_DATA.enemies.find(x => x.id === state.combatState.enemyId);
        state.combatState.enemyHp = state.combatState.enemyMaxHp;
        
        let dropG = Math.floor(Math.random() * (e.goldDrop[1]-e.goldDrop[0]+1)) + e.goldDrop[0];
        state.gold += dropG;
        giveXp('combat', e.xp);
        createFloatingText(`+${dropG} Ouro`, 'enemy', '#ffb703');
    }
}

// --- XP & Levels ---
function giveXp(skillId, amount) {
    const s = state.skills[skillId];
    s.xp += amount;
    
    // Check level up
    let nextXp = GAME_DATA.xpLevels[s.level];
    if(nextXp && s.xp >= nextXp) {
        s.level++;
        createFloatingText(`Level UP! ${s.level}`, 'center', '#00f3ff');
        renderActionLists(); // Unlock new items
        updateLevelUI();
    }
}

// --- Visual & UI Helpers ---
function updateInventoryUI() {
    UI.gold.textContent = state.gold;
    UI.hp.textContent = state.hp;
    
    // Build Grid
    let html = '';
    for(let key in state.inventory) {
        if(state.inventory[key] > 0) {
            html += `<div class="inv-slot"><span class="inv-name">${key}</span><span class="inv-qty">${state.inventory[key]}</span></div>`;
        }
    }
    UI.invGrid.innerHTML = html;
}

function updateLevelUI() {
    document.getElementById('lvl-wood').textContent = `Nível ${state.skills.woodcutting.level}`;
    document.getElementById('lvl-mine').textContent = `Nível ${state.skills.mining.level}`;
    document.getElementById('lvl-fish').textContent = `Nível ${state.skills.fishing.level}`;
    document.getElementById('lvl-cook').textContent = `Nível ${state.skills.cooking.level}`;
    document.getElementById('lvl-smith').textContent = `Nível ${state.skills.smithing.level}`;
    document.getElementById('lvl-combat').textContent = `Nível ${state.skills.combat.level}`;
}

function updateCombatUI() {
    UI.playerHpBar.style.width = `${(state.hp / state.maxHp) * 100}%`;
    UI.enemyHpBar.style.width = `${(state.combatState.enemyHp / state.combatState.enemyMaxHp) * 100}%`;
}

function createFloatingText(text, targetType, color) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    el.style.color = color;
    
    // Position roughly
    if(targetType === 'player') { el.style.left = '20%'; el.style.top = '40%'; }
    else if(targetType === 'enemy') { el.style.left = '70%'; el.style.top = '40%'; }
    else { el.style.left = '50%'; el.style.top = '50%'; }
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function playSound(audioEl) {
    if(audioEl && !UI.bgm.paused) {
        audioEl.currentTime = 0;
        audioEl.play().catch(e=>console.log(e));
    }
}

// --- Shop & Market ---
function buyCompanion(id) {
    const comp = GAME_DATA.companions.find(c => c.id === id);
    if(state.gold >= comp.cost.gold && !state.companions.includes(id)) {
        state.gold -= comp.cost.gold;
        state.companions.push(id);
        renderCompanions();
    } else {
        alert("Ouro insuficiente!");
    }
}

function sellItem(itemId, qtyArg) {
    if(!state.inventory[itemId] || state.inventory[itemId] <= 0) return;
    
    let qty = qtyArg === 'all' ? state.inventory[itemId] : 1;
    let price = GAME_DATA.prices[itemId] || 1;
    let total = price * qty;
    
    state.inventory[itemId] -= qty;
    state.gold += total;
    createFloatingText(`+${total} Ouro`, 'center', '#ffb703');
    
    updateInventoryUI();
    renderMarket(); // Re-render to update Qtys
}

function buyUpgrade(id) {
    const u = GAME_DATA.upgrades.find(x => x.id === id);
    if(state.gold >= u.cost && !state.upgrades.includes(id)) {
        state.gold -= u.cost;
        state.upgrades.push(id);
        renderMarket();
        updateInventoryUI();
    } else {
        alert("Ouro insuficiente!");
    }
}

// --- Cloud Save Sync ---
window.getGameStateForSave = () => {
    return {
        gold: state.gold,
        hp: state.hp,
        inventory: state.inventory,
        skills: state.skills,
        companions: state.companions,
        upgrades: state.upgrades
    };
};

window.loadGameStateFromSave = (savedData) => {
    if(!savedData) return;
    state.gold = savedData.gold || 0;
    state.hp = savedData.hp || 100;
    if(savedData.inventory) state.inventory = savedData.inventory;
    if(savedData.skills) state.skills = savedData.skills;
    if(savedData.companions) state.companions = savedData.companions;
    if(savedData.upgrades) state.upgrades = savedData.upgrades;
    
    // Refresh UIs
    updateInventoryUI();
    updateLevelUI();
    renderActionLists();
    renderCompanions();
    renderMarket();
};

// Inicia
setTimeout(init, 500);
