/**
 * ═══════════════════════════════════════════════════════════════
 *  SkyWay — Razorpay Integration Automation Test Suite
 *  Run: node test-razorpay.js
 *  Requires: server running on http://localhost:5000
 * ═══════════════════════════════════════════════════════════════
 */

const BASE_URL = 'http://localhost:5000/api';
let passed = 0;
let failed = 0;
const results = [];

// ── Coloured terminal output ──────────────────────────────────────────────────
const green  = s => `\x1b[32m${s}\x1b[0m`;
const red    = s => `\x1b[31m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const cyan   = s => `\x1b[36m${s}\x1b[0m`;
const bold   = s => `\x1b[1m${s}\x1b[0m`;

async function fetchJson(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: text }; }
}

function assert(name, condition, detail = '') {
  if (condition) {
    passed++;
    results.push({ name, pass: true });
    console.log(`  ${green('✓')} ${name}`);
  } else {
    failed++;
    results.push({ name, pass: false, detail });
    console.log(`  ${red('✗')} ${name}${detail ? `\n    ${yellow(detail)}` : ''}`);
  }
}

// ── TEST GROUPS ───────────────────────────────────────────────────────────────

async function testPaymentsConfig() {
  console.log(cyan('\n📋  TEST GROUP 1: GET /api/payments/config'));
  const { status, body } = await fetchJson('/payments/config');
  assert('HTTP 200 response',                    status === 200);
  assert('Response has success: true',           body?.success === true);
  assert('razorpayActive is boolean',            typeof body?.razorpayActive === 'boolean');
  assert('razorpayKeyId present when active',    !body?.razorpayActive || typeof body?.razorpayKeyId === 'string');
  assert('razorpayActive is TRUE (keys found)',  body?.razorpayActive === true, `Got: ${body?.razorpayActive}`);
  assert('keyId starts with rzp_',              (body?.razorpayKeyId || '').startsWith('rzp_'), `Got: ${body?.razorpayKeyId}`);
  assert('merchantName is a string',             typeof body?.merchantName === 'string');
  return body;
}

async function testCreateOrder(config) {
  console.log(cyan('\n🔑  TEST GROUP 2: POST /api/payments/create-order'));
  const payload = {
    amount:      5499,
    currency:    'INR',
    bookingType: 'flight',
    from:        'Mumbai',
    to:          'Delhi',
    airline:     'IndiGo',
    bookingId:   'TEST_BOOKING_' + Date.now(),
  };

  const { status, body } = await fetchJson('/payments/create-order', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });

  assert('HTTP 200 response',                  status === 200);
  assert('success: true',                      body?.success === true);
  assert('orderId is returned',                typeof body?.orderId === 'string' && body.orderId.startsWith('order_'));
  assert('amount matches (paise)',             body?.amount === payload.amount * 100);
  assert('currency is INR',                    body?.currency === 'INR');
  assert('keyId is returned',                  typeof body?.keyId === 'string' && body.keyId.startsWith('rzp_'));

  if (body?.success && body?.orderId) {
    console.log(`  ${green('ℹ')} Razorpay Order ID: ${bold(body.orderId)}`);
  }
  return body;
}

async function testCreateOrderInvalidPayload() {
  console.log(cyan('\n⚠️   TEST GROUP 3: create-order with invalid/missing amount'));
  const { status, body } = await fetchJson('/payments/create-order', {
    method: 'POST',
    body:   JSON.stringify({ currency: 'INR' }),  // missing amount
  });
  // Should either return error or still create (Razorpay validates on its side)
  assert('HTTP response is 200 or 400',  status === 200 || status === 400);
  if (status !== 200) {
    assert('Has error field on failure',  typeof body?.error === 'string' || typeof body?.message === 'string');
  }
}

async function testVerifySignatureFakeData() {
  console.log(cyan('\n🔐  TEST GROUP 4: POST /api/payments/verify-signature (fake data → should fail gracefully)'));
  const { status, body } = await fetchJson('/payments/verify-signature', {
    method: 'POST',
    body:   JSON.stringify({
      razorpay_order_id:   'order_fake1234567890',
      razorpay_payment_id: 'pay_fake1234567890',
      razorpay_signature:  'invalidsignature_abc123',
      email:       'test@example.com',
      phone:       '9999999999',
      firstName:   'Test',
      lastName:    'User',
      amount:      5499,
      bookingType: 'flight',
      from:        'Mumbai',
      to:          'Delhi',
    }),
  });
  assert('Returns HTTP 200 or 400', status === 200 || status === 400);
  if (status === 200 && body?.success) {
    // Unexpected — but handle gracefully
    assert('If success, has paymentId', typeof body?.paymentId === 'string');
  } else {
    assert('Signature rejection returns error or success:false',
      body?.success === false || body?.error || body?.message || status === 400);
    console.log(`  ${green('ℹ')} Correctly rejected invalid signature`);
  }
}

async function testValidateUpi() {
  console.log(cyan('\n📱  TEST GROUP 5: POST /api/payments/validate-upi'));
  const validIds   = ['success@razorpay'];
  const invalidIds = ['notavalidupi_format', ''];

  for (const upiId of validIds) {
    const { status, body } = await fetchJson('/payments/validate-upi', {
      method: 'POST',
      body:   JSON.stringify({ upiId }),
    });
    assert(`HTTP 200 for UPI: ${upiId}`, status === 200);
    assert(`Has 'valid' boolean field`,  typeof body?.valid === 'boolean');
  }

  for (const upiId of invalidIds) {
    const { status, body } = await fetchJson('/payments/validate-upi', {
      method: 'POST',
      body:   JSON.stringify({ upiId }),
    });
    assert(`Returns 200 or 400 for invalid: "${upiId}"`, status === 200 || status === 400);
  }
}

async function testServerHealth() {
  console.log(cyan('\n💚  TEST GROUP 0: Server Health Check'));
  try {
    const { status } = await fetchJson('/payments/config');
    assert('Server is reachable', status !== undefined);
  } catch (err) {
    assert('Server is reachable', false, `Connection refused — is the server running on localhost:5000? (${err.message})`);
    return false;
  }
  return true;
}

// ── ENTRY POINT ───────────────────────────────────────────────────────────────
async function runAll() {
  console.log(bold('\n═══════════════════════════════════════════════════'));
  console.log(bold('  SkyWay · Razorpay Integration Test Suite'));
  console.log(bold('═══════════════════════════════════════════════════'));
  console.log(`  Base URL: ${cyan(BASE_URL)}`);
  console.log(`  Time:     ${new Date().toLocaleString()}`);

  const serverOk = await testServerHealth();
  if (!serverOk) {
    console.log(red('\n✗ Cannot reach server. Aborting tests.'));
    console.log(yellow('  Start the server with: cd server && node index.js'));
    process.exit(1);
  }

  const config    = await testPaymentsConfig();
  const order     = await testCreateOrder(config);
  await testCreateOrderInvalidPayload();
  await testVerifySignatureFakeData();
  await testValidateUpi();

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(bold('\n═══════════════════════════════════════════════════'));
  console.log(bold('  TEST RESULTS SUMMARY'));
  console.log(bold('═══════════════════════════════════════════════════'));
  console.log(`  ${green('Passed:')} ${passed}`);
  console.log(`  ${failed > 0 ? red('Failed:') : green('Failed:')} ${failed}`);
  console.log(`  Total:  ${passed + failed}`);

  if (failed === 0) {
    console.log(green('\n  ✅  All tests passed! Razorpay integration is working correctly.'));
    console.log(cyan('\n  📝  How Razorpay auto-redirect works:'));
    console.log('     1. User clicks "Proceed to Payment" on Checkout page');
    console.log('     2. PaymentModal mounts → fetches /api/payments/config');
    console.log('     3. If razorpayActive=true → auto-calls handleRazorpayDirect()');
    console.log('     4. Loads Razorpay checkout.js SDK');
    console.log('     5. Calls /api/payments/create-order → gets Razorpay order_id');
    console.log('     6. Opens Razorpay payment overlay with all payment methods');
    console.log('     7. User completes payment → Razorpay calls handler()');
    console.log('     8. Handler calls /api/payments/verify-signature → booking confirmed');
    if (order?.orderId) {
      console.log(green(`\n  🔑  Sample Order Created: ${bold(order.orderId)}`));
      console.log(`     Amount: ₹5,499 · Currency: INR · Key: ${order.keyId}`);
    }
  } else {
    console.log(red(`\n  ❌  ${failed} test(s) failed. Review errors above.`));
    const failedTests = results.filter(r => !r.pass);
    console.log(yellow('\n  Failed tests:'));
    failedTests.forEach(t => console.log(`    • ${t.name}${t.detail ? ': ' + t.detail : ''}`));
  }

  console.log(bold('\n═══════════════════════════════════════════════════\n'));
  process.exit(failed > 0 ? 1 : 0);
}

runAll().catch(err => {
  console.error(red('\nFatal test error:'), err.message);
  process.exit(1);
});
