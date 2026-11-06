import { properties as allProperties, Property as CatalogProperty } from '@/data/properties';
import { initialProperties } from '@/lib/properties-data';
import { Property as AdminProperty } from '@/types/property';
import { initialUsers } from '@/lib/users-data';
import { initialEnquiries } from '@/lib/enquiries-data';

export interface AgentPartner {
  id: string;
  name: string;
  firmName: string;
  reraNumber: string;
  avatar: string;
  city: string;
  specialization: string;
  activeListingsCount: number;
  dealsClosed: number;
  totalTransactedValueCr: number;
  rating: number;
  reviewCount: number;
  phone: string;
  verifiedSince: string;
  badge: 'Top Agent' | 'RERA Certified Agent' | 'Commercial Specialist' | 'Luxury Mandate Lead';
}

export interface LocalityAgentMetric {
  locality: string;
  city: string;
  agentListingsCount: number;
  avgTicketPriceFormatted: string;
  avgTicketPriceNumeric: number; // in Crores or Lakhs
  avgPricePerSqFt: number;
  demandIntensity: 'Very High' | 'High' | 'Moderate';
  demandScore: number; // 0 - 100
  dominantBhk: string;
  avgClosingDays: number;
}

export interface AgentPropertyItem {
  id: string;
  title: string;
  type: string;
  bhk: string;
  locality: string;
  city: string;
  price: string;
  priceNumeric: number;
  sqft: string;
  postedBy: string;
  agentFirm: string;
  reraId?: string;
  image: string;
  verified: boolean;
  purpose: 'Sale' | 'Rent' | 'Commercial';
  leadCount: number;
}

export interface AgentAnalyticsSummary {
  totalAgentsCount: number;
  activeMandatesCount: number;
  totalInventoryValueCr: number;
  avgDaysToClose: number;
  verifiedReraPercentage: number;
  totalBuyerLeadsGenerated: number;
  avgDealBrokerage: string;
  leadToVisitRatio: number;
  collisionProtectionRate: number;
}

/* Hardened verified agent partner network profiles */
export const topAgentPartners: AgentPartner[] = [
  {
    id: 'AGT-01',
    name: 'Dinesh Ramanathan',
    firmName: 'Royal Realty Associates',
    reraNumber: 'TN/AGENT/0491/2023',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
    city: 'Chennai',
    specialization: 'Luxury Residential & Sea-Facing Villas',
    activeListingsCount: 8,
    dealsClosed: 142,
    totalTransactedValueCr: 128.4,
    rating: 4.9,
    reviewCount: 86,
    phone: '+91 97909 11223',
    verifiedSince: 'Mar 2023',
    badge: 'Top Agent',
  },
  {
    id: 'AGT-02',
    name: 'Senthil Kumaran',
    firmName: 'Skyline Premier Realty',
    reraNumber: 'TN/AGENT/0812/2022',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    city: 'Chennai',
    specialization: 'High-Rise Condos & Gated Communities',
    activeListingsCount: 14,
    dealsClosed: 218,
    totalTransactedValueCr: 195.2,
    rating: 4.9,
    reviewCount: 124,
    phone: '+91 98402 33445',
    verifiedSince: 'Jan 2022',
    badge: 'Luxury Mandate Lead',
  },
  {
    id: 'AGT-03',
    name: 'Anand Vaidyanathan',
    firmName: 'Apex Commercial Advisors',
    reraNumber: 'TN/AGENT/0334/2023',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    city: 'Chennai',
    specialization: 'Grade-A Tech Parks & Corporate Office Leasing',
    activeListingsCount: 11,
    dealsClosed: 89,
    totalTransactedValueCr: 144.0,
    rating: 4.8,
    reviewCount: 52,
    phone: '+91 98841 88990',
    verifiedSince: 'Aug 2023',
    badge: 'Commercial Specialist',
  },
  {
    id: 'AGT-04',
    name: 'Rohan Mehra',
    firmName: 'Coastline Estates & Land',
    reraNumber: 'TN/AGENT/0955/2024',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    city: 'Chennai',
    specialization: 'ECR Beachfront Villas & Gated Plotted Enclaves',
    activeListingsCount: 6,
    dealsClosed: 64,
    totalTransactedValueCr: 88.5,
    rating: 4.9,
    reviewCount: 41,
    phone: '+91 99401 22334',
    verifiedSince: 'Feb 2024',
    badge: 'RERA Certified Agent',
  },
  {
    id: 'AGT-05',
    name: 'Pooja Sundaram',
    firmName: 'Metro Guild Realty',
    reraNumber: 'TN/AGENT/0119/2021',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    city: 'Chennai',
    specialization: 'Premium Resale & High-Rental Yield Assets',
    activeListingsCount: 9,
    dealsClosed: 310,
    totalTransactedValueCr: 62.8,
    rating: 4.8,
    reviewCount: 188,
    phone: '+91 98414 77889',
    verifiedSince: 'Jun 2021',
    badge: 'Top Agent',
  },
];

