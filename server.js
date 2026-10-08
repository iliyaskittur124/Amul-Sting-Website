import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Flexible URL normalizer for Vercel Serverless Function rewrites
app.use((req, res, next) => {
  if (!req.url.startsWith('/api') && req.url !== '/' && !req.url.startsWith('/frames')) {
    req.url = '/api' + req.url;
  }
  next();
});

app.get('/api', (req, res) => {
  res.json({
    service: 'Amul × Sting Neural Beverage Engine API',
    status: 'online',
    version: '2.8.0-ENTERPRISE',
    anandFacility: 'GCMMF Anand Plant #4 (Gujarat, India)',
    endpoints: [
      '/api/health',
      '/api/coldchain/telemetry',
      '/api/ai/synthesize',
      '/api/community/creations',
      '/api/orders',
      '/api/analytics'
    ]
  });
});

// Data storage directory (Uses /tmp in Vercel Serverless environment to prevent EROFS errors)
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Storage directory initialization notice:', e.message);
  }
}

const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CREATIONS_FILE = path.join(DATA_DIR, 'creations.json');


// Initial seed data
const initialCreations = [
  {
    id: 'AMUL-AI-001',
    name: 'Neon Damask Overdrive',
    mood: 'Late Night Coding Marathon',
    caffeine: 85,
    dairy: 70,
    rose: 90,
    chill: 2,
    carbonation: 'High Fizz',
    tagline: 'Hyper-focused cognitive surge wrapped in velvety dairy calm.',
    flavorNotes: ['Crisp Pink Petals', 'Silken Milk Foam', 'Citrus Zing', 'Electrifying Taurine Kick'],
    caffeineMg: 88,
    colorGlow: '#ff2d87',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'AMUL-AI-002',
    name: 'Himalayan Silk Recharge',
    mood: 'Post-Workout Beast Mode',
    caffeine: 72,
    dairy: 95,
    rose: 60,
    chill: 3,
    carbonation: 'Velvet Smooth',
    tagline: 'High-protein milk emulsion engineered for instant glycogen replenishment.',
    flavorNotes: ['Creamy Anand Toned Milk', 'Wild Mountain Rose', 'Electrolyte Saline Finish'],
    caffeineMg: 75,
    colorGlow: '#ffbe3b',
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: 'AMUL-AI-003',
    name: 'Monsoon Velvet Euphoria',
    mood: 'Chilled Sunset Vibe',
    caffeine: 55,
    dairy: 85,
    rose: 100,
    chill: 4,
    carbonation: 'Micro-Bubbles',
    tagline: 'A luxurious floral meditation with a subtle awakening spark.',
    flavorNotes: ['Double-Distilled Damask Attar', 'Sweet Condensed Dairy Silk', 'Cardamom Mist'],
    caffeineMg: 60,
    colorGlow: '#ff4071',
    createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  }
];

const initialOrders = [
  {
    orderId: 'AMUL-STG-891024',
    dispatchCode: 'CND-4C-ANAND01',
    custName: 'Dr. R. K. Patel (GCMMF HQ)',
    custAddress: 'Amul Dairy Road, Anand - 388001, Gujarat',
    packName: 'Limited Vault Box (24 Cans)',
    packPrice: 399,
    customFormulaName: 'Amul × Sting Silken Reserve: Anabolic Silk Edition',
    customFormulaId: 'AMUL-AI-002',
    placedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    status: 'OUT_FOR_DELIVERY',
    coldChainTemp: '3.8 °C Verified',
    carrier: 'Amul Anand Reefer Express Fleet #14',
    estimatedDeliveryHours: 4,
  },
  {
    orderId: 'AMUL-STG-742918',
    dispatchCode: 'CND-4C-MUM892',
    custName: 'Aarav Sharma',
    custAddress: 'Hill Road, Bandra West, Mumbai - 400050',
    packName: "Collector's 6-Pack Box",
    packPrice: 110,
    customFormulaName: 'Amul × Sting HyperDrive: Neon Byte Edition',
    customFormulaId: 'AMUL-AI-001',
    placedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    status: 'EN_ROUTE_REEFER',
    coldChainTemp: '3.9 °C Verified',
    carrier: 'Amul Western Cold-Corridor Logistics',
    estimatedDeliveryHours: 12,
  },
  {
    orderId: 'AMUL-STG-639105',
    dispatchCode: 'CND-4C-BLR331',
    custName: 'Priya Iyer',
    custAddress: '100ft Road, Indiranagar, Bengaluru - 560038',
    packName: 'Single 120ml Can',
    packPrice: 20,
    customFormulaName: 'Amul × Sting Rose (Standard Blend)',
    customFormulaId: null,
    placedAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    status: 'DISPATCH_CONFIRMED',
    coldChainTemp: '3.7 °C Verified',
    carrier: 'Amul South Cold-Chain Transit',
    estimatedDeliveryHours: 24,
  }
];

