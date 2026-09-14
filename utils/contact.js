import { Linking } from 'react-native';

export function buildWhatsAppUrl(phoneNumber, message = '') {
  const digitsOnly = phoneNumber.replace(/[^\d]/g, '');
  if (!message) {
    return `https://wa.me/${digitsOnly}`;
  }
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

export function buildPhoneUrl(phoneNumber) {
  return `tel:${phoneNumber}`;
}

export async function openWhatsApp(phoneNumber, message) {
  await Linking.openURL(buildWhatsAppUrl(phoneNumber, message));
}

export async function callPhoneNumber(phoneNumber) {
  await Linking.openURL(buildPhoneUrl(phoneNumber));
}