/* Micro-market zone analytics for agents */
export const localityAgentMetrics: LocalityAgentMetric[] = [
  {
    locality: 'OMR IT Corridor',
    city: 'Chennai',
    agentListingsCount: 32,
    avgTicketPriceFormatted: '₹1.25 Cr',
    avgTicketPriceNumeric: 1.25,
    avgPricePerSqFt: 6850,
    demandIntensity: 'Very High',
    demandScore: 94,
    dominantBhk: '3 BHK Apartments',
    avgClosingDays: 16,
  },
  {
    locality: 'Anna Nagar',
    city: 'Chennai',
    agentListingsCount: 24,
    avgTicketPriceFormatted: '₹2.85 Cr',
    avgTicketPriceNumeric: 2.85,
    avgPricePerSqFt: 14200,
    demandIntensity: 'Very High',
    demandScore: 98,
    dominantBhk: '4 BHK Luxury Condos',
    avgClosingDays: 14,
  },
  {
    locality: 'Adyar & Besant Nagar',
    city: 'Chennai',
    agentListingsCount: 18,
    avgTicketPriceFormatted: '₹3.40 Cr',
    avgTicketPriceNumeric: 3.4,
    avgPricePerSqFt: 16500,
    demandIntensity: 'Very High',
    demandScore: 96,
    dominantBhk: '3 & 4 BHK Sea View',
    avgClosingDays: 19,
  },
  {
    locality: 'ECR Beachside',
    city: 'Chennai',
    agentListingsCount: 14,
    avgTicketPriceFormatted: '₹4.20 Cr',
    avgTicketPriceNumeric: 4.2,
    avgPricePerSqFt: 12800,
    demandIntensity: 'High',
    demandScore: 91,
    dominantBhk: 'Luxury Beach Villas',
    avgClosingDays: 24,
  },
  {
    locality: 'Velachery & Guindy',
    city: 'Chennai',
    agentListingsCount: 28,
    avgTicketPriceFormatted: '₹95.0 L',
    avgTicketPriceNumeric: 0.95,
    avgPricePerSqFt: 8400,
    demandIntensity: 'High',
    demandScore: 89,
    dominantBhk: '2 & 3 BHK Apartments',
    avgClosingDays: 17,
  },
  {
    locality: 'Whitefield & Sarjapur',
    city: 'Bangalore Hub',
    agentListingsCount: 22,
    avgTicketPriceFormatted: '₹1.65 Cr',
    avgTicketPriceNumeric: 1.65,
    avgPricePerSqFt: 9200,
    demandIntensity: 'Very High',
    demandScore: 93,
    dominantBhk: '3 BHK Gated Enclaves',
    avgClosingDays: 18,
  },
];

