import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import SegmentedControl from '../components/SegmentedControl';
import Dropdown from '../components/Dropdown';
import WizardProgress from '../components/WizardProgress';
import { createProperty } from '../api/properties';
import { useLanguage } from '../context/LanguageContext';
import { isOnline } from '../utils/network';
import { formatPrice } from '../utils/format';
import { NEIGHBORHOODS, findNeighborhood } from '../constants/neighborhoods';

// Option lists for the dropdowns and chip groups.

const PROPERTY_TYPES = ['Villa', 'Apartment', 'Commercial', 'Land'];
const FLOORS = ['Ground floor', 'G+1', 'G+2', 'G+3', 'G+4', 'G+5', 'G+6', 'G+7'];
const APARTMENT_TYPES = [
  'Studio',
  '2-room',
  '3-room',
  '4-room',
  '5-room',
  '6-room',
  '7-room',
  '8-room',
  '9-room',
  '10-room',
];
const ROOM_COUNTS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
// "+6" is stored as 7 so it still coerces to a number server-side.
const PARKING_OPTIONS = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '+6', value: '7' },
];
const FINISHINGS = ['Finished', 'Semi-finished', 'Not finished'];

// Ownership-document options differ per property type; each list is taken
// straight from that type's mockup.
const DOCUMENTS_BY_TYPE = {
  Villa: [
    'Notarial act',
    'Real estate booklet',
    'Act in joint ownership',
    'Customary contract',
    'Decision',
    'Certificate of conformance',
  ],
  Apartment: ['Notarial act', 'Real estate booklet', 'Off-plan contract'],
  Commercial: ['Notarized deed', 'Land title', 'Off-plan sale contract'],
  Land: [
    'Land title',
    'Undivided ownership deed',
    'Stamped paper',
    'Official decision',
    'Building permit',
    'Compliance certificate',
    'Concession',
  ],
};

// The multi-select chips. Land has no "features" as such; its equivalent is
// which utilities are connected, and those ride in the same features array.
const FEATURES_BY_TYPE = {
  Villa: [
    'Furnished',
    'Air conditioning',
    'Central heating',
    'Water tank',
    'Garden',
    'Garage',
    'Pool',
    'Elevator',
  ],
  Apartment: [
    'Furnished',
    'Equipped kitchen',
    'Air conditioning',
    'Central heating',
    'Water tank',
    'Master suite',
    'Terrace',
    'Elevator',
    'Playground',
    'Pool',
    'Gym',
  ],
  Commercial: ['Air conditioning', 'Water tank', 'Terrace'],
  Land: ['Gas', 'Water', 'Electricity'],
};

// Title placeholder, negotiability and amenity display text are translated at
// the point of use (see TITLE_PLACEHOLDER_KEY, NEGOTIABILITY_KEYS and
// AMENITY_ROWS below): these are module-level constants with no hook of
// their own, so what they hold is dictionary key names, not the copy itself.
const TITLE_PLACEHOLDER_KEY = {
  Villa: 'wizard.about.titlePlaceholderVilla',
  Apartment: 'wizard.about.titlePlaceholderApartment',
  Commercial: 'wizard.about.titlePlaceholderCommercial',
  Land: 'wizard.about.titlePlaceholderLand',
};

const NEGOTIABILITY_KEYS = [
  { labelKey: 'wizard.about.negotiableYes', value: 'Negotiable' },
  { labelKey: 'wizard.about.negotiableNo', value: 'Fixed price' },
  { labelKey: 'wizard.about.negotiableExchange', value: 'Exchange accepted' },
];
const AMENITY_ROWS = [
  { key: 'hospital', labelKey: 'amenity.hospital' },
  { key: 'school', labelKey: 'amenity.school' },
  { key: 'supermarket', labelKey: 'amenity.supermarket' },
  { key: 'mosque', labelKey: 'amenity.mosque' },
  { key: 'busStop', labelKey: 'amenity.busStop' },
  { key: 'gym', labelKey: 'amenity.gym' },
  { key: 'park', labelKey: 'amenity.park' },
];
const MAX_PHOTOS = 6;
// Photos travel to the server as base64 inside the JSON body, so a few
// full-resolution pictures overflow the request size limit (a 413). Downscale
// and recompress each one first: a 1280px-wide JPEG lands around 100 to 200 KB.
const PHOTO_MAX_WIDTH = 1280;
const PHOTO_COMPRESS = 0.5;

