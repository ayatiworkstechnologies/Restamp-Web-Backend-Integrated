export type AgentPlan = {
  id: string;
  name: string;
  category: 'Solo Agent' | 'Agency Team';
  highlight?: string;
  price: number;
  priceSub1: string;
  priceSub2: string;
  validityDays: number | null;
  listingLimit: number;
  popular?: boolean;
  commissionCut: string;
  features: string[];
};

export const agentPlans: Record<'Broker' | 'Agency', AgentPlan[]> = {
  Broker: [
    {
      id: 'agent-starter',
      name: 'Starter Agent',
      category: 'Solo Agent',
      price: 0,
      priceSub1: 'free forever',
      priceSub2: 'pay per verified token',
      validityDays: 30,
      listingLimit: 3,
      commissionCut: '0% Restamp commission',
      features: [
        'Up to 3 active property mandates',
        'Direct buyer in-app inquiries',
        'Basic RERA verification badge',
        'Mobile web console access',
        'Standard search ranking',
      ],
    },
    {
      id: 'agent-pro',
      name: 'Pro Agent',
      category: 'Solo Agent',
      highlight: 'Most Popular',
      price: 4999,
      priceSub1: 'for 90 days access',
      priceSub2: '+ GST • full input tax credit',
      validityDays: 90,
      listingLimit: 15,
      popular: true,
      commissionCut: '0% Restamp commission',
      features: [
        'Up to 15 active high-priority mandates',
        'Instant WhatsApp buyer lead notifications',
        'Direct phone number unmasking',
        'Verified RERA Agent badge ⭐',
        'Top 10% search boost in your local micro-market',
        'Access to Restamp co-broking syndicate',
      ],
    },
    {
      id: 'agent-elite',
      name: 'Elite Agent VIP',
      category: 'Solo Agent',
      highlight: 'VIP Mandate',
      price: 9999,
      priceSub1: 'for 180 days access',
      priceSub2: 'priority lead guarantee',
      validityDays: 180,
      listingLimit: 35,
      commissionCut: '0% Restamp commission',
      features: [
        'Up to 35 active prime mandates',
        'Dedicated Key Account Manager',
        'First access to exclusive builder pre-launches',
        '3D virtual walkthrough tag on listings',
        'Priority home loan assistance for your buyers',
        'Legal title check assistance desk',
      ],
    },
  ],
  Agency: [
    {
      id: 'agent-agency-growth',
      name: 'Agency Growth',
      category: 'Agency Team',
      price: 14999,
      priceSub1: 'for 180 days access',
      priceSub2: 'up to 5 team members',
      validityDays: 180,
      listingLimit: 60,
      popular: true,
      commissionCut: '0% Restamp commission',
      features: [
        'Up to 60 active agency mandates',
        '5 Agent sub-logins with role permissions',
        'Agency branded showcase microsite',
        'Bulk inventory CSV / XML feed upload',
        'Real-time team lead distribution CRM',
        'Dedicated relationship manager & legal desk',
      ],
    },
    {
      id: 'agent-agency-enterprise',
      name: 'Brokerage Enterprise',
      category: 'Agency Team',
      highlight: 'Institutional',
      price: 29999,
      priceSub1: 'for 365 days access',
      priceSub2: 'unlimited mandates & team',
      validityDays: 365,
      listingLimit: 999,
      commissionCut: '0% Restamp commission',
      features: [
        'Unlimited listings across all micro-markets',
        'Unlimited team agent licenses',
        'Exclusive developer marketing mandates',
        'Custom CRM API webhook integration',
        'Featured Agency spotlight on Restamp homepage',
        'Guaranteed minimum 150+ verified buyer leads / mo',
      ],
    },
  ],
};

/* --- LOCATION PACKAGES (Step 2 Requirements) --- */
export type LocationPackage = {
  id: 'loc-5' | 'loc-10' | 'loc-15';
  name: string;
  tagline: string;
  badge: string;
  locationLimit: number;
  price: number;
  monthlyEquivalent: number;
  validityDays: number;
  mandateLimit: number;
  popular?: boolean;
  commissionCut: string;
  features: string[];
};