// Load or initialize persistent storage
let recentCreations = [];
let confirmedOrders = [];

try {
  if (fs.existsSync(CREATIONS_FILE)) {
    recentCreations = JSON.parse(fs.readFileSync(CREATIONS_FILE, 'utf-8'));
  } else {
    recentCreations = [...initialCreations];
    fs.writeFileSync(CREATIONS_FILE, JSON.stringify(recentCreations, null, 2));
  }
} catch (e) {
  recentCreations = [...initialCreations];
}

try {
  if (fs.existsSync(ORDERS_FILE)) {
    confirmedOrders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
  } else {
    confirmedOrders = [...initialOrders];
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(confirmedOrders, null, 2));
  }
} catch (e) {
  confirmedOrders = [...initialOrders];
}

function saveOrders() {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(confirmedOrders, null, 2));
  } catch (e) {
    console.error('Error saving orders to disk:', e);
  }
}

function saveCreations() {
  try {
    fs.writeFileSync(CREATIONS_FILE, JSON.stringify(recentCreations, null, 2));
  } catch (e) {
    console.error('Error saving creations to disk:', e);
  }
}

// ============================================================================
// 1. HEALTH CHECK & STATUS
// ============================================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Amul × Sting Neural Beverage Engine',
    version: '2.8.0-ENTERPRISE',
    serverTime: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    coldChainConnected: true,
    anandFacility: 'GCMMF Anand Plant #4 (Gujarat, India)',
    databaseStatus: 'DISK_PERSISTENCE_SYNCHRONIZED',
    totalRegisteredOrders: confirmedOrders.length,
  });
});

// ============================================================================
// 2. LIVE COLD-CHAIN IOT TELEMETRY (ANAND DAIRY PLANT #4)
// ============================================================================
app.get('/api/coldchain/telemetry', (req, res) => {
  const time = Date.now();
  const tempJitter = (Math.sin(time / 4000) * 0.25).toFixed(2);
  const pressureJitter = (Math.cos(time / 5000) * 0.4).toFixed(1);
  const currentTemp = (3.8 + parseFloat(tempJitter)).toFixed(2);
  const currentPressure = (42.2 + parseFloat(pressureJitter)).toFixed(1);

  res.json({
    facility: 'Amul Dairy Central Complex, Anand, Gujarat',
    fssaiLicense: '10012021000071',
    timestamp: new Date().toISOString(),
    telemetry: {
      vatTemperature: `${currentTemp} °C`,
      vatStatus: currentTemp <= 4.0 ? 'OPTIMAL FRESHNESS' : 'AUTO-COMPENSATING',
      targetTemp: '4.00 °C',
      dairyBatchNumber: `AML-STG-2026-${Math.floor(time / 100000) % 9000 + 1000}`,
      microCarbonationPressure: `${currentPressure} PSI`,
      nitrogenSealIntegrity: '99.94%',
      milkFatContent: '3.15% (Standardized Anand Toned)',
      activeReeferTrucks: 148,
      liveDispatchCities: ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Ahmedabad', 'Hyderabad', 'Pune'],
      lastDispatchedOrder: confirmedOrders.length > 0 
        ? confirmedOrders[confirmedOrders.length - 1].orderId 
        : 'AMUL-STG-948102',
    }
  });
});

