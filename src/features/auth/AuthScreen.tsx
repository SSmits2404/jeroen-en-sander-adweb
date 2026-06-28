import { FormEvent, useState } from 'react';
import { signInUser, signUpUser } from '../../services/authService';

type Mode = 'login' | 'register';

function getAuthErrorMessage(error: unknown): string {
    console.error('Firebase Auth Error:', error);

    if (typeof error !== 'object' || error === null) {
        return 'Onbekende fout.';
    }

    const code =
        'code' in error ? String((error as { code?: string }).code) : '';

    const message =
        'message' in error ? String((error as { message?: string }).message) : '';

    switch (code) {
        case 'auth/invalid-email':
            return 'Ongeldig e-mailadres.';

        case 'auth/user-not-found':
            return 'Er bestaat geen account met dit e-mailadres.';

        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Onjuiste combinatie van e-mailadres en wachtwoord.';

        case 'auth/email-already-in-use':
            return 'Dit e-mailadres wordt al gebruikt.';

        case 'auth/weak-password':
            return 'Het wachtwoord moet minstens 6 tekens bevatten.';

        case 'auth/operation-not-allowed':
            return 'Email/wachtwoord-authenticatie staat niet aan in Firebase.';

        case 'auth/network-request-failed':
            return 'Kan geen verbinding maken met Firebase.';

        default:
            return `${code || 'Onbekende fout'}\n${message}`;
    }
}

export function AuthScreen() {
    const [mode, setMode] = useState<Mode>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        setBusy(true);
        setError(null);

        try {
            if (mode === 'login') {
                await signInUser(email.trim(), password);
            } else {
                await signUpUser(
                    email.trim(),
                    password,
                    name.trim()
                );
            }
        } catch (err) {
            setError(getAuthErrorMessage(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="app-shell">
            <header className="app-header">
                <div>
                    <h1>Huishoudboekje</h1>
                    <p>Log in om je boekjes te beheren.</p>
                </div>
            </header>

            <section className="page-section">
                <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
                    <h2 className="section-title">
                        {mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {mode === 'register' && (
                            <div className="input-group">
                                <label>Naam</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <label>E-mailadres</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label>Wachtwoord</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && <p className="error-text">{error}</p>}

                        <div className="button-row">
                            <button
                                className="primary-button"
                                type="submit"
                                disabled={
                                    busy ||
                                    !email.trim() ||
                                    !password ||
                                    (mode === 'register' && !name.trim())
                                }
                            >
                                {busy
                                    ? 'Bezig...'
                                    : mode === 'login'
                                        ? 'Inloggen'
                                        : 'Account aanmaken'}
                            </button>

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => {
                                    setError(null);
                                    setMode(mode === 'login' ? 'register' : 'login');
                                }}
                            >
                                {mode === 'login'
                                    ? 'Nieuw account'
                                    : 'Ik heb al een account'}
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        </main>
    );
}