export const locationPackages: LocationPackage[] = [
  {
    id: 'loc-5',
    name: '5 Micro-Markets',
    tagline: 'Ideal for neighborhood specialists & boutique agents',
    badge: 'Starter Hub',
    locationLimit: 5,
    price: 2999,
    monthlyEquivalent: 999,
    validityDays: 90,
    mandateLimit: 10,
    commissionCut: '0% Restamp commission',
    features: [
      'Coverage across 5 chosen high-intent micro-markets',
      'Post up to 10 active exclusive mandates',
      'Direct buyer WhatsApp & push lead notifications',
      'Verified RERA Agent badge on all listings',
      'Standard search ranking in your 5 zones',
      'Retain 100% of your buyer & seller brokerage',
    ],
  },
  {
    id: 'loc-10',
    name: '10 Micro-Markets',
    tagline: 'Best for active full-time agents & mid-size teams',
    badge: 'Growth Agent',
    locationLimit: 10,
    price: 4999,
    monthlyEquivalent: 1666,
    validityDays: 90,
    mandateLimit: 25,
    popular: true,
    commissionCut: '0% Restamp commission',
    features: [
      'Coverage across 10 prime micro-markets',
      'Post up to 25 active prime mandates',
      'Instant buyer phone unmasking & WhatsApp CRM sync',
      'Top 10% search placement in your 10 zones',
      'Access to Restamp Co-Broking Syndicate (50:50 splits)',
      'Quarterly deal closing analytics & price movement insights',
    ],
  },
  {
    id: 'loc-15',
    name: '15 Micro-Markets',
    tagline: 'Full metro-wide dominance for top-producing agencies',
    badge: 'Enterprise Syndicate',
    locationLimit: 15,
    price: 7999,
    monthlyEquivalent: 2666,
    validityDays: 90,
    mandateLimit: 50,
    commissionCut: '0% Restamp commission',
    features: [
      'City-wide dominance across 15 prime micro-markets',
      'Post up to 50 active high-value mandates',
      'Exclusive developer pre-launch mandate rights',
      'Dedicated Key Account Manager & fast RERA compliance desk',
      'Pre-approved mortgage assistance desk for your buyers',
      'Priority showcase in weekly Restamp HNI Buyer Digest',
    ],
  },
];

/* --- AVAILABLE AGENT LOCATIONS / MICRO-MARKETS --- */
export type AgentLocation = {
  id: string;
  name: string;
  city: string;
  region: 'South & OMR' | 'Central Chennai' | 'Coastal & ECR' | 'West Chennai';
  demandIntensity: 'Very High' | 'High' | 'Moderate';
  demandScore: number;
  avgTicketPrice: string;
  activeBuyers: number;
  tag: string;
};

