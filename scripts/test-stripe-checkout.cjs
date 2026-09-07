const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function loadRoute(file, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    exports, require: name => { if (!(name in mocks)) throw new Error('Unexpected dependency: ' + name); return mocks[name]; },
    process: { env: { NEXT_PUBLIC_BASE_URL: 'https://bricoc.com' } },
    console: { log() {}, error() {}, warn() {} }, Date,
  });
  return exports;
}

(async () => {
  let product, order, linked, created, updates, notifications, paymentStatus;
  const reset = () => {
    product = { id: 'product-1', slug: 'mower', title: 'Real mower', price: 100, currency: 'USD', inStock: true, images: [] };
    order = { id: 'order-1', product_slug: 'mower', product_title: 'Real mower', order_number: 123, status: 'pending_payment' };
    linked = true; created = []; updates = []; notifications = 0; paymentStatus = 'paid';
  };
  const mocks = {
    'next/server': { NextResponse: { json: (data, options = {}) => ({ status: options.status || 200, data }) } },
    stripe: class Stripe { constructor() { this.checkout = { sessions: {
      create: async params => { created.push(params); return { id: 'cs_test', client_secret: 'test_secret' }; },
      retrieve: async () => ({ id: 'cs_test', payment_status: paymentStatus, metadata: { order_id: 'order-1' }, payment_intent: 'pi_test', amount_total: 10000, currency: 'usd' }),
    } }; } },
    '@/lib/supabase/payment-settings': { getStripeConfig: async () => ({ secretKey: 'mock' }) },
    '@/lib/supabase/products': { getProductBySlug: async () => product },
    '@/lib/supabase/orders': {
      getOrderById: async () => order,
      updateOrderStripeStatus: async (_id, data) => { updates.push(data); if (linked) order = { ...order, ...data }; return linked; },
    },
    '@/lib/email/sender': { sendStripePaymentSuccessEmail: async () => { notifications++; return { success: true }; } },
  };
  const create = loadRoute('src/app/api/create-stripe-checkout/route.ts', mocks).POST;
  const verify = loadRoute('src/app/api/verify-payment/route.ts', mocks).POST;
  const request = () => ({ headers: { get: () => 'https://bricoc.com' }, json: async () => ({
    orderId: 'order-1', product: { slug: 'mower', title: 'Tampered', price: 1, currency: 'GBP' },
    shippingData: { fullName: 'Test Buyer', email: 'test@example.com', streetAddress: '1 Test St', addressLine2: 'Unit 2', city: 'Boston', state: 'MA', zipCode: '02108', countryCode: 'US' },
  }) });
  reset();
  assert.equal((await create(request())).status, 200);
  const session = created[0];
  assert.equal(session.ui_mode, 'embedded');
  assert.equal(session.line_items[0].price_data.unit_amount, 10000);
  assert.equal(session.line_items[0].price_data.currency, 'usd');
  assert.equal(session.line_items[0].price_data.product_data.name, 'Bricoc order - #123');
  assert.equal(session.payment_intent_data.shipping.address.line2, 'Unit 2');
  assert.equal(session.payment_intent_data.shipping.address.country, 'US');
  assert.equal(session.shipping_address_collection, undefined);
  assert.equal(updates[0].stripe_checkout_session_id, 'cs_test');
  for (const [change, expected] of [
    [() => product = null, 404], [() => product.inStock = false, 409],
    [() => order = null, 400], [() => order.product_slug = 'different', 400],
    [() => order.status = 'paid', 409],
  ]) {
    reset(); change(); assert.equal((await create(request())).status, expected); assert.equal(created.length, 0);
  }
  reset(); linked = false; assert.equal((await create(request())).status, 500);
  const verifyRequest = { json: async () => ({ sessionId: 'cs_test' }) };
  reset(); paymentStatus = 'unpaid';
  assert.equal((await verify(verifyRequest)).data.status, 'pending'); assert.equal(updates.length, 0); assert.equal(notifications, 0);
  reset(); assert.equal((await verify(verifyRequest)).data.status, 'paid'); assert.equal(order.status, 'paid'); assert.equal(notifications, 1);
  reset(); linked = false; assert.equal((await verify(verifyRequest)).status, 500); assert.equal(notifications, 0);
  console.log('PASS: Stripe pricing, delivery address, order validation, session linking, and paid verification recovery. No external calls.');
})().catch(error => { console.error(error); process.exitCode = 1; });
