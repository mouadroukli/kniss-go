// Builds a listing from the wizard payload plus the authenticated seller.
// The client sends every property field it collected; ownership, age and
// contact details are stamped here from the account and can't be spoofed.

const AMENITIES = ['hospital', 'school', 'supermarket', 'mosque', 'busStop', 'gym', 'park'];

function normalizeNearby(input) {
  const nearby = {};
  for (const key of AMENITIES) {
    nearby[key] = Boolean(input && input[key]);
  }
  return nearby;
}

function buildNewProperty(input, seller) {
  const {
    title,
    description,
    price,
    priceNote,
    listingType,
    type,
    area,
    landArea,
    rooms,
    features,
    floors,
    parkingSpots,
    finishing,
    documents,
    nearby,
    neighborhood,
    photos,
    photoUri,
    latitude,
    longitude,
  } = input;

  if (!title || !price || latitude == null || longitude == null) {
    throw new Error('title, price, latitude, and longitude are required');
  }
  if (!seller || seller.role !== 'seller') {
    throw new Error('a seller account is required to post a listing');
  }

  const isAgency = seller.sellerType === 'agency';
  const photoList = Array.isArray(photos) ? photos.filter(Boolean) : [];
  const cover = photoList[0] || photoUri || null;

  return {
    id: Date.now().toString(),
    title,
    description: description || '',
    type: type || 'Apartment',
    listingType: listingType === 'Rent' ? 'Rent' : 'Sell',
    price: Number(price),
    priceNote: priceNote || 'Fixed price',
    area: Number(area) || 0,
    landArea: Number(landArea) || 0,
    rooms: Number(rooms) || 0,
    latitude: Number(latitude),
    longitude: Number(longitude),
    neighborhood: neighborhood || null,
    features: Array.isArray(features) ? features.filter(Boolean) : [],
    floors: floors || 'N/A',
    parkingSpots: Number(parkingSpots) || 0,
    finishing: finishing || 'N/A',
    documents: documents || 'N/A',
    nearby: normalizeNearby(nearby),
    photos: photoList,
    photoUri: cover,
    // Ownership and age are set here server-side from the authenticated
    // account; the client never sends them. ownerId is the account's phone
    // number (the identity primitive), which is how "my listings" and the
    // leads for a listing get matched back to a seller.
    ownerId: seller.phone,
    createdAt: new Date().toISOString(),
    agencyName: isAgency ? seller.agencyName : 'Private seller',
    phoneNumber: seller.phone,
    postedDaysAgo: 0,
    boosted: false,
  };
}

module.exports = { buildNewProperty };
