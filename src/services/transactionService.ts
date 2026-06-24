import { collection, addDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { firestore } from './firebase';

export interface TransactionEntity {
  id?: string;
  description: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
  categoryId?: string;
}

const transactionCollection = collection(firestore, 'transactions');

export async function createTransaction(transaction: Omit<TransactionEntity, 'id'>) {
  const docRef = await addDoc(transactionCollection, transaction);
  return { id: docRef.id, ...transaction };
}

export async function deleteTransaction(transactionId: string) {
  const ref = doc(firestore, 'transactions', transactionId);
  await deleteDoc(ref);
}

export async function fetchTransactionsByUser(userId: string) {
  const q = query(transactionCollection, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() })) as TransactionEntity[];
}
