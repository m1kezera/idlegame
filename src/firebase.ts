import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { state } from './state';
import { updateInventoryUI, updateLevelUI } from './ui';
import { renderActionLists, renderCompanions, renderMarket, renderHero } from './render';
import { GameState } from './types';

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "aethelgard-idle.firebaseapp.com",
    projectId: "aethelgard-idle",
    storageBucket: "aethelgard-idle.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser: User | null = null;

declare global {
    interface Window {
        loginUser: () => void;
        logoutUser: () => void;
        saveGame: () => void;
    }
}

window.loginUser = () => {
    signInWithPopup(auth, provider).catch(error => {
        console.error("Login Failed:", error);
    });
};

window.logoutUser = () => {
    signOut(auth).catch(error => {
        console.error("Logout Failed:", error);
    });
};

onAuthStateChanged(auth, async (user) => {
    const authBox = document.getElementById('auth-box');
    if (user) {
        currentUser = user;
        if(authBox) authBox.innerHTML = `
            <p style="color:#00ff00; margin-bottom:0.5rem">Logado como: ${user.displayName}</p>
            <button class="action-btn" style="width:100%; background: #ef233c; color:white" onclick="window.logoutUser()">Sair</button>
            <button class="action-btn" style="width:100%; background: #00ff00; color:black; margin-top:0.5rem" onclick="window.saveGame()">Salvar na Nuvem</button>
        `;
        await loadGameStateFromSave();
    } else {
        currentUser = null;
        if(authBox) authBox.innerHTML = `
            <button class="action-btn" style="width:100%; background: #4285F4; color:white" onclick="window.loginUser()">Login com Google</button>
            <p style="font-size:0.8rem; margin-top:0.5rem; color:var(--text-muted)">Logue para salvar na nuvem</p>
        `;
    }
});

function getGameStateForSave() {
    return {
        gold: state.gold,
        hp: state.hp,
        inventory: state.inventory,
        skills: state.skills,
        companions: state.companions,
        upgrades: state.upgrades,
        equipment: state.equipment,
        farmPlots: state.farmPlots
    };
}

window.saveGame = async () => {
    if (!currentUser) {
        alert("Você precisa estar logado para salvar na nuvem!");
        return;
    }
    try {
        const saveBtn = document.querySelector('button[onclick="window.saveGame()"]') as HTMLElement;
        if(saveBtn) saveBtn.textContent = 'Salvando...';
        
        await setDoc(doc(db, "saves", currentUser.uid), {
            data: getGameStateForSave(),
            timestamp: Date.now()
        });
        
        if(saveBtn) saveBtn.textContent = 'Salvo!';
        setTimeout(() => {
            if(saveBtn) saveBtn.textContent = 'Salvar na Nuvem';
        }, 2000);
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar o jogo.");
    }
};

async function loadGameStateFromSave() {
    if(!currentUser) return;
    try {
        const docSnap = await getDoc(doc(db, "saves", currentUser.uid));
        if (docSnap.exists()) {
            const savedData = docSnap.data().data as Partial<GameState>;
            if(!savedData) return;
            
            state.gold = savedData.gold || 0;
            state.hp = savedData.hp || 100;
            if(savedData.inventory) state.inventory = savedData.inventory;
            if(savedData.skills) {
                state.skills = savedData.skills as any;
                if(!state.skills.farming) state.skills.farming = { xp: 0, level: 1 };
            }
            if(savedData.companions) state.companions = savedData.companions;
            if(savedData.upgrades) state.upgrades = savedData.upgrades;
            if(savedData.equipment) state.equipment = savedData.equipment;
            if(savedData.farmPlots) state.farmPlots = savedData.farmPlots;
            
            updateInventoryUI();
            updateLevelUI();
            renderActionLists();
            renderCompanions();
            renderMarket();
            renderHero();
            console.log("Jogo carregado da nuvem!");
        }
    } catch (error) {
        console.error("Erro ao carregar:", error);
    }
}
