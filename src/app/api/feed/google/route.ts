import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/data';
import { formatValidSku, mapConditionToGmc } from '@/lib/conditions';
import type { Product } from '@/types/product';

const BASE_URL = 'https://bricoc.com';
const SUPPORTED_COUNTRIES = ['GB', 'US'] as const;
const SUPPORTED_CURRENCIES = ['GBP', 'USD'] as const;

type FeedCountry = (typeof SUPPORTED_COUNTRIES)[number];
type FeedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const SHIPPING_BY_COUNTRY: Record<FeedCountry, {
  service: string;
  currency: FeedCurrency;
}> = {
  GB: { service: 'Free Standard Delivery', currency: 'GBP' },
  US: { service: 'Free Standard Shipping', currency: 'USD' },
};

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseEnum<T extends string>(
  value: string | null,
  supportedValues: readonly T[],
): T | null | undefined {
  if (!value) return undefined;
  const normalized = value.toUpperCase();
  return supportedValues.includes(normalized as T) ? (normalized as T) : null;
}

function isFeedEligible(product: Product): boolean {
  return (
    product.meta?.gmc_enabled !== false &&
    product.meta?.published !== false &&
    product.published !== false &&
    Boolean(product.slug && product.title && product.images?.[0]) &&
    Number.isFinite(Number(product.price)) &&
    Number(product.price) > 0
  );
}

function buildShippingXml(
  countries: readonly FeedCountry[],
  itemCurrency: string,
): string {
  return countries
    .map((country) => {
      const shipping = SHIPPING_BY_COUNTRY[country];
      return `
      <g:shipping>
        <g:country>${country}</g:country>
        <g:service>${shipping.service}</g:service>
        <g:price>0.00 ${itemCurrency}</g:price>
        <g:min_handling_time>0</g:min_handling_time>
        <g:max_handling_time>1</g:max_handling_time>
        <g:min_transit_time>5</g:min_transit_time>
        <g:max_transit_time>9</g:max_transit_time>
      </g:shipping>`;
    })
    .join('');
}

export async function GET(request: NextRequest) {
  const country = parseEnum(
    request.nextUrl.searchParams.get('country'),
    SUPPORTED_COUNTRIES,
  );
  const currency = parseEnum(
    request.nextUrl.searchParams.get('currency'),
    SUPPORTED_CURRENCIES,
  );

  if (country === null) {
    return new NextResponse('Unsupported country. Use GB or US.', { status: 400 });
  }
  if (currency === null) {
    return new NextResponse('Unsupported currency. Use GBP or USD.', { status: 400 });
  }

  try {
    let products: Product[] = [];
    try {
      products = await getAllProducts();
    } catch (error) {
      console.error('Error fetching products for Google feed:', error);
    }

    const targetCountries: readonly FeedCountry[] = country
      ? [country]
      : SUPPORTED_COUNTRIES;

    const itemsXml = products
      .filter(isFeedEligible)
      .filter((product) => {
        if (!currency) return true;
        return (product.currency || 'USD').toUpperCase() === currency;
      })
      .map((product) => {
        const sku = escapeXml(formatValidSku(product));
        const title = escapeXml(product.title || 'Product');
        const description = escapeXml(product.description || product.title || '');
        const link = escapeXml(`${BASE_URL}/products/${encodeURIComponent(product.slug)}`);
        const productCurrency = (product.currency || 'USD').toUpperCase();
        const price = `${Number(product.price).toFixed(2)} ${productCurrency}`;
        const availability = product.inStock === false ? 'out_of_stock' : 'in_stock';
        const condition = mapConditionToGmc(product.condition);
        const brand = escapeXml(product.brand || 'Bricoc');
        const category = escapeXml(product.category || 'Home & Garden');
        const originalImage = new URL(product.images[0], BASE_URL).toString();
        const imageLink = escapeXml(`${BASE_URL}/api/image-proxy?url=${encodeURIComponent(originalImage)}`);

        return `
    <item>
      <g:id>${sku}</g:id>
      <title>${title}</title>
      <description>${description}</description>
      <link>${link}</link>
      <g:image_link>${imageLink}</g:image_link>
      <g:price>${price}</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>${condition}</g:condition>
      <g:brand>${brand}</g:brand>
      <g:product_type>${category}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>${buildShippingXml(targetCountries, productCurrency)}
    </item>`;
      })
      .join('');

    const targetLabel = country ? ` (${country})` : ' (GB + US)';
    const currencyLabel = currency ? ` in ${currency}` : '';
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Bricoc Google Merchant Center Feed${targetLabel}${currencyLabel}</title>
    <link>${BASE_URL}</link>
    <description>Selected Bricoc products for ${country || 'United States'}${currencyLabel}</description>
    ${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (error) {
    console.error('Error generating GMC feed:', error);
    return new NextResponse('Error generating feed', { status: 500 });
  }
}
