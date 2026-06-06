import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  getDoc 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Sincronizar estado de la sala en tiempo real
export function subscribeToRoom(roomId, onUpdate) {
  const roomRef = doc(db, "rooms", roomId);
  return onSnapshot(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data());
    } else {
      onUpdate(null);
    }
  }, (error) => {
    console.error("Error subscribing to room:", error);
  });
}

// Crear sala de juego nueva
export async function createRoom(roomId) {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  
  if (!roomSnap.exists()) {
    await setDoc(roomRef, {
      roomId: roomId,
      createdAt: new Date().toISOString(),
      drawnNumbers: [],
      lastDrawn: null,
      winningPattern: "Full Card", // Patrón por defecto
      claims: []
    });
  }
}

// Cantar un número en la sala
export async function drawNumber(roomId, number) {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  
  if (roomSnap.exists()) {
    const data = roomSnap.data();
    const drawnNumbers = data.drawnNumbers || [];
    if (!drawnNumbers.includes(number)) {
      await updateDoc(roomRef, {
        drawnNumbers: arrayUnion(number),
        lastDrawn: number
      });
    }
  }
}

// Alternar un número manualmente (cantar/quitar)
export async function toggleNumberInRoom(roomId, number) {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  
  if (roomSnap.exists()) {
    const data = roomSnap.data();
    const drawnNumbers = data.drawnNumbers || [];
    let updated;
    let lastDrawn = data.lastDrawn;
    
    if (drawnNumbers.includes(number)) {
      updated = drawnNumbers.filter(n => n !== number);
      if (lastDrawn === number) {
        lastDrawn = updated.length > 0 ? updated[updated.length - 1] : null;
      }
    } else {
      updated = [...drawnNumbers, number];
      lastDrawn = number;
    }
    
    await updateDoc(roomRef, {
      drawnNumbers: updated,
      lastDrawn: lastDrawn
    });
  }
}

// Reiniciar sala de juego
export async function resetRoom(roomId) {
  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, {
    drawnNumbers: [],
    lastDrawn: null,
    claims: []
  });
}

// Reclamar Bingo
export async function claimBingo(roomId, playerName, seed) {
  const roomRef = doc(db, "rooms", roomId);
  const newClaim = {
    name: playerName,
    seed: seed,
    timestamp: new Date().toISOString(),
    verified: false
  };
  
  await updateDoc(roomRef, {
    claims: arrayUnion(newClaim)
  });
}

// Cambiar el patrón de victoria
export async function setWinningPattern(roomId, pattern) {
  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, {
    winningPattern: pattern
  });
}

// Actualizar el estado de validación de un reclamo de Bingo
export async function updateClaimStatus(roomId, claimsList, updatedClaims) {
  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, {
    claims: updatedClaims
  });
}