export const availableAgentLocations: AgentLocation[] = [
  // South & OMR
  {
    id: 'omr-it-corridor',
    name: 'OMR IT Corridor',
    city: 'Chennai',
    region: 'South & OMR',
    demandIntensity: 'Very High',
    demandScore: 96,
    avgTicketPrice: '₹1.25 Cr',
    activeBuyers: 420,
    tag: 'Tech Hub',
  },
  {
    id: 'sholinganallur',
    name: 'Sholinganallur',
    city: 'Chennai',
    region: 'South & OMR',
    demandIntensity: 'Very High',
    demandScore: 94,
    avgTicketPrice: '₹95 L',
    activeBuyers: 380,
    tag: 'SEZ Corridor',
  },
  {
    id: 'velachery',
    name: 'Velachery',
    city: 'Chennai',
    region: 'South & OMR',
    demandIntensity: 'Very High',
    demandScore: 92,
    avgTicketPrice: '₹1.10 Cr',
    activeBuyers: 310,
    tag: 'Metro Connected',
  },
  {
    id: 'perungudi',
    name: 'Perungudi & Kandanchavadi',
    city: 'Chennai',
    region: 'South & OMR',
    demandIntensity: 'High',
    demandScore: 90,
    avgTicketPrice: '₹1.15 Cr',
    activeBuyers: 290,
    tag: 'Tech Park Zone',
  },
  {
    id: 'siruseri-navalur',
    name: 'Navalur & Siruseri SIPCOT',
    city: 'Chennai',
    region: 'South & OMR',
    demandIntensity: 'High',
    demandScore: 88,
    avgTicketPrice: '₹65 L',
    activeBuyers: 340,
    tag: 'IT Park Hub',
  },
  {
    id: 'medavakkam',
    name: 'Medavakkam & Pallikaranai',
    city: 'Chennai',
    region: 'South & OMR',
    demandIntensity: 'High',
    demandScore: 88,
    avgTicketPrice: '₹75 L',
    activeBuyers: 260,
    tag: 'Gated Condos',
  },
  {
    id: 'tambaram-chromepet',
    name: 'Tambaram & Chromepet',
    city: 'Chennai',
    region: 'South & OMR',
    demandIntensity: 'High',
    demandScore: 86,
    avgTicketPrice: '₹68 L',
    activeBuyers: 240,
    tag: 'Transit Hub',
  },
  {
    id: 'guindy',
    name: 'Guindy & Alandur',
    city: 'Chennai',
    region: 'South & OMR',
    demandIntensity: 'High',
    demandScore: 89,
    avgTicketPrice: '₹1.80 Cr',
    activeBuyers: 275,
    tag: 'Corporate Hub',
  },

  // Coastal & ECR
  {
    id: 'adyar-besant-nagar',
    name: 'Adyar & Besant Nagar',
    city: 'Chennai',
    region: 'Coastal & ECR',
    demandIntensity: 'Very High',
    demandScore: 98,
    avgTicketPrice: '₹3.40 Cr',
    activeBuyers: 290,
    tag: 'Luxury Coastal',
  },
  {
    id: 'ecr-beachside',
    name: 'ECR Beachside & Neelankarai',
    city: 'Chennai',
    region: 'Coastal & ECR',
    demandIntensity: 'High',
    demandScore: 90,
    avgTicketPrice: '₹4.20 Cr',
    activeBuyers: 210,
    tag: 'Boutique Villas',
  },
  {
    id: 'thiruvanmiyur',
    name: 'Thiruvanmiyur & Kottivakkam',
    city: 'Chennai',
    region: 'Coastal & ECR',
    demandIntensity: 'Very High',
    demandScore: 93,
    avgTicketPrice: '₹2.80 Cr',
    activeBuyers: 245,
    tag: 'Coastal Residential',
  },
  {
    id: 'palavakkam-injambakkam',
    name: 'Palavakkam & Injambakkam',
    city: 'Chennai',
    region: 'Coastal & ECR',
    demandIntensity: 'High',
    demandScore: 89,
    avgTicketPrice: '₹3.60 Cr',
    activeBuyers: 180,
    tag: 'Seafront Enclaves',
  },

  // Central Chennai
  {
    id: 'anna-nagar',
    name: 'Anna Nagar & Shenoy Nagar',
    city: 'Chennai',
    region: 'Central Chennai',
    demandIntensity: 'Very High',
    demandScore: 97,
    avgTicketPrice: '₹2.85 Cr',
    activeBuyers: 340,
    tag: 'Prime Residential',
  },
  {
    id: 't-nagar',
    name: 'T. Nagar & West Mambalam',
    city: 'Chennai',
    region: 'Central Chennai',
    demandIntensity: 'High',
    demandScore: 91,
    avgTicketPrice: '₹2.40 Cr',
    activeBuyers: 295,
    tag: 'Retail Commercial',
  },
  {
    id: 'nungambakkam-central',
    name: 'Nungambakkam & Central',
    city: 'Chennai',
    region: 'Central Chennai',
    demandIntensity: 'Very High',
    demandScore: 95,
    avgTicketPrice: '₹3.80 Cr',
    activeBuyers: 230,
    tag: 'HNI & Embassy',
  },
  {
    id: 'alwarpet-ra-puram',
    name: 'Alwarpet & RA Puram',
    city: 'Chennai',
    region: 'Central Chennai',
    demandIntensity: 'Very High',
    demandScore: 98,
    avgTicketPrice: '₹4.50 Cr',
    activeBuyers: 215,
    tag: 'Ultra-Luxury HNI',
  },
  {
    id: 'mylapore-mandaveli',
    name: 'Mylapore & Mandaveli',
    city: 'Chennai',
    region: 'Central Chennai',
    demandIntensity: 'High',
    demandScore: 92,
    avgTicketPrice: '₹2.90 Cr',
    activeBuyers: 250,
    tag: 'Heritage Prime',
  },
  {
    id: 'kilpauk-chetpet',
    name: 'Kilpauk & Chetpet',
    city: 'Chennai',
    region: 'Central Chennai',
    demandIntensity: 'High',
    demandScore: 90,
    avgTicketPrice: '₹3.10 Cr',
    activeBuyers: 220,
    tag: 'Central Elite',
  },

  // West Chennai
  {
    id: 'porur-dlf',
    name: 'Porur & DLF Tech Park',
    city: 'Chennai',
    region: 'West Chennai',
    demandIntensity: 'High',
    demandScore: 87,
    avgTicketPrice: '₹88 L',
    activeBuyers: 280,
    tag: 'IT SEZ West',
  },
  {
    id: 'koyambedu-vadapalani',
    name: 'Koyambedu & Vadapalani',
    city: 'Chennai',
    region: 'West Chennai',
    demandIntensity: 'High',
    demandScore: 89,
    avgTicketPrice: '₹1.45 Cr',
    activeBuyers: 270,
    tag: 'Metro Interchange',
  },
  {
    id: 'mogappair-nolambur',
    name: 'Mogappair & Nolambur',
    city: 'Chennai',
    region: 'West Chennai',
    demandIntensity: 'High',
    demandScore: 88,
    avgTicketPrice: '₹1.05 Cr',
    activeBuyers: 260,
    tag: 'Premium Gated West',
  },
  {
    id: 'kattupakkam',
    name: 'Kattupakkam & Iyyappanthangal',
    city: 'Chennai',
    region: 'West Chennai',
    demandIntensity: 'Moderate',
    demandScore: 84,
    avgTicketPrice: '₹62 L',
    activeBuyers: 210,
    tag: 'West Growth Corridor',
  },
];

