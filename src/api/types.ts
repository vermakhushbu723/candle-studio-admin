export interface OrderItem {
  productId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  fragrance?: string;
  color?: string;
}

export interface Order {
  id: string;
  _id: string;
  date: string;
  customer: { name: string; phone: string; email: string };
  address: { line1: string; city: string; state: string; pincode: string };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  giftNote?: string;
  status: string;
  statusHistory: { status: string; at: string; note?: string }[];
  paymentMethod: 'upi' | 'card' | 'cod';
  paymentStatus: string;
  courier?: string;
  awb?: string;
  razorpayPaymentId?: string;
  account?: { _id: string; name: string; email: string; phone: string } | null;
}

export interface ProductColor {
  name: string;
  hex: string;
  images: string[];
}

export interface Product {
  id: string; // slug — what the website uses
  _id: string;
  slug: string;
  name: string;
  subtitle: string;
  line: 'pearled' | 'handcrafted';
  category: string;
  collections: string[];
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  badge: string;
  moods: string[];
  tagline: string;
  description: string;
  includes: string[];
  bestFor: string;
  howToUse: string[];
  fragrances: boolean;
  images: string[];
  colors: ProductColor[];
  variantGroup: string;
  variantLabel: string;
  stock: number;
  soldCount: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Collection {
  _id: string;
  id: string;
  slug: string;
  name: string;
  type: 'festive' | 'curated';
  description: string;
  image: string;
  tone: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt?: string;
  orders: number;
  spent: number;
  lastOrder?: string;
  loginMethod?: 'phone' | 'google' | 'password';
  googleLinked?: boolean;
  notifyOffers?: boolean;
  pushDevices?: number | { device?: string; addedAt: string }[];
}

export interface Note {
  by: string;
  text: string;
  at: string;
}

export interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
  status: string;
  notes: Note[];
  createdAt: string;
}

export interface Ticket {
  _id: string;
  ticketId: string;
  name: string;
  phone: string;
  topic: string;
  message: string;
  status: string;
  notes: Note[];
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  expiry: string;
  usageLimit: number;
  usedCount: number;
  description: string;
  isActive: boolean;
}

// Labels shared with the storefront
export const LINES = { pearled: 'Pearled', handcrafted: 'Handcrafted' } as const;
export const CATEGORIES: Record<string, string> = {
  // Current catalogue
  'pooja-festive': 'Pooja & Diyas',
  'food-inspired': 'Sweets & Treats',
  'bubble-candles': 'Bubble Candles',
  floral: 'Bouquets & Roses',
  'floating-candles': 'Floating Candles',
  'jars-glass': 'Jars & Glass',
  tealights: 'Tea Lights',
  'cute-gifts': 'Cute & Gifting',
  // Earlier ranges (hidden products)
  'pearl-kits': 'Pearl Decor Kits',
  refills: 'Refills & Scent Bar',
  'love-in-the-air': 'Love in the Air',
  luxury: 'Luxury & Festive',
  'wax-fresheners': 'Wax Fresheners',
};
export const COLLECTIONS: Record<string, string> = {
  'cartoons-kids': 'Cartoons & Kids',
  ocean: 'Ocean',
  aesthetic: 'Aesthetic',
  'diwali-special': 'Diwali Special',
  'christmas-special': 'Christmas Special',
  'valentine-special': 'Valentine Special',
  'new-year-special': 'New Year Special',
  spiritual: 'Spiritual',
  winter: 'Winter',
};
export const FRAGRANCES: Record<string, string> = { sandalwood: 'Mysore Sandalwood', lavender: 'Lavender Vanilla', jasmine: 'Night Jasmine', oud: 'Amber Oud' };
export const PAYMENT: Record<string, string> = { upi: 'UPI', card: 'Card', cod: 'Cash on Delivery' };
export const CONTACT_TOPICS: Record<string, string> = { order: 'Order support', bulk: 'Bulk / corporate gifting', custom: 'Custom hamper', other: 'Something else' };
