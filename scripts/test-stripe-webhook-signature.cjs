const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const StripeModule = require('stripe');

const Stripe = StripeModule.Stripe || StripeModule;

function loadRoute(file, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;

  vm.runInNewContext(code, {
    exports,
    require: name => {
      if (!(name in mocks)) throw new Error('Unexpected dependency: ' + name);
      return mocks[name];
    },
    process: { env: { STRIPE_WEBHOOK_SECRET: 'whsec_env_fallback_unit' } },
    console: { log() {}, error() {}, warn() {} },
    Date,
  });

  return exports;
}

(async () => {
  const signingSecret = 'whsec_database_unit';
  const alternateSecret = 'whsec_env_fallback_unit';
  const stripeForTests = new Stripe('sk_test_unit');
  const payload = JSON.stringify({
    id: 'evt_unit',
    object: 'event',
    type: 'payment_intent.succeeded',
    data: { object: { id: 'pi_unit', object: 'payment_intent' } },
  });

  let configuredWebhookSecret = signingSecret;
  let currentSignature = stripeForTests.webhooks.generateTestHeaderString({
    payload,
    secret: signingSecret,
  });

  class TestStripe {
    constructor() {
      this.webhooks = stripeForTests.webhooks;
    }
  }

  const route = loadRoute('src/app/api/webhooks/stripe/route.ts', {
    'next/server': { NextResponse: { json: (data, options = {}) => ({ status: options.status || 200, data }) } },
    stripe: TestStripe,
    'next/headers': { headers: async () => ({ get: () => currentSignature }) },
    '@/lib/supabase/orders': {
      updateOrderStripeStatus: async () => true,
      getOrderById: async () => null,
    },
    '@/lib/supabase/payment-settings': {
      getStripeConfig: async () => ({
        secretKey: 'sk_test_unit',
        webhookSecret: configuredWebhookSecret,
      }),
    },
  }).POST;

  const request = () => ({
    headers: { get: name => (name === 'stripe-signature' ? currentSignature : null) },
    text: async () => payload,
  });

  let response = await route(request());
  assert.equal(response.status, 200);
  assert.equal(response.data.received, true);

  currentSignature = stripeForTests.webhooks.generateTestHeaderString({
    payload,
    secret: 'whsec_wrong_unit',
  });
  response = await route(request());
  assert.equal(response.status, 400);
  assert.equal(response.data.error, 'Webhook signature verification failed');
  assert.equal(JSON.stringify(response.data).includes(signingSecret), false);

  configuredWebhookSecret = '';
  currentSignature = stripeForTests.webhooks.generateTestHeaderString({
    payload,
    secret: alternateSecret,
  });
  response = await route(request());
  assert.equal(response.status, 200);

  configuredWebhookSecret = '';
  currentSignature = '';
  response = await route(request());
  assert.equal(response.status, 400);
  assert.equal(response.data.error, 'No signature');

  console.log('PASS: Stripe webhook accepts valid signatures, rejects invalid signatures, and keeps signing secrets out of responses.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
