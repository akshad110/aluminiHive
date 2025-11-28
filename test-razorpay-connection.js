// Test Razorpay Connection
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: 'rzp_test_RDoUFgwLLU69on',
  key_secret: 'IxZI40FsgedA0w3IaCEnk3J3'
});

async function testRazorpayConnection() {
  try {
    console.log('🔗 Testing Razorpay Connection...');
    
    // Test creating a simple order
    const order = await razorpay.orders.create({
      amount: 30000, // ₹300 in paise
      currency: 'INR',
      receipt: 'test_receipt_123'
    });
    
    console.log('✅ Razorpay connection successful!');
    console.log('Order ID:', order.id);
    console.log('Amount:', order.amount);
    console.log('Currency:', order.currency);
    console.log('Status:', order.status);
    
  } catch (error) {
    console.error('❌ Razorpay connection failed:');
    console.error('Error:', error.message);
    console.error('Details:', error);
  }
}

testRazorpayConnection();
