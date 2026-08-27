"use client";

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import {
  FEATURED_COUNTRIES,
  OTHER_COUNTRIES,
  getAddressConfig,
  getCountryName,
  getLegacyAddressConfig,
  isPaypalEligibleCountry,
  isPaypalCheckoutFlow,
  isPostalCodeValid,
  normalizePostalCode,
  usesCountryFirstAddress,
} from '@/lib/shipping';
import type { Product } from '@/types/product';
import type { ShippingData } from './types';

/**
 * Infer the default shipping country from the product's admin-configured
 * target market and currency. Falls back to 'US' if nothing matches.
 */
function inferDefaultCountry(product?: Product | null): { code: string; name: string } {
  const market = product?.meta?.targetMarket as string | undefined;
  const currency = product?.currency as string | undefined;

  // Direct market → country code mapping
  const marketToCountry: Record<string, string> = {
    us: 'US',
    ca: 'CA',
    au: 'AU',
    eu: 'DE', // EU products default to Germany
  };

  // Currency fallback → country code mapping
  const currencyToCountry: Record<string, string> = {
    USD: 'US',
    CAD: 'CA',
    AUD: 'AU',
    EUR: 'DE',
    NZD: 'NZ',
  };

  const code = (market && marketToCountry[market])
    || (currency && currencyToCountry[currency])
    || 'US';

  return { code, name: getCountryName(code) };
}

const FALLBACK_SHIPPING_DATA: ShippingData = {
  fullName: '',
  countryCode: 'US',
  country: 'United States',
  streetAddress: '',
  addressLine2: '',
  city: '',
  zipCode: '',
  state: '',
  email: '',
};

