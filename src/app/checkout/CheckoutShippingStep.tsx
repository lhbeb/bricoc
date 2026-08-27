"use client";

import { useState } from 'react';
import type { FormEventHandler, MouseEvent, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Globe2, Mail, Store, Trash, User } from 'lucide-react';
import CheckoutNotifier from '@/components/CheckoutNotifier';
import CountrySelect from '@/components/CountrySelect';
import PaypalApiRedirectButton from '@/components/PaypalApiRedirectButton';
import PaypalRedirectButton from '@/components/PaypalRedirectButton';
import type { CartItem } from '@/utils/cart';
import type { CheckoutFormController } from './useCheckoutForm';
import type { PaypalApiInitializationResult, PaypalPaymentInitializationResult } from './types';

interface CheckoutShippingStepProps {
  cartItem: CartItem;
  sellerName: string | null;
  form: CheckoutFormController;
  isSendingEmail: boolean;
  isRedirecting: boolean;
  checkoutError: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onPaypalBeforePayment: () => Promise<PaypalPaymentInitializationResult>;
  onPaypalApiBeforePayment: () => Promise<PaypalApiInitializationResult>;
  onClearCart: () => void;
  onDismissCheckoutError: () => void;
}

interface MobileCheckoutCTAProps {
  onClick?: (event: MouseEvent) => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  label: string;
}

function FixedCheckoutBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-gray-200 bg-white/95 shadow-[0_-6px_24px_rgba(0,0,0,0.10)] backdrop-blur-lg lg:hidden">
      <div
        className="mx-auto w-full max-w-3xl px-4 pt-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {children}
      </div>
    </div>
  );
}