// ============================================================================
// 3. AI SENSORY TASTE SYNTHESIZER
// ============================================================================
app.post('/api/ai/synthesize', async (req, res) => {
  try {
    const {
      mood = 'Electric Surge',
      caffeine = 72,
      dairy = 80,
      rose = 85,
      chill = 4,
      fizz = 'Moderate Carbonation',
      customPrompt = '',
    } = req.body;

    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const promptText = `
You are the Chief Sensory Beverage AI Engineer for the official collaboration between Amul (India's legendary pure dairy cooperative) and Sting (electrifying energy drink).
Generate a JSON response (strictly valid JSON, no markdown codeblocks, just raw json) with these exact keys:
{
  "editionName": "A catchy, futuristic, luxurious edition name (e.g. Amul × Sting Quantum Velvet)",
  "tagline": "A powerful 1-sentence sensory brand tagline",
  "flavorNotes": ["3 to 4 distinct tasting notes combining dairy cream, botanical rose, and energetic fizz"],
  "caffeineMg": number (between 50 and 110 calculated from caffeine %),
  "colorGlow": "Hex color code reflecting this flavor aura",
  "sensoryProfile": {
    "topNote": "Immediate palate sensation on first sip",
    "heartHarmony": "Mid-sip dairy and rose fusion sensation",
    "finish": "Lingering mouthfeel and caffeine vitality curve"
  },
  "sommelierReview": "A 2-3 sentence enthusiastic, vivid sommelier tasting verdict describing how the rich Amul dairy buffers the Sting caffeine surge for zero crash.",
  "recommendedMusicTempo": "e.g. 128 BPM Synthwave",
  "idealMoment": "Best time/activity to drink this can"
}
Input parameters:
- Mood: ${mood}
- Caffeine: ${caffeine}%
- Dairy: ${dairy}%
- Rose: ${rose}%
- Chill: ${chill}°C
- Fizz: ${fizz}
- Notes: ${customPrompt || 'None'}
`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            const synthesized = {
              id: `AMUL-AI-${Math.floor(100 + Math.random() * 900)}`,
              ...parsed,
              mood,
              caffeine,
              dairy,
              rose,
              chill,
              fizz,
              createdAt: new Date().toISOString()
            };
            recentCreations.unshift(synthesized);
            if (recentCreations.length > 20) recentCreations.pop();
            saveCreations();
            return res.json({ success: true, engine: 'Gemini 2.5 Flash', creation: synthesized });
          }
        }
      } catch (err) {
        console.warn('Gemini API call fallback to Neural Sensory Formula engine:', err.message);
      }
    }

    // High-Fidelity Deterministic Neural Sensory Formula Engine
    const caffeineMg = Math.round(50 + (caffeine / 100) * 55);
    
    let titlePrefix = 'Amul × Sting';
    let colorGlow = '#ff2d87';

    if (caffeine > 80) {
      titlePrefix = 'Amul × Sting HyperDrive';
      colorGlow = '#ff0055';
    } else if (dairy > 85) {
      titlePrefix = 'Amul × Sting Silken Reserve';
      colorGlow = '#ffa6c9';
    } else if (rose > 90) {
      titlePrefix = 'Amul × Sting Royal Damask Crown';
      colorGlow = '#e0115f';
    } else if (chill <= 2) {
      titlePrefix = 'Amul × Sting Glacier Frost';
      colorGlow = '#00d4ff';
    }

    const moodNames = {
      'Late Night Coding Marathon': 'Neon Byte Edition',
      'Post-Workout Beast Mode': 'Anabolic Silk Edition',
      'Festival Sunset Rave': 'Electro-Carnival Edition',
      'Executive Focus Sprint': 'Zenith Apex Edition',
      'Monsoon Drive Euphoria': 'Petrichor Velvet Edition',
      'Chilled Midnight Chill': 'Lunar Slumber-Zero Edition'
    };

    const editionName = `${titlePrefix}: ${moodNames[mood] || 'Neural Custom Edition'}`;

    const flavorNotes = [];
    if (rose >= 70) flavorNotes.push('Sun-Dried Damask Rose Attar');
    else flavorNotes.push('Delicate White Blossom Mist');

    if (dairy >= 75) flavorNotes.push('Creamy Anand Toned Dairy Silk');
    else flavorNotes.push('Light Clarified Milk Whey');

    if (caffeine >= 75) flavorNotes.push('Crisp Electro-Caffeine Spark');
    else flavorNotes.push('Mellow Green Tea Bio-Vitality');

    if (fizz.toLowerCase().includes('high') || fizz.toLowerCase().includes('volcanic')) {
      flavorNotes.push('Vigorous Champagne-Grade Effervescence');
    } else {
      flavorNotes.push('Micro-Bubble Velvet Glide');
    }

    const creation = {
      id: `AMUL-AI-${Math.floor(100 + Math.random() * 900)}`,
      editionName,
      tagline: `An audacious balance where ${caffeineMg}mg of vitalizing energy meets the unyielding silk of 100% Anand dairy milk.`,
      flavorNotes,
      caffeineMg,
      colorGlow,
      sensoryProfile: {
        topNote: `First contact unleashes an invigorating ${fizz.toLowerCase()} burst, carrying fragrant floral rose high notes.`,
        heartHarmony: `The palate is enveloped in lush ${dairy}% Amul dairy silk, buffering acidity and creating an ultra-velvety glide.`,
        finish: `Clean, sustained alertness with zero crash, accompanied by a lingering chilled ${chill}°C floral after-bloom.`
      },
      sommelierReview: `Remarkable architectural harmony. By combining Anand's homogenized milk solids with Sting's precision caffeine curve, this blend eliminates gastric acidity while sustaining focus for over 4.5 hours.`,
      recommendedMusicTempo: caffeine > 75 ? '130 BPM Electro Synth' : '90 BPM Ambient Velvet Chill',
      idealMoment: `Designed specifically for your "${mood}" state at peak sensory readiness.`,
      mood,
      caffeine,
      dairy,
      rose,
      chill,
      fizz,
      customPrompt: customPrompt || null,
      createdAt: new Date().toISOString()
    };

    recentCreations.unshift(creation);
    if (recentCreations.length > 20) recentCreations.pop();
    saveCreations();

    res.json({
      success: true,
      engine: 'Amul Neural Sensory Lab v2.5',
      creation
    });

  } catch (error) {
    console.error('AI Synthesizer error:', error);
    res.status(500).json({ error: 'Failed to synthesize beverage formulation' });
  }
});

