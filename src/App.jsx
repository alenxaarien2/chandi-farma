import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin, Phone, MessageCircle, PlusCircle, ShieldCheck, Trash2,
  Ban, CheckCircle2, Navigation, Camera, ExternalLink, Search,
  Sprout, Users, Lock, Unlock, Calculator, X, Cloud, Sparkles, Send, Loader2
} from 'lucide-react';

// --- फसल / बिचा कैटेगरी (Crop Categories) ---
const CATEGORIES = [
  { id: 'all', nameHi: 'सभी बिचा', nameEn: 'All Plants', icon: '🌱' },
  { id: 'cauliflower', nameHi: 'फूलगोभी', nameEn: 'Cauliflower', icon: '🥦' },
  { id: 'tomato', nameHi: 'टमाटर', nameEn: 'Tomato', icon: '🍅' },
  { id: 'brinjal', nameHi: 'बैंगन', nameEn: 'Brinjal', icon: '🍆' },
  { id: 'chilli', nameHi: 'मिर्च', nameEn: 'Chilli', icon: '🌶️' },
  { id: 'cabbage', nameHi: 'पत्तागोभी', nameEn: 'Cabbage', icon: '🥬' },
  { id: 'onion', nameHi: 'प्याज', nameEn: 'Onion', icon: '🧅' },
  { id: 'papaya', nameHi: 'पपीता', nameEn: 'Papaya', icon: '🍈' },
];

// --- चांदी फार्म (Chandi Farm) के शुरुआती डिफ़ॉल्ट लिस्टिंग ---
const INITIAL_SELLERS = [
  {
    id: 'seller_1',
    sellerName: 'रामेश्वर प्रसाद (Rameshwar Prasad)',
    phone: '9876543210',
    category: 'cauliflower',
    varietyName: 'अगेती स्नोबॉल फूलगोभी (Early Snowball)',
    price: 60,
    priceUnit: 'per_100',
    capacity: '40,000 पौधे (Plants)',
    address: 'चांदी बाज़ार, मुख्य नर्सरी रोड, जिला नालंदा, बिहार (803108)',
    mapLink: 'https://www.google.com/maps/search/?api=1&query=25.3265,85.4048',
    extraLink: '',
    lat: 25.3265,
    lng: 85.4048,
    verified: true,
    createdAt: 'आज',
    photos: [
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=60',
      'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=600&q=60',
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=600&q=60',
      'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=600&q=60',
    ],
  },
  {
    id: 'seller_2',
    sellerName: 'सुनील कुमार (Sunil Kumar)',
    phone: '9123456789',
    category: 'tomato',
    varietyName: 'हाइब्रिड नामधारी टमाटर (Hybrid Tomato)',
    price: 1,
    priceUnit: 'per_1',
    capacity: '25,000 पौधे (Plants)',
    address: 'ग्राम चांदी, पंचायत भवन के पास, नालंदा, बिहार',
    mapLink: 'https://www.google.com/maps/search/?api=1&query=25.3284,85.4227',
    extraLink: '',
    lat: 25.3284,
    lng: 85.4227,
    verified: true,
    createdAt: 'कल',
    photos: [
      'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=600&q=60',
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=60',
    ],
  }
];

const INITIAL_COMMUNITY = [
  {
    id: 'post_1',
    author: 'विजय (संचालक - Chandi Farm)',
    phone: '9999999999',
    category: 'all',
    text: 'सभी किसान भाइयों का Chandi Farm पर स्वागत है! यहाँ आप अपने खेत का तैयार बिचा (पौधा) सही दाम पर बेच सकते हैं और अपने सबसे नज़दीकी किसान से सीधा संपर्क कर सकते हैं।',
    createdAt: 'अभी',
    isAdmin: true,
    replies: [
      { id: 'r1', author: 'महेश किसान', text: 'बहुत बढ़िया ऐप है विजय भाई, अब बिचा खरीदने में आसानी होगी।' }
    ]
  }
];

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

