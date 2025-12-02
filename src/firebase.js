// Firebase SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase do projeto MilkShakeMix
const firebaseConfig = {
  apiKey: "AIZaSyAVM_MUpn7CqJUis9kTLcRBPVvF_fe4inE",
  authDomain: "milkshakemix-93dfb.firebaseapp.com",
  projectId: "milkshakemix-93dfb",
  storageBucket: "milkshakemix-93dfb.appspot.com",
  messagingSenderId: "1094021843954",
  appId: "1:1094021843954:web:6ac553bc5743975c8cf96b",
  measurementId: "G-9JC2PPD5XJ",
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o Firestore para usar no projeto
export const db = getFirestore(app);
