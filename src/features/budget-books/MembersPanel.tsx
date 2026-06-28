/**
 * MembersPanel.tsx
 *
 * Toont de huidige leden van een boekje en maakt het mogelijk om:
 * - Nieuwe leden uit te nodigen via e-mailadres
 * - Bestaande leden te verwijderen (alleen de eigenaar kan dit)
 *
 * Separation of Concern: dit component heeft geen idee van Firestore.
 * Het roept alleen functies aan uit inviteService.
 */
import { useState } from 'react';
import { inviteMember, removeMember } from '../../services/inviteService';
import { BudgetBook } from '../../services/budgetBookService';
import { useAppState } from '../../state/appState';

interface MembersPanelProps {
  book: BudgetBook;
}

export function MembersPanel({ book }: MembersPanelProps) {
  const { user } = useAppState();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isOwner = user?.id === book.ownerId;
  const memberIds: string[] = book.memberIds ?? [];

  async function handleInvite() {
    if (!email.trim() || !user) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { displayName } = await inviteMember(book.id, email.trim(), user.id);
      setEmail('');
      setSuccessMsg(`${displayName} is toegevoegd aan "${book.name}".`);
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
      <h4>Deelnemers</h4>

      {/* Eigenaar */}
      <p className="members-owner">
        <strong>Eigenaar:</strong> {book.ownerId === user?.id ? 'Jij' : book.ownerId}
      </p>

      {/* Ledenlijst */}
      {memberIds.length === 0 ? (
        <p className="empty-text">Nog geen andere deelnemers.</p>
      ) : (
        <ul className="list-card members-list">
          {memberIds.map((memberId) => (
            <li key={memberId} className="members-list-item">
              <span className="member-uid">{memberId}</span>
              {isOwner && (
                <button
                  className="secondary-button small"
                  type="button"
                  onClick={() => handleRemove(memberId)}
                >
                  Verwijderen
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Uitnodigingsformulier — alleen zichtbaar voor de eigenaar */}
      {isOwner && (
        <div className="invite-form">
          <div className="input-group">
            <label htmlFor={`invite-email-${book.id}`}>Uitnodigen via e-mailadres</label>
            <input
              id={`invite-email-${book.id}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="naam@voorbeeld.nl"
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
          </div>
          <button
            className="primary-button small"
            type="button"
            onClick={handleInvite}
            disabled={!email.trim() || loading}
          >
            {loading ? 'Bezig…' : 'Uitnodigen'}
          </button>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
      {successMsg && <p className="success-text">{successMsg}</p>}
    </div>
  );
}