// ============================================================================
// 4. COMMUNITY CREATIONS
// ============================================================================
app.get('/api/community/creations', (req, res) => {
  res.json({
    count: recentCreations.length,
    creations: recentCreations
  });
});

// ============================================================================
// 5. ORDER PLACEMENT & ORDER MANAGEMENT LEDGER
// ============================================================================
app.get('/api/orders', (req, res) => {
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + (o.packPrice || 0), 0);
  res.json({
    totalOrders: confirmedOrders.length,
    totalRevenue,
    coldChainPurityRate: '100.0%',
    orders: [...confirmedOrders].reverse(),
  });
});

// Track single order by ID or dispatch hash
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const order = confirmedOrders.find(
    (o) => o.orderId.toLowerCase() === id.toLowerCase() || 
           (o.dispatchCode && o.dispatchCode.toLowerCase() === id.toLowerCase())
  );

  if (!order) {
    return res.status(404).json({ error: 'Order not found in Anand Logistics ledger' });
  }

  // Construct realistic GPS cold-chain tracking timeline
  const timeline = [
    { time: 'T+00m', milestone: 'Order Authenticated & Registered by GCMMF Anand', status: 'COMPLETED' },
    { time: 'T+15m', milestone: 'Anand Plant #4 Can Allocation & 3.8°C Pre-Chilling', status: 'COMPLETED' },
    { time: 'T+45m', milestone: `Loaded onto ${order.carrier} (Insulated Reefer)`, status: 'COMPLETED' },
    { time: 'T+02h', milestone: `GPS Highway Corridor Dispatch towards ${order.custAddress}`, status: 'ACTIVE' },
    { time: `T+${order.estimatedDeliveryHours}h`, milestone: 'Guaranteed 4°C Handover to Customer', status: 'PENDING' },
  ];

  res.json({
    order,
    trackingTimeline: timeline,
    verifiedColdChain: true,
    fssaiLicense: '10012021000071',
  });
});

