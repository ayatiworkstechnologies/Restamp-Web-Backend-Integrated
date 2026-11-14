/**
 * Reva AI: copy, quick actions, knowledge base and chat transport.
 * Ported from the mobile app module (src/reva) for the Next.js website.
 */

export type RevaRole = "Buyer" | "Owner" | "Agent";
export type RevaLang = "en" | "ta";
export type DataKind = "listings" | "saved" | "visits" | "contactPrompt";
export type RevaRoute = "Search" | "OwnerAdd" | "OwnerDashboard" | "OwnerPlans" | "Activity" | "AgentPlans" | "AgentDashboard" | "Saved";
export interface RevaAction {
  label: string;
  route: RevaRoute;
}

/** Website paths for the app's route names. */
export const ROUTE_PATHS: Record<RevaRoute, string> = {
  Search: "/buy",
  OwnerAdd: "/post-property",
  OwnerDashboard: "/owner/dashboard",
  OwnerPlans: "/owner/plans",
  Activity: "/activity",
  Saved: "/saved",
  AgentPlans: "/agent/packages",
  AgentDashboard: "/agent/dashboard",
};

export const LANGUAGES: { code: RevaLang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ta", label: "தமிழ்" },
];

export const COPY = {
  en: {
    welcome: (role: RevaRole) =>
      `Hi! 👋 I'm Reva AI, your Restamp property assistant. How can I help you as a ${role.toLowerCase()}?`,
    open: "Ask Reva AI",
    close: "Close chat",
    online: "Online · Voice & Text",
    placeholder: "Ask Reva about properties…",
    send: "Send message",
    thinking: "Thinking…",
    tooLong: "Please keep your question under 500 characters.",
    networkError: "Connection failed. Please check your network and retry.",
    disclaimer: "AI can make mistakes. Verify property details directly with owners.",
    languageLabel: "Chat language",
    startRecording: "Speak to Reva",
    stopRecording: "Stop recording",
    listening: "Listening… speak now, tap the mic to finish",
    micDenied: "Microphone permission was denied. Please allow it in your browser settings.",
    voiceError: "Voice input failed. Please try again or type your question.",
    voiceEmpty: "No speech was recognized. Please try speaking again.",
    voiceUnsupported: "Voice input isn't available in this browser. Try Chrome or Edge.",
    speak: "Listen",
    autoSpeakOn: "Auto-voice on",
    autoSpeakOff: "Auto-voice off",
    speakingError: "Speech playback isn't available in this browser for the selected language.",
    roles: { Buyer: "Buyer", Owner: "Owner", Agent: "Agent" } as Record<RevaRole, string>,
    newChat: "New chat",
  },
  ta: {
    welcome: (role: RevaRole) =>
      `வணக்கம்! 👋 நான் Reva AI, உங்கள் Restamp சொத்து உதவியாளர். ${role === "Owner" ? "உரிமையாளராக" : role === "Agent" ? "முகவராக" : "வாங்குபவராக"} உங்களுக்கு என்ன உதவி வேண்டும்?`,
    open: "Reva AI-யிடம் கேளுங்கள்",
    close: "உரையாடலை மூடு",
    online: "இணைப்பில் · குரல் & எழுத்து",
    placeholder: "Reva-விடம் கேளுங்கள்…",
    send: "செய்தி அனுப்பு",
    thinking: "பதிலைத் தயாரிக்கிறது…",
    tooLong: "கேள்வி 500 எழுத்துகளுக்குள் இருக்க வேண்டும்.",
    networkError: "இணைப்பு தோல்வி. உங்கள் இணைய இணைப்பைச் சரிபார்க்கவும்.",
    disclaimer: "AI பதிலில் பிழைகள் இருக்கலாம். சொத்து விவரங்களை உரிமையாளரிடம் உறுதிப்படுத்தவும்.",
    languageLabel: "உரையாடல் மொழி",
    startRecording: "குரலில் பேசவும்",
    stopRecording: "பதிவை நிறுத்து",
    listening: "கேட்கிறேன்… பேசுங்கள், முடிக்க மைக்கைத் தட்டவும்",
    micDenied: "மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. உலாவி அமைப்புகளில் அனுமதிக்கவும்.",
    voiceError: "குரல் உள்ளீடு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.",
    voiceEmpty: "குரல் புரியவில்லை. மீண்டும் பேசவும்.",
    voiceUnsupported: "இந்த உலாவியில் குரல் உள்ளீடு கிடைக்கவில்லை. Chrome-ஐப் பயன்படுத்தவும்.",
    speak: "கேட்கவும்",
    autoSpeakOn: "குரல் பதில்: இயக்கு",
    autoSpeakOff: "குரல் பதில்: நிறுத்து",
    speakingError: "இந்த உலாவியில் தமிழ் பேச்சு ஒலி கிடைக்கவில்லை.",
    roles: { Buyer: "வாங்குபவர்", Owner: "உரிமையாளர்", Agent: "முகவர்" } as Record<RevaRole, string>,
    newChat: "புதிய உரையாடல்",
  },
};

