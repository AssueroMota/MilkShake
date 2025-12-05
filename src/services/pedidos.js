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
   🔵 Função SEGURA para gerar número sequencial real
--------------------------------------------------- */
async function getNextPedidoNumber() {
  const colRef = collection(db, COLLECTION);
  const snapshot = await getDocs(colRef);

  // Extrai todos os números já usados
  const nums = snapshot.docs
    .map((d) => d.data().pedidoNumber)
    .filter((n) => typeof n === "number");

  // Se não existir nenhum → começa em 1
  const last = nums.length > 0 ? Math.max(...nums) : 0;

  return last + 1;
}

/* ---------------------------------------------------
   🔵 Criar Pedido NOVO (via Carrinho)
--------------------------------------------------- */
export async function createPedido(data) {
  const colRef = collection(db, COLLECTION);

  const pedidoNumber = await getNextPedidoNumber();

  const payload = {
    ...data,
    pedidoNumber,
    createdAt: new Date(),
    status: "solicitado",
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
   🔴 Cancelar / deletar pedido
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

/* ---------------------------------------------------
   🟣 Criar pedido finalizado vindo do CAIXA (PDV)
--------------------------------------------------- */
export async function createPedidoFinalizado(data) {
  const pedidoNumber = await getNextPedidoNumber();

  await addDoc(collection(db, COLLECTION), {
    ...data,
    pedidoNumber,
    status: "finalizado",
    createdAt: new Date(),
  });
}

/* ---------------------------------------------------
   🟣 Finalizar pedido existente no CAIXA
--------------------------------------------------- */
export async function finalizarPedidoExistente(id, data) {
  const ref = doc(db, COLLECTION, id);

  await updateDoc(ref, {
    ...data,
    status: "finalizado",
    updatedAt: new Date(),
  });
}