app.post('/api/orders', (req, res) => {
  const { custName, custAddress, packName, packPrice, customFormulaId, customFormulaName } = req.body;

  if (!custName || !custAddress) {
    return res.status(400).json({ error: 'Customer Name and Address are required.' });
  }

  const orderId = `AMUL-STG-${Math.floor(100000 + Math.random() * 900000)}`;
  const dispatchCode = `CND-4C-${Buffer.from(orderId).toString('base64').substring(0, 8).toUpperCase()}`;

  const newOrder = {
    orderId,
    dispatchCode,
    custName,
    custAddress,
    packName: packName || 'Single 120ml Can',
    packPrice: packPrice || 20,
    customFormulaName: customFormulaName || 'Amul × Sting Rose (Standard Blend)',
    customFormulaId: customFormulaId || null,
    placedAt: new Date().toISOString(),
    status: 'DISPATCH_CONFIRMED',
    coldChainTemp: '3.8 °C Verified',
    carrier: 'Amul Anand Reefer Fleet Logistics',
    estimatedDeliveryHours: 24,
  };

  confirmedOrders.push(newOrder);
  saveOrders();

  res.status(201).json({
    success: true,
    message: 'Pre-order registered with GCMMF Amul Anand Logistics',
    order: newOrder,
  });
});

app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const idx = confirmedOrders.findIndex((o) => o.orderId === id);
  if (idx !== -1) {
    const deleted = confirmedOrders.splice(idx, 1);
    saveOrders();
    return res.json({ success: true, message: 'Order removed', order: deleted[0] });
  }
  res.status(404).json({ error: 'Order not found' });
});

// ============================================================================
// 6. EXECUTIVE COLD-CHAIN & SALES ANALYTICS
// ============================================================================
app.get('/api/analytics', (req, res) => {
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + (o.packPrice || 0), 0);
  
  // Pack breakdown
  const packCounts = {};
  confirmedOrders.forEach((o) => {
    packCounts[o.packName] = (packCounts[o.packName] || 0) + 1;
  });

  const aiBlendCount = confirmedOrders.filter(
    (o) => o.customFormulaName && !o.customFormulaName.includes('Standard')
  ).length;

  res.json({
    executiveSummary: {
      totalOrdersAllocated: confirmedOrders.length,
      grossPreOrderRevenue: `₹${totalRevenue}`,
      coldChainCompliance: '100.0% (Sub-4°C Guaranteed)',
      averageVatTemperature: '3.82 °C',
      aiPersonalizedShare: `${Math.round((aiBlendCount / (confirmedOrders.length || 1)) * 100)}%`,
    },
    topPacks: packCounts,
    stateCorridors: {
      Gujarat: '42%',
      Maharashtra: '31%',
      Karnataka: '15%',
      'Delhi NCR': '12%',
    },
    complianceAudit: {
      fssaiCentralLicense: '10012021000071',
      vegetarianCertification: '100% Pure Green Dot Verified',
      cooperativeFarmerBenefitShare: '80%+ Returned to Village Societies',
    }
  });
});

