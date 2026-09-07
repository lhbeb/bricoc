import { getProductBySlug } from '@/lib/data';
import { getReviewProduct, isReviewProduct } from '@/lib/reviewProducts';
import { getSellerById } from '@/lib/supabase/sellers';
import { formatValidSku, mapConditionToSchema } from '@/lib/conditions';
import { notFound } from 'next/navigation';
import ProductPageClient from './ProductPageClient';
import type { Metadata, ResolvingMetadata } from 'next';

// Hardcoded base URL (no environment variable needed)
const BASE_URL = 'https://bricoc.com';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const { slug } = await params;
    if (!slug) return { title: 'Product Not Found | Bricoc' };

    let product = isReviewProduct(slug) ? getReviewProduct(slug) : null;
    if (!product) product = await getProductBySlug(slug);
    if (!product) return { title: 'Product Not Found | Bricoc' };

    const title = `${product.title || 'Product'} - ${product.brand || ''} | ${product.category || ''} | Bricoc`;
    const description = (product.description || '').substring(0, 155) + '...';
    const canonicalUrl = `${BASE_URL}/products/${product.slug}`;
    const currencyCode = product.currency || 'USD';
    const price = (product.price || 0).toFixed(2);
    const inStock = product.inStock !== false;

    const imageUrls = (product.images || []).map(img => ({
      url: new URL(img, BASE_URL).toString(),
      alt: product!.title || 'Product image',
    }));

    return {
      title,
      description,
      keywords: product.meta?.keywords || `${product.title}, ${product.brand}, ${product.category}`,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'Bricoc',
        type: 'website',
        images: imageUrls,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrls.map(i => i.url),
      },
      // Extra OG product tags consumed by Facebook, Pinterest, Google Shopping
      other: {
        'og:type': 'product',
        'product:price:amount': price,
        'product:price:currency': currencyCode,
        'product:availability': inStock ? 'in stock' : 'out of stock',
        'product:brand': product.brand || '',
        'product:retailer_item_id': product.slug || '',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Product | Bricoc',
      description: 'Browse our products on Bricoc',
    };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    if (!slug || typeof slug !== 'string') {
      notFound();
    }

    let product = isReviewProduct(slug) ? getReviewProduct(slug) : null;
    if (!product) product = await getProductBySlug(slug);
    if (!product) notFound();

    // ── Review inheritance ─────────────────────────────────────────────────
    const hasOwnReviews = Array.isArray(product.reviews) && product.reviews.length > 0;
    if (!hasOwnReviews && product.sellerId) {
      try {
        const seller = await getSellerById(product.sellerId);
        if (seller && seller.reviews && seller.reviews.length > 0) {
          product = {
            ...product,
            reviews: seller.reviews,
            rating: product.rating || seller.averageRating || 0,
            reviewCount: product.reviewCount || seller.totalReviews || 0,
            meta: {
              ...product.meta,
              _sellerReviews: true,
              _sellerName: seller.name,
              _sellerUsername: seller.username,
            } as any,
          };
        }
      } catch {
        // Silently ignore – don't break product page if seller fetch fails
      }
    }

    const p = product!;
    const inStock = p.inStock !== false;
    const hasReviews = (p.reviewCount || 0) > 0 && (p.rating || 0) > 0;

    // priceValidUntil: 1 year from today — expected by Google Merchant Center
    const priceValidUntil = new Date();
    priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);

    // Generate Product Schema for Rich Snippets
    const productSchema: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": p.title || 'Product',
      "description": p.description || '',
      "image": (p.images || []).map((img: string) => {
        try { return new URL(img, BASE_URL).toString(); } catch { return img; }
      }),
      "brand": {
        "@type": "Brand",
        "name": p.brand || ''
      },
      "category": p.category || '',
      "sku": formatValidSku(p, slug),
      "offers": {
        "@type": "Offer",
        "price": p.price || 0,
        "priceCurrency": p.currency || "USD",
        "validFrom": new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        "priceValidUntil": priceValidUntil.toISOString().slice(0, 10),
        "availability": inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        "itemCondition": mapConditionToSchema(p.condition),
        "url": `${BASE_URL}/products/${p.slug}`,
        "seller": {
          "@type": "Organization",
          "name": "Bricoc"
        },
        "hasMerchantReturnPolicy": {
          "@type": "MerchantReturnPolicy",
          "applicableCountry": ["US"],
          "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
          "merchantReturnDays": 30,
          "returnMethod": "https://schema.org/ReturnByMail",
          "returnFees": "https://schema.org/FreeReturn",
          "returnLabelSource": "https://schema.org/ReturnLabelDownloadAndPrint",
          "restockingFee": 0,
          "refundType": "https://schema.org/FullRefund"
        },
        "shippingDetails": [
          {
            "@type": "OfferShippingDetails",
            "shippingRate": {
              "@type": "MonetaryAmount",
              "value": 0,
              "currency": "USD"
            },
            "shippingDestination": {
              "@type": "DefinedRegion",
              "addressCountry": "US"
            },
            "deliveryTime": {
              "@type": "ShippingDeliveryTime",
              "handlingTime": {
                "@type": "QuantitativeValue",
                "minValue": 0,
                "maxValue": 1,
                "unitCode": "DAY"
              },
              "transitTime": {
                "@type": "QuantitativeValue",
                "minValue": 5,
                "maxValue": 9,
                "unitCode": "DAY"
              }
            }
          }
        ]
      },
    };

    // Only add aggregateRating when there ARE real reviews —
    // Google rejects / ignores ratings with reviewCount=0
    if (hasReviews) {
      productSchema["aggregateRating"] = {
        "@type": "AggregateRating",
        "ratingValue": p.rating,
        "reviewCount": p.reviewCount,
        "bestRating": 5,
        "worstRating": 1
      };
      productSchema["review"] = ((p.reviews || []) as any[]).slice(0, 5).map((review: any) => ({
        "@type": "Review",
        "author": { "@type": "Person", "name": review.author || 'Anonymous' },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating || 0,
          "bestRating": 5,
          "worstRating": 1
        },
        "reviewBody": review.content || '',
        "datePublished": review.date || new Date().toISOString(),
      }));
    }

    // Generate Breadcrumb Schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
        { "@type": "ListItem", "position": 2, "name": "Products", "item": `${BASE_URL}/#products` },
        {
          "@type": "ListItem", "position": 3,
          "name": p.category || 'Category',
          "item": `${BASE_URL}/#products?category=${encodeURIComponent(p.category || '')}`
        },
        { "@type": "ListItem", "position": 4, "name": p.title || 'Product', "item": `${BASE_URL}/products/${p.slug}` }
      ]
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <ProductPageClient product={p} />
      </>
    );
  } catch (error) {
    console.error('Error in ProductPage:', error);
    notFound();
  }
}
