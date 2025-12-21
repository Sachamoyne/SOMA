# ANKIbis

Clone Anki avec interface moderne - Phase 0 + Phase 1 (fondations + import)

## Installation

```bash
pnpm install
```

## Configuration (Phase 1)

Créez un fichier `.env.local` à la racine du projet :

```env
# Required: API key for LLM provider (OpenAI-compatible)
LLM_API_KEY=your_api_key_here

# Optional: Base URL for LLM API (default: https://api.openai.com/v1)
# Use this if you're using a different provider
LLM_BASE_URL=

# Optional: Model name (default: gpt-4o-mini)
LLM_MODEL=gpt-4o-mini
```

## Développement

```bash
pnpm dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Scripts

- `pnpm dev` - Lance le serveur de développement
- `pnpm build` - Compile l'application pour la production
- `pnpm start` - Lance le serveur de production
- `pnpm lint` - Vérifie le code avec ESLint
- `pnpm format` - Formate le code avec Prettier
- `pnpm typecheck` - Vérifie les types TypeScript

## Structure

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── layout.tsx         # Layout racine
│   ├── page.tsx           # Landing page
│   └── (app)/             # Groupe de routes avec layout interne
│       ├── layout.tsx     # Layout avec sidebar
│       ├── dashboard/     # Page dashboard
│       ├── decks/         # Liste des decks
│       │   └── [deckId]/  # Détail d'un deck
│       ├── study/         # Mode étude
│       │   └── [deckId]/  # Étude d'un deck
│       └── settings/      # Paramètres
├── components/
│   ├── shell/             # Composants de layout
│   │   ├── AppSidebar.tsx
│   │   └── Topbar.tsx
│   ├── ui/                # Composants shadcn/ui
│   ├── DeckCard.tsx       # Carte de deck
│   ├── ImportDialog.tsx   # Dialog d'import (PDF/image)
│   ├── GeneratedCardRow.tsx # Ligne de carte générée
│   └── ImportsList.tsx   # Liste des imports d'un deck
├── lib/
│   ├── cn.ts              # Utilitaire className
│   ├── db.ts              # Configuration Dexie
│   └── seed.ts            # Seed données démo
├── store/
│   └── decks.ts           # Store CRUD decks/cards + import
├── app/
│   └── api/
│       └── generate-cards/ # API route pour génération LLM
└── styles/
    └── globals.css        # Styles globaux + Tailwind
```

## Phase 0 - Fonctionnalités

✅ Initialisation projet Next.js 15 + TypeScript + TailwindCSS  
✅ Configuration shadcn/ui (style new-york)  
✅ Base de données IndexedDB avec Dexie  
✅ CRUD complet pour decks et cards  
✅ Navigation avec sidebar  
✅ Pages : Landing, Dashboard, Decks, Study, Settings  
✅ Seed automatique (2 decks + 5 cartes au premier run)  
✅ Design sobre et épuré

## Phase 1 - Import & Génération

✅ Import PDF (extraction texte via pdfjs-dist)  
✅ Import Image (OCR via tesseract.js)  
✅ Génération de flashcards via LLM (OpenAI-compatible)  
✅ Review et sélection des cartes générées  
✅ Édition inline des cartes avant ajout  
✅ Historique des imports avec "Generate again"  
✅ Support pages spécifiques pour PDF (ex: 1-5)  
✅ Limitation texte à 20k caractères pour LLM  

## Technologies

- **Next.js 15** (App Router)
- **TypeScript**
- **TailwindCSS**
- **shadcn/ui** (composants UI)
- **Dexie** (IndexedDB)
- **lucide-react** (icônes)
- **pdfjs-dist** (extraction PDF)
- **tesseract.js** (OCR images)
- **zod** (validation)

## Phase 0 + Phase 1 done ✅

