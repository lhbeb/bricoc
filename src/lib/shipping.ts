export interface ShippingData {
  fullName?: string;
  countryCode: string;
  country: string;
  streetAddress: string;
  addressLine2: string;
  city: string;
  zipCode: string;
  state: string;
  email: string;
}

export interface CountryOption {
  code: string;
  name: string;
}

interface RegionOption {
  code: string;
  name: string;
}

export interface AddressConfig {
  streetLabel: string;
  streetPlaceholder: string;
  line2Label: string;
  line2Placeholder: string;
  cityLabel: string;
  cityPlaceholder: string;
  stateLabel: string;
  statePlaceholder: string;
  zipLabel: string;
  zipPlaceholder: string;
  zipPattern: string;
  zipTitle: string;
  zipMaxLength: number;
  zipInputMode: 'text' | 'numeric';
  regions: RegionOption[];
  postalBeforeCity?: boolean;
}

const PAYPAL_ELIGIBLE_COUNTRY_CODES = [
  'US', 'CA', 'FR', 'DE', 'AU', 'NZ', 'IT', 'NL', 'PT', 'ES', 'PL', 'AT',
];
const FEATURED_COUNTRY_CODES = PAYPAL_ELIGIBLE_COUNTRY_CODES;

const ISO_COUNTRY_CODES = `
AD AE AF AG AI AL AM AO AQ AR AS AT AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA
GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP
KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR
MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE
RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR
TT TV TW TZ UA UG UM UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW
`.trim().split(/\s+/);

const countryDisplayNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

function countryName(code: string): string {
  const featuredNames: Record<string, string> = {
    US: 'United States',
    CA: 'Canada',
    FR: 'France',
    DE: 'Germany',
    AU: 'Australia',
    NZ: 'New Zealand',
    IT: 'Italy',
    NL: 'Netherlands',
    PT: 'Portugal',
    ES: 'Spain',
    PL: 'Poland',
    AT: 'Austria',
  };

  return featuredNames[code] || countryDisplayNames?.of(code) || code;
}

export const PAYPAL_ELIGIBLE_COUNTRIES: CountryOption[] = PAYPAL_ELIGIBLE_COUNTRY_CODES.map(code => ({
  code,
  name: countryName(code),
}));

export const FEATURED_COUNTRIES: CountryOption[] = PAYPAL_ELIGIBLE_COUNTRIES;

