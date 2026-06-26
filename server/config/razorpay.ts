import Razorpay from 'razorpay';

export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim()
  );
}

export function shouldUseMockPayments(): boolean {
  if (process.env.MOCK_PAYMENTS === 'true') return true;
  // Use real Razorpay whenever valid keys are present (including local dev)
  if (isRazorpayConfigured()) return false;
  if (process.env.NODE_ENV === 'production') return false;
  return true;
}

let razorpayInstance: Razorpay | null = null;
let cachedKeyId: string | null = null;

export function getRazorpay(): Razorpay {
  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay API keys are not configured');
  }

  const keyId = process.env.RAZORPAY_KEY_ID!.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET!.trim();

  if (!razorpayInstance || cachedKeyId !== keyId) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    cachedKeyId = keyId;
  }

  return razorpayInstance;
}

// Backward-compatible export for existing route handlers
export const razorpay = {
  orders: {
    create: (...args: Parameters<Razorpay['orders']['create']>) =>
      getRazorpay().orders.create(...args),
  },
};

export const CURRENCY = 'INR';
export const PAYMENT_DESCRIPTION = 'AlumniHive Subscription';

export const UPI_TEST_CONFIG = {
  enabled: true,
  autoApprove: true,
  testUPIIds: [
    'success@razorpay',
    'success@upi',
    'test@razorpay'
  ],
  failureUPIIds: [
    'failure@razorpay',
    'failure@upi',
    'error@razorpay'
  ],
  timeoutUPIIds: [
    'timeout@razorpay',
    'timeout@upi'
  ]
};

export const UPI_PAYMENT_METHODS = {
  upi: true,
  card: true,
  netbanking: true,
  wallet: true,
  emi: false
};
