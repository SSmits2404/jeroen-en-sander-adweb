/**
 * MembersPanel.tsx
 *
 * Toont de deelnemers van een boekje met namen in plaats van UIDs.
 * Eigenaar is duidelijk zichtbaar. Alleen de eigenaar kan uitnodigen en verwijderen.
 *
 * Separation of Concern: geen Firestore-kennis in dit component.
 * Namen worden opgehaald via useMemberProfiles (hook) en acties via inviteService.
 */
import { useState } from 'react';
import { inviteMember, removeMember } from '../../services/inviteService';
import { BudgetBook } from '../../services/budgetBookService';
import { useAppState } from '../../state/appState';
import { useMemberProfiles } from '../../hooks/useMemberProfiles';

interface MembersPanelProps {
  book: BudgetBook;
}

/** Zet een naam om naar 1 of 2 initialen voor de avatar */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function MembersPanel({ book }: MembersPanelProps) {
  const { user } = useAppState();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isOwner = user?.id === book.ownerId;
  const memberIds: string[] = book.memberIds ?? [];

  // Haal profielen op voor eigenaar + alle leden samen
  const allUids = [...new Set([book.ownerId, ...memberIds])];
  const profiles = useMemberProfiles(allUids);

  const ownerProfile = profiles.get(book.ownerId);
  const ownerLabel = book.ownerId === user?.id
    ? `Jij (${user.name})`
    : ownerProfile?.displayName ?? '…';

  async function handleInvite() {
    if (!email.trim() || !user) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { displayName } = await inviteMember(book.id, email.trim(), user.id);
      setEmail('');
      setSuccessMsg(`${displayName} is uitgenodigd voor "${book.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uitnodigen mislukt.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(memberId: string) {
    setError(null);
    setSuccessMsg(null);
    try {
      await removeMember(book.id, memberId);
    } catch {
      setError('Verwijderen mislukt. Probeer opnieuw.');
    }
  }

  return (
    <div className="members-panel">

      {/* Eigenaar */}
      <div className="members-section-label">Eigenaar</div>
      <div className="member-row member-row--owner">
        <div className="member-avatar member-avatar--owner">
          {getInitials(ownerProfile?.displayName ?? ownerLabel)}
        </div>
        <div className="member-info">
          <span className="member-name">{ownerLabel}</span>
          {ownerProfile?.email && book.ownerId !== user?.id && (
            <span className="member-email">{ownerProfile.email}</span>
          )}
        </div>
        <span className="member-badge">Eigenaar</span>
      </div>

      {/* Ledenlijst */}
      <div className="members-section-label" style={{ marginTop: '12px' }}>
        Deelnemers {memberIds.length > 0 && <span className="members-count">{memberIds.length}</span>}
      </div>

      {memberIds.length === 0 ? (
        <p className="empty-text" style={{ margin: '8px 0' }}>Nog geen andere deelnemers.</p>
      ) : (
        <ul className="members-list">
          {memberIds.map((uid) => {
            const profile = profiles.get(uid);
            const displayName = profile?.displayName ?? uid;
            const isSelf = uid === user?.id;
            return (
              <li key={uid} className="member-row">
                <div className="member-avatar">
                  {getInitials(displayName)}
                </div>
                <div className="member-info">
                  <span className="member-name">
                    {displayName}
                    {isSelf && <span className="member-self-tag"> (jij)</span>}
                  </span>
                  {profile?.email && (
                    <span className="member-email">{profile.email}</span>
                  )}
                  {!profile && (
                    <span className="member-email member-email--loading">Profiel laden…</span>
                  )}
                </div>
                {isOwner && (
                  <button
                    className="secondary-button small danger"
                    type="button"
                    onClick={() => handleRemove(uid)}
                    title={`${displayName} verwijderen`}
                  >
                    Verwijderen
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Uitnodigingsformulier (alleen eigenaar) */}
      {isOwner && (
        <div className="invite-form">
          <div className="invite-form-label">Iemand uitnodigen</div>
          <div className="invite-input-row">
            <input
              id={`invite-email-${book.id}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="naam@voorbeeld.nl"
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              aria-label="E-mailadres om uit te nodigen"
            />
            <button
              className="primary-button small"
              type="button"
              onClick={handleInvite}
              disabled={!email.trim() || loading}
            >
              {loading ? 'Bezig…' : 'Uitnodigen'}
            </button>
          </div>
          <p className="invite-hint">
            De persoon moet al een account hebben in de app.
          </p>
        </div>
      )}

      {error && <p className="error-text" style={{ marginTop: '8px' }}>{error}</p>}
      {successMsg && <p className="success-text" style={{ marginTop: '8px' }}>{successMsg}</p>}
    </div>
  );
}