async function compressToDataUri(uri, sourceWidth) {
  const targetWidth = Math.min(sourceWidth || PHOTO_MAX_WIDTH, PHOTO_MAX_WIDTH);
  const rendered = await ImageManipulator.manipulate(uri)
    .resize({ width: targetWidth })
    .renderAsync();
  const { base64 } = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: PHOTO_COMPRESS,
    base64: true,
  });
  return `data:image/jpeg;base64,${base64}`;
}

const EMPTY_FORM = {
  listingType: 'Sell',
  type: null,
  title: '',
  description: '',
  landArea: '',
  area: '',
  price: '',
  priceNote: 'Fixed price',
  floors: '',
  apartmentType: '',
  rooms: '',
  parkingSpots: '',
  features: [],
  finishing: '',
  documents: '',
  nearby: { hospital: false, school: false, supermarket: false, mosque: false, busStop: false, gym: false, park: false },
  photos: [],
  locationMode: 'current',
  neighborhood: null,
  location: null,
};

// Step order. Titles for "Tell buyers…", "What's nearby", "Add property
// photos" and "Review your listing" come from the spec; the rest are named
// to match. Progress % is evenly spread (no mockup to pin exact values to).
const STEPS = ['listingType', 'type', 'about', 'features', 'nearby', 'photos', 'location', 'review'];

