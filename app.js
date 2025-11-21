/******************************************************
 *  app.js — QUI-SUIS-JE BD + FIRESTORE + CODE JOUEUR
 ******************************************************/

console.log("app.js chargé ✅");

// ---------- IMPORTS FIREBASE (CDN) ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ---------- CONFIG FIREBASE ----------
const firebaseConfig = {
  apiKey: "AIzaSyA3UEPy4BGPw0iKiSSTzuGE-z14PzAvAp4",
  authDomain: "qui-suis-je-bbe49.firebaseapp.com",
  projectId: "qui-suis-je-bbe49",
  storageBucket: "qui-suis-je-bbe49.firebasestorage.app",
  messagingSenderId: "546376799946",
  appId: "1:546376799946:web:c27d83e1099c61056a4633",
  measurementId: "G-SDP7VH0MDG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- CONFIG DU JEU ----------
const PHOTO_COUNT = 33;           // 33 personnes
const ADMIN_CODE = "1234";        // à changer

// ---------- LISTE DES PHOTOS (ANIME + ORIGINALE, TOUT EN .png) ----------
const PHOTOS = [
  { id: 1,  heroUrl: "img/justine-animé.png",      realUrl: "img/justine-original.jpg",      answer: "justine" },
  { id: 2,  heroUrl: "img/alix-anime.png",         realUrl: "img/alix-original.jpg",         answer: "alix" },
  { id: 3,  heroUrl: "img/yannaelle-anime.png",    realUrl: "img/yannaelle-original.jpg",    answer: "yannaelle" },
  { id: 4,  heroUrl: "img/anita-anime.png",        realUrl: "img/anita-original.jpg",        answer: "anita" },
  { id: 5,  heroUrl: "img/steven-anime.png",       realUrl: "img/steven-original.jpg",       answer: "steven" },
  { id: 6,  heroUrl: "img/alain-anime.png",        realUrl: "img/alain-original.jpg",        answer: "alain" },
  { id: 7,  heroUrl: "img/marion-anime.png",       realUrl: "img/marion-original.jpg",       answer: "marion" },
  { id: 8,  heroUrl: "img/shaneke-anime.png",      realUrl: "img/shaneke-original.jpg",      answer: "shaneke" },
  { id: 9,  heroUrl: "img/shirley-anime.png",      realUrl: "img/shirley-original.jpg",      answer: "shirley" },
  { id: 10, heroUrl: "img/pierre-louis-anime.png", realUrl: "img/pierre-louis-original.jpg", answer: "pierre-louis" },
  { id: 11, heroUrl: "img/patrick-anime.png",      realUrl: "img/patrick-original.jpg",      answer: "patrick" },
  { id: 12, heroUrl: "img/solene-anime.png",       realUrl: "img/solene-original.jpg",       answer: "solene" },
  { id: 13, heroUrl: "img/mariej-anime.png",       realUrl: "img/mariej-original.jpg",       answer: "marie" },
  { id: 14, heroUrl: "img/mylaine-anime.png",      realUrl: "img/mylaine-original.jpg",      answer: "mylaine" },
  { id: 15, heroUrl: "img/alexis-anime.png",       realUrl: "img/alexis-original.jpg",       answer: "alexis" },
  { id: 16, heroUrl: "img/marie-anime.png",        realUrl: "img/marie-original.jpg",        answer: "marie" },
  { id: 17, heroUrl: "img/nicolas-anime.png",      realUrl: "img/nicolas-original.jpg",      answer: "nicolas" },
  { id: 18, heroUrl: "img/valentin-anime.png",     realUrl: "img/valentin-original.jpg",     answer: "valentin" },
  { id: 19, heroUrl: "img/elisa-anime.png",        realUrl: "img/elisa-original.jpg",        answer: "elisa" },
  { id: 20, heroUrl: "img/floriane-anime.png",     realUrl: "img/floriane-original.jpg",     answer: "floriane" },
  { id: 21, heroUrl: "img/loic-anime.png",         realUrl: "img/loic-original.jpg",         answer: "loic" },
  { id: 22, heroUrl: "img/emily-anime.png",        realUrl: "img/emily-original.jpg",        answer: "emily" },
  { id: 23, heroUrl: "img/cindy-anime.png",        realUrl: "img/cindy-original.jpg",        answer: "cindy" },
  { id: 24, heroUrl: "img/virginie-anime.png",     realUrl: "img/virginie-original.jpg",     answer: "virginie" },
  { id: 25, heroUrl: "img/sylvain-anime.png",      realUrl: "img/sylvain-original.jpg",      answer: "sylvain" },
  { id: 26, heroUrl: "img/pauline-anime.png",      realUrl: "img/pauline-original.jpg",      answer: "pauline" },
  { id: 27, heroUrl: "img/megane-anime.png",       realUrl: "img/megane-original.jpg",       answer: "megane" },
  { id: 28, heroUrl: "img/gabriel-anime.png",      realUrl: "img/gabriel-original.jpg",      answer: "gabriel" },
  { id: 29, heroUrl: "img/sabrina-anime.png",      realUrl: "img/sabrina-original.jpg",      answer: "sabrina" },
  { id: 30, heroUrl: "img/dani-anime.png",         realUrl: "img/dani-original.jpg",         answer: "dani" },
  { id: 31, heroUrl: "img/alex-anime.png",         realUrl: "img/alex-original.jpg",         answer: "alex" },
  { id: 32, heroUrl: "img/audrey-anime.png",       realUrl: "img/audrey-original.jpg",       answer: "audrey" },
  { id: 33, heroUrl: "img/redha-anime.png",        realUrl: "img/redha-original.jpg",        answer: "redha" }
];

// ---------- OUTILS ----------
function slugifyName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function normalize(str) {
  return (str || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// ---------- API FIRESTORE ----------

// Création / connexion joueur AVEC code
async function ensurePlayer(name, code) {
  const id = slugifyName(name);
  const ref = doc(db, "players", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // 1ère connexion : création joueur avec code
    await setDoc(ref, {
      id,
      name,
      code,
      createdAt: serverTimestamp()
    });
    return { id, name };
  }

  const data = snap.data();

  // Ancien joueur sans code -> on enregistre celui entré
  if (!data.code) {
    await setDoc(ref, { ...data, code }, { merge: true });
    return { id, name: data.name };
  }

  // Joueur avec code -> on vérifie
  if (data.code !== code) {
    throw new Error("INVALID_CODE");
  }

  return { id, name: data.name };
}

async function loadAnswer(playerId, photoId) {
  const ref = doc(db, "guesses", `${playerId}_${photoId}`);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

async function saveAnswer(player, photoId, answer) {
  const ref = doc(db, "guesses", `${player.id}_${photoId}`);
  await setDoc(ref, {
    id: `${player.id}_${photoId}`,
    playerId: player.id,
    playerName: player.name,
    photoId,
    answer: answer.trim(),
    updatedAt: serverTimestamp()
  });
}

async function loadAllGuesses() {
  const snapshot = await getDocs(collection(db, "guesses"));
  return snapshot.docs.map(d => d.data());
}

// ---------- DOM ----------
const loginButton = document.getElementById("login-button");
const playerNameInput = document.getElementById("player-name-input");
const playerCodeInput = document.getElementById("player-code-input");
const playerNameDisplay = document.getElementById("player-name-display");
const photoGrid = document.getElementById("photo-grid");
const answerInput = document.getElementById("answer-input");
const saveAnswerButton = document.getElementById("save-answer-button");
const saveStatus = document.getElementById("save-status");
const heroImage = document.getElementById("hero-image");
const realImage = document.getElementById("real-image");
const currentPhotoIdSpan = document.getElementById("current-photo-id");
const backToMenuButton = document.getElementById("back-to-menu-button");
const logoutButton = document.getElementById("logout-button");

const adminOpenButton = document.getElementById("admin-open-button");
const adminBackButton = document.getElementById("admin-back-button");
const adminCodeInput = document.getElementById("admin-code-input");
const adminLoginButton = document.getElementById("admin-login-button");
const adminLoginStatus = document.getElementById("admin-login-status");
const adminResultsArea = document.getElementById("admin-results-area");
const rankingTableBody = document.querySelector("#ranking-table tbody");
const answersDetailDiv = document.getElementById("answers-detail");

// ---------- ÉTAT ----------
let currentPlayer = null;
let currentPhotoId = null;

// ---------- LOGIQUE UTILISATEUR ----------
loginButton.addEventListener("click", async () => {
  const name = playerNameInput.value.trim();
  const code = playerCodeInput.value.trim();

  if (!name) {
    alert("Merci d'entrer un nom");
    return;
  }
  if (!code) {
    alert("Merci d'entrer ton code joueur");
    return;
  }

  try {
    currentPlayer = await ensurePlayer(name, code);
  } catch (e) {
    console.error("Erreur login:", e);
    if (e.message === "INVALID_CODE") {
      alert("Code incorrect pour ce joueur.");
    } else {
      alert("Erreur de connexion au jeu : " + e.message);
    }
    return;
  }

  playerNameDisplay.textContent = currentPlayer.name;
  await renderPhotoGrid();
  showScreen("menu-screen");
});

async function renderPhotoGrid() {
  photoGrid.innerHTML = "";
  const guesses = await loadAllGuesses();

  const answered = new Set(
    guesses.filter(g => g.playerId === currentPlayer.id).map(g => Number(g.photoId))
  );

  PHOTOS.forEach(p => {
    const btn = document.createElement("button");
    btn.textContent = p.id;
    btn.className = "photo-button";
    if (answered.has(p.id)) btn.classList.add("answered");
    btn.onclick = () => openPhoto(p.id);
    photoGrid.appendChild(btn);
  });
}

async function openPhoto(id) {
  currentPhotoId = id;
  const p = PHOTOS.find(x => x.id === id);

  heroImage.src = p.heroUrl;
  realImage.src = p.realUrl;
  currentPhotoIdSpan.textContent = id;

  const g = await loadAnswer(currentPlayer.id, id);
  answerInput.value = g?.answer || "";

  saveStatus.textContent = "";
  showScreen("guess-screen");
}

saveAnswerButton.addEventListener("click", async () => {
  const ans = answerInput.value.trim();
  saveStatus.textContent = "Enregistrement...";

  await saveAnswer(currentPlayer, currentPhotoId, ans);

  saveStatus.textContent = "Réponse enregistrée ✔️";

  await renderPhotoGrid();
});

// ---------- RETOUR & LOGOUT ----------
backToMenuButton.addEventListener("click", () => showScreen("menu-screen"));
logoutButton.addEventListener("click", () => {
  currentPlayer = null;
  showScreen("login-screen");
});

// ---------- MODE ORGANISATEUR ----------
adminOpenButton.addEventListener("click", () => showScreen("admin-screen"));
adminBackButton.addEventListener("click", () => showScreen("menu-screen"));

adminLoginButton.addEventListener("click", async () => {
  if (adminCodeInput.value !== ADMIN_CODE) {
    adminLoginStatus.textContent = "Code organisateur incorrect.";
    adminLoginStatus.classList.add("error");
    return;
  }

  adminLoginStatus.textContent = "Connexion réussie, chargement...";
  const guesses = await loadAllGuesses();
  buildRanking(guesses);
  adminResultsArea.classList.remove("hidden");
});

function buildRanking(guesses) {
  const correctMap = new Map();
  PHOTOS.forEach(p => {
    if (p.answer) correctMap.set(String(p.id), normalize(p.answer));
  });

  const players = {};

  guesses.forEach(g => {
    if (!players[g.playerId]) {
      players[g.playerId] = {
        name: g.playerName,
        score: 0,
        total: 0,
        details: []
      };
    }

    const player = players[g.playerId];
    const correct = correctMap.get(String(g.photoId)) || "";
    const given = normalize(g.answer);

    if (correct) player.total++;
    const isCorrect = correct && given === correct;
    if (isCorrect) player.score++;

    player.details.push({
      photoId: g.photoId,
      answer: g.answer,
      rightAnswer: correct,
      isCorrect
    });
  });

  const ranking = Object.values(players).sort((a, b) => b.score - a.score);

  rankingTableBody.innerHTML = "";
  ranking.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.name}</td>
      <td>${p.score}/${p.total}</td>
      <td>Voir détails</td>
    `;
    rankingTableBody.appendChild(tr);
  });

  const lines = [];
  ranking.forEach(p => {
    lines.push(`<h4>${p.name} — ${p.score}/${p.total}</h4><ul>`);
    p.details.forEach(d => {
      lines.push(
        `<li>Photo ${d.photoId} : "${d.answer}" — ${
          d.isCorrect ? "✔️" : d.rightAnswer ? `❌ (réponse : ${d.rightAnswer})` : "❌"
        }</li>`
      );
    });
    lines.push("</ul>");
  });

  answersDetailDiv.innerHTML = lines.join("");
}

// ---------- ÉCRAN DE DÉPART ----------
showScreen("login-screen");
