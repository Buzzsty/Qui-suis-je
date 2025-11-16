// app.js
// SCRIPT EN MODE MODULE

// ---------- CONFIG GÉNÉRALE ----------

// Nombre de photos dans le jeu
const PHOTO_COUNT = 36;

// Code organisateur (à changer !)
const ADMIN_CODE = "MON_CODE_SECRET";

// Tableau des photos : à personnaliser
// Par défaut, on suppose des fichiers : img/hero-1.jpg, img/real-1.jpg, etc.
const PHOTOS = Array.from({ length: PHOTO_COUNT }, (_, i) => {
  const id = i + 1;
  return {
    id,
    heroUrl: `img/hero-${id}.jpg`,   // À adapter selon tes noms/chemins
    realUrl: `img/real-${id}.jpg`,   // idem
    answer: ""                       // À remplir : "Prénom Nom"
  };
});

// Exemple pour remplir quelques réponses :
// PHOTOS[0].answer = "Emma";
// PHOTOS[1].answer = "Lucas";

// ---------- FIREBASE ----------

// 1) Crée un projet sur https://console.firebase.google.com
// 2) Active Firestore Database
// 3) Récupère la config web (dans Paramètres du projet > Configurations)
// 4) Remplace l'objet ci-dessous par le tien

const firebaseConfig = {
  apiKey: "A_REMPLACER",
  authDomain: "A_REMPLACER",
  projectId: "A_REMPLACER",
  storageBucket: "A_REMPLACER",
  messagingSenderId: "A_REMPLACER",
  appId: "A_REMPLACER"
};

// Import des modules Firebase (version CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PLAYERS_COLLECTION = "players";
const GUESSES_COLLECTION = "guesses";

// ---------- ÉTAT LOCAL ----------

let currentPlayer = null;   // { id, name }
let currentPhotoId = null;

// ---------- UTILITAIRES ----------

