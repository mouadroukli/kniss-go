# Kniss Go

A property listing app for Algiers. Instead of a map, you pick a radius and "scan" for what's for sale or rent nearby — a real map or address search isn't reliable enough on Android emulators to build the app around. Buyers browse with no account; sellers (individuals or agencies) sign up to post listings and see who's interested in them.

The project has two parts: the Expo/React Native app at the repository root, and a small standalone API in [server/](server/).

## What's in the app

**Buyer side** — no account required to browse:
- Pick a location and radius, then scan for nearby listings (Explore tab)
- View listing details and a seller's public profile
- Sign up as a buyer to save favourites — favouriting a listing also shows up as a lead on the seller's dashboard

**Seller side** — sign up as an Individual or Agency:
- Phone-number verification by one-time code
- Post listings for free (Add tab), with photos
- A dashboard of your own listings, expiring listings, and leads (buyers who favourited your listings)
- Profile, phone, and password management, each re-verified by OTP where it matters

Both sides live in the same Expo app; which one you see depends on the signed-in account's role (`navigation/RootNavigator.js`).

## Tech stack

- **App**: Expo (SDK 57), React Native, React Navigation, React Context for auth/favourites/language state
- **Server**: Node.js, Express, JWT auth (`jsonwebtoken`), password hashing (`bcryptjs`)
- **Persistence**: a single JSON file (`server/data.json`) — no database
- **Tests**: Jest (`jest-expo` preset), React Native Testing Library

## Running the app

From the repository root:

```sh
npm install
npm start          # opens Expo dev tools; scan the QR code with Expo Go
npm run android    # or: launch directly in an Android emulator
npm run ios        # or: launch directly in an iOS simulator
npm run web        # or: run in a browser
```

The app talks to the API on `localhost:3000` and works out which `localhost` actually means depending on where it's running (browser/iOS simulator, the Android emulator's `10.0.2.2` alias, or a physical device's LAN IP read from the Expo Go connection) — see `api/properties.js`. No manual configuration needed, but **the server below must be running**, since browsing, auth, and everything else goes through it.

## Running the server

In a separate terminal, from `server/`:

```sh
cd server
npm install
npm start
```

This starts the API on `http://localhost:3000` (override with a `PORT` env var, though the app itself always calls port 3000 — see `api/properties.js`). On first run it seeds `server/data.json` with demo data; after that, the file is the source of truth. Delete it to reset back to the seed data.

There's no real SMS/WhatsApp integration: one-time codes for phone verification are generated for real but printed to this terminal instead of sent anywhere. The app tells you to check here.

### Demo accounts

The seed data includes two accounts, both with password `12345678`:

| Account              | Phone           |
| -------------------- | --------------- |
| Seller : Agency      | `+213782956756` |
| Buyer                | `+213777777777` |

## Tests

```sh
npm test
```

Run from the repository root, this covers both the React Native side (screens, components, context) and the server's logic modules (auth, distance calculation, listing creation, seed data, etc.), which the tests import and call directly rather than over HTTP. There's no separate test command inside `server/`.