export const OTHER_COUNTRIES: CountryOption[] = ISO_COUNTRY_CODES
  .filter(code => !FEATURED_COUNTRY_CODES.includes(code))
  .map(code => ({ code, name: countryName(code) }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const ALL_COUNTRIES: CountryOption[] = [...FEATURED_COUNTRIES, ...OTHER_COUNTRIES];

const US_REGIONS: RegionOption[] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'],
  ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'],
  ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'],
  ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
].map(([code, name]) => ({ code, name }));

const CANADIAN_REGIONS: RegionOption[] = [
  ['AB', 'Alberta'], ['BC', 'British Columbia'], ['MB', 'Manitoba'], ['NB', 'New Brunswick'],
  ['NL', 'Newfoundland and Labrador'], ['NT', 'Northwest Territories'], ['NS', 'Nova Scotia'],
  ['NU', 'Nunavut'], ['ON', 'Ontario'], ['PE', 'Prince Edward Island'], ['QC', 'Quebec'],
  ['SK', 'Saskatchewan'], ['YT', 'Yukon'],
].map(([code, name]) => ({ code, name }));

const AUSTRALIAN_REGIONS: RegionOption[] = [
  ['NSW', 'New South Wales'], ['VIC', 'Victoria'], ['QLD', 'Queensland'], ['WA', 'Western Australia'],
  ['SA', 'South Australia'], ['TAS', 'Tasmania'], ['ACT', 'Australian Capital Territory'],
  ['NT', 'Northern Territory'],
].map(([code, name]) => ({ code, name }));

const NZ_REGIONS: RegionOption[] = [
  'Auckland', 'Bay of Plenty', 'Canterbury', 'Gisborne', 'Hawke\'s Bay', 'Manawatu-Wanganui',
  'Marlborough', 'Nelson', 'Northland', 'Otago', 'Southland', 'Taranaki', 'Tasman',
  'Waikato', 'Wellington', 'West Coast',
].map(name => ({ code: name, name }));

const GERMAN_REGIONS: RegionOption[] = [
  'Baden-Wurttemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse',
  'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate',
  'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia',
].map(name => ({ code: name, name }));

const FRENCH_REGIONS: RegionOption[] = [
  'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne', 'Centre-Val de Loire',
  'Corse', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandie',
  'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur',
].map(name => ({ code: name, name }));

const ITALIAN_REGIONS: RegionOption[] = [
  'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli Venezia Giulia', 'Lazio', 'Liguria', 'Lombardy', 'Marche', 'Molise',
  'Piedmont', 'Puglia', 'Sardinia', 'Sicily', 'Trentino-Alto Adige', 'Tuscany',
  'Umbria', 'Veneto', 'Aosta Valley',
].map(name => ({ code: name, name }));

const NETHERLANDS_REGIONS: RegionOption[] = [
  'Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen', 'Limburg',
  'North Brabant', 'North Holland', 'Overijssel', 'South Holland', 'Utrecht', 'Zeeland',
].map(name => ({ code: name, name }));

const PORTUGUESE_REGIONS: RegionOption[] = [
  'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra', 'Évora',
  'Faro', 'Guarda', 'Leiria', 'Lisbon', 'Portalegre', 'Porto', 'Santarém',
  'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu',
  'Azores', 'Madeira',
].map(name => ({ code: name, name }));

const SPANISH_REGIONS: RegionOption[] = [
  'Andalusia', 'Aragon', 'Asturias', 'Balearic Islands', 'Basque Country',
  'Canary Islands', 'Cantabria', 'Castile and León', 'Castilla-La Mancha',
  'Catalonia', 'Extremadura', 'Galicia', 'La Rioja', 'Madrid',
  'Murcia', 'Navarre', 'Valencian Community',
].map(name => ({ code: name, name }));

const POLISH_REGIONS: RegionOption[] = [
  'Greater Poland', 'Kuyavian-Pomeranian', 'Lesser Poland', 'Łódź', 'Lower Silesian',
  'Lublin', 'Lubusz', 'Masovian', 'Opole', 'Podkarpackie', 'Podlaskie',
  'Pomeranian', 'Silesian', 'Świętokrzyskie', 'Warmian-Masurian', 'West Pomeranian',
].map(name => ({ code: name, name }));

const AUSTRIAN_REGIONS: RegionOption[] = [
  'Burgenland', 'Carinthia', 'Lower Austria', 'Salzburg', 'Styria',
  'Tyrol', 'Upper Austria', 'Vienna', 'Vorarlberg',
].map(name => ({ code: name, name }));

const GENERIC_CONFIG: AddressConfig = {
  streetLabel: 'Street address *',
  streetPlaceholder: 'Street name and building number',
  line2Label: 'Apartment, suite, or unit',
  line2Placeholder: 'Optional',
  cityLabel: 'City *',
  cityPlaceholder: 'Enter your city',
  stateLabel: 'State / Province / Region *',
  statePlaceholder: 'Enter your state, province, or region',
  zipLabel: 'Postal code *',
  zipPlaceholder: 'Enter your postal code',
  zipPattern: '[A-Za-z0-9][A-Za-z0-9\\s-]{2,11}',
  zipTitle: 'Enter a valid postal code',
  zipMaxLength: 12,
  zipInputMode: 'text',
  regions: [],
};

const ADDRESS_CONFIGS: Record<string, AddressConfig> = {
  US: {
    ...GENERIC_CONFIG,
    cityLabel: 'City *',
    stateLabel: 'State *',
    statePlaceholder: 'Select or enter a state',
    zipLabel: 'ZIP code *',
    zipPlaceholder: 'e.g. 10001',
    zipPattern: '\\d{5}(-\\d{4})?',
    zipTitle: 'Enter a 5-digit ZIP code or ZIP+4',
    zipMaxLength: 10,
    regions: US_REGIONS,
  },
  CA: {
    ...GENERIC_CONFIG,
    stateLabel: 'Province / Territory *',
    statePlaceholder: 'Select or enter a province',
    zipLabel: 'Postal code *',
    zipPlaceholder: 'e.g. M5V 3A8',
    zipPattern: '[A-Za-z]\\d[A-Za-z][ -]?\\d[A-Za-z]\\d',
    zipTitle: 'Enter a valid Canadian postal code',
    zipMaxLength: 7,
    regions: CANADIAN_REGIONS,
  },
  AU: {
    ...GENERIC_CONFIG,
    cityLabel: 'Suburb / City *',
    cityPlaceholder: 'Enter your suburb or city',
    stateLabel: 'State / Territory *',
    statePlaceholder: 'Select or enter a state',
    zipLabel: 'Postcode *',
    zipPlaceholder: 'e.g. 2000',
    zipPattern: '\\d{4}',
    zipTitle: 'Enter a 4-digit Australian postcode',
    zipMaxLength: 4,
    zipInputMode: 'numeric',
    regions: AUSTRALIAN_REGIONS,
  },
  DE: {
    ...GENERIC_CONFIG,
    streetLabel: 'Street and house number *',
    streetPlaceholder: 'e.g. Musterstrasse 12',
    line2Label: 'Apartment, floor, or c/o',
    cityLabel: 'City *',
    stateLabel: 'Federal state *',
    statePlaceholder: 'Select or enter a federal state',
    zipLabel: 'Postal code *',
    zipPlaceholder: 'e.g. 10115',
    zipPattern: '\\d{5}',
    zipTitle: 'Enter a 5-digit German postal code',
    zipMaxLength: 5,
    zipInputMode: 'numeric',
    regions: GERMAN_REGIONS,
    postalBeforeCity: true,
  },
  FR: {
    ...GENERIC_CONFIG,
    streetLabel: 'Street address *',
    streetPlaceholder: 'e.g. 12 Rue de Rivoli',
    line2Label: 'Apartment, building, floor',
    cityLabel: 'City *',
    cityPlaceholder: 'e.g. Paris',
    stateLabel: 'Region *',
    statePlaceholder: 'Select or enter a region',
    zipLabel: 'Postal code *',
    zipPlaceholder: 'e.g. 75001',
    zipPattern: '\\d{5}',
    zipTitle: 'Enter a 5-digit French postal code',
    zipMaxLength: 5,
    zipInputMode: 'numeric',
    regions: FRENCH_REGIONS,
    postalBeforeCity: true,
  },
  NZ: {
    ...GENERIC_CONFIG,
    cityLabel: 'Suburb / City *',
    cityPlaceholder: 'Enter your suburb or city',
    stateLabel: 'Region *',
    statePlaceholder: 'Select or enter a region',
    zipLabel: 'Postcode *',
    zipPlaceholder: 'e.g. 1010',
    zipPattern: '\\d{4}',
    zipTitle: 'Enter a 4-digit New Zealand postcode',
    zipMaxLength: 4,
    zipInputMode: 'numeric',
    regions: NZ_REGIONS,
  },
  IT: {
    ...GENERIC_CONFIG,
    streetLabel: 'Street address *',
    streetPlaceholder: 'e.g. Via Roma 1',
    line2Label: 'Apartment, floor, or c/o',
    cityLabel: 'City *',
    cityPlaceholder: 'e.g. Rome',
    stateLabel: 'Region *',
    statePlaceholder: 'Select or enter a region',
    zipLabel: 'CAP (Postal code) *',
    zipPlaceholder: 'e.g. 00100',
    zipPattern: '\\d{5}',
    zipTitle: 'Enter a 5-digit Italian postal code (CAP)',
    zipMaxLength: 5,
    zipInputMode: 'numeric',
    regions: ITALIAN_REGIONS,
    postalBeforeCity: true,
  },
  NL: {
    ...GENERIC_CONFIG,
    streetLabel: 'Street and house number *',
    streetPlaceholder: 'e.g. Keizersgracht 123',
    line2Label: 'Apartment, floor',
    cityLabel: 'City *',
    cityPlaceholder: 'e.g. Amsterdam',
    stateLabel: 'Province *',
    statePlaceholder: 'Select or enter a province',
    zipLabel: 'Postal code *',
    zipPlaceholder: 'e.g. 1012 AB',
    zipPattern: '\\d{4}\\s?[A-Za-z]{2}',
    zipTitle: 'Enter a valid Dutch postal code (e.g. 1012 AB)',
    zipMaxLength: 7,
    regions: NETHERLANDS_REGIONS,
    postalBeforeCity: true,
  },
  PT: {
    ...GENERIC_CONFIG,
    streetLabel: 'Street address *',
    streetPlaceholder: 'e.g. Rua Augusta 10',
    line2Label: 'Apartment, floor',
    cityLabel: 'City *',
    cityPlaceholder: 'e.g. Lisbon',
    stateLabel: 'District *',
    statePlaceholder: 'Select or enter a district',
    zipLabel: 'Postal code *',
    zipPlaceholder: 'e.g. 1100-148',
    zipPattern: '\\d{4}-\\d{3}',
    zipTitle: 'Enter a valid Portuguese postal code (e.g. 1100-148)',
    zipMaxLength: 8,
    regions: PORTUGUESE_REGIONS,
    postalBeforeCity: true,
  },
  ES: {
    ...GENERIC_CONFIG,
    streetLabel: 'Street address *',
    streetPlaceholder: 'e.g. Calle Mayor 5',
    line2Label: 'Apartment, floor, door',
    cityLabel: 'City *',
    cityPlaceholder: 'e.g. Madrid',
    stateLabel: 'Province / Community *',
    statePlaceholder: 'Select or enter a province or community',
    zipLabel: 'Postal code *',
    zipPlaceholder: 'e.g. 28001',
    zipPattern: '\\d{5}',
    zipTitle: 'Enter a 5-digit Spanish postal code',
    zipMaxLength: 5,
    zipInputMode: 'numeric',
    regions: SPANISH_REGIONS,
    postalBeforeCity: true,
  },
  PL: {
    ...GENERIC_CONFIG,
    streetLabel: 'Street and house number *',
    streetPlaceholder: 'e.g. ul. Marszałkowska 1',
    line2Label: 'Apartment, floor',
    cityLabel: 'City *',
    cityPlaceholder: 'e.g. Warsaw',
    stateLabel: 'Voivodeship *',
    statePlaceholder: 'Select or enter a voivodeship',
    zipLabel: 'Postal code *',
    zipPlaceholder: 'e.g. 00-001',
    zipPattern: '\\d{2}-\\d{3}',
    zipTitle: 'Enter a valid Polish postal code (e.g. 00-001)',
    zipMaxLength: 6,
    regions: POLISH_REGIONS,
    postalBeforeCity: true,
  },
  AT: {
    ...GENERIC_CONFIG,
    streetLabel: 'Street and house number *',
    streetPlaceholder: 'e.g. Kärntner Straße 1',
    line2Label: 'Apartment, floor, door',
    cityLabel: 'City *',
    cityPlaceholder: 'e.g. Vienna',
    stateLabel: 'Federal state *',
    statePlaceholder: 'Select or enter a federal state',
    zipLabel: 'Postal code *',
    zipPlaceholder: 'e.g. 1010',
    zipPattern: '\\d{4}',
    zipTitle: 'Enter a 4-digit Austrian postal code',
    zipMaxLength: 4,
    zipInputMode: 'numeric',
    regions: AUSTRIAN_REGIONS,
    postalBeforeCity: true,
  },
};

const LEGACY_CONFIG: AddressConfig = {
  ...GENERIC_CONFIG,
  streetLabel: 'Street Address *',
  streetPlaceholder: 'Enter your street address',
  stateLabel: 'State/Province *',
  statePlaceholder: 'Enter state/province',
  zipLabel: 'Zip Code *',
  zipPlaceholder: 'Enter your zip code',
  zipPattern: '[A-Za-z0-9\\s-]{3,10}',
  zipTitle: 'Zip/postal code must be 3-10 characters',
  zipMaxLength: 10,
  regions: [
    ...US_REGIONS,
    ...CANADIAN_REGIONS,
    ...AUSTRALIAN_REGIONS,
    ...NETHERLANDS_REGIONS,
  ],
};

export function isPaypalEligibleCountry(countryCode: string): boolean {
  return PAYPAL_ELIGIBLE_COUNTRY_CODES.includes(countryCode.toUpperCase());
}

/** @deprecated Use isPaypalEligibleCountry instead */
export function isBig4Country(countryCode: string): boolean {
  return isPaypalEligibleCountry(countryCode);
}

export function isPaypalCheckoutFlow(checkoutFlow?: string | null): boolean {
  if (!checkoutFlow) return false;
  return checkoutFlow.startsWith('paypal-');
}

export function usesCountryFirstAddress(checkoutFlow?: string | null): boolean {
  return checkoutFlow === 'kofi' || isPaypalCheckoutFlow(checkoutFlow);
}

export function getCountryName(countryCode: string): string {
  return ALL_COUNTRIES.find(country => country.code === countryCode)?.name || countryName(countryCode);
}

export function getAddressConfig(countryCode: string): AddressConfig {
  return ADDRESS_CONFIGS[countryCode] || GENERIC_CONFIG;
}

export function getLegacyAddressConfig(_isUK?: boolean): AddressConfig {
  return LEGACY_CONFIG;
}

export function getRegionCode(countryCode: string, regionName: string): string {
  const region = getAddressConfig(countryCode).regions.find(option =>
    option.name.toLowerCase() === regionName.trim().toLowerCase() ||
    option.code.toLowerCase() === regionName.trim().toLowerCase()
  );

  return region?.code || regionName.trim();
}

export function normalizePostalCode(value: string, countryCode: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9\s-]/g, '');
  return countryCode === 'CA' ? cleaned.toUpperCase() : cleaned;
}

