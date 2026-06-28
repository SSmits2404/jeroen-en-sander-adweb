/**
 * inviteService.ts
 *
 * Separation of Concern: alle logica rondom het uitnodigen van deelnemers
 * zit hier. Components weten niets van Firestore — ze roepen alleen deze functies aan.
 *
 * Hoe het werkt:
 * 1. Zoek het uid van de genodigde op via e-mailadres (users-collectie).
 * 2. Voeg dat uid toe aan memberIds van het boekje.
 * 3. Verwijder een lid door hun uid uit memberIds te halen.
 *
 * De bestaande Firestore rules checken al op memberIds, dus geen rule-wijzigingen nodig.
 * Wel moet subscribeBudgetBooks ook boekjes ophalen waar de user lid van is
 * (zie de aangepaste versie onderaan dit bestand).
 */
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { BudgetBook } from './budgetBookService';

const USERS_COL = 'users';
const BOOKS_COL = 'budgetBooks';

/**
 * Zoek een user op via e-mailadres.
 * Gooit een fout als het e-mailadres niet bekend is.
 */
export async function findUserByEmail(email: string): Promise<{ uid: string; displayName: string }> {
  const q = query(collection(firestore, USERS_COL), where('email', '==', email.toLowerCase().trim()));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error(`Geen gebruiker gevonden met e-mailadres "${email}".`);
  }

  const data = snap.docs[0].data();
  return {
    uid: snap.docs[0].id,
    displayName: data.displayName ?? email,
  };
}

/**
 * Voeg een lid toe aan een boekje via e-mailadres.
 * Gooit een fout als de gebruiker zichzelf probeert uit te nodigen,
 * of als het e-mailadres niet bekend is.
 */
export async function inviteMember(
  bookId: string,
  email: string,
  currentUserId: string
): Promise<{ displayName: string }> {
  const user = await findUserByEmail(email);

  if (user.uid === currentUserId) {
    throw new Error('Je kunt jezelf niet uitnodigen.');
  }

  await updateDoc(doc(firestore, BOOKS_COL, bookId), {
    memberIds: arrayUnion(user.uid),
  });

  return { displayName: user.displayName };
}

/**
 * Verwijder een lid uit een boekje.
 */
export async function removeMember(bookId: string, memberId: string): Promise<void> {
  await updateDoc(doc(firestore, BOOKS_COL, bookId), {
    memberIds: arrayRemove(memberId),
  });
}

/**
 * Real-time listener die ZOWEL owned als member boekjes teruggeeft.
 *
 * Firestore ondersteunt geen OR-query over twee velden tegelijk,
 * dus we draaien twee onSnapshot-listeners parallel en mergen het resultaat.
 *
 * Gebruik deze functie IN PLAATS VAN subscribeBudgetBooks uit budgetBookService
 * zodra je de invite-feature inschakelt. Je kunt de oude functie ook gewoon
 * vervangen — de interface is identiek.
 */
export function subscribeBudgetBooksForUser(
  userId: string,
  onData: (books: BudgetBook[]) => void
): Unsubscribe {
  const owned = new Map<string, BudgetBook>();
  const member = new Map<string, BudgetBook>();

  function emit() {
    const merged = new Map([...owned, ...member]);
    onData(Array.from(merged.values()));
  }

  const qOwner = query(
    collection(firestore, BOOKS_COL),
    where('ownerId', '==', userId)
  );

  const qMember = query(
    collection(firestore, BOOKS_COL),
    where('memberIds', 'array-contains', userId)
  );

  const unsubOwner = onSnapshot(qOwner, (snap) => {
    snap.docs.forEach((d) => owned.set(d.id, { id: d.id, ...(d.data() as Omit<BudgetBook, 'id'>) }));
    // Verwijder boekjes die niet meer in de snapshot zitten
    const ids = new Set(snap.docs.map((d) => d.id));
    [...owned.keys()].forEach((k) => { if (!ids.has(k)) owned.delete(k); });
    emit();
  });

  const unsubMember = onSnapshot(qMember, (snap) => {
    snap.docs.forEach((d) => member.set(d.id, { id: d.id, ...(d.data() as Omit<BudgetBook, 'id'>) }));
    const ids = new Set(snap.docs.map((d) => d.id));
    [...member.keys()].forEach((k) => { if (!ids.has(k)) member.delete(k); });
    emit();
  });

  return () => {
    unsubOwner();
    unsubMember();
  };
}
