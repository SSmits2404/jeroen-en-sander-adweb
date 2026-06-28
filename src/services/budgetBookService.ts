/**
 * budgetBookService.ts
 *
 * Separation of Concern: deze service vormt de enige brug tussen Firebase Firestore
 * en de rest van de applicatie. Components weten niets van Firestore; ze roepen
 * alleen functies uit deze service aan.
 *
 * Real-time: subscribeBudgetBooks gebruikt onSnapshot zodat de UI automatisch
 * bijwerkt zonder dat een component opnieuw hoeft te fetchen.
 */
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './firebase';

export interface BudgetBook {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  archived: boolean;
  memberIds: string[];
}

const COL = 'budgetBooks';

/**
 * Real-time listener op alle boekjes van een gebruiker.
 * Geeft een unsubscribe-functie terug die de component aanroept in useEffect cleanup.
 */
export function subscribeBudgetBooks(
  ownerId: string,
  onData: (books: BudgetBook[]) => void
): Unsubscribe {
  const q = query(
    collection(firestore, COL),
    where('ownerId', '==', ownerId)
  );

  return onSnapshot(q, (snapshot) => {
    const books = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<BudgetBook, 'id'>),
    }));
    onData(books);
  });
}

export async function createBudgetBook(
  name: string,
  description: string,
  ownerId: string
): Promise<void> {
  await addDoc(collection(firestore, COL), {
    name,
    description,
    ownerId,
    archived: false,
    createdAt: serverTimestamp(),
  });
}

export async function updateBudgetBook(
  id: string,
  fields: Partial<Omit<BudgetBook, 'id'>>
): Promise<void> {
  await updateDoc(doc(firestore, COL, id), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

export async function archiveBudgetBook(id: string): Promise<void> {
  await updateBudgetBook(id, { archived: true });
}

export async function restoreBudgetBook(id: string): Promise<void> {
  await updateBudgetBook(id, { archived: false });
}
