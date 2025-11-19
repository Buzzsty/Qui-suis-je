/******************************************************
 *  app.js — VERSION FINALE AVEC FIREBASE FIRESTORE
 ******************************************************/

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

// ---------- CONFIG FIREBASE (TA CONFIG) ----------
const firebaseConfig = {
  apiKey: "AIzaSyA3UEPy4BGPw0iKiSSTzuGE-z14PzAvAp4",
  authDomain: "qui-suis-je-bbe49.firebaseapp.com",
  projectId: "qui-suis-je-bbe49",
  storageBucket: "qui-suis-je-bbe49.firebasestorage.app",
  messagingSenderId: "546376799946",
  appId: "1:546376799946:web:c27d83e1099c61056a4633",
  measurementId: "G-SDP7VH0MDG"
};

// Initialisation Firebase + Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- CONFIG DU JEU ----------
const PHOTO_COUNT = 36;
const ADMIN_CODE = "1234"; // change-moi

// Liste des photos (adapte les chemins si besoin)
const PHOTOS = Array.from({ length: PHOTO_COUNT }, (_, i) => {
  const id = i + 1;
  return {
    id,
    heroUrl: `img/hero-${id}.jpg`,
    realUrl: `img/real-${id}.jpg`,
    answer: "" // ICI tu mettras les bonnes réponses ex: "Emma"
  };
});

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
async function ensurePlayer(name) {
  const id = slugifyName(name);
  const ref = doc(db, "players", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      id,
      name,
      createdAt: serverTimestamp()
    });
  }

  return { id, name };
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
  if (!name) return alert("Merci d'entrer un nom");

  currentPlayer = await ensurePlayer(name);
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
  saveStatus.className = "status-message";
  showScreen("guess-screen");
}

saveAnswerButton.addEventListener("click", async () => {
  const ans = answerInput.value.trim();
  saveStatus.textContent = "Enregistrement...";

  await saveAnswer(currentPlayer, currentPhotoId, ans);

  saveStatus.textContent = "Réponse enregistrée ✔️";
  saveStatus.classList.add("ok");

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
    adminLoginStatus.textContent = "Code incorrect.";
    adminLoginStatus.classList.add("error");
    return;
  }

  adminLoginStatus.textContent = "Connexion réussie ! Chargement...";
  adminLoginStatus.classList.add("ok");

  const guesses = await loadAllGuesses();
  buildRanking(guesses);
  adminResultsArea.classList.remove("hidden");
});

function buildRanking(guesses) {
  // bonnes réponses
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

    if (correct) player.total += 1;
    const isCorrect = correct && correct === given;

    if (isCorrect) player.score += 1;

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
          d.isCorrect ? "✔️" : "❌ (réponse : " + d.rightAnswer + ")"
        }</li>`
      );
    });
    lines.push("</ul>");
  });

  answersDetailDiv.innerHTML = lines.join("");
}

// ---------- ÉCRAN DE DÉPART ----------
showScreen("login-screen");