function compressImageFile(file, maxWidth = 720, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeInKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
        resolve({ dataUrl: compressedDataUrl, sizeKb: sizeInKb });
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState('buy');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [sellers, setSellers] = useState(() => {
    const saved = localStorage.getItem('cf_sellers_v3');
    return saved ? JSON.parse(saved) : INITIAL_SELLERS;
  });

  const [communityPosts, setCommunityPosts] = useState(() => {
    const saved = localStorage.getItem('cf_community_v3');
    return saved ? JSON.parse(saved) : INITIAL_COMMUNITY;
  });

  const [blockedPhones, setBlockedPhones] = useState(() => {
    const saved = localStorage.getItem('cf_blocked_phones');
    return saved ? JSON.parse(saved) : [];
  });

  const [firebaseDbUrl, setFirebaseDbUrl] = useState(() => {
    return localStorage.getItem('cf_firebase_url') || '';
  });

  const [buyerLocation, setBuyerLocation] = useState({
    lat: null,
    lng: null,
    addressText: '',
    loading: false,
    error: ''
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPin] = useState('2026');
  const [blockPhoneInput, setBlockPhoneInput] = useState('');

  const [activePhotoModal, setActivePhotoModal] = useState(null);
  const [calcQuantity, setCalcQuantity] = useState({});

  const [sellerForm, setSellerForm] = useState({
    sellerName: '',
    phone: '',
    category: 'cauliflower',
    varietyName: '',
    price: '',
    priceUnit: 'per_100',
    capacity: '',
    address: '',
    mapLink: '',
    extraLink: '',
    lat: null,
    lng: null,
    photos: []
  });
  const [isCompressing, setIsCompressing] = useState(false);
  const [sellerGpsLoading, setSellerGpsLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  const [newPost, setNewPost] = useState({ author: '', phone: '', category: 'cauliflower', text: '' });

  useEffect(() => {
    localStorage.setItem('cf_sellers_v3', JSON.stringify(sellers));
  }, [sellers]);

  useEffect(() => {
    localStorage.setItem('cf_community_v3', JSON.stringify(communityPosts));
  }, [communityPosts]);

  useEffect(() => {
    localStorage.setItem('cf_blocked_phones', JSON.stringify(blockedPhones));
  }, [blockedPhones]);

  const syncFromCloud = async () => {
    if (!firebaseDbUrl) return;
    try {
      const cleanUrl = firebaseDbUrl.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/chandifarm.json`);
      if (res.ok) {
        const data = await res.json();
        if (data?.sellers) setSellers(data.sellers);
        if (data?.community) setCommunityPosts(data.community);
        if (data?.blocked) setBlockedPhones(data.blocked);
      }
    } catch (e) {
      console.error('Cloud sync error:', e);
    }
  };

  const pushToCloud = async (uSellers, uCommunity, uBlocked) => {
    if (!firebaseDbUrl) return;
    try {
      const cleanUrl = firebaseDbUrl.replace(/\/$/, '');
      await fetch(`${cleanUrl}/chandifarm.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellers: uSellers ?? sellers,
          community: uCommunity ?? communityPosts,
          blocked: uBlocked ?? blockedPhones
        })
      });
    } catch (e) {
      console.error('Cloud push error:', e);
    }
  };

  useEffect(() => {
    if (firebaseDbUrl) syncFromCloud();
  }, [firebaseDbUrl]);

  const detectBuyerLocation = () => {
    if (!navigator.geolocation) {
      setBuyerLocation((prev) => ({ ...prev, error: 'GPS सपोर्ट उपलब्ध नहीं है।' }));
      return;
    }
    setBuyerLocation((prev) => ({ ...prev, loading: true, error: '' }));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        let placeName = `GPS: ${lat}, ${lng}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&accept-language=hi,en`
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            placeName = [addr.village || addr.town || addr.suburb, addr.city || addr.state_district]
              .filter(Boolean)
              .join(', ');
          }
        } catch (e) {}
        setBuyerLocation({ lat, lng, addressText: placeName, loading: false, error: '' });
      },
      () => {
        setBuyerLocation((prev) => ({
          ...prev,
          loading: false,
          error: 'लोकेशन अनुमति नहीं मिली।'
        }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const detectSellerLocation = () => {
    if (!navigator.geolocation) {
      setFormMessage({ type: 'error', text: 'GPS समर्थित नहीं है।' });
      return;
    }
    setSellerGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        let detectedAddress = sellerForm.address;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&accept-language=hi,en`
          );
          const data = await res.json();
          if (data && data.display_name) {
            detectedAddress = data.display_name.split(',').slice(0, 4).join(', ');
          }
        } catch (e) {}

        setSellerForm((prev) => ({
          ...prev,
          lat,
          lng,
          mapLink,
          address: detectedAddress || prev.address
        }));
        setSellerGpsLoading(false);
        setFormMessage({ type: 'success', text: 'सफलतापूर्वक आपकी लाइव लोकेशन जुड़ गई है!' });
      },
      () => {
        setSellerGpsLoading(false);
        setFormMessage({ type: 'error', text: 'लोकेशन नहीं मिल पाई।' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 4 - sellerForm.photos.length;
    const toProcess = files.slice(0, remaining);

    setIsCompressing(true);
    try {
      const compressedList = [];
      for (const file of toProcess) {
        const comp = await compressImageFile(file);
        compressedList.push(comp);
      }
      setSellerForm((prev) => ({
        ...prev,
        photos: [...prev.photos, ...compressedList].slice(0, 4)
      }));
    } catch (err) {
      setFormMessage({ type: 'error', text: 'फोटो अपलोड करने में त्रुटि।' });
    }
    setIsCompressing(false);
  };

  const handleSellerSubmit = (e) => {
    e.preventDefault();
    const cleanPhone = sellerForm.phone.replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
      setFormMessage({ type: 'error', text: 'कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें।' });
      return;
    }
    if (blockedPhones.includes(cleanPhone)) {
      setFormMessage({ type: 'error', text: 'यह मोबाइल नंबर ब्लॉक किया गया है।' });
      return;
    }
    if (!sellerForm.sellerName.trim() || !sellerForm.price || !sellerForm.address.trim()) {
      setFormMessage({ type: 'error', text: 'कृपया नाम, मूल्य और पता अनिवार्य रूप से भरें।' });
      return;
    }

    const finalMapLink =
      sellerForm.mapLink.trim() ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sellerForm.address)}`;

    const newListing = {
      id: 'seller_' + Date.now(),
      sellerName: sellerForm.sellerName.trim(),
      phone: cleanPhone,
      category: sellerForm.category,
      varietyName: sellerForm.varietyName.trim() || 'बिचा पौधा',
      price: Number(sellerForm.price),
      priceUnit: sellerForm.priceUnit,
      capacity: sellerForm.capacity.trim() || 'उपलब्ध है',
      address: sellerForm.address.trim(),
      mapLink: finalMapLink,
      extraLink: sellerForm.extraLink.trim(),
      lat: sellerForm.lat,
      lng: sellerForm.lng,
      verified: false,
      createdAt: 'अभी',
      photos:
        sellerForm.photos.length > 0
          ? sellerForm.photos.map((p) => p.dataUrl)
          : ['https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=600&q=60']
    };

    const updated = [newListing, ...sellers];
    setSellers(updated);
    pushToCloud(updated, communityPosts, blockedPhones);

    setSellerForm({
      sellerName: '',
      phone: '',
      category: 'cauliflower',
      varietyName: '',
      price: '',
      priceUnit: 'per_100',
      capacity: '',
      address: '',
      mapLink: '',
      extraLink: '',
      lat: null,
      lng: null,
      photos: []
    });
    setFormMessage({ type: '', text: '' });
    setSelectedCategory(newListing.category);
    setActiveTab('buy');
  };

  const processedSellers = useMemo(() => {
    return sellers
      .filter((s) => !blockedPhones.includes(s.phone))
      .filter((s) => (selectedCategory === 'all' ? true : s.category === selectedCategory))
      .filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          s.sellerName.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.varietyName.toLowerCase().includes(q)
        );
      })
      .map((s) => {
        const distanceKm = calculateDistanceKm(buyerLocation.lat, buyerLocation.lng, s.lat, s.lng);
        return { ...s, distanceKm };
      })
      .sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm !== null) return -1;
        if (b.distanceKm !== null) return 1;
        return 0;
      });
  }, [sellers, blockedPhones, selectedCategory, searchQuery, buyerLocation]);

  const handleDeleteSeller = (id) => {
    const updated = sellers.filter((s) => s.id !== id);
    setSellers(updated);
    pushToCloud(updated, communityPosts, blockedPhones);
  };

  const handleToggleVerify = (id) => {
    const updated = sellers.map((s) => (s.id === id ? { ...s, verified: !s.verified } : s));
    setSellers(updated);
    pushToCloud(updated, communityPosts, blockedPhones);
  };

  const handleBlockPhone = (phone) => {
    const clean = phone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) return;
    const uBlocked = Array.from(new Set([...blockedPhones, clean]));
    const uSellers = sellers.filter((s) => s.phone !== clean);
    setBlockedPhones(uBlocked);
    setSellers(uSellers);
    pushToCloud(uSellers, communityPosts, uBlocked);
    setBlockPhoneInput('');
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    const cleanPhone = newPost.phone.replace(/\D/g, '').slice(-10);
    if (blockedPhones.includes(cleanPhone)) {
      alert('यह नंबर ब्लॉक किया गया है।');
      return;
    }
    if (!newPost.author.trim() || !newPost.text.trim()) return;

    const postObj = {
      id: 'post_' + Date.now(),
      author: newPost.author.trim(),
      phone: cleanPhone,
      category: newPost.category,
      text: newPost.text.trim(),
      createdAt: 'अभी',
      isAdmin,
      replies: []
    };
    const updated = [postObj, ...communityPosts];
    setCommunityPosts(updated);
    pushToCloud(sellers, updated, blockedPhones);
    setNewPost({ author: '', phone: '', category: 'cauliflower', text: '' });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-24 font-sans relative">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-emerald-900 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center text-xl font-black">
              🌱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-wide">Chandi Farm</h1>
                <span className="text-[11px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                  चांदी फार्म
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                संचालक: <strong className="text-amber-300">Vijay (विजय)</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAdminModal(true)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              isAdmin ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-950/60 text-emerald-100 border border-emerald-700'
            }`}
          >
            {isAdmin ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isAdmin ? 'Admin चालू' : 'संचालक पैनल'}</span>
          </button>
        </div>

        {/* TAB SWITCHER */}
        <div className="max-w-4xl mx-auto px-4 pb-2.5 flex gap-2">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'buy' ? 'bg-white text-emerald-950 shadow' : 'bg-emerald-800 text-emerald-100'
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>बिचा खरीदें (Buy)</span>
          </button>

          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'sell' ? 'bg-amber-400 text-emerald-950 shadow' : 'bg-emerald-800 text-emerald-100'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>बिचा बेचें (Sell)</span>
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'community' ? 'bg-white text-emerald-950 shadow' : 'bg-emerald-800 text-emerald-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>किसान चौपाल</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 pt-4">
        {activeTab === 'buy' && (
          <div className="space-y-4">
            {/* GPS Location Bar */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    नज़दीकी किसान प्राथमिकता (Nearest Priority)
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {buyerLocation.lat ? `📍 लोकेशन: ${buyerLocation.addressText}` : 'अपने सबसे पास के किसान देखने के लिए GPS चालू करें।'}
                  </p>
                </div>
              </div>
              <button
                onClick={detectBuyerLocation}
                disabled={buyerLocation.loading}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm shrink-0"
              >
                <Navigation className={`w-4 h-4 ${buyerLocation.loading ? 'animate-spin' : ''}`} />
                <span>{buyerLocation.loading ? 'खोज रहा है...' : 'मेरी लोकेशन से पास के किसान दिखाएं'}</span>
              </button>
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200">
              <h2 className="text-xs font-extrabold text-slate-700 mb-2">बिचा कैटेगरी चुनें:</h2>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex flex-col items-center justify-center min-w-[76px] p-2 rounded-xl border transition shrink-0 ${
                        active ? 'bg-emerald-700 text-white border-emerald-700 shadow' : 'bg-slate-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <span className="text-xl mb-1">{cat.icon}</span>
                      <span className="text-xs font-bold">{cat.nameHi}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="गाँव या किसान का नाम लिखकर खोजें..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Sellers Grid */}
            {processedSellers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                <div className="text-3xl mb-2">🌱</div>
                <h3 className="text-sm font-bold text-slate-800">इस कैटेगरी में अभी कोई बिचा उपलब्ध नहीं है</h3>
                <button onClick={() => setActiveTab('sell')} className="mt-3 bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl">
                  + अपना बिचा बेचें
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processedSellers.map((seller, index) => {
                  const catObj = CATEGORIES.find((c) => c.id === seller.category) || CATEGORIES[0];
                  const isNearest = index === 0 && seller.distanceKm !== null;
                  const qty = calcQuantity[seller.id] ?? '';
                  const calculatedCost =
                    qty && Number(qty) > 0
                      ? seller.priceUnit === 'per_100'
                        ? ((Number(qty) / 100) * seller.price).toFixed(0)
                        : (Number(qty) * seller.price).toFixed(0)
                      : null;

                  return (
                    <div
                      key={seller.id}
                      className={`bg-white rounded-2xl overflow-hidden border shadow-sm ${
                        isNearest ? 'border-2 border-emerald-600 ring-2 ring-emerald-500/10' : 'border-slate-200'
                      }`}
                    >
                      {isNearest && (
                        <div className="bg-emerald-700 text-white px-3 py-1 text-xs font-bold flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> आपके सबसे करीब (Nearest)
                          </span>
                          <span className="bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full text-[10px] font-black">
                            {seller.distanceKm} km दूर
                          </span>
                        </div>
                      )}

                      {/* Photo Gallery */}
                      <div className="p-3 pb-0">
                        <div className="grid grid-cols-4 gap-1.5 h-40">
                          <div
                            onClick={() => setActivePhotoModal(seller.photos[0])}
                            className="col-span-3 h-full rounded-xl overflow-hidden relative cursor-pointer bg-slate-100"
                          >
                            <img src={seller.photos[0]} alt="" className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded text-[11px] font-bold">
                              {catObj.icon} {catObj.nameHi}
                            </div>
                            <div className="absolute bottom-2 left-2 bg-amber-400 text-emerald-950 px-2.5 py-0.5 rounded-lg font-black text-xs">
                              ₹{seller.price} / {seller.priceUnit === 'per_100' ? '100 पौधा' : '1 पौधा'}
                            </div>
                          </div>

                          <div className="col-span-1 flex flex-col gap-1.5 h-full">
                            {[1, 2, 3].map((idx) => {
                              const photo = seller.photos[idx];
                              return photo ? (
                                <div key={idx} onClick={() => setActivePhotoModal(photo)} className="flex-1 rounded-lg overflow-hidden cursor-pointer bg-slate-100">
                                  <img src={photo} alt="" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div key={idx} className="flex-1 rounded-lg bg-slate-100 border border-dashed border-slate-200 text-[9px] text-slate-400 flex items-center justify-center">
                                  फोटो
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900">{seller.varietyName}</h3>
                            <p className="text-xs font-bold text-slate-600">👨‍🌾 विक्रेता: {seller.sellerName}</p>
                          </div>
                          {seller.distanceKm !== null && !isNearest && (
                            <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200">
                              📍 {seller.distanceKm} km
                            </span>
                          )}
                        </div>

                        <div className="bg-slate-50 rounded-xl p-2.5 text-xs space-y-1.5 border border-slate-200">
                          <div className="flex justify-between">
                            <span className="text-slate-500">क्षमता:</span>
                            <span className="font-extrabold text-emerald-800">{seller.capacity}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">पता:</span> <span className="font-bold text-slate-800">{seller.address}</span>
                          </div>
                          <div className="pt-1 flex gap-2">
                            <a
                              href={seller.mapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg"
                            >
                              <MapPin className="w-3 h-3" /> Google Map रास्ता <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>

                        {/* Price Calculator */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-950 flex items-center gap-1">
                            <Calculator className="w-3.5 h-3.5 text-amber-700" /> कैलकुलेटर:
                          </span>
                          <input
                            type="number"
                            min="1"
                            placeholder="पौधों की संख्या"
                            value={qty}
                            onChange={(e) => setCalcQuantity((prev) => ({ ...prev, [seller.id]: e.target.value }))}
                            className="w-28 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold"
                          />
                          <span className="font-black text-emerald-900 min-w-[50px] text-right">
                            {calculatedCost ? `₹${calculatedCost}` : `₹${seller.price}`}
                          </span>
                        </div>

                        {/* Call & WhatsApp APIs */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <a
                            href={`tel:${seller.phone}`}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Phone className="w-3.5 h-3.5" /> कॉल ({seller.phone})
                          </a>
                          <a
                            href={`https://wa.me/91${seller.phone}?text=${encodeURIComponent(
                              `नमस्ते ${seller.sellerName} जी, मुझे Chandi Farm पर आपका बिचा (${seller.varietyName}) पसंद आया है।`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp करें
                          </a>
                        </div>

                        {isAdmin && (
                          <div className="pt-2 border-t border-red-200 flex justify-between items-center bg-red-50 p-1.5 rounded-lg text-xs">
                            <span className="text-red-800 font-bold">Admin:</span>
                            <div className="flex gap-1">
                              <button onClick={() => handleToggleVerify(seller.id)} className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                                {seller.verified ? 'Unverify' : 'Verify'}
                              </button>
                              <button onClick={() => handleBlockPhone(seller.phone)} className="bg-amber-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                                ब्लॉक
                              </button>
                              <button onClick={() => handleDeleteSeller(seller.id)} className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                                हटाएं
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SELL BICHA */}
        {activeTab === 'sell' && (
          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-emerald-900 text-white p-4">
              <h2 className="text-sm font-extrabold">🌱 अपना बिचा बेचने के लिए फॉर्म भरें</h2>
              <p className="text-xs text-emerald-200 mt-0.5">अपनी सही जानकारी, रेट और खेत की 4 फोटो अपलोड करें।</p>
            </div>

            <form onSubmit={handleSellerSubmit} className="p-4 space-y-4 text-xs">
              {formMessage.text && (
                <div className={`p-3 rounded-xl font-bold ${formMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
                  {formMessage.text}
                </div>
              )}

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">फसल की कैटेगरी चुनें *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSellerForm((prev) => ({ ...prev, category: cat.id }))}
                      className={`p-2 rounded-xl border text-center ${sellerForm.category === cat.id ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50'}`}
                    >
                      <div className="text-lg">{cat.icon}</div>
                      <div className="font-bold mt-0.5">{cat.nameHi}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">आपका नाम *</label>
                  <input
                    type="text"
                    required
                    placeholder="जैसे: रामेश्वर प्रसाद"
                    value={sellerForm.sellerName}
                    onChange={(e) => setSellerForm((prev) => ({ ...prev, sellerName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">मोबाइल नंबर *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10 अंकों का नंबर"
                    value={sellerForm.phone}
                    onChange={(e) => setSellerForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">बिचा की किस्म (Variety)</label>
                  <input
                    type="text"
                    placeholder="जैसे: हाइब्रिड 101"
                    value={sellerForm.varietyName}
                    onChange={(e) => setSellerForm((prev) => ({ ...prev, varietyName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">कुल कितना बिचा है? *</label>
                  <input
                    type="text"
                    required
                    placeholder="जैसे: 30,000 पौधे"
                    value={sellerForm.capacity}
                    onChange={(e) => setSellerForm((prev) => ({ ...prev, capacity: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-2">
                <label className="block font-extrabold text-amber-950">मूल्य तय करें (Price Unit) *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSellerForm((prev) => ({ ...prev, priceUnit: 'per_100' }))}
                    className={`py-2 rounded-xl font-bold border ${sellerForm.priceUnit === 'per_100' ? 'bg-emerald-800 text-white' : 'bg-white'}`}
                  >
                    प्रति 100 पौधा
                  </button>
                  <button
                    type="button"
                    onClick={() => setSellerForm((prev) => ({ ...prev, priceUnit: 'per_1' }))}
                    className={`py-2 rounded-xl font-bold border ${sellerForm.priceUnit === 'per_1' ? 'bg-emerald-800 text-white' : 'bg-white'}`}
                  >
                    प्रति 1 पौधा
                  </button>
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="मूल्य दर्ज करें (₹)"
                  value={sellerForm.price}
                  onChange={(e) => setSellerForm((prev) => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-emerald-950">खेत का पता और GPS लोकेशन *</span>
                  <button
                    type="button"
                    onClick={detectSellerLocation}
                    disabled={sellerGpsLoading}
                    className="bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold"
                  >
                    {sellerGpsLoading ? 'खोज रहा है...' : '📍 GPS लोकेशन भरें'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="पूरा पता (गाँव, प्रखंड, जिला)"
                  value={sellerForm.address}
                  onChange={(e) => setSellerForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                />
                <input
                  type="url"
                  placeholder="Google Map लिंक (ऑटोमेटिक)"
                  value={sellerForm.mapLink}
                  onChange={(e) => setSellerForm((prev) => ({ ...prev, mapLink: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-[11px]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-extrabold text-slate-700">खेत की 4 फोटो ({sellerForm.photos.length}/4)</span>
                  <span className="text-[10px] text-emerald-700 font-bold">⚡ ऑटो कम्प्रेसर सक्रिय</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {sellerForm.photos.map((p, i) => (
                    <div key={i} className="relative h-20 rounded-xl overflow-hidden bg-slate-100">
                      <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setSellerForm((prev) => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }))}
                        className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {sellerForm.photos.length < 4 && (
                    <label className="h-20 rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-50 flex flex-col items-center justify-center cursor-pointer text-center p-1">
                      <Camera className="w-5 h-5 text-emerald-700" />
                      <span className="text-[10px] font-bold text-emerald-900 mt-1">{isCompressing ? 'पैक हो रहा है...' : '+ फोटो'}</span>
                      <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3 rounded-xl shadow">
                ✅ बिचा लाइव पब्लिश करें
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: COMMUNITY */}
        {activeTab === 'community' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 h-fit space-y-3">
              <h3 className="text-xs font-extrabold flex items-center gap-1">
                <Users className="w-4 h-4 text-emerald-700" /> चौपाल में चर्चा करें
              </h3>
              <form onSubmit={handleCreatePost} className="space-y-2.5 text-xs">
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.nameHi}</option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  placeholder="आपका नाम"
                  value={newPost.author}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, author: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
                <textarea
                  rows={3}
                  required
                  placeholder="अपना सवाल या जानकारी लिखें..."
                  value={newPost.text}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, text: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
                <button type="submit" className="w-full bg-emerald-700 text-white font-bold py-2 rounded-xl">
                  पोस्ट करें
                </button>
              </form>
            </div>

            <div className="md:col-span-2 space-y-3">
              {communityPosts.map((p) => {
                const cat = CATEGORIES.find((c) => c.id === p.category) || CATEGORIES[0];
                return (
                  <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        {cat.icon} {cat.nameHi}
                      </span>
                      <span className="text-slate-400 text-[10px]">{p.createdAt}</span>
                    </div>
                    <h4 className="font-extrabold text-slate-900">{p.author} {p.isAdmin && '⭐ (संपादक)'}</h4>
                    <p className="text-slate-700">{p.text}</p>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          const updated = communityPosts.filter((item) => item.id !== p.id);
                          setCommunityPosts(updated);
                          pushToCloud(sellers, updated, blockedPhones);
                        }}
                        className="text-red-600 font-bold"
                      >
                        🗑️ पोस्ट हटाएं
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* FULL PHOTO LIGHTBOX */}
      {activePhotoModal && (
        <div onClick={() => setActivePhotoModal(null)} className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full">
            <button onClick={() => setActivePhotoModal(null)} className="absolute -top-10 right-0 bg-white text-black px-3 py-1 rounded-full text-xs font-bold">
              ✕ बंद करें
            </button>
            <img src={activePhotoModal} alt="" className="w-full max-h-[80vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}

      {/* ADMIN MODAL */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-slate-900">संचालक पैनल (Vijay Admin)</h3>
              <button onClick={() => setShowAdminModal(false)}><X className="w-4 h-4" /></button>
            </div>

            {!isAdmin ? (
              <div className="space-y-2">
                <p className="text-slate-600">एडमिन पिन डालें (डिफ़ॉल्ट: <code className="font-bold">2026</code>)</p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="पिन (2026)"
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-xl font-bold"
                  />
                  <button
                    onClick={() => {
                      if (adminPinInput === adminPin) setIsAdmin(true);
                      else alert('गलत पिन!');
                    }}
                    className="bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold"
                  >
                    लॉगिन
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-900 font-medium">
                  ✅ एडमिन मोड सक्रिय है। आप किसी भी पोस्ट को हटा सकते हैं या नंबर ब्लॉक कर सकते हैं।
                </div>
                <div className="space-y-1">
                  <span className="font-bold">स्पैम नंबर ब्लॉक करें:</span>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10 अंकों का फोन नंबर"
                      value={blockPhoneInput}
                      onChange={(e) => setBlockPhoneInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 border rounded-lg"
                    />
                    <button onClick={() => handleBlockPhone(blockPhoneInput)} className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold">
                      ब्लॉक
                    </button>
                  </div>
                </div>
                <div className="space-y-1 pt-2">
                  <span className="font-bold flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5 text-blue-600" /> Firebase Realtime DB URL (क्लाउड सिंक):
                  </span>
                  <input
                    type="url"
                    placeholder="https://your-app.firebaseio.com"
                    value={firebaseDbUrl}
                    onChange={(e) => {
                      setFirebaseDbUrl(e.target.value);
                      localStorage.setItem('cf_firebase_url', e.target.value);
                    }}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <button onClick={() => setIsAdmin(false)} className="w-full bg-slate-800 text-white py-2 rounded-xl font-bold">
                  लॉगआउट
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="max-w-4xl mx-auto px-4 mt-8 text-center text-xs text-slate-500">
        <p className="font-extrabold text-slate-700">Chandi Farm (चांदी फार्म) — सीधा किसान बाज़ार</p>
        <p>संचालक: <strong className="text-emerald-800">Vijay (विजय)</strong></p>
      </footer>

      {/* 🟢 ALENEXAARIEN JSR - AI CHATBOT INTEGRATED */}
      <AlenexaarienJSR />
    </div>
  );
}

// ==========================================================
// ALENEXAARIEN JSR - SMART AI CHATBOT (HUMANOID VOICE & TEXT)
// ==========================================================
function AlenexaarienJSR() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const getNaturalVoice = (voices) => {
    return voices.find(v => v.lang.includes('hi') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neerja') || v.name.includes('Madhur'))) ||
           voices.find(v => v.lang.includes('hi')) || 
           voices[0];
  };

  const speakText = (text, isGreeting = false) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = getNaturalVoice(voices);
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.lang = 'hi-IN';
      utterance.rate = isGreeting ? 0.95 : 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      const greetingText = "नमस्ते किसान भाई! मैं Alenexaarien JSR हूँ। खेती-बाड़ी, फसल या दुनिया का कोई भी सवाल हो, आप मुझसे लिखकर या बोलकर पूछ सकते हैं।";
      setMessages([{ sender: 'bot', text: greetingText }]);
      setTimeout(() => speakText(greetingText, true), 500);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('माफ़ करें, आपका ब्राउज़र बोलकर टाइप करने का समर्थन नहीं करता है।');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setInput(speechToText);
      sendMessage(speechToText);
    };
    recognition.start();
  };

  const sendMessage = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userText = textToSend.trim();
    if (!customText) {
      setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
      setInput('');
    } else {
      setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    }

    setLoading(true);
    const systemPrompt = "तुम्हारा नाम 'Alenexaarien JSR' है। तुम किसानों और आम लोगों के लिए एक बहुत स्मार्ट AI असिस्टेंट हो जो पूर्णिया, बिहार, या दुनिया की किसी भी भाषा (जैसे मैथिली, भोजपुरी, हिंदी आदि) में बात कर सकते हो। अगर कोई तुमसे विशेष रूप से पूछे कि 'तुम्हें किसने बनाया है?' या 'तुम्हारा मालिक कौन है?', तभी यह उत्तर देना कि 'मुझे अलोक्स भगत (Alox Bhagat) ने बनाया है।' इसके अलावा सामान्य बातचीत में बिना पूछे अपने आप निर्माता का जिक्र बार-बार मत करना। कभी भी भूलकर भी Google, Gemini या OpenAI का नाम मत लेना। हमेशा आसान और दोस्ताना भाषा में सटीक जवाब देना।";

    try {
      const res = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText }
          ],
          model: 'openai'
        })
      });
      const replyText = await res.text();
      const finalReply = replyText || 'माफ़ करें, अभी जवाब नहीं मिल पाया। दोबारा पूछें।';

      setMessages((prev) => [...prev, { sender: 'bot', text: finalReply }]);
      speakText(finalReply);
    } catch (err) {
      const errReply = 'नेटवर्क में थोड़ी दिक्कत है, कृपया एक बार फिर से कोशिश करें।';
      setMessages((prev) => [...prev, { sender: 'bot', text: errReply }]);
      speakText(errReply);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, fontFamily: 'sans-serif' }}>
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          style={{
            background: 'linear-gradient(135deg, #15803d, #166534)',
            color: 'white',
            padding: '12px 22px',
            borderRadius: '50px',
            border: '2px solid #86efac',
            boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            fontSize: '15px'
          }}
        >
          <span>🎙️ Alenexaarien JSR</span>
        </button>
      )}

      {isOpen && (
        <div style={{ width: '340px', height: '480px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #bbf7d0' }}>
          <div style={{ background: 'linear-gradient(135deg, #166534, #15803d)', color: 'white', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#052e16', color: '#fde047', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1px solid #fde047' }}>AJ</div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Alenexaarien JSR</div>
                <div style={{ fontSize: '11px', color: '#bbf7d0' }}>{isSpeaking ? '🔊 बोल रहा है...' : '● AI सहायक'}</div>
              </div>
            </div>
            <button onClick={() => { window.speechSynthesis?.cancel(); setIsOpen(false); }} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>

          <div style={{ flex: 1, padding: '12px', overflowY: 'auto', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', backgroundColor: m.sender === 'user' ? '#15803d' : '#ffffff', color: m.sender === 'user' ? '#ffffff' : '#1e293b', padding: '10px 14px', borderRadius: '14px', maxWidth: '82%', fontSize: '14px', lineHeight: '1.4', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}>
                {m.text}
                {m.sender === 'bot' && (
                  <button onClick={() => speakText(m.text)} style={{ display: 'block', marginTop: '6px', background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', color: '#15803d', fontWeight: 'bold' }}>🔊 दोबारा सुनें</button>
                )}
              </div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start', fontSize: '12px', color: '#15803d', padding: '6px' }}>Alenexaarien JSR सोच रहा है...</div>}
            {isListening && <div style={{ alignSelf: 'center', fontSize: '12px', color: '#dc2626', fontWeight: 'bold' }}>🎙️ बोलिए, मैं सुन रहा हूँ...</div>}
          </div>

          <div style={{ padding: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '6px', backgroundColor: '#ffffff', alignItems: 'center' }}>
            <button onClick={startListening} title="बोलकर पूछने के लिए दबाएं" style={{ backgroundColor: isListening ? '#dc2626' : '#22c55e', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', fontSize: '16px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>🎙️</button>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="बोलकर या लिखकर पूछें..." style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
            <button onClick={() => sendMessage()} disabled={loading} style={{ backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>भेजें</button>
          </div>
        </div>
      )}
    </div>
  );
}
