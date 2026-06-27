# Huishoudboekje React App

Dit project is een React / Vite setup voor de ADWEB eindopdracht.

## Wat is aanwezig

- `React 19` met `TypeScript`
- Vite als bundler en ontwikkelserver
- Basis pagina-indeling met:
  - Dashboard
  - Huishoudboekjes
  - Uitgaven en inkomsten
  - Categorieën
- Simpele state provider voor gebruikerscontext
- Voorbeeld tests met Vitest en Testing Library
- Basis CSS lay-out

## Belangrijke bestanden

- `package.json` - projectafhankelijkheden en scripts
- `vite.config.ts` - Vite configuratie
- `vitest.config.ts` - testconfiguratie
- `src/App.tsx` - app navigatie en pagina routering
- `src/main.tsx` - startpunt
- `src/components/AppShell.tsx` - pagina template
- `src/features/*` - features voor de opdracht
- `src/state/appState.ts` - eenvoudige app state

## Scripts

- `npm install` - installeer dependencies
- `npm run dev` - start de ontwikkelserver
- `npm run build` - produceer een productiebuild
- `npm run test` - voer unit tests uit
- `npm run coverage` - genereer test coverage

## Hoe verder

- Gebruik Firebase voor data-opslag en authenticatie volgens de opdracht.
- Werk de functies uit in `src/features/*` voor real-time Firestore integratie.
- Implementeer autorisatie- en archiveringslogica.
- Voeg grafieken toe op het dashboard voor de nice-to-have criteria.

## Firebase setup

- `firebase.json` bevat de lokale Firebase hosting en Firestore regels configuratie.
- `firestore.rules` beschrijft documentbeveiliging, autorisatie en projecttoegang.
- `firestore.indexes.json` bevat aanbevolen query-indexen voor budgetboek-, transactie- en categorie-queries.
- `FIRESTORE_SCHEMA.md` beschrijft de belangrijkste collecties, velden en relaties voor het huishoudboekje.
