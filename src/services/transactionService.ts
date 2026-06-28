/**
 * transactionService.ts
 *
 * Beheert transacties (uitgaven/inkomsten) per huishoudboekje via Firestore.
 * Real-time updates via onSnapshot.
 */
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './firebase';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
  categoryId?: string;
  budgetBookId: string;
  userId: string;
}

const COL = 'transactions';

export function subscribeTransactions(
  budgetBookId: string,
  onData: (transactions: Transaction[]) => void
): Unsubscribe {
  const q = query(
    collection(firestore, COL),
    where('budgetBookId', '==', budgetBookId)
  );

  return onSnapshot(q, (snap) => {
    onData(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Transaction, 'id'>),
      }))
    );
  });
}

export async function createTransaction(
  transaction: Omit<Transaction, 'id'>
): Promise<void> {
  await addDoc(collection(firestore, COL), {
    ...transaction,
    createdAt: serverTimestamp(),
  });
}

export async function updateTransaction(
  id: string,
  fields: Partial<Omit<Transaction, 'id'>>
): Promise<void> {
  await updateDoc(doc(firestore, COL, id), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await deleteDoc(doc(firestore, COL, id));
}