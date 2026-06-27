import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { firestore } from './firebase';

export interface CategoryEntity {
  id?: string;
  name: string;
  budget: number;
  userId: string;
}

const categoryCollection = collection(firestore, 'categories');

export async function createCategory(category: Omit<CategoryEntity, 'id'>) {
  const docRef = await addDoc(categoryCollection, category);
  return { id: docRef.id, ...category };
}

export async function fetchCategoriesByUser(userId: string) {
  const q = query(categoryCollection, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() })) as CategoryEntity[];
}