function slugifyName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function normalize(str) {
  return (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// ---------- DOM ----------

const loginScreen = document.getElementById("login-screen");
const menuScreen = document.getElementById("menu-screen");
const guessScreen = document.getElementById("guess-screen");
const adminScreen = document.getElementById("admin-screen");

const playerNameInput = document.getElementById("player-name-input");
const loginButton = document.getElementById("login-button");
const playerNameDisplay = document.getElementById("player-name-display");
const logoutButton = document.getElementById("logout-button");

const photoGrid = document.getElementById("photo-grid");
const backToMenuButton = document.getElementById("back-to-menu-button");
const currentPhotoIdSpan = document.getElementById("current-photo-id");
const heroImage = document.getElementById("hero-image");
const realImage = document.getElementById("real-image");
const answerInput = document.getElementById("answer-input");
const saveAnswerButton = document.getElementById("save-answer-button");
const saveStatus = document.getElementById("save-status");

const adminOpenButton = document.getElementById("admin-open-button");
const adminBackButton = document.getElementById("admin-back-button");
const adminCodeInput = document.getElementById("admin-code-input");
const adminLoginButton = document.getElementById("admin-login-button");
const adminLoginStatus = document.getElementById("admin-login-status");
const adminResultsArea = document.getElementById("admin-results-area");
const rankingTableBody = document.querySelector("#ranking-table tbody");
const answersDetailDiv = document.getElementById("answers-detail");

// ---------- FONCTIONS FIRESTORE ----------

async function ensurePlayer(name) {
  const id = slugifyName(name);
  const ref = doc(db, PLAYERS_COLLECTION, id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    await setDoc(ref, {
      id,
      name: name.trim(),
      createdAt: serverTimestamp()
    });
  }
  return { id, name: name.trim() };
}

async function loadAnswer(playerId, photoId) {
  const guessId = `${playerId}_${photoId}`;
  const ref = doc(db, GUESSES_COLLECTION, guessId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return snapshot.data();
}

async function saveAnswer(player, photoId, answer) {
  const guessId = `${player.id}_${photoId}`;
  const ref = doc(db, GUESSES_COLLECTION, guessId);
  await setDoc(ref, {
    id: guessId,
    playerId: player.id,
    playerName: player.name,
    photoId,
    answer: answer.trim(),
    updatedAt: serverTimestamp()
  });
}

async function loadAllGuesses() {
  const ref = collection(db, GUESSES_COLLECTION);
  const snapshot = await getDocs(ref);
  const results = [];
  snapshot.forEach(docSnap => results.push(docSnap.data()));
  return results;
}

// ---------- UI / LOGIQUE DU JEU ----------

async function handleLogin() {
  const name = playerNameInput.value;
  if (!name || !name.trim()) {
    alert("Merci d'entrer un prénom / nom.");
    return;
  }
  const player = await ensurePlayer(name);
  currentPlayer = player;
  playerNameDisplay.textContent = player.name;
  playerNameInput.value = "";
  await renderPhotoGrid();
  showScreen("menu-screen");
}

async function renderPhotoGrid() {
  photoGrid.innerHTML = "";
  if (!currentPlayer) return;

  // On charge tous les guesses pour ce joueur pour marquer ceux déjà répondus.
  const allGuesses = await loadAllGuesses();
  const answeredSet = new Set(
    allGuesses
      .filter(g => g.playerId === currentPlayer.id && g.answer && g.answer.trim())
      .map(g => Number(g.photoId))
  );

  PHOTOS.forEach(photo => {
    const btn = document.createElement("button");
    btn.className = "photo-button";
    if (answeredSet.has(photo.id)) {
      btn.classList.add("answered");
    }
    btn.textContent = photo.id;
    btn.addEventListener("click", () => openPhoto(photo.id));
    photoGrid.appendChild(btn);
  });
}

async function openPhoto(photoId) {
  currentPhotoId = photoId;
  const photo = PHOTOS.find(p => p.id === photoId);
  currentPhotoIdSpan.textContent = photoId;
  heroImage.src = photo.heroUrl;
  realImage.src = photo.realUrl;

  saveStatus.textContent = "";

  if (currentPlayer) {
    const guess = await loadAnswer(currentPlayer.id, photoId);
    answerInput.value = guess && guess.answer ? guess.answer : "";
  } else {
    answerInput.value = "";
  }

  showScreen("guess-screen");
}

async function handleSaveAnswer() {
  if (!currentPlayer || !currentPhotoId) return;
  const text = answerInput.value || "";
  saveStatus.textContent = "Enregistrement...";
  saveStatus.className = "status-message";

  try {
    await saveAnswer(currentPlayer, currentPhotoId, text);
    saveStatus.textContent = "Réponse enregistrée ✅";
    saveStatus.classList.add("ok");
    // Mettre à jour la grille quand on revient
    await renderPhotoGrid();
  } catch (e) {
    console.error(e);
    saveStatus.textContent = "Erreur lors de l'enregistrement ❌";
    saveStatus.classList.add("error");
  }
}

function handleLogout() {
  currentPlayer = null;
  currentPhotoId = null;
  playerNameDisplay.textContent = "";
  showScreen("login-screen");
}

// ---------- MODE ORGANISATEUR ----------

function openAdminScreen() {
  showScreen("admin-screen");
}

function backFromAdmin() {
  showScreen(currentPlayer ? "menu-screen" : "login-screen");
}

async function handleAdminLogin() {
  adminLoginStatus.textContent = "";
  adminLoginStatus.className = "status-message";

  const code = adminCodeInput.value;
  if (code !== ADMIN_CODE) {
    adminLoginStatus.textContent = "Code incorrect.";
    adminLoginStatus.classList.add("error");
    return;
  }

  adminLoginStatus.textContent = "Connexion réussie, chargement des résultats...";
  adminLoginStatus.classList.add("ok");

  try {
    const guesses = await loadAllGuesses();
    buildAndRenderRanking(guesses);
    adminResultsArea.classList.remove("hidden");
  } catch (e) {
    console.error(e);
    adminLoginStatus.textContent = "Erreur lors du chargement des résultats.";
    adminLoginStatus.classList.add("error");
  }
}

function buildAndRenderRanking(guesses) {
  // Prépare une map photoId -> bonne réponse normalisée
  const correctByPhotoId = new Map();
  PHOTOS.forEach(p => {
    if (p.answer && p.answer.trim()) {
      correctByPhotoId.set(String(p.id), normalize(p.answer));
    }
  });

  const players = {}; // playerId -> { name, score, total, details: [] }

  guesses.forEach(g => {
    const pid = g.playerId;
    if (!players[pid]) {
      players[pid] = {
        name: g.playerName || pid,
        score: 0,
        total: 0,
        details: []
      };
    }
    const player = players[pid];

    const photoIdStr = String(g.photoId);
    const correctNorm = correctByPhotoId.get(photoIdStr) || "";
    const givenNorm = normalize(g.answer);
    let isCorrect = false;

    if (correctNorm) {
      player.total += 1;
      if (givenNorm === correctNorm) {
        isCorrect = true;
        player.score += 1;
      }
    }

    player.details.push({
      photoId: g.photoId,
      answer: g.answer,
      correct: isCorrect,
      correctAnswer: PHOTOS.find(p => p.id === Number(g.photoId))?.answer || ""
    });
  });

  // Transformer en tableau + tri par score
  const ranking = Object.values(players).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  // Rendu tableau classement
  rankingTableBody.innerHTML = "";
  ranking.forEach((p, index) => {
    const tr = document.createElement("tr");
    const ratio = p.total > 0 ? `${p.score}/${p.total}` : `${p.score}`;
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${p.name}</td>
      <td>${ratio}</td>
      <td>Voir détails plus bas</td>
    `;
    rankingTableBody.appendChild(tr);
  });

  // Rendu détails
  const lines = [];
  ranking.forEach(p => {
    lines.push(`<h4>${p.name} – Score : ${p.score}/${p.total}</h4>`);
    if (p.details.length === 0) {
      lines.push(`<p>Aucune réponse.</p>`);
      return;
    }
    lines.push("<ul>");
    p.details.forEach(d => {
      const status = d.correct ? "✅" : "❌";
      const correctText = d.correctAnswer ? ` (Bonne réponse : ${d.correctAnswer})` : "";
      lines.push(`<li>Photo ${d.photoId} : "${d.answer || "-"}" ${status}${correctText}</li>`);
    });
    lines.push("</ul>");
  });

  answersDetailDiv.innerHTML = lines.join("");
}

// ---------- ÉCOUTEURS ----------

loginButton.addEventListener("click", handleLogin);
playerNameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") handleLogin();
});

logoutButton.addEventListener("click", handleLogout);
backToMenuButton.addEventListener("click", () => showScreen("menu-screen"));
saveAnswerButton.addEventListener("click", handleSaveAnswer);

adminOpenButton.addEventListener("click", openAdminScreen);
adminBackButton.addEventListener("click", backFromAdmin);
adminLoginButton.addEventListener("click", handleAdminLogin);

// Au chargement, on affiche l'écran de login
showScreen("login-screen");
