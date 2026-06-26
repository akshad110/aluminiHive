// Razorpay integration utilities

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      console.log('Razorpay SDK already loaded');
      resolve(true);
      return;
    }

    console.log('Loading Razorpay SDK from CDN...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      console.log('Razorpay SDK loaded successfully');
      resolve(true);
    };
    script.onerror = (error) => {
      console.error('Failed to load Razorpay SDK:', error);
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, any>;
  handler: (response: any) => void;
  modal: {
    ondismiss: () => void;
  };
  method?: {
    netbanking?: boolean;
    wallet?: boolean;
    upi?: boolean;
    card?: boolean;
    emi?: boolean;
  };
  theme?: {
    color?: string;
  };
  retry?: {
    enabled: boolean;
    max_count: number;
  };
  callback_url?: string;
  reminder_at?: number;
}

export const openRazorpayModal = (options: RazorpayOptions) => {
  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not loaded');
  }

  try {
    const razorpay = new window.Razorpay(options);
    razorpay.open();
    return razorpay;
  } catch (error) {
    console.error('Error opening Razorpay modal:', error);
    throw new Error(`Failed to open payment modal: ${error.message}`);
  }
};
