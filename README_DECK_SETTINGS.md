# 🎯 Solution finale : Options du paquet (100% Supabase Cloud)

## ✅ État actuel

**Le code de l'application est prêt et fonctionnel.**

Il ne vous reste plus qu'à **créer la table dans Supabase Cloud** (1 minute).

---

## 🚀 Solution en 3 étapes

### Étape 1 : Ouvrir Supabase Dashboard

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Menu de gauche → **SQL Editor**
4. Cliquez **New Query**

### Étape 2 : Exécuter le SQL

1. Ouvrez le fichier **`SUPABASE_CLOUD_SETUP.sql`** (racine du projet)
2. Copiez **TOUT** le contenu
3. Collez dans le SQL Editor
4. Cliquez **Run**

**Résultat attendu** : `Success. No rows returned`

### Étape 3 : Tester

1. Rechargez votre app Next.js
2. Page Decks → Cliquez ⚙️ → "Options du paquet"
3. Le modal s'ouvre ✅

---

## 📋 Comportement actuel

### Avant d'exécuter le SQL

Quand vous cliquez sur "Options du paquet", vous verrez :

```
┌─────────────────────────────────────────┐
│ ⚠️ Erreur                                │
│                                          │
│ La table deck_settings n'existe pas     │
│ dans votre base de données Supabase.    │
│                                          │
│ 📝 Pour créer la table :                │
│   1. Ouvrez SUPABASE_CLOUD_SETUP.sql    │
│   2. Supabase Dashboard → SQL Editor    │
│   3. Copiez-collez et cliquez "Run"     │
│                                          │
│ [Fermer]                                 │
└─────────────────────────────────────────┘
```

**C'est normal !** Le code gère correctement ce cas et vous guide.

### Après avoir exécuté le SQL

Le modal s'ouvre normalement avec tous les paramètres :

```
┌─────────────────────────────────────────┐
│ Options du paquet : Français            │
│                                          │
│ ℹ️ Paramètres spécifiques à ce paquet   │
│                                          │
│ Limites journalières                    │
│ ☐ Utiliser le réglage global            │
│ │ Nouvelles cartes par jour: [20]      │
│                                          │
│ Apprentissage                           │
│ ☑ Utiliser le réglage global            │
│ │ ○ Rapide  ● Normal  ○ Approfondi     │
│                                          │
│ [Réinitialiser]  [Annuler] [Enregistrer]│
└─────────────────────────────────────────┘
```

---

## 🔍 Vérification (optionnel)

Pour vérifier que la table existe, exécutez dans le SQL Editor :

```sql
SELECT COUNT(*) FROM deck_settings;
```

Si vous obtenez un nombre (même 0), c'est bon ✅

---

## 📁 Fichiers créés/modifiés

### Fichiers créés (pour vous aider)

1. **`SUPABASE_CLOUD_SETUP.sql`** ⭐
   - SQL complet à exécuter dans Supabase Dashboard
   - Crée la table `deck_settings`
   - Configure RLS, indexes, triggers

2. **`SETUP_DECK_SETTINGS_CLOUD.md`**
   - Guide détaillé étape par étape
   - FAQ et troubleshooting
   - Requêtes de vérification

3. **`README_DECK_SETTINGS.md`** (ce fichier)
   - Résumé rapide

### Fichiers modifiés (déjà fait ✅)

1. **`src/components/DeckOptions.tsx`**
   - Gestion d'erreur robuste
   - UI d'erreur avec instructions Supabase Cloud
   - Logs détaillés pour debugging
   - Aucun crash si table manquante

2. **`src/store/deck-settings.ts`**
   - Fonctions CRUD pour deck_settings
   - Gestion d'erreur enrichie
   - Logs de traçabilité

3. **`src/components/SettingsForm.tsx`**
   - Formulaire réutilisable (global + deck)
   - Toggles pour héritage

4. **`src/components/DeckSettingsMenu.tsx`**
   - Intégration du modal DeckOptions

