// src/services/pedidos.js
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "../firebase";

const COLLECTION = "pedidos";

/* ---------------------------------------------------
   🔵 Criar Pedido NOVO (chamado pelo Carrinho)
--------------------------------------------------- */
export async function createPedido(data) {
  const colRef = collection(db, COLLECTION);

  // Buscar quantidade atual para gerar número sequencial
  const snapshot = await getDocs(colRef);
  const newNumber = snapshot.size + 1;

  const payload = {
    ...data,
    pedidoNumber: newNumber, // número que aparece para o usuário
    createdAt: new Date(),
  };

  const docRef = await addDoc(colRef, payload);
  return docRef.id;
}

/* ---------------------------------------------------
   🟣 Atualizar apenas STATUS
--------------------------------------------------- */
export async function updatePedidoStatus(id, status) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { status });
}

/* ---------------------------------------------------
   🟣 Atualizar pedido inteiro (edição)
--------------------------------------------------- */
export async function updatePedidoCompleto(pedido) {
  const ref = doc(db, COLLECTION, pedido.id);
  await updateDoc(ref, pedido);
}

/* ---------------------------------------------------
   🔴 Deletar pedido
--------------------------------------------------- */
export async function deletePedido(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}

/* ---------------------------------------------------
   🟪 Buscar UM pedido pelo ID (🔥 usado no CAIXA)
--------------------------------------------------- */
export async function getPedidoById(id) {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  };
}

/* ---------------------------------------------------
   🟡 Listener realtime (Pedidos.jsx)
--------------------------------------------------- */
export function listenPedidos(callback) {
  const colRef = collection(db, COLLECTION);
  const q = query(colRef, orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(list);
  });

  return unsubscribe;
}


// Criar pedido finalizado vindo do caixa
export async function createPedidoFinalizado(data) {
  await addDoc(collection(db, COLLECTION), {
    ...data,
    status: "finalizado",
    createdAt: new Date().toISOString(),
  });
}
export async function finalizarPedidoExistente(id, data) {
  const ref = doc(db, COLLECTION, id);

  await updateDoc(ref, {
    ...data,
    status: "finalizado",
    updatedAt: new Date().toISOString(),
  });
}