export const AGENT_GST_RATE = 0.18;
export const AGENT_PROMO_CODES: Record<string, number> = {
  PARTNER500: 500,
  RERAPRO: 1000,
  RESTAMPAGENT: 500,
  GROWTH300: 300,
};

/* --- SUBSCRIPTION DATA MODELS --- */
export type AgentSubscription = {
  planId: string;
  planName: string;
  badge?: string;
  category: string;
  locationLimit: number;
  selectedLocations: string[];
  listingLimit: number;
  price: number;
  discount: number;
  gst: number;
  totalPaid: number;
  paymentId?: string;
  paymentMethod?: string;
  paymentStatus?: 'verified' | 'pending' | 'failed';
  startedAt: string;
  expiresAt: string | null;
  agentMobile?: string;
  agentName?: string;
  firmName?: string;
  reraNumber?: string;
};

export type AgentPaymentRecord = {
  id: string;
  packageId: string;
  packageName: string;
  locationsCount: number;
  locations: string[];
  amount: number;
  discount: number;
  gst: number;
  total: number;
  promoCode?: string;
  method: string;
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  paidAt: string;
  transactionRef: string;
};

const AGENT_SUB_KEY = 'restamp_agent_subscription';
const AGENT_PAYMENTS_KEY = 'restamp_agent_payments';
const AGENT_DRAFT_KEY = 'restamp_agent_draft_package';

/* --- BILLING CALCULATOR HELPER --- */
export function calculateAgentPackageBill(pkg: LocationPackage, discountAmount: number) {
  const afterDiscount = Math.max(0, pkg.price - discountAmount);
  const gst = Math.round(afterDiscount * AGENT_GST_RATE);
  const total = afterDiscount + gst;
  return {
    basePrice: pkg.price,
    discount: discountAmount,
    afterDiscount,
    gst,
    total,
  };
}

/* --- DRAFT PACKAGE STATE (Checkout Bridge) --- */
export type DraftAgentPackage = {
  packageId: 'loc-5' | 'loc-10' | 'loc-15';
  selectedLocations: string[];
  promoCode?: string;
  discount?: number;
  updatedAt: string;
};

export function saveDraftPackage(draft: DraftAgentPackage) {
  try {
    sessionStorage.setItem(AGENT_DRAFT_KEY, JSON.stringify(draft));
  } catch {}
}

export function getDraftPackage(): DraftAgentPackage | null {
  try {
    const raw = sessionStorage.getItem(AGENT_DRAFT_KEY);
    if (raw) return JSON.parse(raw) as DraftAgentPackage;
  } catch {}
  return null;
}

export function clearDraftPackage() {
  try {
    sessionStorage.removeItem(AGENT_DRAFT_KEY);
  } catch {}
}

/* --- SUBSCRIPTION PERSISTENCE --- */
export function getAgentSubscription(): AgentSubscription | null {
  try {
    const raw = localStorage.getItem(AGENT_SUB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AgentSubscription;
      // Check expiration
      if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
        return {
          ...parsed,
          paymentStatus: 'pending',
        };
      }
      return parsed;
    }
  } catch {}
  return null;
}

export function saveAgentSubscription(sub: AgentSubscription) {
  try {
    localStorage.setItem(AGENT_SUB_KEY, JSON.stringify(sub));
    window.dispatchEvent(new Event('agent-subscription-change'));
  } catch {}
}

export function clearAgentSubscription() {
  try {
    localStorage.removeItem(AGENT_SUB_KEY);
    window.dispatchEvent(new Event('agent-subscription-change'));
  } catch {}
}

/**
 * Checks if the currently active agent has a verified, unexpired paid subscription.
 * Existing paid agents won't be forced to pay again.
 */
export function hasActiveAgentSubscription(): boolean {
  const sub = getAgentSubscription();
  if (!sub) return false;
  if (sub.paymentStatus === 'failed') return false;
  if (sub.expiresAt && new Date(sub.expiresAt).getTime() < Date.now()) return false;
  return sub.selectedLocations && sub.selectedLocations.length > 0;
}

