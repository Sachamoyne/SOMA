# Backend Setup - Soma

## Architecture

- **Frontend**: Next.js (Vercel) - UI uniquement
- **Backend**: Node.js + Express (Railway) - Logique métier

## Sécurité

Le backend utilise **uniquement** l'authentification Supabase JWT :
- Header `Authorization: Bearer <supabase-access-token>`
- Le JWT est décodé pour extraire l'`userId`
- Le `SUPABASE_SERVICE_ROLE_KEY` est utilisé uniquement pour les opérations DB côté serveur
- **Aucune clé backend custom** (BACKEND_API_KEY supprimée)

## Variables d'environnement

### Backend (Railway)

```env
# Supabase (OBLIGATOIRE)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# OpenAI (OBLIGATOIRE)
OPENAI_API_KEY=sk-xxxxx

# Port (optionnel, défaut: 3000)
PORT=3000
```

### Frontend (Vercel)

```env
# Backend API (OBLIGATOIRE)
NEXT_PUBLIC_API_URL=https://soma-production.up.railway.app

# Supabase (client-side only)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
```

## Endpoints Backend

### Health Check
- `GET /health` - No auth required

### PDF Processing
- `POST /pdf/import` - Extract text from PDF (no AI generation)
  - Auth: `Authorization: Bearer <supabase-token>`
  - Body: `multipart/form-data` with `file` field (PDF)
  - Response: `{ success: true, text: string, pages: number }`

- `POST /pdf/generate-cards` - Extract text from PDF and generate AI cards
  - Auth: `Authorization: Bearer <supabase-token>`
  - Body: `multipart/form-data` with `file` (PDF), `deck_id`, `language`
  - Response: `{ deck_id, cards: [...] }`

### Anki Import
- `POST /anki/import` - Import Anki deck (.apkg file)
  - Auth: `Authorization: Bearer <supabase-token>`
  - Body: `multipart/form-data` with `file` field (.apkg file)
  - Response: `{ success: true, imported: number, decks: number }`

### AI Generation
- `POST /generate/cards` - Generate card preview (no insertion)
  - Auth: `Authorization: Bearer <supabase-token>`
  - Body: `{ text: string, deck_id: string, language: "fr" | "en" }`
  - Response: `{ deck_id, cards: [...] }`
  
- `POST /generate/confirm` - Confirm and insert selected cards
  - Auth: `Authorization: Bearer <supabase-token>`
  - Body: `{ deck_id: string, cards: Array<{ front, back, tags?, difficulty? }> }`
  - Response: `{ deck_id, imported: number, cards: [...] }`

## CORS

Backend CORS whitelist:
- `https://soma-edu.com`
- `https://www.soma-edu.com`
- `http://localhost:3000`

## Validation au démarrage

Le backend **crash immédiatement** si ces variables sont manquantes :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## Déploiement

### Railway (Backend)

1. Connecter le repo GitHub
2. Root directory: `apps/backend`
3. Build command: `npm run build`
4. Start command: `npm start`
5. Port: Railway définit automatiquement `PORT` (défaut: 3000)
6. Ajouter toutes les variables d'environnement listées ci-dessus

### Vercel (Frontend)

1. Root directory: `/` (root du monorepo)
2. Framework: Next.js
3. Ajouter toutes les variables `NEXT_PUBLIC_*` listées ci-dessus

## Routes API Next.js supprimées

✅ Routes migrées vers le backend et **supprimées du frontend** :
- `/api/generate-cards` → `/generate/cards`
- `/api/confirm-cards` → `/generate/confirm`
- `/api/generate-cards-from-pdf` → `/pdf/generate-cards`
- `/api/import/anki` → `/anki/import`

**Note**: Les routes suivantes restent (intégrations Vercel/Next.js) :
- `/api/stripe/*` - Webhooks Stripe
- `/api/quota` - Si nécessaire
- `/api/checkout` - Intégration Stripe
