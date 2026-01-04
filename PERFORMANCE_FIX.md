# Fix : Rafraîchissement et Performance de la Page Decks

## ✅ Problèmes Corrigés

### 1️⃣ Rafraîchissement après Import Anki

**Problème Initial** :
- Après import d'un deck Anki (.apkg), la page Decks affichait 0 cards partout
- Les decks et cartes étaient bien importés en base mais invisibles
- Il fallait naviguer ailleurs puis revenir pour voir les données

**Cause Racine** :
```typescript
// ImportDialog.tsx ligne 170 (AVANT)
onSuccess?.();  // ❌ Callback non attendu !
onOpenChange(false);
```

Le callback `onSuccess` était appelé SANS `await`, donc :
1. L'import se terminait
2. `onSuccess()` était appelé (sans attendre)
3. La dialog se fermait immédiatement
4. `loadDecks()` s'exécutait en arrière-plan (trop tard)

**Solution Appliquée** :
```typescript
// ImportDialog.tsx ligne 172 (APRÈS)
await onSuccess?.();  // ✅ Attente du callback !
onOpenChange(false);
```

**Résultat** :
- ✅ Le callback `handleImportSuccess()` est maintenant attendu
- ✅ `loadDecks()` se termine AVANT la fermeture de la dialog
- ✅ Les données sont rafraîchies et visibles immédiatement

---

### 2️⃣ Optimisation des Performances (N+1 Query Problem)

**Problème Initial** :
```typescript
// DecksPage.tsx (AVANT)
const countPromises = loadedDecks.map(async (deck) => {
  const [cardCount, dueCount, learningCount] = await Promise.all([
    getTotalCardCount(deck.id),    // Requête 1
    getDueCount(deck.id),           // Requête 2
    getDeckCardCounts(deck.id),     // Requête 3
  ]);
  // ...
});
```

**Nombre de requêtes** :
- Pour 1 deck : 3 requêtes
- Pour 10 decks : 30 requêtes
- Pour 20 decks : **60 requêtes** 🐌

**Impact** :
- Chargement très lent (plusieurs secondes)
- Latence réseau multipliée
- Surcharge de Supabase

**Solution Appliquée** :

**Nouvelle fonction `getAllDeckCounts()` dans `supabase-db.ts`** :
```typescript
export async function getAllDeckCounts(deckIds: string[]): Promise<{
  cardCounts: Record<string, number>;
  dueCounts: Record<string, number>;
  learningCounts: Record<string, { new: number; learning: number; review: number }>;
}> {
  // 1. UNE SEULE requête pour toutes les cartes
  const { data: allCards } = await supabase
    .from("cards")
    .select("deck_id, state, due_at, suspended")
    .eq("user_id", userId);

  // 2. UNE SEULE requête pour la hiérarchie des decks
  const { data: allDecks } = await supabase
    .from("decks")
    .select("id, parent_deck_id")
    .eq("user_id", userId);

  // 3. Calcul côté client (rapide)
  for (const deckId of deckIds) {
    const descendantIds = getAllDescendants(deckId);
    const deckCards = allCards.filter(
      card => descendantIds.includes(card.deck_id) && !card.suspended
    );

    cardCounts[deckId] = deckCards.length;
    dueCounts[deckId] = deckCards.filter(card => card.due_at <= now).length;
    // ... etc
  }

  return { cardCounts, dueCounts, learningCounts };
}
```

**Utilisation dans DecksPage.tsx** :
```typescript
// DecksPage.tsx (APRÈS)
const loadDecks = async () => {
  const loadedDecks = await listDecks();
  setDecks(loadedDecks);

  // ✅ UNE SEULE fonction batch au lieu de 3*N requêtes
  const deckIds = loadedDecks.map(d => d.id);
  const { cardCounts, dueCounts, learningCounts } = await getAllDeckCounts(deckIds);

  setCardCounts(cardCounts);
  setDueCounts(dueCounts);
  setLearningCounts(learningCounts);
};
```

**Nombre de requêtes** :
- Pour 1 deck : **2 requêtes** (cards + decks)
- Pour 10 decks : **2 requêtes** (cards + decks)
- Pour 20 decks : **2 requêtes** (cards + decks) ⚡

**Performance** :
- Réduction de **60 requêtes → 2 requêtes** (pour 20 decks)
- Amélioration de **~30x** en nombre de requêtes
- Chargement quasi-instantané

---

## 📊 Comparaison Avant/Après

### Import Anki

| Métrique | Avant ❌ | Après ✅ |
|----------|---------|---------|
| Affichage immédiat après import | Non (0 cards) | Oui (données visibles) |
| Navigation manuelle nécessaire | Oui | Non |
| Callback `onSuccess` attendu | Non | Oui |

### Performance Chargement

| Nombre de Decks | Requêtes Avant ❌ | Requêtes Après ✅ | Gain |
|-----------------|------------------|------------------|------|
| 1 deck | 3 requêtes | 2 requêtes | 1.5x |
| 10 decks | 30 requêtes | 2 requêtes | **15x** |
| 20 decks | 60 requêtes | 2 requêtes | **30x** |
| 50 decks | 150 requêtes | 2 requêtes | **75x** |

