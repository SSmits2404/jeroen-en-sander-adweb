/**
 * categoryService.ts
 *
 * Beheert categorieën per huishoudboekje via Firestore.
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

export interface Category {
  id: string;
  name: string;
  budget: number;
  endDate?: string;
  budgetBookId: string;
}

const COL = 'categories';

export function subscribeCategories(
  budgetBookId: string,
  onData: (cats: Category[]) => void
): Unsubscribe {
  const q = query(
    collection(firestore, COL),
    where('budgetBookId', '==', budgetBookId)
  );
  return onSnapshot(q, (snap) => {
    onData(
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }))
    );
  });
}

export async function createCategory(
  category: Omit<Category, 'id'>
): Promise<void> {
  await addDoc(collection(firestore, COL), {
    ...category,
    createdAt: serverTimestamp(),
  });
}

export async function updateCategory(
  id: string,
  fields: Partial<Omit<Category, 'id'>>
): Promise<void> {
  await updateDoc(doc(firestore, COL, id), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(firestore, COL, id));
}