export interface QuickAction {
  label: string;
  question: string;
  dataKind?: DataKind;
}

export const QUICK_ACTIONS: Record<RevaLang, Record<RevaRole, QuickAction[]>> = {
  en: {
    Buyer: [
      { label: "🏠 Find a property", question: "How do I find and filter properties in Chennai?", dataKind: "listings" },
      { label: "💰 0% Brokerage", question: "How does 0% brokerage work on Restamp?" },
      { label: "📅 Schedule visit", question: "How can I book a site visit with an owner?", dataKind: "visits" },
      { label: "📞 Contact owner", question: "I want to contact a property owner", dataKind: "contactPrompt" },
      { label: "⭐ Saved properties", question: "Where do I find my shortlisted properties?", dataKind: "saved" },
    ],
    Owner: [
      { label: "➕ Post property", question: "How do I list my property on Restamp?" },
      { label: "💎 Owner plans", question: "What owner subscription plans are available?" },
      { label: "📊 Leads & visits", question: "Where can I track my buyer leads and site visits?" },
      { label: "🛡️ Verification", question: "How does property verification work?" },
    ],
    Agent: [
      { label: "🏘️ Locality leads", question: "How do Chennai locality packages work for agents?" },
      { label: "📈 Agent dashboard", question: "What features are included in the Agent Dashboard?" },
      { label: "💼 Partner pricing", question: "What are the Agent Starter, Pro and Elite plans?" },
      { label: "❓ General help", question: "What can Reva AI assist me with?" },
    ],
  },
  ta: {
    Buyer: [
      { label: "🏠 சொத்து தேடல்", question: "சென்னையில் சொத்துகளை எவ்வாறு தேடுவது?", dataKind: "listings" },
      { label: "💰 0% தரகு", question: "Restamp-ல் 0% தரகு எவ்வாறு செயல்படுகிறது?" },
      { label: "📅 பார்வை பதிவு", question: "சொத்துப் பார்வைக்கு எவ்வாறு நேரம் ஒதுக்குவது?", dataKind: "visits" },
      { label: "📞 உரிமையாளரை தொடர்பு", question: "நான் சொத்து உரிமையாளரை தொடர்பு கொள்ள வேண்டும்", dataKind: "contactPrompt" },
      { label: "⭐ விருப்பப் பட்டியல்", question: "எனது சேமிக்கப்பட்ட சொத்துகளை எங்கே பார்ப்பது?", dataKind: "saved" },
    ],
    Owner: [
      { label: "➕ சொத்து பதிவு", question: "எனது சொத்தை Restamp-ல் எவ்வாறு பதிவு செய்வது?" },
      { label: "💎 உரிமையாளர் திட்டம்", question: "உரிமையாளர்களுக்கான திட்டங்கள் என்னென்ன?" },
      { label: "📊 வாடிக்கையாளர் தொடர்புகள்", question: "வாங்குபவர் தொடர்புகளை எங்கே பார்ப்பது?" },
      { label: "🛡️ சரிபார்ப்பு", question: "சொத்து சரிபார்ப்பு எவ்வாறு செயல்படுகிறது?" },
    ],
    Agent: [
      { label: "🏘️ பகுதி வாய்ப்புகள்", question: "சென்னை பகுதி தொகுப்புகள் எவ்வாறு செயல்படுகின்றன?" },
      { label: "📈 முகவர் டாஷ்போர்டு", question: "முகவர் டாஷ்போர்டில் என்னென்ன வசதிகள் உள்ளன?" },
      { label: "💼 கூட்டாளர் திட்டங்கள்", question: "முகவர் திட்டங்களின் விலை விவரங்கள் என்ன?" },
      { label: "❓ பொதுவான உதவி", question: "Reva AI எனக்கு எதில் உதவ முடியும்?" },
    ],
  },
};

