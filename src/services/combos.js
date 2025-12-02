// src/services/combos.js
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase";

const COLLECTION = "combos";

// 🟢 Criar combo
export async function createCombo(data) {
  await addDoc(collection(db, COLLECTION), data);
}

// 🟣 Atualizar combo
export async function updateCombo(id, data) {
  await updateDoc(doc(db, COLLECTION, id), data);
}

// 🔴 Deletar combo
export async function deleteCombo(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}

// 🟡 Buscar combos (opcional)
export async function getAllCombos() {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

// 🟣 Listener realtime
export function listenCombos(callback) {
  const colRef = collection(db, COLLECTION);

  const unsubscribe = onSnapshot(colRef, (snapshot) => {
    const list = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(list);
  });

  return unsubscribe;
}
