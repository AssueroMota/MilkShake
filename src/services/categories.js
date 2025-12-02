import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "categories";

// Criar categoria
export async function createCategory(data) {
  await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: new Date(),
  });
}

// Editar categoria
export async function updateCategory(id, data) {
  await updateDoc(doc(db, COLLECTION, id), data);
}

// Excluir categoria (somente Firestore)
export async function deleteCategory(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}

// Live listener
export function listenCategories(callback) {
  return onSnapshot(collection(db, COLLECTION), (snapshot) => {
    const list = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(list);
  });
}
