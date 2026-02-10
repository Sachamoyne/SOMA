# iOS Deep Links (Capacitor + Next.js)

## Supported links

- `soma://review` -> `/review`
- `soma://decks/{deckId}` -> `/decks/{deckId}`
- `soma://decks/{deckId}/stats` -> `/decks/{deckId}/stats`
- `https://soma-edu.com/review` -> `/review`
- `https://soma-edu.com/decks/{deckId}` -> `/decks/{deckId}`
- `https://soma-edu.com/decks/{deckId}/stats` -> `/decks/{deckId}/stats`

Other hosts are ignored. Invalid URLs are ignored safely.

## Simulator checks (no iPhone required)

From project root:

```bash
xcrun simctl openurl booted "soma://decks/123/stats"
xcrun simctl openurl booted "soma://review"
```

Expected in DEV console logs:

- `DeepLink received: <url>`
- `Routing to: <path>`

## Optional Universal Links setup (non-blocking)

This is optional and should not block local build if your Apple account/domain setup is not fully ready yet.

1. Open `ios/App/App.xcworkspace` in Xcode.
2. Select target `App` -> `Signing & Capabilities`.
3. Add capability `Associated Domains`.
4. Add this entry:
   - `applinks:soma-edu.com`
5. Ensure `https://soma-edu.com/.well-known/apple-app-site-association` is served with valid JSON and no redirect.

If this is not configured yet, custom scheme deep links (`soma://...`) still work.