export function useCheckoutForm(product?: Product | null) {
  const [shippingData, setShippingData] = useState<ShippingData>(FALLBACK_SHIPPING_DATA);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [stateSuggestions, setStateSuggestions] = useState<string[]>([]);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [stateSuggestionIndex, setStateSuggestionIndex] = useState(-1);
  const [emailError, setEmailError] = useState('');
  const stateInputRef = useRef<HTMLInputElement>(null);

  const isPaypal = isPaypalCheckoutFlow(product?.checkoutFlow);
  const isKofi = product?.checkoutFlow === 'kofi';
  const requiresCountry = usesCountryFirstAddress(product?.checkoutFlow);
  // Ko-fi collects buyer name in Phase 2 (payment processor), so skip it in Phase 1
  const requiresFullName = requiresCountry && !isKofi;
  // Only show the featured countries across all checkout flows (no "All countries" group)
  const availableOtherCountries: typeof OTHER_COUNTRIES = [];

  // When the product loads, set the default country based on its market/currency
  useEffect(() => {
    if (hasInitialized || !product) return;
    const defaultCountry = inferDefaultCountry(product);
    setShippingData(prev => ({
      ...prev,
      countryCode: defaultCountry.code,
      country: defaultCountry.name,
    }));
    setHasInitialized(true);
  }, [product, hasInitialized]);

  const inferredIsUK = product?.currency === 'GBP' || product?.meta?.targetMarket === 'uk';
  const isUK = requiresCountry ? shippingData.countryCode === 'GB' : inferredIsUK;
  const addressConfig = requiresCountry
    ? getAddressConfig(shippingData.countryCode)
    : getLegacyAddressConfig(inferredIsUK);
  const postalCodeIsValid = requiresCountry
    ? isPostalCodeValid(shippingData.zipCode, shippingData.countryCode)
    : Boolean(shippingData.zipCode && shippingData.zipCode.trim().length >= 3);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    if (name === 'countryCode') {
      setShippingData(previous => ({
        ...previous,
        countryCode: value,
        country: value ? getCountryName(value) : '',
        state: '',
        zipCode: '',
      }));
      setStateSuggestions([]);
      setShowStateSuggestions(false);
      setStateSuggestionIndex(-1);
      return;
    }

    if (name === 'zipCode') {
      const cleanedValue = normalizePostalCode(value, shippingData.countryCode);
      setShippingData(previous => ({ ...previous, [name]: cleanedValue }));
    } else if (name === 'email') {
      setEmailError('');
      setShippingData(previous => ({ ...previous, [name]: value }));
    } else {
      setShippingData(previous => ({ ...previous, [name]: value }));
    }

    if (name !== 'state') return;

    if (value.trim() === '') {
      const defaultSuggestions = requiresCountry
        ? addressConfig.regions.slice(0, 7).map(region => region.name)
        : isUK
          ? addressConfig.regions.slice(0, 4).map(region => region.name)
          : [];
      setStateSuggestions(defaultSuggestions);
      setShowStateSuggestions(defaultSuggestions.length > 0);
      setStateSuggestionIndex(-1);
      return;
    }

    const regions = addressConfig.regions.map(region => region.name);
    const filtered = regions.filter(region =>
      region.toLowerCase().includes(value.toLowerCase())
    );
    setStateSuggestions(filtered.slice(0, 7));
    setShowStateSuggestions(true);
  };

  const handleStateSelect = (state: string) => {
    setShippingData(previous => ({ ...previous, state }));
    setShowStateSuggestions(false);
    setStateSuggestions([]);
  };

  const handleStateFocus = () => {
    if (shippingData.state.trim() === '' && (requiresCountry || isUK)) {
      setStateSuggestions(
        addressConfig.regions.slice(0, requiresCountry ? 7 : 4).map(region => region.name)
      );
    }
    setShowStateSuggestions(true);
  };

  const handleStateBlur = () => {
    setTimeout(() => setShowStateSuggestions(false), 200);
  };

  const handleStateKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showStateSuggestions) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setStateSuggestionIndex(previous =>
        previous < stateSuggestions.length - 1 ? previous + 1 : 0
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setStateSuggestionIndex(previous =>
        previous > 0 ? previous - 1 : stateSuggestions.length - 1
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (stateSuggestionIndex >= 0 && stateSuggestionIndex < stateSuggestions.length) {
        handleStateSelect(stateSuggestions[stateSuggestionIndex]);
      }
    } else if (event.key === 'Escape') {
      setShowStateSuggestions(false);
      setStateSuggestionIndex(-1);
    }
  };

  const isFormValid = Boolean(
    product &&
    product.inStock !== false &&
    shippingData.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingData.email) &&
    (!requiresCountry || (
      // Ko-fi: name is collected in Phase 2, skip name check here
      (requiresFullName ? Boolean(shippingData.fullName?.trim()) : true) &&
      shippingData.countryCode &&
      shippingData.country &&
      (!isPaypal || isPaypalEligibleCountry(shippingData.countryCode))
    )) &&
    postalCodeIsValid &&
    shippingData.streetAddress &&
    shippingData.city &&
    shippingData.state
  );

  return {
    shippingData,
    emailError,
    setEmailError,
    stateSuggestions,
    showStateSuggestions,
    stateSuggestionIndex,
    stateInputRef,
    isKofi,
    requiresCountry,
    requiresFullName,
    featuredCountries: FEATURED_COUNTRIES,
    otherCountries: availableOtherCountries,
    addressConfig,
    isPostalCodeValid: postalCodeIsValid,
    isUK,
    isFormValid,
    stateLabel: addressConfig.stateLabel,
    statePlaceholder: addressConfig.statePlaceholder,
    zipLabel: addressConfig.zipLabel,
    zipPlaceholder: addressConfig.zipPlaceholder,
    cityLabel: addressConfig.cityLabel,
    cityPlaceholder: addressConfig.cityPlaceholder,
    handleInputChange,
    handleStateSelect,
    handleStateFocus,
    handleStateBlur,
    handleStateKeyDown,
  };
}

export type CheckoutFormController = ReturnType<typeof useCheckoutForm>;