interface KbItem {
  keywords: string[];
  reply: string;
  action: RevaAction;
}

const KB_EN: KbItem[] = [
  {
    keywords: ["brokerage", "commission", "zero brokerage", "0%"],
    reply: "Restamp is a direct 100% zero-brokerage platform. Buyers and tenants connect directly with authentic property owners without middlemen or brokerage fees.",
    action: { label: "Browse Direct Listings", route: "Search" },
  },
  {
    keywords: ["list", "post", "sell", "publish", "add property", "new listing", "owner listing"],
    reply: "Listing your property takes less than 3 minutes through our guided owner flow: select category, enter details, location & pincode, measurements & floor, amenities, real photos, and submit. Once submitted, our automated engine verifies the listing for immediate visibility.",
    action: { label: "Post Your Property", route: "OwnerAdd" },
  },
  {
    keywords: ["agent", "broker", "partner", "localities", "elite", "agent plan", "starter, pro"],
    reply: "Restamp Agent Partner plans give local brokers direct buyer leads mapped to the Chennai localities they choose (5, 10 or 15 areas), plus a dedicated Agent Dashboard.",
    action: { label: "Agent Plans", route: "AgentPlans" },
  },
  {
    keywords: ["plan", "pricing", "subscription", "starter", "plus", "gold", "premium", "cost", "charge", "fee"],
    reply: "Restamp offers owner subscription plans with different listing limits, validity and support, from a single listing up to bundles with a relationship manager and social media promotion. See the current prices on the Owner Plans page.",
    action: { label: "View Owner Plans", route: "OwnerPlans" },
  },
  {
    keywords: ["visit", "schedule", "appointment", "booking", "timing", "tour"],
    reply: "You can schedule an in-person site visit from any property detail page. Choose your preferred date and time slot and the owner is notified instantly to confirm or reschedule.",
    action: { label: "View Activity & Visits", route: "Activity" },
  },
  {
    keywords: ["saved", "shortlist", "favorite", "favourite", "bookmark", "wishlist"],
    reply: "Tap the heart icon on any property card to save it. You can review and compare all your shortlisted properties anytime on the Saved page.",
    action: { label: "Open Saved Properties", route: "Saved" },
  },
  {
    keywords: ["lead", "enquir", "inquir", "dashboard", "manage"],
    reply: "Property owners can view genuine buyer enquiries, contact requests and scheduled site visits from the Owner Dashboard.",
    action: { label: "Owner Dashboard", route: "OwnerDashboard" },
  },
  {
    keywords: ["verify", "verification", "authentic", "trust", "safety"],
    reply: "Every property on Restamp goes through verification of address, photos and owner authenticity. Verified listings get a 'Verified' badge and top search placement.",
    action: { label: "Post Verified Property", route: "OwnerAdd" },
  },
  {
    keywords: ["find", "search", "explore", "filter", "apartment", "villa", "plot", "house", "rent", "buy", "locality", "omr", "anna nagar", "velachery", "chennai"],
    reply: "Restamp lets you browse verified residential and commercial properties across Chennai with 0% brokerage. Filter by deal type (Buy, Resale, Rent, Lease), property type (Apartment, House, Villa, Plot, Commercial) and localities like Anna Nagar, OMR, Velachery and Adyar.",
    action: { label: "Explore Properties", route: "Search" },
  },
];

