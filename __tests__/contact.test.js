import { buildWhatsAppUrl, buildPhoneUrl } from '../utils/contact';

describe('buildWhatsAppUrl', () => {
  it('strips everything except digits from the phone number', () => {
    expect(buildWhatsAppUrl('+213 550 11 22 33')).toBe('https://wa.me/213550112233');
  });

  it('adds an encoded text parameter when a message is given', () => {
    const url = buildWhatsAppUrl('+213550112233', 'Hi, is this still available?');
    expect(url).toBe('https://wa.me/213550112233?text=Hi%2C%20is%20this%20still%20available%3F');
  });

  it('omits the text parameter when no message is given', () => {
    expect(buildWhatsAppUrl('+213550112233')).toBe('https://wa.me/213550112233');
  });
});

describe('buildPhoneUrl', () => {
  it('prefixes the number with tel:', () => {
    expect(buildPhoneUrl('+213550112233')).toBe('tel:+213550112233');
  });
});
