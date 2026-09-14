import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FavoritePromptModal from '../components/FavoritePromptModal';
import { useAuth } from './AuthContext';
import { fetchAccountFavorites, saveAccountFavorites } from '../api/auth';
import { reportPropertyInterest } from '../api/properties';
import { navigationRef } from '../navigation/navigationRef';

// Favoriting requires a signed-in buyer account: there's no anonymous
// consent-form path any more (see FavoritePromptModal). Each account keeps
// its own list, keyed by id and cached locally under its own key, so
// switching accounts never mixes one list into another.
function accountFavoritesKey(userId) {
  return `kniss_go_favorites_${userId}`;
}

// A favourite is stored without its full photo gallery. Photos can run to
// several hundred KB per listing, and a browser's localStorage is capped at
// only a few MB total for the whole app. The cover photoUri is kept so the
// Favorites list still shows a thumbnail; opening the listing elsewhere
// fetches the full gallery fresh from the server.
function toStoredFavorite(property) {
  const { photos, ...rest } = property;
  return rest;
}

// A storage write here is a cache, not a source of truth: the in-memory
// state the caller already applied is what the UI actually runs on. If this
// fails (quota exceeded, private browsing, etc.), the favourite still worked
// for this run. Only surviving a refresh is at risk.
async function trySave(key, value) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.log(`Could not save ${key} locally`, error.message);
  }
}

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { token, user } = useAuth();

  const [favorites, setFavorites] = useState([]);
  // A property tapped while signed out. It waits on a modal decision, or, if
  // the visitor goes on to sign in or sign up, gets favourited the moment
  // that succeeds, so there's no need to find it and tap the heart again.
  const [pendingProperty, setPendingProperty] = useState(null);
  const [promptVisible, setPromptVisible] = useState(false);

  // Signed out: no favourites to load. Signed in: each account's own list is
  // adopted fresh from the server every time, even when empty, rather than
  // merged with anything favourited before signing in.
  useEffect(() => {
    if (!token || !user?.id) {
      setFavorites([]);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const { favorites: remote } = await fetchAccountFavorites(token);
        if (cancelled) return;
        let next = Array.isArray(remote) ? remote : [];

        // A favourite was attempted before this login or sign-up, so finish
        // it now rather than leaving it stranded.
        if (pendingProperty && !next.some((item) => item.id === pendingProperty.id)) {
          next = [...next, toStoredFavorite(pendingProperty)];
          setPendingProperty(null);
        }

        setFavorites(next);
        await trySave(accountFavoritesKey(user.id), JSON.stringify(next));
        saveAccountFavorites(next, token).catch((error) =>
          console.log('Could not sync favorites to account', error.message)
        );

        // Backfills the lead for every favourite, not just a newly added one:
        // reporting interest is best-effort (offline, a dropped request), so
        // a favourite can already exist with no matching lead on the
        // seller's side. The server treats this as a no-op when the lead is
        // already there, so re-sending it on every sync is harmless and
        // keeps the two lists from drifting apart.
        const name = user.fullName || user.displayName || undefined;
        for (const property of next) {
          reportPropertyInterest(property.id, user.phone, name).catch((error) =>
            console.log('Could not report interest', error.message)
          );
        }
      } catch (error) {
        console.log('Favorites sync skipped', error.message);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  function isFavorite(propertyId) {
    return favorites.some((item) => item.id === propertyId);
  }

  // Lets the listing's owner know a buyer is interested. Best-effort: a
  // failure (offline, server down) just means the seller misses this one
  // lead, the favourite itself is unaffected. Always uses the account's
  // real phone and name now, never a hand-typed one.
  function reportInterest(property, buyerPhone, buyerName) {
    if (!buyerPhone || !property?.id) return;
    reportPropertyInterest(property.id, buyerPhone, buyerName || undefined).catch((error) =>
      console.log('Could not report interest', error.message)
    );
  }

  async function persistFavorites(next) {
    setFavorites(next);
    await trySave(accountFavoritesKey(user.id), JSON.stringify(next));
    saveAccountFavorites(next, token).catch((error) =>
      console.log('Could not sync favorites to account', error.message)
    );
  }

  async function addFavorite(property) {
    if (isFavorite(property.id)) return;
    await persistFavorites([...favorites, toStoredFavorite(property)]);
  }

  async function removeFavorite(propertyId) {
    await persistFavorites(favorites.filter((item) => item.id !== propertyId));
  }

  function toggleFavorite(property) {
    if (isFavorite(property.id)) {
      removeFavorite(property.id);
      return;
    }
    if (token && user?.id) {
      addFavorite(property);
      reportInterest(property, user.phone, user.fullName || user.displayName);
      return;
    }
    // Not signed in: favoriting needs a buyer account.
    setPendingProperty(property);
    setPromptVisible(true);
  }

  function handlePromptNotNow() {
    setPromptVisible(false);
    setPendingProperty(null);
  }

  function handlePromptSignIn() {
    // Close the modal so it doesn't linger over Login or the sign-up wizard.
    // pendingProperty is deliberately left set: the effect above finishes
    // favoriting it automatically if this leads to a successful sign-in.
    setPromptVisible(false);
    if (navigationRef.isReady()) {
      navigationRef.navigate('Login', { intent: 'buyer' });
    }
  }

  const value = { favorites, isFavorite, toggleFavorite };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      <FavoritePromptModal
        visible={promptVisible}
        onNotNow={handlePromptNotNow}
        onSignIn={handlePromptSignIn}
      />
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used inside a FavoritesProvider');
  }
  return context;
}
