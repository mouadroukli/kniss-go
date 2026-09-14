import { API_BASE_URL } from './properties';

async function request(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Server responded with ${response.status}`);
  }
  return data;
}

// Sign-up flow: request a code, verify it for a short-lived token, then
// create the account with that token plus the profile fields.
export function requestOtp(phone, channel) {
  return request('/auth/otp/request', { method: 'POST', body: { phone, channel } });
}

export function verifyOtp(phone, code) {
  return request('/auth/otp/verify', { method: 'POST', body: { phone, code } });
}

export function registerRequest(payload) {
  return request('/auth/register', { method: 'POST', body: payload });
}

export function loginRequest(phone, password) {
  return request('/auth/login', { method: 'POST', body: { phone, password } });
}

// "Forgot password?": reuses requestOtp/verifyOtp above to prove phone
// ownership, then this commits the new password with no session required.
export function resetPasswordRequest(phone, verificationToken, password) {
  return request('/auth/password/reset', {
    method: 'POST',
    body: { phone, verificationToken, password },
  });
}

export function fetchMe(token) {
  return request('/auth/me', { token });
}

export function fetchAccountFavorites(token) {
  return request('/me/favorites', { token });
}

export function saveAccountFavorites(favorites, token) {
  return request('/me/favorites', { method: 'PUT', body: { favorites }, token });
}

// Seller dashboard data.
export function fetchMyProperties(token) {
  return request('/me/properties', { token });
}

export function fetchMyLeads(token) {
  return request('/me/leads', { token });
}

// Account settings, the seller Profile tab.

export function updateProfile(patch, token) {
  return request('/me', { method: 'PATCH', body: patch, token });
}

// Phone / password changes reuse the sign-up OTP endpoints (requestOtp,
// verifyOtp) to get a verificationToken, then commit it here.
export function changePhoneNumber(newPhone, verificationToken, token) {
  return request('/me/phone', {
    method: 'POST',
    body: { newPhone, verificationToken },
    token,
  });
}

export function changePassword(password, verificationToken, token) {
  return request('/me/password', {
    method: 'POST',
    body: { password, verificationToken },
    token,
  });
}

export function connectGoogle(token) {
  return request('/me/google', { method: 'POST', token });
}

export function deleteAccount(token) {
  return request('/me', { method: 'DELETE', token });
}
