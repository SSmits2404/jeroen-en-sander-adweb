/**
 * ActiveBookBadge.tsx
 *
 * Klein, herbruikbaar label dat op elk tabblad laat zien van wie het
 * geselecteerde huishoudboekje is: "Jouw boekje" of "Van [naam]".
 *
 * Separation of Concern: dit component weet niets van Firestore. Het
 * leest alleen het al-opgehaalde `activeBudgetBook` uit de appState en
 * gebruikt `useMemberProfiles` (dezelfde hook als bij "Huishoudboekjes")
 * om de naam van de eigenaar op te zoeken.
 *
 * Real-time: zowel `activeBudgetBook` (via onSnapshot in appState) als
 * het eigenaarprofiel (via useMemberProfiles) werken automatisch bij.
 */
import { useAppState } from '../state/appState';
import { useMemberProfiles } from '../hooks/useMemberProfiles';

export function ActiveBookBadge() {
  const { user, activeBudgetBook } = useAppState();
  const ownerIds = activeBudgetBook ? [activeBudgetBook.ownerId] : [];
  const ownerProfiles = useMemberProfiles(ownerIds);

  if (!activeBudgetBook) return null;

  const isOwnBook = activeBudgetBook.ownerId === user?.id;
  const ownerProfile = ownerProfiles.get(activeBudgetBook.ownerId);
  const ownerName = isOwnBook
    ? 'Jouw boekje'
    : `Van ${ownerProfile?.displayName ?? '…'}`;

  return (
    <div className="active-book-badge">
      <span className="active-book-badge__name">{activeBudgetBook.name}</span>
      <span className={`book-owner-tag ${isOwnBook ? 'book-owner-tag--own' : 'book-owner-tag--other'}`}>
        {ownerName}
      </span>
    </div>
  );
}
