import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerRequest, loginRequest, resetPasswordRequest, deleteAccount } from '../api/auth';

const SESSION_KEY = 'kniss_go_session';

const AuthContext = createContext(null);

// Holds the signed-in account, if any. The whole app runs fine with no
// session since browsing never needs one, but posting a listing does, and a
// session also lets a buyer sync favourites to their account.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // { token, user } | null
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          setSession(JSON.parse(raw));
        }
      } catch (error) {
        console.log('Failed to load session', error);
      } finally {
        setIsReady(true);
      }
    }
    loadSession();
  }, []);

  async function persist(next) {
    // The in-memory session above is what login/register actually depend on,
    // and it's already updated by the time this runs. Persisting to disk is
    // just a nice-to-have for surviving a refresh, so a storage failure here
    // (e.g. quota exceeded on web) must never look like a failed login.
    setSession(next);
    try {
      if (next) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
      } else {
        await AsyncStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      console.log('Could not save the session locally — it will not survive a refresh', error.message);
    }
  }

  async function register(payload) {
    const { token, user } = await registerRequest(payload);
    await persist({ token, user });
    return user;
  }

  async function login(phone, password) {
    const { token, user } = await loginRequest(phone, password);
    await persist({ token, user });
    return user;
  }

  // "Forgot password?": the phone was already proven with an OTP
  // verificationToken (see requestOtp/verifyOtp), so this both sets the new
  // password and signs the account in, the same as login() does.
  async function resetPassword(phone, verificationToken, password) {
    const { token, user } = await resetPasswordRequest(phone, verificationToken, password);
    await persist({ token, user });
    return user;
  }

  async function logout() {
    await persist(null);
  }

  // Replaces the stored account snapshot after an edit (profile save, phone
  // change, Google link), keeping the same token.
  async function updateUser(nextUser) {
    if (!session) return;
    await persist({ ...session, user: nextUser });
  }

  // Deletes the account server-side first, then clears the local session.
  async function removeAccount() {
    if (session?.token) {
      await deleteAccount(session.token);
    }
    await persist(null);
  }

  const user = session?.user ?? null;
  const value = {
    isReady,
    token: session?.token ?? null,
    user,
    isAuthenticated: !!session,
    isSeller: user?.role === 'seller',
    register,
    login,
    resetPassword,
    logout,
    updateUser,
    removeAccount,
  };

  if (!isReady) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