export default function PostListingWizard({ navigation, token }) {
  const { t, tType } = useLanguage();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [locating, setLocating] = useState(false);
  // Blocks a double-tap on Post from firing two POSTs during the async
  // isOnline() check, before submitting state has re-rendered the button.
  const submitLock = useRef(false);

  const update = (patch) => setForm((current) => ({ ...current, ...patch }));

  function goBack() {
    if (step > 0) {
      setError(null);
      setStep(step - 1);
    }
  }

  function next() {
    setError(null);
    setStep(step + 1);
  }

  function jumpTo(target) {
    setError(null);
    setStep(target);
  }

  function chooseType(type) {
    update({ type });
    next();
  }

  async function addPhotos() {
    setError(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError(t('wizard.errorPhotoPermission'));
      return;
    }
    const remaining = MAX_PHOTOS - form.photos.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    if (result.canceled || !result.assets?.length) return;
    try {
      const compressed = await Promise.all(
        result.assets.map((asset) => compressToDataUri(asset.uri, asset.width))
      );
      update({ photos: [...form.photos, ...compressed].slice(0, MAX_PHOTOS) });
    } catch (photoError) {
      setError(t('wizard.errorPhotoProcess'));
    }
  }

  async function useCurrentLocation() {
    setLocating(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(t('wizard.errorLocationPermission'));
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      update({
        location: { latitude: position.coords.latitude, longitude: position.coords.longitude },
        neighborhood: null,
      });
    } catch (locationError) {
      setError(t('wizard.errorLocationFailed'));
    } finally {
      setLocating(false);
    }
  }

  function pickNeighborhood(name) {
    const match = findNeighborhood(name);
    if (!match) return;
    update({ neighborhood: name, location: { latitude: match.latitude, longitude: match.longitude } });
  }

  // Land collects a single Land Area; every other type's required size field
  // is the built/usable Area.
  const requiredArea = form.type === 'Land' ? form.landArea : form.area;
  const canProceed = {
    listingType: () => true,
    type: () => !!form.type,
    about: () => form.title.trim() && form.price.trim() && String(requiredArea).trim(),
    features: () => true,
    nearby: () => true,
    photos: () => true,
    location: () => !!form.location,
    review: () => true,
  }[STEPS[step]]();

  async function handleSubmit() {
    if (submitLock.current) return;
    submitLock.current = true;
    setError(null);
    if (!(await isOnline())) {
      submitLock.current = false;
      setError(t('wizard.offlineError'));
      return;
    }
    setSubmitting(true);
    try {
      const { property } = await createProperty(
        {
          listingType: form.listingType,
          type: form.type,
          title: form.title.trim(),
          description: form.description.trim(),
          landArea: Number(form.landArea) || 0,
          area: Number(form.area) || 0,
          price: Number(form.price),
          priceNote: form.priceNote,
          // Apartments have no "floors"; their structural descriptor is the
          // apartment type (Studio, 3-room), which reuses the same field.
          floors:
            (form.type === 'Apartment' ? form.apartmentType : form.floors) || undefined,
          rooms: Number(form.rooms) || 0,
          parkingSpots: Number(form.parkingSpots) || 0,
          features: form.features,
          finishing: form.finishing || undefined,
          documents: form.documents || undefined,
          nearby: form.nearby,
          neighborhood: form.neighborhood || undefined,
          photos: form.photos,
          latitude: form.location.latitude,
          longitude: form.location.longitude,
        },
        token
      );
      setForm(EMPTY_FORM);
      setStep(0);
      submitLock.current = false;
      navigation.navigate('ListingPosted', { property });
    } catch (submitError) {
      submitLock.current = false;
      setError(submitError.message);
      setSubmitting(false);
    }
  }

  const percent = ((step + 1) / STEPS.length) * 100;
  const isReview = STEPS[step] === 'review';
  const hideFooter = STEPS[step] === 'type';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {step > 0 ? (
          <TouchableOpacity
            onPress={goBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color="#1c1c1c" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        <WizardProgress percent={percent} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <StepBody
          stepKey={STEPS[step]}
          form={form}
          update={update}
          chooseType={chooseType}
          addPhotos={addPhotos}
          useCurrentLocation={useCurrentLocation}
          pickNeighborhood={pickNeighborhood}
          locating={locating}
          jumpTo={jumpTo}
          t={t}
          tType={tType}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      {!hideFooter && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerButton, (!canProceed || submitting) && styles.footerButtonDisabled]}
            onPress={isReview ? handleSubmit : next}
            disabled={!canProceed || submitting}
            accessibilityRole="button"
            accessibilityLabel={isReview ? t('wizard.post') : t('common.next')}
          >
            <Text style={[styles.footerButtonText, isReview && styles.footerButtonTextPost]}>
              {isReview ? (submitting ? t('wizard.posting') : t('wizard.post')) : t('common.next')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// Step body components, one per wizard step.

function StepBody(props) {
  switch (props.stepKey) {
    case 'listingType':
      return <StepListingType {...props} />;
    case 'type':
      return <StepType {...props} />;
    case 'about':
      return <StepAbout {...props} />;
    case 'features':
      return <StepFeatures {...props} />;
    case 'nearby':
      return <StepNearby {...props} />;
    case 'photos':
      return <StepPhotos {...props} />;
    case 'location':
      return <StepLocation {...props} />;
    case 'review':
      return <StepReview {...props} />;
    default:
      return null;
  }
}

function StepShell({ title, subtitle, children }) {
  return (
    <>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </>
  );
}

function Field({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function StepListingType({ form, update, t }) {
  return (
    <StepShell title={t('wizard.listingType.title')} subtitle={t('wizard.listingType.subtitle')}>
      <SegmentedControl
        value={form.listingType}
        onChange={(listingType) => update({ listingType })}
        options={[
          { value: 'Sell', label: t('common.sale') },
          { value: 'Rent', label: t('common.rent') },
        ]}
      />
    </StepShell>
  );
}

function StepType({ form, chooseType, tType, t }) {
  return (
    <StepShell title={t('wizard.type.title')} subtitle={t('wizard.type.subtitle')}>
      <View style={styles.typeGrid}>
        {PROPERTY_TYPES.map((type) => {
          const active = form.type === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.typeTile, active && styles.typeTileActive]}
              onPress={() => chooseType(type)}
              accessibilityRole="button"
              accessibilityLabel={tType(type)}
            >
              <Ionicons
                name={
                  type === 'Villa'
                    ? 'home-outline'
                    : type === 'Apartment'
                    ? 'business-outline'
                    : type === 'Commercial'
                    ? 'storefront-outline'
                    : 'map-outline'
                }
                size={22}
                color="#1c1c1c"
              />
              <Text style={styles.typeTileText}>{tType(type)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </StepShell>
  );
}

function StepAbout({ form, update, t }) {
  const { type } = form;
  const areaInput = (label, placeholder, key) => (
    <Field label={label}>
      <TextInput
        style={styles.input}
        value={form[key]}
        onChangeText={(v) => update({ [key]: v.replace(/\D/g, '') })}
        placeholder={placeholder}
        keyboardType="number-pad"
      />
    </Field>
  );

  return (
    <StepShell title={t('wizard.about.title')} subtitle={t('wizard.about.subtitle')}>
      <Field label={t('wizard.about.titleLabel')}>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(title) => update({ title })}
          placeholder={t(TITLE_PLACEHOLDER_KEY[type] || 'wizard.about.titlePlaceholderDefault')}
        />
      </Field>
      <Field label={t('wizard.about.descriptionLabel')}>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={(description) => update({ description })}
          placeholder={t('wizard.about.descriptionPlaceholder')}
          multiline
        />
      </Field>

      {type === 'Villa' ? (
        <View style={styles.row}>
          <View style={styles.rowItem}>{areaInput(t('wizard.about.landAreaLabel'), '300', 'landArea')}</View>
          <View style={styles.rowItem}>{areaInput(t('wizard.about.builtAreaLabel'), '210', 'area')}</View>
        </View>
      ) : type === 'Land' ? (
        areaInput(t('wizard.about.landAreaLabel'), '300', 'landArea')
      ) : (
        areaInput(
          t(type === 'Apartment' ? 'wizard.about.apartmentAreaLabel' : 'wizard.about.areaLabel'),
          '120',
          'area'
        )
      )}

      <Field label={t('wizard.about.priceLabel')}>
        <TextInput
          style={styles.input}
          value={form.price}
          onChangeText={(price) => update({ price: price.replace(/\D/g, '') })}
          placeholder="28000000"
          keyboardType="number-pad"
        />
      </Field>
      <Field label={t('wizard.about.negotiabilityLabel')}>
        <Dropdown
          value={form.priceNote}
          options={NEGOTIABILITY_KEYS.map((entry) => ({ label: t(entry.labelKey), value: entry.value }))}
          onSelect={(priceNote) => update({ priceNote })}
          accessibilityLabel={t('wizard.about.negotiabilityLabel')}
        />
      </Field>
    </StepShell>
  );
}

function StepFeatures({ form, update, t }) {
  const { type } = form;
  const featureList = FEATURES_BY_TYPE[type] || [];
  const documentList = DOCUMENTS_BY_TYPE[type] || [];
  const choose = t('wizard.features.choose');

  function toggleFeature(feature) {
    update({
      features: form.features.includes(feature)
        ? form.features.filter((f) => f !== feature)
        : [...form.features, feature],
    });
  }

  return (
    <StepShell title={t('wizard.features.title')} subtitle={t('wizard.features.subtitle')}>
      {type === 'Villa' && (
        <Field label={t('wizard.features.floorsLabel')}>
          <Dropdown
            value={form.floors}
            placeholder={choose}
            options={FLOORS}
            onSelect={(floors) => update({ floors })}
            accessibilityLabel={t('wizard.features.floorsLabel')}
          />
        </Field>
      )}

      {type === 'Apartment' && (
        <>
          <Field label={t('wizard.features.apartmentTypeLabel')}>
            <Dropdown
              value={form.apartmentType}
              placeholder={choose}
              options={APARTMENT_TYPES}
              onSelect={(apartmentType) => update({ apartmentType })}
              accessibilityLabel={t('wizard.features.apartmentTypeLabel')}
            />
          </Field>
          <Field label={t('wizard.features.roomsLabel')}>
            <Dropdown
              value={form.rooms}
              placeholder={choose}
              options={ROOM_COUNTS}
              onSelect={(rooms) => update({ rooms })}
              accessibilityLabel={t('wizard.features.roomsLabel')}
            />
          </Field>
        </>
      )}

      <Field label={t(type === 'Land' ? 'wizard.features.utilitiesLabel' : 'wizard.features.featuresLabel')}>
        <View style={styles.chipWrap}>
          {featureList.map((feature) => {
            const on = form.features.includes(feature);
            return (
              <TouchableOpacity
                key={feature}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => toggleFeature(feature)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={feature}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{feature}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Field>

      {type === 'Apartment' && (
        <Field label={t('wizard.features.parkingLabel')}>
          <Dropdown
            value={form.parkingSpots}
            placeholder={choose}
            options={PARKING_OPTIONS}
            onSelect={(parkingSpots) => update({ parkingSpots })}
            accessibilityLabel={t('wizard.features.parkingLabel')}
          />
        </Field>
      )}

      {type !== 'Land' && (
        <Field label={t('wizard.features.finishingLabel')}>
          <Dropdown
            value={form.finishing}
            placeholder={choose}
            options={FINISHINGS}
            onSelect={(finishing) => update({ finishing })}
            accessibilityLabel={t('wizard.features.finishingLabel')}
          />
        </Field>
      )}

      <Field label={t('wizard.features.documentsLabel')}>
        <Dropdown
          value={form.documents}
          placeholder={choose}
          options={documentList}
          onSelect={(documents) => update({ documents })}
          accessibilityLabel={t('wizard.features.documentsLabel')}
        />
      </Field>
    </StepShell>
  );
}

function StepNearby({ form, update, t }) {
  return (
    <StepShell title={t('wizard.nearby.title')} subtitle={t('wizard.nearby.subtitle')}>
      <View style={styles.amenityCard}>
        {AMENITY_ROWS.map(({ key, labelKey }, index) => (
          <View
            key={key}
            style={[styles.amenityRow, index < AMENITY_ROWS.length - 1 && styles.amenityDivider]}
          >
            <Text style={styles.amenityLabel}>{t(labelKey)}</Text>
            <Switch
              value={form.nearby[key]}
              onValueChange={(value) => update({ nearby: { ...form.nearby, [key]: value } })}
              trackColor={{ true: '#c8ec4a', false: '#d3d1c7' }}
              thumbColor="#ffffff"
              accessibilityLabel={t(labelKey)}
            />
          </View>
        ))}
      </View>
    </StepShell>
  );
}

function StepPhotos({ form, update, addPhotos, t }) {
  return (
    <StepShell title={t('wizard.photos.title')} subtitle={t('wizard.photos.subtitle', { max: MAX_PHOTOS })}>
      <View style={styles.photoGrid}>
        {form.photos.map((uri, index) => (
          <View key={`${uri.slice(-16)}-${index}`} style={styles.photoTile}>
            <Image source={{ uri }} style={styles.photoThumb} />
            <TouchableOpacity
              style={styles.photoRemove}
              onPress={() => update({ photos: form.photos.filter((_, j) => j !== index) })}
              accessibilityRole="button"
              accessibilityLabel={t('wizard.photos.removePhoto', { n: index + 1 })}
            >
              <Ionicons name="close" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ))}
        {form.photos.length < MAX_PHOTOS && (
          <TouchableOpacity
            style={[styles.photoTile, styles.photoAdd]}
            onPress={addPhotos}
            accessibilityRole="button"
            accessibilityLabel={t('wizard.photos.addPhotos')}
          >
            <Ionicons name="add" size={26} color="#8a8878" />
          </TouchableOpacity>
        )}
      </View>
    </StepShell>
  );
}

function StepLocation({ form, update, useCurrentLocation, pickNeighborhood, locating, t }) {
  return (
    <StepShell title={t('wizard.location.title')} subtitle={t('wizard.location.subtitle')}>
      <SegmentedControl
        value={form.locationMode}
        onChange={(locationMode) => update({ locationMode })}
        options={[
          { value: 'current', label: t('wizard.location.useCurrent') },
          { value: 'neighborhood', label: t('wizard.location.chooseNeighborhood') },
        ]}
      />

      {form.locationMode === 'current' ? (
        <TouchableOpacity
          style={styles.locationButton}
          onPress={useCurrentLocation}
          disabled={locating}
          accessibilityRole="button"
        >
          <Text style={styles.locationButtonText}>
            {locating
              ? t('wizard.location.finding')
              : form.location && !form.neighborhood
              ? t('wizard.location.setAt', {
                  lat: form.location.latitude.toFixed(4),
                  lon: form.location.longitude.toFixed(4),
                })
              : t('wizard.location.useCurrent')}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.field}>
          <Dropdown
            value={form.neighborhood}
            placeholder={t('wizard.location.chooseNeighborhood')}
            options={NEIGHBORHOODS.map((n) => n.name)}
            onSelect={pickNeighborhood}
            accessibilityLabel={t('radiusPicker.neighborhoodA11y')}
          />
        </View>
      )}
    </StepShell>
  );
}

// Review step: an editable summary of everything collected so far.

function ReviewSection({ title, onEdit, children, t }) {
  return (
    <View style={styles.reviewSection}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewTitle}>{title}</Text>
        <TouchableOpacity
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={t('wizard.review.editA11y', { section: title })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="pencil" size={16} color="#5f5e5a" />
        </TouchableOpacity>
      </View>
      <View style={styles.reviewCard}>{children}</View>
    </View>
  );
}

function ReviewRow({ label, value }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value || '—'}</Text>
    </View>
  );
}

function StepReview({ form, jumpTo, t, tType }) {
  const { type } = form;
  const negotiabilityLabel =
    t(NEGOTIABILITY_KEYS.find((n) => n.value === form.priceNote)?.labelKey) || form.priceNote;
  const nearbyYes = AMENITY_ROWS.filter(({ key }) => form.nearby[key]).map((a) => t(a.labelKey));
  const parkingLabel = PARKING_OPTIONS.find((o) => o.value === form.parkingSpots)?.label;
  const primaryAreaLabel = t(
    type === 'Villa' ? 'wizard.review.builtArea' : type === 'Apartment' ? 'wizard.review.apartmentArea' : 'wizard.review.areaLabel'
  );

  return (
    <StepShell title={t('wizard.review.title')} subtitle={t('wizard.review.subtitle')}>
      <ReviewSection t={t} title={t('wizard.review.listingTypeSection')} onEdit={() => jumpTo(0)}>
        <ReviewRow label={t('wizard.review.for')} value={t(form.listingType === 'Rent' ? 'common.rent' : 'common.sale')} />
      </ReviewSection>

      <ReviewSection t={t} title={t('wizard.review.propertyTypeSection')} onEdit={() => jumpTo(1)}>
        <ReviewRow label={t('wizard.review.typeLabel')} value={tType(form.type)} />
      </ReviewSection>

      <ReviewSection t={t} title={t('wizard.review.aboutSection')} onEdit={() => jumpTo(2)}>
        <ReviewRow label={t('wizard.review.titleLabel')} value={form.title} />
        <ReviewRow label={t('wizard.review.descriptionLabel')} value={form.description} />
        {type === 'Villa' || type === 'Land' ? (
          <ReviewRow label={t('wizard.review.landAreaLabel')} value={form.landArea ? `${form.landArea} m²` : ''} />
        ) : null}
        {type !== 'Land' ? (
          <ReviewRow label={primaryAreaLabel} value={form.area ? `${form.area} m²` : ''} />
        ) : null}
        <ReviewRow
          label={t('wizard.review.priceLabel')}
          value={form.price ? formatPrice(Number(form.price), form.listingType) : ''}
        />
        <ReviewRow label={t('wizard.review.negotiabilityLabel')} value={negotiabilityLabel} />
      </ReviewSection>

      <ReviewSection t={t} title={t('wizard.review.featuresSection')} onEdit={() => jumpTo(3)}>
        {type === 'Villa' ? <ReviewRow label={t('wizard.review.floorsLabel')} value={form.floors} /> : null}
        {type === 'Apartment' ? (
          <>
            <ReviewRow label={t('wizard.review.apartmentTypeLabel')} value={form.apartmentType} />
            <ReviewRow label={t('wizard.review.roomsLabel')} value={form.rooms} />
          </>
        ) : null}
        <ReviewRow
          label={t(type === 'Land' ? 'wizard.review.utilitiesLabel' : 'wizard.review.featuresLabel')}
          value={form.features.join(', ')}
        />
        {type === 'Apartment' ? <ReviewRow label={t('wizard.review.parkingLabel')} value={parkingLabel} /> : null}
        {type !== 'Land' ? <ReviewRow label={t('wizard.review.finishingLabel')} value={form.finishing} /> : null}
        <ReviewRow label={t('wizard.review.documentsLabel')} value={form.documents} />
      </ReviewSection>

      <ReviewSection t={t} title={t('wizard.review.nearbySection')} onEdit={() => jumpTo(4)}>
        <ReviewRow
          label={t('wizard.review.nearbyLabel')}
          value={nearbyYes.length ? nearbyYes.join(', ') : t('wizard.review.noneSelected')}
        />
      </ReviewSection>

      <ReviewSection t={t} title={t('wizard.review.photosSection')} onEdit={() => jumpTo(5)}>
        {form.photos.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewPhotos}>
            {form.photos.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.reviewPhoto} />
            ))}
          </ScrollView>
        ) : (
          <ReviewRow label={t('wizard.review.photosLabel')} value={t('wizard.review.noneAdded')} />
        )}
      </ReviewSection>

      <ReviewSection t={t} title={t('wizard.review.locationSection')} onEdit={() => jumpTo(6)}>
        <ReviewRow label={t('wizard.review.whereLabel')} value={form.neighborhood || t('wizard.review.currentLocation')} />
        <ReviewRow
          label={t('wizard.review.coordinatesLabel')}
          value={
            form.location
              ? `${form.location.latitude.toFixed(4)}, ${form.location.longitude.toFixed(4)}`
              : ''
          }
        />
      </ReviewSection>
    </StepShell>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#1c1c1c' },
  subtitle: { fontSize: 13, color: '#8a8878', marginTop: 6, marginBottom: 16, lineHeight: 18 },

  field: { marginTop: 14 },
  label: { fontSize: 13, color: '#5f5e5a', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1c1c1c',
  },
  textArea: { height: 88, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  typeTile: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 12,
    paddingVertical: 22,
    alignItems: 'center',
    marginBottom: 12,
  },
  typeTileActive: { borderColor: '#1c1c1c', backgroundColor: '#f7f6f1' },
  typeTileText: { fontSize: 14, fontWeight: '600', color: '#1c1c1c', marginTop: 8 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f1efe8',
  },
  chipOn: { backgroundColor: '#1c1c1c', borderColor: '#1c1c1c' },
  chipText: { fontSize: 13, color: '#1c1c1c' },
  chipTextOn: { color: '#ffffff', fontWeight: '600' },

  amenityCard: {
    borderWidth: 1,
    borderColor: '#f1efe8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  amenityDivider: { borderBottomWidth: 1, borderBottomColor: '#f1efe8' },
  amenityLabel: { fontSize: 14, color: '#1c1c1c' },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoTile: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f1efe8',
  },
  photoThumb: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(28, 28, 28, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdd: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d3d1c7',
    backgroundColor: '#f7f6f1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  locationButton: {
    borderWidth: 1,
    borderColor: '#d3d1c7',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  locationButtonText: { fontSize: 14, color: '#1c1c1c', fontWeight: '600' },

  reviewSection: { marginTop: 18 },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewTitle: { fontSize: 15, fontWeight: '700', color: '#1c1c1c' },
  reviewCard: { borderWidth: 1, borderColor: '#f1efe8', borderRadius: 12 },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1efe8',
  },
  reviewLabel: { fontSize: 13, color: '#8a8878' },
  reviewValue: {
    fontSize: 13,
    color: '#1c1c1c',
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
  reviewPhotos: { padding: 12 },
  reviewPhoto: { width: 64, height: 64, borderRadius: 8, marginRight: 8 },

  error: { color: '#c0453c', fontSize: 13, marginTop: 16, lineHeight: 18 },

  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f1efe8',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  footerButton: {
    backgroundColor: '#1c1c1c',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerButtonDisabled: { backgroundColor: '#d3d1c7' },
  footerButtonText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  footerButtonTextPost: { color: '#ffffff' },
});