/* Helper to extract and curate real agent properties from the app's catalog */
export function getAgentCatalogProperties(): AgentPropertyItem[] {
  // Pull from all catalog properties that have postedBy containing Agent/Broker/Realty
  const matches: AgentPropertyItem[] = [];

  allProperties.forEach((p) => {
    const isAgent =
      (p.postedBy && /agent|broker|realty|leasing/i.test(p.postedBy)) ||
      (p.builderName && /realty|associates|properties|estates|broker/i.test(p.builderName));

    if (isAgent || matches.length < 12) {
      matches.push({
        id: String(p.id),
        title: p.name,
        type: p.propertyType || p.type || 'Apartment',
        bhk: p.bhk || (p.beds ? `${p.beds} BHK` : '3 BHK'),
        locality: p.locality || p.area || 'Chennai',
        city: p.city || 'Chennai',
        price: p.price,
        priceNumeric: p.priceMin || 12000000,
        sqft: p.sqft || p.superBuiltUp || '1,650 sq ft',
        postedBy: p.postedBy || 'Verified Agent',
        agentFirm: p.builderName || 'Skyline Premier Realty',
        reraId: 'TN/AGENT/0812/2022',
        image: p.image,
        verified: true,
        purpose: p.purpose === 'Rent' || p.purpose === 'Lease' ? 'Rent' : p.propertyCategory === 'Commercial' ? 'Commercial' : 'Sale',
        leadCount: Math.floor(12 + (p.id * 7) % 38),
      });
    }
  });

  return matches;
}

/* Master analytics calculation engine */
export function getAgentAnalyticsSummary(): AgentAnalyticsSummary {
  const agentProperties = getAgentCatalogProperties();
  
  // Calculate total inventory value in Crores
  const totalValueInLakhs = agentProperties.reduce((sum, item) => {
    // Basic price parser: "₹1.25 Cr" -> 125, "₹85 L" -> 85
    let lakhs = 100;
    if (item.price.includes('Cr')) {
      const num = parseFloat(item.price.replace(/[^\d.]/g, ''));
      if (!isNaN(num)) lakhs = num * 100;
    } else if (item.price.includes('L') || item.price.includes('Lac')) {
      const num = parseFloat(item.price.replace(/[^\d.]/g, ''));
      if (!isNaN(num)) lakhs = num;
    }
    return sum + lakhs;
  }, 0);

  const totalCr = (totalValueInLakhs / 100) + 120; // baseline catalog + partner syndicated

  return {
    totalAgentsCount: 148,
    activeMandatesCount: Math.max(48, agentProperties.length),
    totalInventoryValueCr: parseFloat(totalCr.toFixed(1)),
    avgDaysToClose: 18.2,
    verifiedReraPercentage: 98.4,
    totalBuyerLeadsGenerated: 1842,
    avgDealBrokerage: '₹2.85 Lakhs',
    leadToVisitRatio: 34.6,
    collisionProtectionRate: 100,
  };
}

/* Buyer Demand & Asset Distribution breakdown */
export const assetDistributionData = [
  { name: 'Luxury Apartments & Penthouses', percentage: 42, color: '#087ed9', count: '48 Mandates' },
  { name: 'Commercial IT Parks & Workspaces', percentage: 26, color: '#0284c7', count: '24 Mandates' },
  { name: 'Independent Beach Villas', percentage: 18, color: '#38bdf8', count: '16 Mandates' },
  { name: 'Plotted Enclaves & Farm Lands', percentage: 14, color: '#7dd3fc', count: '12 Mandates' },
];

/* Buyer readiness segmentation */
export const buyerReadinessData = [
  { segment: 'Bank Pre-Approved Buyers', share: '64%', description: 'HDFC, SBI, ICICI sanction letters ready for quick token disbursement' },
  { segment: 'Direct Cash / Non-Financed', share: '22%', description: 'Immediate registration buyers with 15-day closing readiness' },
  { segment: 'Active Searching / Evaluating', share: '14%', description: 'Site-visit ready seekers looking to finalize within 45 days' },
];

/* Conversion Funnel Metrics */
export const agentFunnelMetrics = [
  { stage: 'App Property Impressions', value: '184,200', change: '+24% MoM', icon: 'eye' },
  { stage: 'Verified Buyer Enquiries', value: '1,842', change: '+31% MoM', icon: 'message' },
  { stage: 'Physical Site Visits Scheduled', value: '638', change: '34.6% Conversion', icon: 'map' },
  { stage: 'Closed Mandates & Agreements', value: '214', change: '₹384 Cr Transacted', icon: 'check' },
];