const KB_TA: KbItem[] = [
  {
    keywords: ["தரகு", "கமிஷன்", "0%", "இடைத்தரகர்"],
    reply: "Restamp 100% நேரடி தரகு இல்லாத தளம். வாங்குபவர்களும் வாடகைதாரர்களும் இடைத்தரகர்கள் இல்லாமல் நேரடியாக உரிமையாளர்களுடன் தொடர்பு கொள்ளலாம்.",
    action: { label: "நேரடி சொத்துகள்", route: "Search" },
  },
  {
    keywords: ["பதிவு செய்வது", "விற்ப", "சேர்க்க", "சொத்து பதிவு"],
    reply: "உங்கள் சொத்தை Restamp-ல் பதிவு செய்ய எளிய படிகள் உள்ளன: வகை தேர்வு, விவரங்கள், முகவரி & பின்கோட், பரப்பளவு, வசதிகள், புகைப்படங்கள் மற்றும் சமர்ப்பிப்பு. சமர்ப்பித்தவுடன் உடனடி சரிபார்ப்பு நடைபெறும்.",
    action: { label: "சொத்து பதிவு செய்ய", route: "OwnerAdd" },
  },
  {
    keywords: ["முகவர்", "பகுதி"],
    reply: "Restamp முகவர் திட்டங்கள் நீங்கள் தேர்ந்தெடுக்கும் சென்னை பகுதிகளுக்கான (5, 10 அல்லது 15) நேரடி வாடிக்கையாளர் தொடர்புகளையும் முகவர் டாஷ்போர்டையும் வழங்குகின்றன.",
    action: { label: "முகவர் திட்டங்கள்", route: "AgentPlans" },
  },
  {
    keywords: ["திட்ட", "விலை", "ஸ்டார்ட்டர்", "பிளஸ்", "கோல்ட்", "பிரீமியம்", "கட்டணம்"],
    reply: "Restamp உரிமையாளர்களுக்கு வெவ்வேறு பதிவு எண்ணிக்கை, காலம் மற்றும் உதவி கொண்ட சந்தா திட்டங்களை வழங்குகிறது. தற்போதைய விலைகளை உரிமையாளர் திட்டங்கள் பக்கத்தில் காணலாம்.",
    action: { label: "திட்டங்களைக் காண்க", route: "OwnerPlans" },
  },
  {
    keywords: ["பார்வை", "நேரம்", "பார்வையிட"],
    reply: "சொத்து விவரப் பக்கத்தில் நேரில் சென்று பார்க்க நீங்கள் விரும்பிய நாள் மற்றும் நேரத்தைத் தேர்ந்தெடுக்கலாம். உரிமையாளருக்கு உடனடி தகவல் சென்று உறுதிப்படுத்தப்படும்.",
    action: { label: "பார்வை விவரங்கள்", route: "Activity" },
  },
  {
    keywords: ["சேமித்த", "சேமிக்கப்பட்ட", "விருப்ப", "பிடித்தவை"],
    reply: "எந்தவொரு சொத்து அட்டை மீதும் உள்ள இதயக் குறியீட்டைத் தட்டி சேமிக்கலாம். சேமித்த சொத்துகளை 'சேமிக்கப்பட்டவை' பக்கத்தில் எப்போது வேண்டுமானாலும் பார்க்கலாம்.",
    action: { label: "சேமிக்கப்பட்டவை", route: "Saved" },
  },
  {
    keywords: ["தொடர்பு", "டாஷ்போர்டு", "விசாரணை"],
    reply: "உரிமையாளர் டாஷ்போர்டில் வாங்குபவர்களின் விசாரணைகள், தொலைபேசி கோரிக்கைகள் மற்றும் பார்வை நேரங்களை எளிதாக நிர்வகிக்கலாம்.",
    action: { label: "உரிமையாளர் பகுதி", route: "OwnerDashboard" },
  },
  {
    keywords: ["சரிபார்ப்பு"],
    reply: "Restamp-ல் உள்ள ஒவ்வொரு சொத்தின் முகவரி, புகைப்படங்கள் மற்றும் உரிமையாளர் விவரங்கள் சரிபார்க்கப்படுகின்றன. சரிபார்க்கப்பட்ட சொத்துகளுக்கு 'Verified' அடையாளம் கிடைக்கும்.",
    action: { label: "சொத்து பதிவு செய்ய", route: "OwnerAdd" },
  },
  {
    keywords: ["தேட", "சொத்து", "வடிகட்டி", "வீடு", "வாடகை", "வாங்க", "சென்னை", "அண்ணா நகர்", "வேளச்சேரி", "omr"],
    reply: "Restamp மூலம் சென்னையில் உள்ள சரிபார்க்கப்பட்ட வீடுகள், அடுக்குமாடி குடியிருப்புகள் மற்றும் வீட்டுமனைகளை 0% தரகில் தேடலாம். வாங்க, வாடகைக்கு எடுக்க அல்லது குத்தகைக்கு பெற வடிகட்டிகளைப் பயன்படுத்தலாம்.",
    action: { label: "சொத்துகளைக் காண்க", route: "Search" },
  },
];

