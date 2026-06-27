import { collection, addDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { firestore } from './firebase';

export interface BudgetBookEntity {
  id?: string;
  name: string;
  description: string;
  ownerId: string;
  archived: boolean;
}

const budgetBookCollection = collection(firestore, 'budgetBooks');

export async function createBudgetBook(book: Omit<BudgetBookEntity, 'id'>) {
  const docRef = await addDoc(budgetBookCollection, book);
  return { id: docRef.id, ...book };
}

export async function archiveBudgetBook(bookId: string) {
  const ref = doc(firestore, 'budgetBooks', bookId);
  await updateDoc(ref, { archived: true });
}

export async function restoreBudgetBook(bookId: string) {
  const ref = doc(firestore, 'budgetBooks', bookId);
  await updateDoc(ref, { archived: false });
}

export async function fetchUserBudgetBooks(ownerId: string) {
  const q = query(budgetBookCollection, where('ownerId', '==', ownerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() })) as BudgetBookEntity[];
}
