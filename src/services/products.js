// src/services/products.js
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase";

const COLLECTION = "products";

// 🔵 Criar produto
export async function createProduct(data) {
  await addDoc(collection(db, COLLECTION), data);
}

// 🟣 Atualizar produto
export async function updateProduct(id, data) {
  await updateDoc(doc(db, COLLECTION, id), data);
}

// 🔴 Remover produto
// 👉 Agora recebe SOMENTE o ID corretamente
export async function deleteProduct(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}

// 🟡 Buscar todos
export async function getAllProducts() {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

// 🟢 Listener realtime
export function listenProducts(callback) {
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
