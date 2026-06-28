# Firestore rules wijziging voor invite-feature

Er is één aanpassing nodig in `firestore.rules`.

## Probleem

De huidige `/users/{userId}` regel laat alleen de user zelf zijn eigen document lezen:

```
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
}
```

Maar om `findUserByEmail` te laten werken, moet een ingelogde gebruiker
een query uitvoeren op de `users`-collectie om iemand anders op te zoeken via e-mail.

## Oplossing

Verander de read-regel voor `/users/{userId}` naar:

```
match /users/{userId} {
  // Elke ingelogde gebruiker mag user-profielen lezen (voor e-mail lookup bij uitnodigen).
  // Schrijven blijft beperkt tot de eigen gebruiker.
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.auth.uid == userId;
  allow update: if request.auth != null && request.auth.uid == userId;
  allow delete: if false;
}
```

## Waarom dit veilig is

- Email-adressen en displayNames zijn al zichtbaar voor iedereen die de app gebruikt.
- Zonder deze regel kan de invite-functie de uid van een uitgenodigde gebruiker niet opzoeken.
- Alternatief (complexer): gebruik een Cloud Function die de lookup doet server-side.
  Dit is niet nodig voor de eindopdracht.

## Belangrijk: users moeten geregistreerd zijn

`findUserByEmail` zoekt in de `users`-collectie. Zorg dat bij registratie
het user-document aangemaakt wordt. Voeg dit toe aan `signUpUser` in `authService.ts`:

```typescript
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from './firebase';

// Na updateProfile in signUpUser:
await setDoc(doc(firestore, 'users', credentials.user.uid), {
  displayName: name.trim() || email.split('@')[0],
  email: email.toLowerCase().trim(),
  createdAt: serverTimestamp(),
});
```

Bestaande gebruikers (die zich al hebben geregistreerd voor deze wijziging)
hebben nog geen document in de `users`-collectie. Die kunnen dan niet worden
uitgenodigd. Je kunt dit oplossen door bij de eerste login ook een document
aan te maken als het nog niet bestaat (`setDoc` met `{ merge: true }`).