function MobileCheckoutCTA({
  onClick,
  disabled,
  isLoading,
  loadingLabel,
  label,
}: MobileCheckoutCTAProps) {
  return (
    <FixedCheckoutBar>
      <button
        type={onClick ? 'button' : 'submit'}
        onClick={onClick}
        disabled={disabled}
        className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[#090A28] focus:ring-offset-2 text-lg sm:text-xl ${
          disabled
            ? 'bg-gray-400 cursor-not-allowed text-white'
            : 'bg-[#090A28] hover:bg-[#1c2070] text-white active:scale-[0.98]'
        }`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white mr-3" />
            <span className="text-white text-lg font-bold">{loadingLabel}</span>
          </>
        ) : (
          <span className="text-white text-lg sm:text-xl font-bold">{label}</span>
        )}
      </button>
    </FixedCheckoutBar>
  );
}

function StateSuggestions({
  form,
  mobile = false,
}: {
  form: CheckoutFormController;
  mobile?: boolean;
}) {
  if (!form.showStateSuggestions || form.stateSuggestions.length === 0) return null;

  return (
    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {form.stateSuggestions.map((suggestion, index) => {
        const isSelected = form.stateSuggestionIndex === index;

        if (mobile) {
          return (
            <div
              key={suggestion}
              className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
              onMouseDown={() => form.handleStateSelect(suggestion)}
            >
              {suggestion}
            </div>
          );
        }

        return (
          <button
            key={suggestion}
            type="button"
            role="option"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            className={`w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-200 ${
              isSelected ? 'bg-blue-50 text-[#090A28]' : 'text-[#262626]'
            }`}
            onClick={() => form.handleStateSelect(suggestion)}
          >
            {suggestion}
          </button>
        );
      })}
    </div>
  );
}

function AddressFields({
  form,
  mobile = false,
}: {
  form: CheckoutFormController;
  mobile?: boolean;
}) {
  const inputRadius = mobile ? 'rounded-xl' : 'rounded-lg';
  const inputClassName = `w-full px-4 py-4 border-2 border-gray-200 ${inputRadius} focus:outline-none focus:ring-2 focus:ring-[#090A28] focus:border-[#090A28] transition-all duration-300`;
  const idSuffix = mobile ? '-mobile' : '-desktop';
  const fieldId = (name: string) => form.requiresCountry ? `${name}${idSuffix}` : name;

  const countryField = form.requiresCountry ? (
    <div>
      <label htmlFor={fieldId('countryCode')} className="block text-sm font-semibold text-gray-700 mb-3">
        Country / Region *
      </label>
      <CountrySelect
        id={fieldId('countryCode')}
        name="countryCode"
        value={form.shippingData.countryCode}
        onChange={form.handleInputChange as any}
        countries={form.featuredCountries}
        placeholder="Select delivery country"
        required
      />
    </div>
  ) : null;

  // Ko-fi collects buyer name in Phase 2 — hide the field entirely in Phase 1
  const fullNameField = form.requiresFullName ? (
    <div>
      <label htmlFor={fieldId('fullName')} className="block text-sm font-semibold text-gray-700 mb-3">
        {!mobile && <User className="inline h-4 w-4 mr-1 text-gray-500" />}
        Full Name *
      </label>
      <input
        type="text"
        id={fieldId('fullName')}
        name="fullName"
        value={form.shippingData.fullName || ''}
        onChange={form.handleInputChange}
        required
        className={inputClassName}
        placeholder="Enter your full name"
        autoComplete="name"
      />
    </div>
  ) : null;

  const streetField = (
    <div>
      <label htmlFor={fieldId('streetAddress')} className="block text-sm font-semibold text-gray-700 mb-3">
        {form.addressConfig.streetLabel}
      </label>
      <input
        type="text"
        id={fieldId('streetAddress')}
        name="streetAddress"
        value={form.shippingData.streetAddress}
        onChange={form.handleInputChange}
        required
        className={inputClassName}
        placeholder={form.addressConfig.streetPlaceholder}
        autoComplete="address-line1"
      />
    </div>
  );

  const addressLine2Field = form.requiresCountry ? (
    <div>
      <label htmlFor={fieldId('addressLine2')} className="block text-sm font-semibold text-gray-700 mb-3">
        {form.addressConfig.line2Label} <span className="font-normal text-gray-400">(optional)</span>
      </label>
      <input
        type="text"
        id={fieldId('addressLine2')}
        name="addressLine2"
        value={form.shippingData.addressLine2}
        onChange={form.handleInputChange}
        className={inputClassName}
        placeholder={form.addressConfig.line2Placeholder}
        autoComplete="address-line2"
      />
    </div>
  ) : null;

  const cityField = (
    <div>
      <label htmlFor={fieldId('city')} className="block text-sm font-semibold text-gray-700 mb-3">
        {form.cityLabel}
      </label>
      <input
        type="text"
        id={fieldId('city')}
        name="city"
        value={form.shippingData.city}
        onChange={form.handleInputChange}
        required
        className={inputClassName}
        placeholder={form.cityPlaceholder}
        autoComplete="address-level2"
      />
    </div>
  );

  const stateField = (
    <div className="relative">
      <label htmlFor={fieldId('state')} className="block text-sm font-semibold text-gray-700 mb-3">
        {form.stateLabel}
      </label>
      <div className="relative">
        <input
          ref={mobile ? undefined : form.stateInputRef}
          type="text"
          id={fieldId('state')}
          name="state"
          value={form.shippingData.state}
          onChange={form.handleInputChange}
          onFocus={form.handleStateFocus}
          onBlur={form.handleStateBlur}
          onKeyDown={form.handleStateKeyDown}
          required
          className={inputClassName}
          placeholder={form.statePlaceholder}
          autoComplete="address-level1"
        />
        <StateSuggestions form={form} mobile={mobile} />
      </div>
    </div>
  );

  const zipField = (
    <div>
      <label htmlFor={fieldId('zipCode')} className="block text-sm font-semibold text-gray-700 mb-3">
        {form.zipLabel}
      </label>
      <input
        type="text"
        id={fieldId('zipCode')}
        name="zipCode"
        value={form.shippingData.zipCode}
        onChange={form.handleInputChange}
        required
        minLength={form.requiresCountry ? 3 : (mobile ? undefined : 3)}
        maxLength={form.requiresCountry ? form.addressConfig.zipMaxLength : (mobile ? undefined : 10)}
        pattern={form.requiresCountry ? form.addressConfig.zipPattern : (mobile ? undefined : '[a-zA-Z0-9\\s-]+')}
        title={
          form.requiresCountry
            ? form.addressConfig.zipTitle
            : mobile
              ? undefined
              : form.isUK
                ? 'Postcode must be 3-10 characters (letters, numbers, and spaces only)'
                : 'Zip/postal code must be 3-10 characters (letters, numbers, spaces, and hyphens only)'
        }
        inputMode={form.requiresCountry ? form.addressConfig.zipInputMode : undefined}
        className={inputClassName}
        placeholder={
          form.requiresCountry
            ? form.zipPlaceholder
            : mobile
              ? (form.isUK ? 'e.g., SW1A 1AA' : '10001')
              : form.zipPlaceholder
        }
        autoComplete="postal-code"
      />
    </div>
  );

  const emailField = (
    <div>
      <label htmlFor={fieldId('email')} className="block text-sm font-semibold text-gray-700 mb-3">
        {!mobile && <Mail className="inline h-4 w-4 mr-1" />}
        Email Address *
      </label>
      <input
        type="email"
        id={fieldId('email')}
        name="email"
        value={form.shippingData.email}
        onChange={form.handleInputChange}
        required
        pattern={mobile ? undefined : '[^\\s@]+@[^\\s@]+\\.[^\\s@]+'}
        title={mobile ? undefined : 'Please enter a valid email address (e.g., example@email.com)'}
        className={
          mobile
            ? `${inputClassName} transition-colors duration-200`
            : `w-full px-4 py-4 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                form.emailError
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#090A28] focus:border-[#090A28]'
              }`
        }
        placeholder="Enter your email address"
        autoComplete="email"
      />
      {mobile && form.emailError && (
        <p className="mt-2 text-sm text-red-600">{form.emailError}</p>
      )}
    </div>
  );

  if (mobile) {
    return (
      <>
        {countryField}
        {fullNameField}
        {streetField}
        {addressLine2Field}
        {cityField}
        {stateField}
        {zipField}
        {emailField}
      </>
    );
  }

  return (
    <>
      {countryField}
      {fullNameField}
      {streetField}
      {addressLine2Field}
      <div className="grid grid-cols-3 gap-4">
        {cityField}
        {stateField}
        {zipField}
      </div>
      {emailField}
    </>
  );
}

function ContinueButton({
  isSendingEmail,
  isRedirecting,
}: {
  isSendingEmail: boolean;
  isRedirecting: boolean;
}) {
  const isBusy = isSendingEmail || isRedirecting;

  return (
    <button
      type="submit"
      onClick={() => console.log('🔘 [Checkout] Submit button clicked (desktop)')}
      disabled={isBusy}
      className={`w-full font-bold py-5 px-8 rounded-xl transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-white focus:outline-none focus:ring-4 focus:ring-[#090A28] focus:ring-offset-2 text-xl ${
        isBusy ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#090A28] hover:bg-[#1c2070]'
      }`}
    >
      {isBusy ? (
        <>
          <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white mr-3" />
          <span className="text-xl font-bold">
            {isSendingEmail ? 'Confirming Address...' : 'Redirecting...'}
          </span>
        </>
      ) : (
        <span className="text-xl font-bold">Continue to Payment</span>
      )}
    </button>
  );
}

function SecureCheckoutInfo({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={`${mobile ? 'lg:hidden mt-4 mb-4 space-y-2' : 'hidden lg:block mt-8 space-y-4'} flex flex-col items-center justify-center text-center w-full`}>
      <div className="text-sm text-gray-600">
        <span className="font-medium text-[#090A28]">Secure Checkout</span> - SSL Encrypted
      </div>
      <p className="text-xs text-gray-500 max-w-sm">
        Shop with confidence - Your payment information is protected by industry-leading encryption
      </p>
      <div className="flex items-center justify-center">
        <Image
          src="/secure-checkout.png"
          alt="Secure Checkout"
          width={192}
          height={192}
          className="h-12 w-auto"
          quality={100}
          priority
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>
      <div className={`flex flex-wrap items-center justify-center text-xs text-gray-500 mt-2 ${mobile ? 'gap-2 px-4' : 'gap-3'}`}>
        <Link href="/terms" className="hover:text-[#090A28] hover:underline transition-colors">
          Terms of Service
        </Link>
        <span className="text-gray-300">•</span>
        <Link href="/return-policy" className="hover:text-[#090A28] hover:underline transition-colors">
          Refund and Return Policy
        </Link>
        <span className="text-gray-300">•</span>
        <Link href="/shipping-policy" className="hover:text-[#090A28] hover:underline transition-colors">
          Shipping Policy
        </Link>
      </div>
    </div>
  );
}

function formatPrice(cartItem: CartItem, amount: number) {
  const { product } = cartItem;
  const currency = product.currency || 'USD';
  const targetMarket = product.meta?.targetMarket || '';

  let symbol = '$';
  if (currency === 'GBP') symbol = '£';
  else if (currency === 'EUR') symbol = '€';
  else if (currency === 'CAD') symbol = 'CA$';
  else if (currency === 'AUD') symbol = 'A$';
  else if (targetMarket === 'uk') symbol = '£';
  else if (targetMarket === 'eu') symbol = '€';
  else if (targetMarket === 'ca') symbol = 'CA$';
  else if (targetMarket === 'au') symbol = 'A$';

  return `${symbol}${amount.toFixed(2)}`;
}

export default function CheckoutShippingStep({
  cartItem,
  sellerName,
  form,
  isSendingEmail,
  isRedirecting,
  checkoutError,
  onSubmit,
  onPaypalBeforePayment,
  onPaypalApiBeforePayment,
  onClearCart,
  onDismissCheckoutError,
}: CheckoutShippingStepProps) {
  const [showMobileOrderSummary, setShowMobileOrderSummary] = useState(false);
  const { product } = cartItem;
  const price = formatPrice(cartItem, product.price);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-40 lg:pb-4">
      <CheckoutNotifier />
      <main className="flex-grow py-4">
        <div className="container mx-auto px-4">
          <Link href={`/products/${product.slug}`} className="inline-flex items-center text-[#090A28] hover:text-[#1c2070] mb-4 text-sm">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Back To Product</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <div className="lg:hidden mb-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <button
                type="button"
                onClick={() => setShowMobileOrderSummary(previous => !previous)}
                className="w-full p-4 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-2xl"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <div className="w-full h-full bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden">
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        width={56}
                        height={56}
                        className="w-14 h-14 object-cover rounded-lg transition-transform duration-200 hover:scale-105"
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#262626] text-base line-clamp-1 mb-1">{product.title}</h3>
                    <p className="text-[#090A28] font-bold text-xl mb-1">{price}</p>
                    {sellerName && (
                      <p className="mb-1 flex min-w-0 items-center gap-1.5 text-sm text-gray-600" aria-label={`Seller: ${sellerName}`}>
                        <Store className="h-4 w-4 shrink-0 text-[#262626]" aria-hidden="true" />
                        <span className="truncate font-medium text-[#262626]">{sellerName}</span>
                      </p>
                    )}
                    <p className="text-gray-400 text-xs leading-tight">Tap To View/Hide Summary</p>
                  </div>
                </div>
                <ChevronDown className={`h-6 w-6 ml-3 flex-shrink-0 text-gray-600 transition-transform duration-200 ${showMobileOrderSummary ? 'rotate-180' : ''}`} />
              </button>

              {showMobileOrderSummary && (
                <div className="px-4 pb-4 border-t border-gray-100 mt-4 pt-4 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Quantity</span>
                    <span className="font-medium">{cartItem.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{price}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-[#090A28]">Free</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <span className="text-base font-semibold text-[#262626]">Total</span>
                    <span className="text-lg font-bold text-[#090A28]">{price}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="max-w-7xl mx-auto flex gap-4 lg:gap-8 items-start">
              <div className="flex-1 bg-white rounded-2xl shadow-sm p-6 lg:p-8 border border-gray-100 flex justify-center">
                <div className="w-full max-w-[750px]">
                  <h2 className="text-xl lg:text-2xl font-bold text-[#262626] mb-6 lg:mb-8 text-left">Delivery Address</h2>
                  <form onSubmit={onSubmit} className="space-y-6">
                    <AddressFields form={form} />
                    <div className="hidden lg:block mt-8">
                      {product.checkoutFlow === 'paypal-direct' ? (
                        <PaypalRedirectButton
                          onBeforePayment={onPaypalBeforePayment}
                          shippingData={form.shippingData}
                          disabled={isSendingEmail || !form.isFormValid}
                        />
                      ) : product.checkoutFlow === 'paypal-api' ? (
                        <PaypalApiRedirectButton
                          onBeforePayment={onPaypalApiBeforePayment}
                          disabled={isSendingEmail || !form.isFormValid}
                        />
                      ) : (
                        <ContinueButton isSendingEmail={isSendingEmail} isRedirecting={isRedirecting} />
                      )}
                    </div>
                  </form>
                  <SecureCheckoutInfo />
                </div>
              </div>

              <div className="w-96 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* Header */}
                  <div className="px-6 pt-6 pb-5 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-400 uppercase tracking-widest">Order Summary</h2>
                  </div>

                  {/* Product row */}
                  <div className="px-6 py-5 flex items-start gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <h3 className="font-semibold text-[#262626] text-sm leading-snug line-clamp-2">{product.title}</h3>

                      {sellerName && (
                        <div className="flex items-center gap-1.5" aria-label={`Seller: ${sellerName}`}>
                          <Store className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                          <span className="truncate text-xs text-gray-500 font-medium">{sellerName}</span>
                        </div>
                      )}

                      {/* Chips row */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                          {product.condition}
                        </span>
                        {(product as ProductWithSelectedSize).selectedSize && (
                          <span className="bg-[#090A28]/8 text-[#090A28] text-xs font-semibold px-2.5 py-1 rounded-full">
                            Size: {(product as ProductWithSelectedSize).selectedSize}
                          </span>
                        )}
                        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                          Qty {cartItem.quantity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price + remove */}
                  <div className="px-6 pb-5 flex items-center justify-between">
                    <span className="text-xl font-bold text-[#090A28]">{price}</span>
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-full hover:bg-red-50"
                      aria-label="Remove item"
                    >
                      <Trash className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-100 px-6 py-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-medium text-[#262626]">{price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Shipping</span>
                      <span className="font-semibold text-emerald-600">Free</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                      <span className="text-sm font-semibold text-[#262626]">Total</span>
                      <span className="text-lg font-bold text-[#090A28]">{price}</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div className="lg:hidden">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-[#262626] mb-6">Delivery Address</h2>
              <form onSubmit={onSubmit} className="space-y-6">
                <AddressFields form={form} mobile />

                {checkoutError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800">{checkoutError}</p>
                      <button type="button" onClick={onDismissCheckoutError} className="text-xs text-red-600 underline mt-1">
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {product.checkoutFlow !== 'paypal-direct' && product.checkoutFlow !== 'paypal-api' && (
                  <MobileCheckoutCTA
                    disabled={isSendingEmail || isRedirecting}
                    isLoading={isSendingEmail || isRedirecting}
                    loadingLabel={isSendingEmail ? 'Confirming Address...' : 'Redirecting...'}
                    label="Continue to Payment"
                  />
                )}

                {product.checkoutFlow === 'paypal-direct' && (
                  <FixedCheckoutBar>
                    <PaypalRedirectButton
                      onBeforePayment={onPaypalBeforePayment}
                      shippingData={form.shippingData}
                      disabled={isSendingEmail || !form.isFormValid}
                    />
                  </FixedCheckoutBar>
                )}

                {product.checkoutFlow === 'paypal-api' && (
                  <FixedCheckoutBar>
                    <PaypalApiRedirectButton
                      onBeforePayment={onPaypalApiBeforePayment}
                      disabled={isSendingEmail || !form.isFormValid}
                    />
                  </FixedCheckoutBar>
                )}

                <SecureCheckoutInfo mobile />
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface ProductWithSelectedSize {
  selectedSize?: string;
}
