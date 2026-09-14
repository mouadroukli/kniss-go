import { buildNewProperty } from '../server/createProperty';

const validInput = {
  title: 'Test Villa',
  description: 'A lovely test villa',
  price: '5000000',
  area: '150',
  rooms: '3',
  listingType: 'Sell',
  latitude: 36.75,
  longitude: 3.02,
};

const agencySeller = {
  id: 'u_1',
  role: 'seller',
  sellerType: 'agency',
  agencyName: 'Kniss Realty',
  phone: '+213555000000',
};

const individualSeller = {
  id: 'u_2',
  role: 'seller',
  sellerType: 'individual',
  fullName: 'Amina B',
  phone: '+213550112233',
};

describe('buildNewProperty', () => {
  it('builds a complete property from valid input', () => {
    const property = buildNewProperty(validInput, agencySeller);
    expect(property.title).toBe('Test Villa');
    expect(property.price).toBe(5000000);
    expect(property.listingType).toBe('Sell');
    expect(property.id).toBeTruthy();
  });

  it('takes owner + contact details from the seller account, not the form', () => {
    const property = buildNewProperty(
      { ...validInput, phoneNumber: '+213000000000', agencyName: 'Spoofed', ownerId: 'spoof', createdAt: 'spoof' },
      agencySeller
    );
    expect(property.phoneNumber).toBe('+213555000000');
    expect(property.agencyName).toBe('Kniss Realty');
    // ownerId is the account's phone, set server-side so the client can't spoof it.
    expect(property.ownerId).toBe('+213555000000');
  });

  it('stamps a createdAt timestamp server-side', () => {
    const before = Date.now();
    const property = buildNewProperty(validInput, agencySeller);
    const created = new Date(property.createdAt).getTime();
    expect(created).toBeGreaterThanOrEqual(before);
    expect(created).toBeLessThanOrEqual(Date.now());
  });

  it('labels an individual seller as "Private seller"', () => {
    const property = buildNewProperty(validInput, individualSeller);
    expect(property.agencyName).toBe('Private seller');
  });

  it('defaults listingType to Sell for anything other than Rent', () => {
    const property = buildNewProperty({ ...validInput, listingType: 'something else' }, agencySeller);
    expect(property.listingType).toBe('Sell');
  });

  it('throws when a required field is missing', () => {
    const { title, ...withoutTitle } = validInput;
    expect(() => buildNewProperty(withoutTitle, agencySeller)).toThrow();
  });

  it('throws when there is no seller account', () => {
    expect(() => buildNewProperty(validInput, null)).toThrow(/seller account/);
    expect(() => buildNewProperty(validInput, { role: 'buyer' })).toThrow(/seller account/);
  });

  it('coerces numeric string inputs to numbers', () => {
    const property = buildNewProperty(validInput, agencySeller);
    expect(typeof property.price).toBe('number');
    expect(typeof property.area).toBe('number');
    expect(typeof property.rooms).toBe('number');
  });

  it('stores a photo when one is given', () => {
    const property = buildNewProperty(
      { ...validInput, photoUri: 'data:image/jpeg;base64,AAA' },
      agencySeller
    );
    expect(property.photoUri).toBe('data:image/jpeg;base64,AAA');
  });

  it('defaults to no photo, not undefined, so callers can rely on the field existing', () => {
    const property = buildNewProperty(validInput, agencySeller);
    expect(property.photoUri).toBeNull();
  });

  it('keeps the full villa payload and reuses the existing field names', () => {
    const property = buildNewProperty(
      {
        ...validInput,
        type: 'Villa',
        priceNote: 'Negotiable',
        landArea: '400',
        area: '250',
        floors: 'G+2',
        features: ['Garden', 'Pool', ''],
        finishing: 'Finished',
        documents: 'Notarial act',
        neighborhood: 'Hydra',
        nearby: { hospital: true, school: 1, park: true, gym: false },
      },
      agencySeller
    );
    expect(property.type).toBe('Villa');
    expect(property.priceNote).toBe('Negotiable');
    expect(property.landArea).toBe(400);
    expect(property.area).toBe(250);
    expect(property.floors).toBe('G+2');
    expect(property.features).toEqual(['Garden', 'Pool']); // empties stripped
    expect(property.finishing).toBe('Finished');
    expect(property.documents).toBe('Notarial act');
    expect(property.neighborhood).toBe('Hydra');
  });

  it('coerces every nearby amenity to a real boolean, defaulting missing ones to false', () => {
    const property = buildNewProperty(
      { ...validInput, nearby: { hospital: true, school: 'yes', mosque: 0 } },
      agencySeller
    );
    expect(property.nearby).toEqual({
      hospital: true,
      school: true,
      supermarket: false,
      mosque: false,
      busStop: false,
      gym: false,
      park: false,
    });
  });

  it('takes the first of several photos as the cover', () => {
    const property = buildNewProperty(
      { ...validInput, photos: ['data:one', 'data:two', ''] },
      agencySeller
    );
    expect(property.photos).toEqual(['data:one', 'data:two']);
    expect(property.photoUri).toBe('data:one');
  });

  it('keeps rooms, parking and the apartment-type descriptor from an apartment payload', () => {
    const property = buildNewProperty(
      {
        ...validInput,
        type: 'Apartment',
        area: '95',
        rooms: '3',
        parkingSpots: '7', // "+6" is sent as 7 by the wizard
        floors: '3-room', // apartment type reuses the floors field
        features: ['Equipped kitchen'],
      },
      individualSeller
    );
    expect(property.type).toBe('Apartment');
    expect(property.area).toBe(95);
    expect(property.landArea).toBe(0);
    expect(property.rooms).toBe(3);
    expect(property.parkingSpots).toBe(7);
    expect(property.floors).toBe('3-room');
  });

  it('defaults rooms, parking and finishing for a land payload', () => {
    const { rooms, area, ...landInput } = validInput;
    const property = buildNewProperty(
      { ...landInput, type: 'Land', landArea: '500', features: ['Water', 'Electricity'] },
      individualSeller
    );
    expect(property.type).toBe('Land');
    expect(property.landArea).toBe(500);
    expect(property.area).toBe(0);
    expect(property.rooms).toBe(0);
    expect(property.parkingSpots).toBe(0);
    expect(property.finishing).toBe('N/A');
    expect(property.features).toEqual(['Water', 'Electricity']);
  });
});
