import Razorpay from 'razorpay';

// Razorpay configuration
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RDoUFgwLLU69on',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'IxZI40FsgedA0w3IaCEnk3J3',
});

// Currency and other constants
export const CURRENCY = 'INR';
export const PAYMENT_DESCRIPTION = 'AlumniHive Subscription';

// UPI Test Configuration
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

// UPI Payment Methods
export const UPI_PAYMENT_METHODS = {
  upi: true,
  card: true,
  netbanking: true,
  wallet: true,
  emi: false
};