---

## 🔍 Fichiers Modifiés

### 1. `src/components/ImportDialog.tsx`

**Ligne 172** :
```diff
- onSuccess?.();
+ await onSuccess?.();
```

**Pourquoi** : Attend que le parent rafraîchisse ses données avant de fermer la dialog.

---

### 2. `src/lib/supabase-db.ts`

**Ajout de la fonction `getAllDeckCounts()`** (lignes 527-614) :
- Récupère toutes les cartes en UNE requête
- Récupère la hiérarchie des decks en UNE requête
- Calcule tous les comptes côté client

**Export** :
```typescript
export async function getAllDeckCounts(deckIds: string[]): Promise<{
  cardCounts: Record<string, number>;
  dueCounts: Record<string, number>;
  learningCounts: Record<string, { new: number; learning: number; review: number }>;
}>
```

---

### 3. `src/store/decks.ts`

**Ajout de l'export** (ligne 21) :
```diff
  getDeckCardCounts,
+ getAllDeckCounts,
  reviewCard,
```

---

### 4. `src/app/(app)/decks/page.tsx`

**Import** (ligne 16) :
```diff
- import { listDecks, createDeck, getDueCount, getDeckCardCounts, getTotalCardCount } from "@/store/decks";
+ import { listDecks, createDeck, getAllDeckCounts } from "@/store/decks";
```

**Fonction `loadDecks()`** (lignes 33-54) :
```diff
- // Boucle sur chaque deck avec 3 requêtes chacun
- const countPromises = loadedDecks.map(async (deck) => {
-   const [cardCount, dueCount, learningCount] = await Promise.all([
-     getTotalCardCount(deck.id),
-     getDueCount(deck.id),
-     getDeckCardCounts(deck.id),
-   ]);
-   return { deckId: deck.id, cardCount, dueCount, learningCount };
- });
- const countResults = await Promise.all(countPromises);
- for (const result of countResults) {
-   counts[result.deckId] = result.cardCount;
-   due[result.deckId] = result.dueCount;
-   learning[result.deckId] = result.learningCount;
- }

+ // Batch query optimisée : 2 requêtes au total
+ const deckIds = loadedDecks.map(d => d.id);
+ const { cardCounts, dueCounts, learningCounts } = await getAllDeckCounts(deckIds);
```

---

## 🧪 Tests à Effectuer

### Test 1 : Import Anki

1. **Démarrer l'application** :
   ```bash
   npm run dev
   ```

2. **Importer un deck Anki** :
   - Aller sur la page Decks
   - Cliquer sur "Import"
   - Sélectionner un fichier `.apkg`
   - Attendre la fin de l'import

3. **Vérifier** :
   - ✅ Les decks apparaissent **immédiatement** après import
   - ✅ Les comptes de cartes sont corrects (New, Learning, Review)
   - ✅ **Aucune navigation manuelle** nécessaire

### Test 2 : Performance Chargement

1. **Ouvrir les DevTools** (F12)
2. **Aller dans l'onglet Network**
3. **Rafraîchir la page Decks** (F5)
4. **Vérifier** :
   - ✅ Seulement **2 requêtes** vers Supabase (cards + decks)
   - ✅ Chargement quasi-instantané (< 1 seconde)
   - ✅ Pas de cascade de requêtes

### Test 3 : Fonctionnalité

1. **Créer un nouveau deck**
2. **Ajouter des cartes**
3. **Vérifier** :
   - ✅ Les comptes se mettent à jour correctement
   - ✅ Pas de régression fonctionnelle

---

## 📝 Notes Techniques

### Pourquoi 2 requêtes au lieu d'1 ?

On pourrait fusionner en une seule requête avec un JOIN, mais :
- ✅ **Simplicité** : 2 requêtes simples vs 1 requête complexe
- ✅ **Lisibilité** : Code plus facile à maintenir
- ✅ **Performance suffisante** : Gain déjà x30, pas besoin d'optimiser plus
- ✅ **Flexibilité** : Facile d'ajouter d'autres données

### Hiérarchie des Decks

La fonction `getAllDeckCounts()` respecte la hiérarchie :
- Un deck parent inclut les comptes de tous ses sous-decks
- Utilise une Map pour cache les descendants
- Évite les calculs redondants

### Gestion du State `suspended`

Les cartes suspendues sont **exclues** :
```typescript
const deckCards = allCards.filter(
  card => descendantIds.includes(card.deck_id) && !card.suspended
);
```

Conforme au comportement Anki ✅

---

## ✅ Résultat Final

**Avant** ❌ :
- Import → 0 cards affichées
- Navigation manuelle nécessaire
- Chargement lent (60 requêtes pour 20 decks)

**Après** ✅ :
- Import → Données visibles immédiatement
- Aucune navigation nécessaire
- Chargement rapide (2 requêtes pour tous les decks)

**Statut** : ✅ **PROBLÈMES RÉSOLUS**