5. **`supabase/migrations/20250105_deck_settings.sql`**
   - Migration locale (ignorée, gardée pour référence)
   - Non utilisée car vous n'avez pas Docker

---

## ⚙️ Architecture technique

### Logique d'héritage

```typescript
// NULL dans deck_settings = hérite du global
const effectiveSettings = {
  newCardsPerDay: deckSettings.newCardsPerDay ?? globalSettings.newCardsPerDay,
  maxReviewsPerDay: deckSettings.maxReviewsPerDay ?? globalSettings.maxReviewsPerDay,
  learningMode: deckSettings.learningMode ?? globalSettings.learningMode,
  againDelayMinutes: deckSettings.againDelayMinutes ?? globalSettings.againDelayMinutes,
  reviewOrder: deckSettings.reviewOrder ?? globalSettings.reviewOrder,
};
```

### Flux de données

```
1. Clic "Options du paquet"
   ↓
2. getDeckSettings(deckId)
   ↓
3. SELECT * FROM deck_settings
   WHERE deck_id = ? AND user_id = ?
   ↓
4. Aucune ligne trouvée ?
   → Retourne des NULL (héritage global)
   ↓
5. getSettings() → récupère settings globaux
   ↓
6. Merge (deck overrides + global defaults)
   ↓
7. Affichage dans le modal
```

### Sécurité

- ✅ Row Level Security (RLS) activé
- ✅ Policies : chaque user voit uniquement ses deck_settings
- ✅ Foreign keys : cascade on delete
- ✅ Contraintes de validation
- ✅ Indexes pour performances

---

## 🎨 Fonctionnalités

Une fois la table créée :

- ✅ **Personnalisation par deck**
  - Nouvelles cartes par jour
  - Révisions max par jour
  - Mode d'apprentissage (Rapide/Normal/Approfondi)
  - Délai avant réapparition des erreurs
  - Ordre des révisions

- ✅ **Toggle par paramètre**
  - Coché = Utiliser le réglage global (valeur NULL en DB)
  - Décoché = Personnaliser pour ce deck (valeur en DB)

- ✅ **Bouton "Réinitialiser"**
  - Supprime tous les overrides du deck
  - Retour immédiat aux paramètres globaux

- ✅ **Aucun crash**
  - Fonctionne même si la table n'existe pas
  - Message d'erreur clair avec instructions

---

## 🆘 Troubleshooting

### "relation deck_settings does not exist"

**Solution** : Exécutez le SQL dans `SUPABASE_CLOUD_SETUP.sql`

### "permission denied for table deck_settings"

**Vérification** :
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'deck_settings';
```

Vous devriez voir 4 policies.

**Solution** : Réexécutez le SQL complet

### "foreign key violation"

**Vérification** :
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'decks';
```

**Solution** : Assurez-vous que la table `decks` existe

---

## 💡 Requêtes utiles

### Voir tous vos deck_settings

```sql
SELECT
  d.name as deck_name,
  ds.new_cards_per_day,
  ds.max_reviews_per_day,
  ds.learning_mode
FROM deck_settings ds
JOIN decks d ON d.id = ds.deck_id
WHERE ds.user_id = auth.uid();
```

### Supprimer tous vos deck_settings (reset)

```sql
DELETE FROM deck_settings WHERE user_id = auth.uid();
```

### Voir quels decks ont des overrides

```sql
SELECT d.name, COUNT(*) as has_custom_settings
FROM deck_settings ds
JOIN decks d ON d.id = ds.deck_id
WHERE ds.user_id = auth.uid()
GROUP BY d.name;
```

---

## ✅ Checklist finale

- [ ] Ouvrir Supabase Dashboard
- [ ] Aller dans SQL Editor
- [ ] Copier-coller `SUPABASE_CLOUD_SETUP.sql`
- [ ] Cliquer "Run"
- [ ] Voir "Success. No rows returned"
- [ ] Recharger l'app Next.js
- [ ] Tester "Options du paquet"
- [ ] Le modal s'ouvre ✅

---

**C'est tout !** Aucune modification de code supplémentaire nécessaire.
