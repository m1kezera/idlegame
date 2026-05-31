import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCzj998BI-Occ_Eg2tcdLZ3QSz8gHebses",
    authDomain: "idlegame-76f84.firebaseapp.com",
    projectId: "idlegame-76f84",
    storageBucket: "idlegame-76f84.firebasestorage.app",
    messagingSenderId: "220999450164",
    appId: "1:220999450164:web:415881bc97b1b7d2af1461"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;

// Observador de estado
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('cloud-status').innerHTML = `<span style="color:#80ed99">Logado como: ${user.email}</span>`;
        document.getElementById('cloud-auth-panel').style.display = 'none';
        document.getElementById('cloud-data-panel').style.display = 'block';
    } else {
        currentUser = null;
        document.getElementById('cloud-status').innerHTML = `<span style="color:#ef233c">Desconectado</span>`;
        document.getElementById('cloud-auth-panel').style.display = 'block';
        document.getElementById('cloud-data-panel').style.display = 'none';
    }
});

// Funções globais para uso no UI
window.loginGoogle = () => {
    signInWithPopup(auth, provider).catch(err => alert("Erro Google Auth: " + err.message));
};

window.logoutUser = () => signOut(auth);

// Funções de Save/Load atreladas ao objeto global `window.gameStateManager` que será implementado no script.js
window.saveToCloud = async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const btn = document.getElementById('btn-save-cloud');
    btn.textContent = "Salvando...";
    try {
        const data = window.getGameStateForSave();
        await setDoc(doc(db, "saves", currentUser.uid), data);
        alert("Jogo salvo na nuvem com sucesso!");
    } catch (e) {
        alert("Erro ao salvar: " + e.message);
    }
    btn.textContent = "Salvar na Nuvem";
};

window.loadFromCloud = async () => {
    if(!currentUser) return alert("Faça login primeiro!");
    const btn = document.getElementById('btn-load-cloud');
    btn.textContent = "Carregando...";
    try {
        const docSnap = await getDoc(doc(db, "saves", currentUser.uid));
        if (docSnap.exists()) {
            window.loadGameStateFromSave(docSnap.data());
            alert("Jogo carregado com sucesso!");
        } else {
            alert("Nenhum save encontrado para esta conta na nuvem.");
        }
    } catch (e) {
        alert("Erro ao carregar: " + e.message);
    }
    btn.textContent = "Carregar da Nuvem";
};