/* --- PAYMENT HISTORY PERSISTENCE --- */
export function getAgentPayments(): AgentPaymentRecord[] {
  try {
    const raw = localStorage.getItem(AGENT_PAYMENTS_KEY);
    return raw ? (JSON.parse(raw) as AgentPaymentRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveAgentPayment(record: AgentPaymentRecord) {
  try {
    const existing = getAgentPayments();
    localStorage.setItem(AGENT_PAYMENTS_KEY, JSON.stringify([record, ...existing]));
  } catch {}
}

/**
 * Activates an agent package upon verified payment confirmation.
 * Enforces idempotency via transactionRef and prevents duplicate charges.
 */
export function activateAgentPackage(
  pkg: LocationPackage,
  selectedLocations: string[],
  payment: {
    total: number;
    amount: number;
    discount: number;
    gst: number;
    promoCode?: string;
    method: string;
    agentMobile?: string;
    agentName?: string;
    firmName?: string;
    reraNumber?: string;
  }
): { sub: AgentSubscription; paymentRecord: AgentPaymentRecord } {
  const now = new Date();
  const paymentId = `PAY-AGNT-${now.getTime()}-${Math.floor(100 + Math.random() * 900)}`;
  const transactionRef = `TXN-RST-${now.getTime()}`;

  const paymentRecord: AgentPaymentRecord = {
    id: paymentId,
    packageId: pkg.id,
    packageName: pkg.name,
    locationsCount: selectedLocations.length,
    locations: selectedLocations,
    amount: payment.amount,
    discount: payment.discount,
    gst: payment.gst,
    total: payment.total,
    promoCode: payment.promoCode,
    method: payment.method,
    status: 'success',
    paidAt: now.toISOString(),
    transactionRef,
  };

  saveAgentPayment(paymentRecord);

  const sub: AgentSubscription = {
    planId: pkg.id,
    planName: pkg.name,
    badge: pkg.badge,
    category: 'Agent',
    locationLimit: pkg.locationLimit,
    selectedLocations,
    listingLimit: pkg.mandateLimit,
    price: payment.amount,
    discount: payment.discount,
    gst: payment.gst,
    totalPaid: payment.total,
    paymentId,
    paymentMethod: payment.method,
    paymentStatus: 'verified',
    startedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + pkg.validityDays * 864e5).toISOString(),
    agentMobile: payment.agentMobile,
    agentName: payment.agentName,
    firmName: payment.firmName,
    reraNumber: payment.reraNumber,
  };

  saveAgentSubscription(sub);
  clearDraftPackage();

  return { sub, paymentRecord };
}

/**
 * Seed an active subscription for existing verified partner accounts (e.g. Royal Realty Associates)
 * so existing paid agents can be tested seamlessly without being forced to pay again.
 */
export function seedExistingPartnerSubscription(mobile = '9840123456') {
  const sub: AgentSubscription = {
    planId: 'loc-10',
    planName: '10 Micro-Markets',
    badge: 'Growth Agent',
    category: 'Agent',
    locationLimit: 10,
    selectedLocations: [
      'OMR IT Corridor',
      'Sholinganallur',
      'Velachery',
      'Adyar & Besant Nagar',
      'Anna Nagar',
      'ECR Beachside',
      'Porur & DLF Tech Park',
      'Guindy & Alandur',
      'Medavakkam',
      'Tambaram & Chromepet',
    ],
    listingLimit: 25,
    price: 4999,
    discount: 500,
    gst: 809,
    totalPaid: 5308,
    paymentId: 'PAY-AGNT-0941',
    paymentMethod: 'UPI · royalrealty@okhdfcbank',
    paymentStatus: 'verified',
    startedAt: new Date(Date.now() - 14 * 864e5).toISOString(),
    expiresAt: new Date(Date.now() + 76 * 864e5).toISOString(),
    agentMobile: mobile,
    agentName: 'Arun Kumar',
    firmName: 'Royal Realty Associates',
    reraNumber: 'TN/AGENT/0491/2023',
  };
  saveAgentSubscription(sub);
  return sub;
}

/**
 * Checks whether an agent's active subscription covers a specific micro-market locality.
 */
export function canAgentAccessLocation(locality: string): boolean {
  const sub = getAgentSubscription();
  if (!sub || !sub.selectedLocations || sub.selectedLocations.length === 0) return false;
  const cleanLoc = locality.toLowerCase().trim();
  return sub.selectedLocations.some((l) => {
    const cleanSub = l.toLowerCase().trim();
    return cleanLoc.includes(cleanSub) || cleanSub.includes(cleanLoc);
  });
}