export function isPostalCodeValid(value: string, countryCode: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const pattern = new RegExp(`^(?:${getAddressConfig(countryCode).zipPattern})$`, 'i');
  return pattern.test(trimmed);
}

export function normalizeShippingData(data: Partial<ShippingData>): ShippingData {
  const countryCode = String(data.countryCode || '').trim().toUpperCase();

  return {
    fullName: String(data.fullName || '').trim(),
    countryCode,
    country: String(data.country || (countryCode ? getCountryName(countryCode) : '')).trim(),
    streetAddress: String(data.streetAddress || '').trim(),
    addressLine2: String(data.addressLine2 || '').trim(),
    city: String(data.city || '').trim(),
    zipCode: normalizePostalCode(String(data.zipCode || '').trim(), countryCode),
    state: String(data.state || '').trim(),
    email: String(data.email || '').trim(),
  };
}

export function formatShippingAddressLines(data: Partial<ShippingData>): string[] {
  const address = normalizeShippingData(data);
  const config = getAddressConfig(address.countryCode);
  const lines = [address.fullName, address.streetAddress, address.addressLine2];

  if (config.postalBeforeCity) {
    lines.push([address.zipCode, address.city].filter(Boolean).join(' '), address.state);
  } else {
    lines.push(address.city, [address.state, address.zipCode].filter(Boolean).join(', '));
  }

  lines.push(address.country);
  return lines.filter((line): line is string => Boolean(line));
}

export function buildPaypalAddressFields(data: Partial<ShippingData>): Record<string, string> {
  const address = normalizeShippingData(data);
  const hasCompleteAddress = Boolean(
    address.countryCode && address.streetAddress && address.city && address.state && address.zipCode
  );

  if (!hasCompleteAddress) {
    return { no_shipping: '1' };
  }

  const fields: Record<string, string> = {
    no_shipping: '0',
    address_override: '1',
    address1: address.streetAddress,
    city: address.city,
    state: getRegionCode(address.countryCode, address.state),
    zip: address.zipCode,
    country: address.countryCode,
    email: address.email,
  };

  if (address.fullName) {
    const parts = address.fullName.trim().split(/\s+/);
    fields.first_name = parts[0] || '';
    if (parts.length > 1) {
      fields.last_name = parts.slice(1).join(' ');
    }
  }

  if (address.addressLine2) fields.address2 = address.addressLine2;
  return fields;
}
