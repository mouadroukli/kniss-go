const { validateSignup, buildUserRecord, normalizePhone } = require('./auth');

// The starting dataset, written to data.json on first run, after which that
// file is the source of truth. Delete data.json to reset back to this.
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

const DEMO_AGENCY = '+213782956756';
const DEMO_BUYER = '+213777777777';
const DEMO_INDIVIDUAL = '+213550000001';
const DEMO_PASSWORD = '12345678';

function seedUsers() {
  return [
    buildUserRecord(
      validateSignup({
        accountType: 'agency',
        fullName: 'Zakaria Lounis',
        agencyName: 'Kniss Realty',
        password: DEMO_PASSWORD,
        monthlyListings: 4,
        acceptedTerms: true,
      }),
      normalizePhone(DEMO_AGENCY)
    ),
    buildUserRecord(
      validateSignup({
        accountType: 'buyer',
        fullName: 'Yasmine Haddad',
        password: DEMO_PASSWORD,
        acceptedTerms: true,
      }),
      normalizePhone(DEMO_BUYER)
    ),
  ];
}

function seedProperties() {
  return [
    {
      id: '1',
      title: 'Appartement F3',
      type: 'Apartment',
      listingType: 'Sell',
      price: 14000000,
      priceNote: 'Fixed price',
      area: 128,
      rooms: 4,
      latitude: 36.7538,
      longitude: 3.018,
      features: ['Furnished', 'Garage'],
      description:
        "Vous recherchez un appartement dans un emplacement stratégique avec des conditions de paiement accessibles? Découvrez cette résidence moderne à Ben Aknoun, proche de toutes commodités.",
      floors: 'G + 2',
      parkingSpots: 2,
      finishing: 'Finished',
      documents: 'Notarial act',
      nearby: { hospital: false, school: true, supermarket: true, mosque: true, busStop: false, gym: true, park: true },
      agencyName: 'Kniss Realty',
      phoneNumber: DEMO_AGENCY,
      ownerId: DEMO_AGENCY,
      createdAt: daysAgo(28),
      postedDaysAgo: 28,
      boosted: true,
    },
    {
      id: '2',
      title: 'Villa avec jardin',
      type: 'Villa',
      listingType: 'Sell',
      price: 28500000,
      priceNote: 'Negotiable',
      area: 210,
      rooms: 5,
      latitude: 36.7545,
      longitude: 3.0176,
      features: ['Garden', 'Pool'],
      description:
        'Belle villa familiale avec jardin privé et piscine, idéale pour les grandes familles. Quartier calme et sécurisé à Ben Aknoun.',
      floors: 'RDC + 1',
      parkingSpots: 3,
      finishing: 'Finished',
      documents: 'Notarial act',
      nearby: { hospital: true, school: true, supermarket: false, mosque: true, busStop: true, gym: false, park: true },
      agencyName: 'Kniss Realty',
      phoneNumber: DEMO_AGENCY,
      ownerId: DEMO_AGENCY,
      createdAt: daysAgo(25),
      postedDaysAgo: 25,
      boosted: false,
    },
    {
      id: '3',
      title: 'Studio meublé',
      type: 'Apartment',
      listingType: 'Rent',
      price: 45000,
      priceNote: 'Fixed price',
      area: 42,
      rooms: 1,
      latitude: 36.753,
      longitude: 3.019,
      features: ['Furnished'],
      description:
        'Studio meublé et équipé, parfait pour un étudiant ou jeune professionnel. Proche des transports et commerces.',
      floors: '3rd floor',
      parkingSpots: 0,
      finishing: 'Finished',
      documents: 'Lease agreement',
      nearby: { hospital: false, school: true, supermarket: true, mosque: false, busStop: true, gym: true, park: false },
      agencyName: 'Private seller',
      phoneNumber: DEMO_INDIVIDUAL,
      ownerId: DEMO_INDIVIDUAL,
      createdAt: daysAgo(9),
      postedDaysAgo: 9,
      boosted: false,
    },
    {
      id: '4',
      title: 'Local commercial',
      type: 'Commercial',
      listingType: 'Rent',
      price: 80000,
      priceNote: 'Negotiable',
      area: 95,
      rooms: 0,
      latitude: 36.755,
      longitude: 3.0165,
      features: ['Air conditioning'],
      description:
        'Local commercial bien situé, idéal pour commerce de détail ou bureau. Visibilité sur rue principale.',
      floors: 'Ground floor',
      parkingSpots: 1,
      finishing: 'Finished',
      documents: 'Commercial lease',
      nearby: { hospital: false, school: false, supermarket: true, mosque: false, busStop: true, gym: false, park: false },
      agencyName: 'Kniss Realty',
      phoneNumber: DEMO_AGENCY,
      ownerId: DEMO_AGENCY,
      createdAt: daysAgo(3),
      postedDaysAgo: 3,
      boosted: false,
    },
    {
      id: '5',
      title: 'F4 vue dégagée',
      type: 'Apartment',
      listingType: 'Sell',
      price: 16500000,
      priceNote: 'Exchange accepted',
      area: 135,
      rooms: 4,
      latitude: 36.7555,
      longitude: 3.0195,
      features: ['Elevator', 'Parking'],
      description:
        'Appartement F4 avec vue dégagée, lumineux et bien agencé. Résidence avec ascenseur et parking sécurisé.',
      floors: '5th floor',
      parkingSpots: 1,
      finishing: 'Finished',
      documents: 'Notarial act',
      nearby: { hospital: true, school: true, supermarket: true, mosque: true, busStop: true, gym: true, park: true },
      agencyName: 'Agency ABC',
      phoneNumber: '+213556700011',
      ownerId: '+213556700011',
      createdAt: daysAgo(6),
      postedDaysAgo: 6,
      boosted: true,
    },
    {
      id: '6',
      title: 'Villa moderne',
      type: 'Villa',
      listingType: 'Sell',
      price: 32000000,
      priceNote: 'Fixed price',
      area: 240,
      rooms: 6,
      latitude: 36.75,
      longitude: 3.014,
      features: ['Pool', 'Garage'],
      description:
        'Villa moderne de standing avec piscine et double garage. Finitions haut de gamme dans un quartier prisé.',
      floors: 'RDC + 2',
      parkingSpots: 2,
      finishing: 'Finished',
      documents: 'Notarial act',
      nearby: { hospital: false, school: true, supermarket: false, mosque: true, busStop: false, gym: true, park: true },
      agencyName: 'Private seller',
      phoneNumber: '+213661223344',
      ownerId: '+213661223344',
      createdAt: daysAgo(14),
      postedDaysAgo: 14,
      boosted: false,
    },
  ];
}

// Seed leads: a buyer favouriting a listing pre-dates this data file, so
// these exist only here rather than as `favorites` on a seed buyer account.
function seedInterests() {
  return [
    { propertyId: '1', ownerId: DEMO_AGENCY, buyerPhone: '+213770112233', buyerName: 'Amine Kaci', createdAt: daysAgo(2) },
    { propertyId: '1', ownerId: DEMO_AGENCY, buyerPhone: '+213661445566', buyerName: 'Nadia Yahiaoui', createdAt: daysAgo(5) },
    { propertyId: '2', ownerId: DEMO_AGENCY, buyerPhone: '+213555998877', buyerName: 'Riad Belkacem', createdAt: daysAgo(1) },
    { propertyId: '3', ownerId: DEMO_INDIVIDUAL, buyerPhone: '+213770009988', buyerName: 'Sami Ferhat', createdAt: daysAgo(3) },
  ];
}

function buildDefaultData() {
  return { users: seedUsers(), properties: seedProperties(), interests: seedInterests() };
}

module.exports = { buildDefaultData };
