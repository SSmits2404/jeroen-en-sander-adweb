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
  deleteField,
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

function toCategoryData(category: Omit<Category, 'id'>) {
  return {
    name: category.name,
    budget: category.budget,
    budgetBookId: category.budgetBookId,
    ...(category.endDate ? { endDate: category.endDate } : {}),
  };
}

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
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Category, 'id'>),
      }))
    );
  });
}

export async function createCategory(
  category: Omit<Category, 'id'>
): Promise<void> {
  await addDoc(collection(firestore, COL), {
    ...toCategoryData(category),
    createdAt: serverTimestamp(),
  });
}

export async function updateCategory(
  id: string,
  fields: Partial<Omit<Category, 'id'>>
): Promise<void> {
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (fields.name !== undefined) payload.name = fields.name;
  if (fields.budget !== undefined) payload.budget = fields.budget;
  if (fields.budgetBookId !== undefined) payload.budgetBookId = fields.budgetBookId;

  if (fields.endDate !== undefined) {
  payload.endDate =
    fields.endDate === ''
      ? deleteField()
      : fields.endDate;
}

  await updateDoc(doc(firestore, COL, id), payload);
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(firestore, COL, id));
}