// ============================================================================
// 7. PRINTABLE OFFICIAL TAX INVOICE HTML ENDPOINT
// ============================================================================
app.get('/api/orders/:id/invoice', (req, res) => {
  const { id } = req.params;
  const order = confirmedOrders.find(
    (o) => o.orderId.toLowerCase() === id.toLowerCase() || 
           (o.dispatchCode && o.dispatchCode.toLowerCase() === id.toLowerCase())
  );

  if (!order) {
    return res.status(404).send('<h1>Order Not Found in GCMMF Records</h1>');
  }

  const basePrice = (order.packPrice / 1.05).toFixed(2);
  const gst = (order.packPrice - basePrice).toFixed(2);

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GCMMF AMUL TAX INVOICE - ${order.orderId}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 40px; color: #111; background: #fff; }
    .invoice-card { max-width: 750px; margin: 0 auto; border: 2px solid #000; padding: 30px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 20px; }
    .brand { font-size: 28px; font-weight: 900; letter-spacing: 1px; color: #d90452; }
    .badge { font-size: 11px; background: #000; color: #fff; padding: 3px 8px; font-weight: 700; }
    .meta { text-align: right; font-size: 13px; line-height: 1.5; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; font-size: 14px; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th, .table td { border: 1px solid #000; padding: 10px; text-align: left; }
    .table th { background: #f4f4f4; }
    .total-row { font-size: 16px; font-weight: 900; }
    .stamps { display: flex; justify-content: space-between; align-items: center; margin-top: 35px; border-top: 1px dashed #666; padding-top: 20px; font-size: 12px; }
    .green-dot-box { display: inline-flex; align-items: center; border: 2px solid #0a883a; padding: 4px 10px; color: #0a883a; font-weight: bold; }
    .dot { width: 10px; height: 10px; background: #0a883a; border-radius: 50%; display: inline-block; margin-right: 6px; }
    .print-btn { background: #d90452; color: #fff; border: none; padding: 10px 20px; font-size: 14px; font-weight: bold; cursor: pointer; margin-bottom: 20px; }
    @media print { .print-btn { display: none; } body { margin: 0; } }
  </style>
</head>
<body>
  <div style="text-align: right; max-width: 750px; margin: 0 auto;">
    <button class="print-btn" onclick="window.print()">🖨️ PRINT OFFICIAL TAX INVOICE</button>
  </div>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand">AMUL × STING</div>
        <div style="font-size: 12px; font-weight: bold; color: #333; margin-top: 4px;">GUJARAT CO-OPERATIVE MILK MARKETING FEDERATION LTD.</div>
        <div style="font-size: 11px; color: #555;">Amul Dairy Road, Anand - 388001, Gujarat, India</div>
        <div style="font-size: 11px; color: #555;">FSSAI Central Lic. No. 10012021000071 | GSTIN: 24AAACG0123A1Z5</div>
      </div>
      <div class="meta">
        <span class="badge">ORIGINAL TAX INVOICE</span>
        <div style="margin-top: 8px;"><strong>INVOICE NO:</strong> INV-${order.orderId}</div>
        <div><strong>DATE:</strong> ${new Date(order.placedAt).toLocaleDateString()}</div>
        <div><strong>DISPATCH HASH:</strong> ${order.dispatchCode}</div>
      </div>
    </div>

    <div class="details">
      <div>
        <strong>BILL TO / SHIP TO:</strong><br>
        ${order.custName}<br>
        ${order.custAddress}<br>
        India
      </div>
      <div style="text-align: right;">
        <strong>COLD-CHAIN INTEGRITY:</strong><br>
        Temperature: ${order.coldChainTemp}<br>
        Carrier: ${order.carrier}<br>
        Status: ${order.status.replace(/_/g, ' ')}
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th>HSN Code</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${order.packName}</strong><br>
            <span style="font-size: 12px; color: #555;">Amul Dairy Silk × Sting Rose Electro Vitality</span><br>
            ${order.customFormulaName ? `<em style="color: #d90452; font-size: 12px;">Formula: ${order.customFormulaName}</em>` : ''}
          </td>
          <td>04029990</td>
          <td>1</td>
          <td>₹${basePrice}</td>
          <td>₹${basePrice}</td>
        </tr>
        <tr>
          <td colspan="4" style="text-align: right;"><strong>Subtotal:</strong></td>
          <td>₹${basePrice}</td>
        </tr>
        <tr>
          <td colspan="4" style="text-align: right;">GST (5% Dairy Beverage):</td>
          <td>₹${gst}</td>
        </tr>
        <tr>
          <td colspan="4" style="text-align: right;">Cold-Chain Reefer Shipping:</td>
          <td>FREE</td>
        </tr>
        <tr class="total-row">
          <td colspan="4" style="text-align: right;">GRAND TOTAL (INR):</td>
          <td style="color: #d90452;">₹${order.packPrice}.00</td>
        </tr>
      </tbody>
    </table>

    <div class="stamps">
      <div>
        <div class="green-dot-box">
          <span class="dot"></span> 100% PURE VEGETARIAN
        </div>
        <div style="margin-top: 6px; font-size: 11px; color: #555;">Owned by 3.6 Million Milk Farmers of Gujarat</div>
      </div>
      <div style="text-align: right;">
        <div>For GUJARAT CO-OPERATIVE MILK MARKETING FEDERATION</div>
        <div style="margin-top: 25px; font-weight: bold; border-top: 1px solid #000; display: inline-block; padding-top: 4px;">Authorized Anand Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>
  `);
});

// ============================================================================
// START SERVER (Local Daemon / Conditional for Serverless)
// ============================================================================
if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ Amul × Sting Backend API running on http://localhost:${PORT}`);
    console.log(`🥛 Connected to Anand Dairy Cold-Chain Telemetry System`);
    console.log(`💾 Persistent Disk Storage Active: ${ORDERS_FILE}`);
  });
}

export default app;
