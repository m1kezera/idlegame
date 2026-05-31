import { state } from './state';
import { UI, updateInventoryUI, updateLevelUI } from './ui';
import { renderActionLists, renderCompanions, renderMarket, renderHero } from './render';
import { startAction, stopAction, plantSeed, sellItem, buyCompanion, buyUpgrade, setEnemy, enterDungeon, equipItem } from './actions';
import { gameLoop } from './engine';
import './firebase';

// Bind to window for HTML inline usage
window.startAction = startAction;
window.plantSeed = plantSeed;
window.sellItem = sellItem;
window.buyCompanion = buyCompanion;
window.buyUpgrade = buyUpgrade;
window.setEnemy = setEnemy;
window.enterDungeon = enterDungeon;
window.equipItem = equipItem;

// Tab Navigation
UI.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        UI.navBtns.forEach(b => b.classList.remove('active'));
        UI.tabs.forEach(t => t.classList.remove('active'));
        
        btn.classList.add('active');
        const target = (btn as HTMLElement).dataset.target;
        if(target) {
            const tabEl = document.getElementById(`tab-${target}`);
            if(tabEl) tabEl.classList.add('active');
        }
    });
});

// Leave Dungeon binding
const leaveDunBtn = document.getElementById('leave-dungeon-btn');
if(leaveDunBtn) {
    leaveDunBtn.addEventListener('click', () => {
        state.dungeon.active = false;
        document.getElementById('dungeon-arena')!.style.display = 'none';
        stopAction();
    });
}

// Music binding
const btnMusic = document.getElementById('btn-toggle-music');
if(btnMusic) {
    btnMusic.addEventListener('click', () => {
        if(UI.bgm.paused) {
            UI.bgm.play().catch(() => alert("Erro ao tocar música. Verifique o link."));
            btnMusic.textContent = '🔊 Desligar Música';
        } else {
            UI.bgm.pause();
            btnMusic.textContent = '🔈 Ligar Música';
        }
    });
}

// Class Selection binding
const bindClassBtn = (id: string, cls: 'warrior'|'mage'|'rogue') => {
    const btn = document.getElementById(id);
    if(btn) {
        btn.addEventListener('click', () => {
            state.playerClass = cls;
            renderHero();
            updateInventoryUI();
            UI.tabs.forEach(t => t.classList.remove('active'));
            document.getElementById('tab-hero')?.classList.add('active');
        });
    }
}
bindClassBtn('btn-class-warrior', 'warrior');
bindClassBtn('btn-class-mage', 'mage');
bindClassBtn('btn-class-rogue', 'rogue');

function init() {
    renderActionLists();
    renderCompanions();
    renderMarket();
    renderHero();
    updateInventoryUI();
    updateLevelUI();
    requestAnimationFrame(gameLoop);
}

setTimeout(init, 100);
