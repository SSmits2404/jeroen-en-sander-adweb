/**
 * useMemberProfiles.ts
 *
 * Haalt voor een lijst van user-IDs de bijbehorende profielen op uit Firestore.
 * Geeft een Map terug van uid → { displayName, email }.
 *
 * Separation of Concern: dit is de enige plek waar components weten dat
 * gebruikersprofielen in de 'users'-collectie staan.
 */
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';

export interface MemberProfile {
  uid: string;
  displayName: string;
  email: string;
}

/**
 * Geeft een Map<uid, MemberProfile> terug die real-time bijwerkt.
 * Als een uid niet gevonden wordt (bijv. nog geen users-doc), staat hij
 * niet in de map — de UI toont dan een fallback.
 */
export function useMemberProfiles(uids: string[]): Map<string, MemberProfile> {
  const [profiles, setProfiles] = useState<Map<string, MemberProfile>>(new Map());

  // Dedupliceer en sorteer zodat de dependency stabiel is
  const key = [...new Set(uids)].sort().join(',');

  useEffect(() => {
    const unique = key ? key.split(',') : [];
    if (unique.length === 0) {
      setProfiles(new Map());
      return;
    }

    // Firestore 'in'-query max 30 items; voor de eindopdracht is dat ruim voldoende
    const q = query(
      collection(firestore, 'users'),
      where('__name__', 'in', unique)
    );

    const unsub = onSnapshot(q, (snap) => {
      const map = new Map<string, MemberProfile>();
      snap.docs.forEach((d) => {
        const data = d.data();
        map.set(d.id, {
          uid: d.id,
          displayName: data.displayName ?? data.email ?? d.id,
          email: data.email ?? '',
        });
      });
      setProfiles(map);
    });

    return unsub;
  }, [key]);

  return profiles;
}