export interface RevaReply {
  text: string;
  action?: RevaAction;
  demo: boolean;
}

function matchKb(kb: KbItem[], query: string) {
  return kb.find((item) => item.keywords.some((kw) => query.includes(kw)));
}

export function getLocalReply(question: string, role: RevaRole, lang: RevaLang): RevaReply {
  const q = question.toLowerCase();
  const hit = matchKb(lang === "ta" ? KB_TA : KB_EN, q) ?? matchKb(lang === "ta" ? KB_EN : KB_TA, q);
  if (hit) return { text: hit.reply, action: hit.action, demo: true };

  if (lang === "ta") {
    if (role === "Owner")
      return { text: "உரிமையாளர் சொத்து பதிவு, சந்தா திட்டங்கள் மற்றும் வாங்குபவர் தொடர்புகளை நிர்வகிக்க நான் உதவ முடியும். உங்களுக்கு என்ன உதவி வேண்டும்?", action: { label: "உரிமையாளர் பகுதி", route: "OwnerDashboard" }, demo: true };
    if (role === "Agent")
      return { text: "சென்னை பகுதி முகவர் திட்டங்கள் மற்றும் வாடிக்கையாளர் தொடர்புகளை நிர்வகிக்க நான் உதவ முடியும். எவ்வாறு உதவலாம்?", action: { label: "முகவர் திட்டங்கள்", route: "AgentPlans" }, demo: true };
    return { text: "நான் Reva AI, உங்கள் Restamp சொத்து உதவியாளர். சென்னையில் வீடுகள் தேடுதல், 0% தரகு மற்றும் சொத்துப் பார்வைக்கு உதவ முடியும். என்னிடம் கேளுங்கள்!", action: { label: "சொத்துகளைக் காண்க", route: "Search" }, demo: true };
  }
  if (role === "Owner")
    return { text: "I can help you list properties, choose an owner plan, review buyer leads, or track scheduled site visits. What would you like to do?", action: { label: "Owner Dashboard", route: "OwnerDashboard" }, demo: true };
  if (role === "Agent")
    return { text: "I can assist you with agent locality packages, buyer leads and the agent dashboard. How can I help your real estate business today?", action: { label: "Agent Plans", route: "AgentPlans" }, demo: true };
  return { text: "I'm Reva AI, your Restamp property assistant. I can help you search properties in Chennai, understand 0% brokerage, schedule site visits, or post a property. Ask me anything!", action: { label: "Explore Chennai Homes", route: "Search" }, demo: true };
}

/**
 * Sends the question to the chat API when NEXT_PUBLIC_CHAT_API_URL is set
 * (POST { message, role, language, history } -> { reply }); otherwise, or on
 * any failure, answers from the built-in knowledge base.
 */
export async function sendRevaChat(opts: {
  question: string;
  role: RevaRole;
  language: RevaLang;
  history: { from: "user" | "assistant"; text: string }[];
  signal?: AbortSignal;
}): Promise<RevaReply> {
  const local = getLocalReply(opts.question, opts.role, opts.language);
  const url = process.env.NEXT_PUBLIC_CHAT_API_URL?.trim();
  if (!url) return local;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: opts.question,
        role: opts.role,
        language: opts.language,
        history: opts.history.slice(-8).map((m) => ({ role: m.from, content: m.text })),
      }),
      signal: opts.signal,
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.reply === "string" && data.reply.trim()) {
        return { text: data.reply, action: local.action, demo: !!data.demo };
      }
    }
  } catch (e) {
    if (opts.signal?.aborted) throw e;
  }
  return local;
}
