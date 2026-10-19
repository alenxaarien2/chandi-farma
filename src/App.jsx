import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin, Phone, MessageCircle, PlusCircle, ShieldCheck, Trash2,
  Ban, CheckCircle2, Navigation, Camera, ExternalLink, Search,
  Sprout, Users, Lock, Unlock, Calculator, X, Cloud, Sparkles, RefreshCw, Mic
} from 'lucide-react';

// --- PERMANENT FIREBASE DATABASE URL ---
const DEFAULT_FIREBASE_URL = "https://chandibari-farma-default-rtdb.asia-southeast1.firebasedatabase.app";
const TWENTY_ONE_DAYS_MS = 21 * 24 * 60 * 60 * 1000;

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

const INITIAL_SELLERS = [
  {
    id: 'seller_1',
    sellerName: 'विजय कुमार (Vijay Kumar)',
    phone: '9876543210',
    category: 'cauliflower',
    varietyName: 'अगेती स्नोबॉल फूलगोभी (Early Snowball)',
    price: 60,
    priceUnit: 'per_100',
    capacity: '40,000 पौधे (Plants)',
    address: 'चांदी बाज़ार, मुख्य नर्सरी रोड, जिला नालंदा, बिहार (803108)',
    mapLink: 'https://www.google.com/maps?q=25.3265,85.4048',
    extraLink: '',
    lat: 25.3265,
    lng: 85.4048,
    verified: true,
    createdAt: 'आज',
    timestamp: Date.now(),
    photos: [
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=60',
      'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=600&q=60',
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=600&q=60',
      'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=600&q=60',
    ],
  }
];

const INITIAL_COMMUNITY = [
  {
    id: 'post_1',
    author: 'विजय कुमार (संचालक)',
    phone: '9876543210',
    category: 'all',
    text: 'सभी किसान भाइयों का Chandi Farm पर स्वागत है! यहाँ आप अपने खेत का तैयार बिचा सही दाम पर बेच सकते हैं और नज़दीकी किसान से सीधा जुड़ सकते हैं।',
    createdAt: 'अभी',
    isAdmin: true,
    replies: []
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

function filterValidSellers(list) {
  if (!Array.isArray(list)) return [];
  const now = Date.now();
  return list.filter((item) => {
    if (!item.timestamp) return true;
    return now - item.timestamp < TWENTY_ONE_DAYS_MS;
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState('buy');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState(false);

  const [sellers, setSellers] = useState(() => {
    const saved = localStorage.getItem('cf_sellers_v5');
    const parsed = saved ? JSON.parse(saved) : INITIAL_SELLERS;
    return filterValidSellers(parsed);
  });

  const [communityPosts, setCommunityPosts] = useState(() => {
    const saved = localStorage.getItem('cf_community_v5');
    return saved ? JSON.parse(saved) : INITIAL_COMMUNITY;
  });

  const [blockedPhones, setBlockedPhones] = useState(() => {
    const saved = localStorage.getItem('cf_blocked_phones');
    return saved ? JSON.parse(saved) : [];
  });

  const [firebaseDbUrl] = useState(DEFAULT_FIREBASE_URL);

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
  
  // --- यहाँ अपना गुप्त पासवर्ड बदल सकते हैं ---
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
    localStorage.setItem('cf_sellers_v5', JSON.stringify(sellers));
  }, [sellers]);

  useEffect(() => {
    localStorage.setItem('cf_community_v5', JSON.stringify(communityPosts));
  }, [communityPosts]);

  useEffect(() => {
    localStorage.setItem('cf_blocked_phones', JSON.stringify(blockedPhones));
  }, [blockedPhones]);

  const syncFromCloud = async () => {
    const activeUrl = firebaseDbUrl.replace(/\/$/, '');
    try {
      setSyncing(true);
      const res = await fetch(`${activeUrl}/chandifarm.json`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const validSellers = data.sellers ? filterValidSellers(data.sellers) : INITIAL_SELLERS;
          const validCommunity = data.community || INITIAL_COMMUNITY;
          const validBlocked = data.blocked || [];
          setSellers(validSellers);
          setCommunityPosts(validCommunity);
          setBlockedPhones(validBlocked);
          return { sellers: validSellers, community: validCommunity, blocked: validBlocked };
        }
      }
    } catch (e) {
      console.error('Cloud sync error:', e);
    } finally {
      setSyncing(false);
    }
    return null;
  };

  const pushToCloud = async (uSellers, uCommunity, uBlocked) => {
    const activeUrl = firebaseDbUrl.replace(/\/$/, '');
    try {
      setSyncing(true);
      await fetch(`${activeUrl}/chandifarm.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellers: filterValidSellers(uSellers ?? sellers),
          community: uCommunity ?? communityPosts,
          blocked: uBlocked ?? blockedPhones
        })
      });
    } catch (e) {
      console.error('Cloud push error:', e);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    syncFromCloud();
    const interval = setInterval(() => {
      syncFromCloud();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const detectBuyerLocation = () => {
    if (!navigator.geolocation) return;
    setBuyerLocation((prev) => ({ ...prev, loading: true }));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        let placeName = `GPS: ${lat}, ${lng}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&accept-language=hi,en`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            placeName = [addr.village || addr.town || addr.suburb, addr.city || addr.state_district].filter(Boolean).join(', ');
          }
        } catch (e) {}
        setBuyerLocation({ lat, lng, addressText: placeName, loading: false, error: '' });
      },
      () => setBuyerLocation((prev) => ({ ...prev, loading: false, error: 'लोकेशन अनुमति नहीं मिली।' })),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const detectSellerLocation = () => {
    if (!navigator.geolocation) return;
    setSellerGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
        let detectedAddress = sellerForm.address;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&accept-language=hi,en`);
          const data = await res.json();
          if (data && data.display_name) {
            detectedAddress = data.display_name.split(',').slice(0, 4).join(', ');
          }
        } catch (e) {}
        setSellerForm((prev) => ({ ...prev, lat, lng, mapLink, address: detectedAddress || prev.address }));
        setSellerGpsLoading(false);
        setFormMessage({ type: 'success', text: 'सफलतापूर्वक लाइव लोकेशन और मैप लिंक जुड़ गया है!' });
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
      setSellerForm((prev) => ({ ...prev, photos: [...prev.photos, ...compressedList].slice(0, 4) }));
    } catch (err) {
      setFormMessage({ type: 'error', text: 'फोटो अपलोड करने में त्रुटि।' });
    }
    setIsCompressing(false);
  };

  const handleSellerSubmit = async (e) => {
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

    let finalMapLink = sellerForm.mapLink.trim();
    if (!finalMapLink) {
      if (sellerForm.lat && sellerForm.lng) {
        finalMapLink = `https://www.google.com/maps?q=${sellerForm.lat},${sellerForm.lng}`;
      } else {
        finalMapLink = `https://www.google.com/maps?q=${encodeURIComponent(sellerForm.address.trim())}`;
      }
    }

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
      createdAt: new Date().toLocaleDateString('hi-IN'),
      timestamp: Date.now(),
      photos: sellerForm.photos.length > 0 ? sellerForm.photos.map((p) => p.dataUrl) : ['https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=600&q=60']
    };

    const latestCloud = await syncFromCloud();
    const baseSellers = latestCloud?.sellers || sellers;
    const updated = filterValidSellers([newListing, ...baseSellers]);

    setSellers(updated);
    await pushToCloud(updated, latestCloud?.community || communityPosts, latestCloud?.blocked || blockedPhones);

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
    return filterValidSellers(sellers)
      .filter((s) => !blockedPhones.includes(s.phone))
      .filter((s) => (selectedCategory === 'all' ? true : s.category === selectedCategory))
      .filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return s.sellerName.toLowerCase().includes(q) || s.address.toLowerCase().includes(q) || s.varietyName.toLowerCase().includes(q);
      })
      .map((s) => {
        const distanceKm = calculateDistanceKm(buyerLocation.lat, buyerLocation.lng, s.lat, s.lng);
        const daysLeft = s.timestamp ? Math.max(1, Math.ceil((TWENTY_ONE_DAYS_MS - (Date.now() - s.timestamp)) / (1000 * 60 * 60 * 24))) : 21;
        return { ...s, distanceKm, daysLeft };
      })
      .sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm !== null) return -1;
        if (b.distanceKm !== null) return 1;
        return 0;
      });
  }, [sellers, blockedPhones, selectedCategory, searchQuery, buyerLocation]);

  const handleDeleteSeller = async (id) => {
    const updated = sellers.filter((s) => s.id !== id);
    setSellers(updated);
    await pushToCloud(updated, communityPosts, blockedPhones);
  };

  const handleToggleVerify = async (id) => {
    const updated = sellers.map((s) => (s.id === id ? { ...s, verified: !s.verified } : s));
    setSellers(updated);
    await pushToCloud(updated, communityPosts, blockedPhones);
  };

  const handleBlockPhone = async (phone) => {
    const clean = phone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) return;
    const uBlocked = Array.from(new Set([...blockedPhones, clean]));
    const uSellers = sellers.filter((s) => s.phone !== clean);
    setBlockedPhones(uBlocked);
    setSellers(uSellers);
    await pushToCloud(uSellers, communityPosts, uBlocked);
    setBlockPhoneInput('');
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const cleanPhone = newPost.phone.replace(/\D/g, '').slice(-10);
    if (!newPost.author.trim() || !newPost.text.trim()) return;

    const postObj = {
      id: 'post_' + Date.now(),
      author: newPost.author.trim(),
      phone: cleanPhone,
      category: newPost.category,
      text: newPost.text.trim(),
      createdAt: new Date().toLocaleDateString('hi-IN'),
      isAdmin,
      replies: []
    };
    const latestCloud = await syncFromCloud();
    const baseCommunity = latestCloud?.community || communityPosts;
    const updated = [postObj, ...baseCommunity];
    setCommunityPosts(updated);
    await pushToCloud(latestCloud?.sellers || sellers, updated, latestCloud?.blocked || blockedPhones);
    setNewPost({ author: '', phone: '', category: 'cauliflower', text: '' });
  };

  return (
    <div className="min-h-screen luxury-gray-bg text-slate-900 pb-28 font-sans relative overflow-x-hidden">
      {/* World-Class Metallic Gray 3D Architecture CSS */}
      <style>{`
        .luxury-gray-bg {
          background: radial-gradient(circle at 15% 15%, #cbd5e1 0%, #94a3b8 45%, #64748b 100%);
          background-attachment: fixed;
        }
        /* Brushed Metallic Gray 3D Panel (Replaces White Panels) */
        .panel-grey-sculpted {
          background: linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 100%);
          border-radius: 26px;
          border: 1px solid rgba(255, 255, 255, 0.75);
          box-shadow: 
            0 20px 38px -10px rgba(15, 23, 42, 0.45),
            0 7px 0px #64748b,
            inset 0 2px 3px rgba(255, 255, 255, 0.9),
            inset 0 -2px 4px rgba(100, 116, 139, 0.35);
          transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .panel-grey-sculpted:hover {
          transform: translateY(-6px);
          box-shadow: 
            0 28px 50px -12px rgba(15, 23, 42, 0.55),
            0 9px 0px #475569,
            inset 0 2px 4px rgba(255, 255, 255, 0.95);
        }
        /* Recessed Inner Slate Box for Crisp Readability */
        .recessed-grey-box {
          background: linear-gradient(180deg, #cbd5e1 0%, #d8e0ea 100%);
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.65);
          box-shadow: 
            inset 0 3px 6px rgba(15, 23, 42, 0.18),
            inset 0 1px 2px rgba(15, 23, 42, 0.12),
            0 1px 0 rgba(255, 255, 255, 0.8);
        }
        /* Input Fields in Sculpted Grey */
        .input-grey-sculpted {
          background: linear-gradient(180deg, #dfe6ee 0%, #eef2f6 100%);
          border: 1.5px solid #94a3b8;
          box-shadow: inset 0 2px 5px rgba(15, 23, 42, 0.15), 0 1px 0 rgba(255, 255, 255, 0.9);
          color: #0f172a;
          transition: all 0.2s ease;
        }
        .input-grey-sculpted:focus {
          background: #f1f5f9;
          border-color: #059669;
          box-shadow: inset 0 2px 4px rgba(5, 150, 105, 0.15), 0 0 0 3px rgba(16, 185, 129, 0.25);
          outline: none;
        }
        /* Tactile Buttons */
        .btn-emerald-pro {
          background: linear-gradient(180deg, #10b981 0%, #047857 100%);
          box-shadow: 0 5px 0 #064e3b, 0 10px 20px rgba(6, 78, 59, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.45);
          transition: all 0.15s ease;
        }
        .btn-emerald-pro:active {
          transform: translateY(4px);
          box-shadow: 0 1px 0 #064e3b, 0 4px 8px rgba(6, 78, 59, 0.25);
        }
        .btn-gold-pro {
          background: linear-gradient(180deg, #fde047 0%, #eab308 100%);
          box-shadow: 0 5px 0 #854d0e, 0 10px 20px rgba(133, 77, 14, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.85);
          transition: all 0.15s ease;
        }
        .btn-gold-pro:active {
          transform: translateY(4px);
          box-shadow: 0 1px 0 #854d0e;
        }
        .btn-whatsapp-pro {
          background: linear-gradient(180deg, #22c55e 0%, #15803d 100%);
          box-shadow: 0 5px 0 #14532d, 0 10px 20px rgba(20, 83, 45, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.45);
          transition: all 0.15s ease;
        }
        .btn-whatsapp-pro:active {
          transform: translateY(4px);
          box-shadow: 0 1px 0 #14532d;
        }
        .cat-pill-grey {
          background: linear-gradient(145deg, #e2e8f0, #cbd5e1);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 5px 0 #64748b, 0 8px 15px rgba(15, 23, 42, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.8);
          transition: all 0.18s ease;
        }
        .cat-pill-grey:active {
          transform: translateY(4px);
          box-shadow: 0 1px 0 #64748b;
        }
        .cat-pill-active {
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          border: 1px solid #38bdf8;
          box-shadow: 0 5px 0 #020617, 0 10px 20px rgba(15, 23, 42, 0.4);
          transform: translateY(-2px);
        }
        /* Embossed MPG Watermark */
        .mpg-embossed {
          font-size: clamp(7rem, 24vw, 20rem);
          font-weight: 900;
          letter-spacing: 0.18em;
          color: rgba(30, 41, 59, 0.055);
          text-shadow: 3px 4px 0px rgba(255, 255, 255, 0.35), -2px -2px 0px rgba(15, 23, 42, 0.08);
          transform: rotate(-20deg);
          user-select: none;
        }
      `}</style>

      {/* SUBTLE EMBOSSED "MPG" WATERMARK LAYER */}
      <div className="pointer-events-none fixed inset-0 z-0 flex flex-col items-center justify-center overflow-hidden">
        <div className="mpg-embossed">MPG</div>
        <div className="grid grid-cols-3 gap-28 opacity-25 mt-8">
          <span className="text-4xl font-black text-slate-800/20 -rotate-12 select-none tracking-widest">MPG</span>
          <span className="text-4xl font-black text-slate-800/20 -rotate-12 select-none tracking-widest">MPG</span>
          <span className="text-4xl font-black text-slate-800/20 -rotate-12 select-none tracking-widest">MPG</span>
        </div>
      </div>

      {/* EXECUTIVE DARK TITANIUM HEADER */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl text-white border-b-2 border-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.5)]">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl btn-gold-pro text-slate-950 flex items-center justify-center text-2xl font-black">
              🌱
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow">
                  Chandi Farm
                </h1>
                <span className="text-[11px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-extrabold">
                  चांदी फार्म
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                संचालक: <strong className="text-amber-300 font-extrabold">विजय कुमार (Vijay Kumar)</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={syncFromCloud}
              title="डेटा रिफ्रेश करें"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 shadow-inner transition"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-amber-300' : ''}`} />
            </button>
            <button
              onClick={() => setShowAdminModal(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                isAdmin ? 'btn-gold-pro text-slate-950' : 'bg-slate-800 text-slate-100 border border-slate-600 shadow-md hover:bg-slate-700'
              }`}
            >
              {isAdmin ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isAdmin ? 'Admin सक्रिय' : 'संचालक पैनल'}</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="max-w-4xl mx-auto px-4 pb-3.5 pt-1 flex gap-2.5">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition ${
              activeTab === 'buy'
                ? 'btn-emerald-pro text-white'
                : 'bg-slate-800/90 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Sprout className="w-4 h-4" /> <span>बिचा खरीदें (Buy)</span>
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition ${
              activeTab === 'sell'
                ? 'btn-gold-pro text-slate-950'
                : 'bg-slate-800/90 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <PlusCircle className="w-4 h-4" /> <span>बिचा बेचें (Sell)</span>
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition ${
              activeTab === 'community'
                ? 'btn-emerald-pro text-white'
                : 'bg-slate-800/90 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" /> <span>किसान चौपाल</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 pt-6 relative z-10">
        {activeTab === 'buy' && (
          <div className="space-y-6">
            {/* Location Radar Bar */}
            <div className="panel-grey-sculpted p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl btn-emerald-pro text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-emerald-700" /> नज़दीकी किसान प्राथमिकता (Nearest Priority)
                  </div>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    {buyerLocation.lat ? `📍 आपकी लोकेशन: ${buyerLocation.addressText}` : 'अपने सबसे पास के किसान देखने के लिए GPS चालू करें।'}
                  </p>
                </div>
              </div>
              <button
                onClick={detectBuyerLocation}
                disabled={buyerLocation.loading}
                className="btn-emerald-pro text-white text-xs font-black px-5 py-3 rounded-2xl flex items-center justify-center gap-2 shrink-0"
              >
                <Navigation className={`w-4 h-4 ${buyerLocation.loading ? 'animate-spin' : ''}`} />
                <span>{buyerLocation.loading ? 'लोकेशन खोज रहा है...' : 'मेरे पास के किसान दिखाएं'}</span>
              </button>
            </div>

            {/* Category Filter & Search */}
            <div className="panel-grey-sculpted p-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">🌱 फसल / बिचा कैटेगरी चुनें:</h2>
              <div className="flex gap-2.5 overflow-x-auto pb-2.5 pt-1 no-scrollbar">
                {CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex flex-col items-center justify-center min-w-[82px] p-2.5 rounded-2xl shrink-0 ${
                        active
                          ? 'cat-pill-active text-white'
                          : 'cat-pill-grey text-slate-900 hover:brightness-105'
                      }`}
                    >
                      <span className="text-2xl mb-1 drop-shadow">{cat.icon}</span>
                      <span className="text-xs font-black">{cat.nameHi}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3.5 relative">
                <Search className="w-4 h-4 text-slate-700 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="गाँव, प्रखंड या किसान का नाम लिखकर खोजें..."
                  className="w-full pl-11 pr-4 py-3 input-grey-sculpted rounded-2xl text-xs sm:text-sm font-extrabold placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Sellers Grid */}
            {processedSellers.length === 0 ? (
              <div className="panel-grey-sculpted p-10 text-center">
                <div className="text-5xl mb-3">🌱</div>
                <h3 className="text-base font-black text-slate-900">इस कैटेगरी में अभी कोई बिचा उपलब्ध नहीं है</h3>
                <button onClick={() => setActiveTab('sell')} className="mt-4 btn-emerald-pro text-white text-xs font-black px-6 py-3 rounded-2xl">
                  + अपना बिचा बेचें
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  const workingMapUrl =
                    seller.mapLink ||
                    (seller.lat && seller.lng
                      ? `https://www.google.com/maps?q=${seller.lat},${seller.lng}`
                      : `https://www.google.com/maps?q=${encodeURIComponent(seller.address)}`);

                  return (
                    <div
                      key={seller.id}
                      className={`panel-grey-sculpted overflow-hidden relative ${
                        isNearest ? 'ring-4 ring-amber-400' : ''
                      }`}
                    >
                      {/* Subtle Card Corner MPG Watermark */}
                      <span className="pointer-events-none select-none absolute bottom-20 right-4 text-3xl font-black text-slate-900/10">
                        MPG
                      </span>

                      {isNearest && (
                        <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 px-4 py-1.5 text-xs font-black flex items-center justify-between shadow">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-slate-950" /> आपके सबसे करीब (Nearest Farmer)
                          </span>
                          <span className="bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-black">
                            {seller.distanceKm} km दूर
                          </span>
                        </div>
                      )}

                      {/* Photo Gallery */}
                      <div className="p-3.5 pb-0">
                        <div className="grid grid-cols-4 gap-2 h-44">
                          <div
                            onClick={() => setActivePhotoModal(seller.photos[0])}
                            className="col-span-3 h-full rounded-2xl overflow-hidden relative cursor-pointer bg-slate-800 shadow-lg border border-white/50 group"
                          >
                            <img src={seller.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                            <div className="absolute top-2.5 left-2.5 bg-slate-950/85 backdrop-blur-md text-white px-3 py-1 rounded-xl text-xs font-black shadow">
                              {catObj.icon} {catObj.nameHi}
                            </div>
                            <div className="absolute bottom-2.5 left-2.5 btn-gold-pro text-slate-950 px-3 py-1 rounded-xl font-black text-xs">
                              ₹{seller.price} / {seller.priceUnit === 'per_100' ? '100 पौधा' : '1 पौधा'}
                            </div>
                          </div>
                          <div className="col-span-1 flex flex-col gap-2 h-full">
                            {[1, 2, 3].map((idx) => {
                              const photo = seller.photos[idx];
                              return photo ? (
                                <div
                                  key={idx}
                                  onClick={() => setActivePhotoModal(photo)}
                                  className="flex-1 rounded-xl overflow-hidden cursor-pointer bg-slate-800 border border-white/50 shadow-sm hover:opacity-90 transition"
                                >
                                  <img src={photo} alt="" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div
                                  key={idx}
                                  className="flex-1 rounded-xl recessed-grey-box text-[10px] text-slate-600 font-extrabold flex items-center justify-center"
                                >
                                  फोटो
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* High-Visibility Farmer Details */}
                      <div className="p-4 space-y-3 relative z-10">
                        <div className="flex items-start justify-between gap-2 bg-slate-900 text-white p-3 rounded-2xl shadow-md border border-slate-700">
                          <div>
                            <h3 className="text-base font-black text-amber-300 leading-snug">{seller.varietyName}</h3>
                            <p className="text-xs sm:text-sm font-extrabold text-white mt-1 flex items-center gap-1.5">
                              <span>👨‍🌾 विक्रेता:</span>
                              <span className="bg-emerald-500/25 text-emerald-200 px-2 py-0.5 rounded-lg border border-emerald-400/30">
                                {seller.sellerName}
                              </span>
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {seller.distanceKm !== null && !isNearest && (
                              <span className="text-xs font-black bg-emerald-400 text-slate-950 px-2.5 py-0.5 rounded-xl block shadow">
                                📍 {seller.distanceKm} km
                              </span>
                            )}
                            <span className="text-[11px] text-slate-300 font-bold block mt-1">⏳ {seller.daysLeft} दिन शेष</span>
                          </div>
                        </div>

                        <div className="recessed-grey-box p-3 text-xs space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-400/30 pb-1.5">
                            <span className="text-slate-700 font-extrabold">उपलब्ध क्षमता:</span>
                            <span className="font-black text-sm text-emerald-950 bg-emerald-300/50 px-2.5 py-0.5 rounded-lg border border-emerald-600/30">
                              {seller.capacity}
                            </span>
                          </div>
                          <div className="leading-relaxed">
                            <span className="text-slate-700 font-extrabold">खेत का पता:</span>{' '}
                            <span className="font-black text-slate-950 text-[13px]">{seller.address}</span>
                          </div>
                          <div className="pt-1">
                            <a
                              href={workingMapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-r from-blue-700 to-indigo-800 px-3.5 py-2 rounded-xl shadow hover:brightness-110 transition"
                            >
                              <MapPin className="w-3.5 h-3.5 text-amber-300" /> Google Map पर सीधा रास्ता देखें <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        {/* Price Calculator */}
                        <div className="recessed-grey-box p-2.5 flex items-center justify-between text-xs border border-amber-500/40">
                          <span className="font-black text-slate-900 flex items-center gap-1">
                            <Calculator className="w-4 h-4 text-amber-700" /> कुल दाम जोड़ें:
                          </span>
                          <input
                            type="number"
                            min="1"
                            placeholder="पौधों की संख्या"
                            value={qty}
                            onChange={(e) => setCalcQuantity((prev) => ({ ...prev, [seller.id]: e.target.value }))}
                            className="w-28 px-2.5 py-1.5 input-grey-sculpted rounded-xl text-xs font-black"
                          />
                          <span className="font-black text-sm text-emerald-950 bg-amber-300 px-2.5 py-1 rounded-lg shadow-sm min-w-[60px] text-center">
                            {calculatedCost ? `₹${calculatedCost}` : `₹${seller.price}`}
                          </span>
                        </div>

                        {/* Call & WhatsApp Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <a
                            href={`tel:${seller.phone}`}
                            className="btn-emerald-pro text-white py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5"
                          >
                            <Phone className="w-4 h-4" /> कॉल ({seller.phone})
                          </a>
                          <a
                            href={`https://wa.me/91${seller.phone}?text=${encodeURIComponent(
                              `नमस्ते ${seller.sellerName} जी, मुझे Chandi Farm पर आपका बिचा (${seller.varietyName}) पसंद आया है।`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-whatsapp-pro text-white py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5"
                          >
                            <MessageCircle className="w-4 h-4" /> WhatsApp करें
                          </a>
                        </div>

                        {isAdmin && (
                          <div className="pt-2 border-t border-slate-400 flex justify-between items-center recessed-grey-box p-2 rounded-xl text-xs">
                            <span className="text-red-900 font-black">संचालक नियंत्रण:</span>
                            <div className="flex gap-1.5">
                              <button onClick={() => handleToggleVerify(seller.id)} className="bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow">
                                {seller.verified ? 'Unverify' : 'Verify'}
                              </button>
                              <button onClick={() => handleBlockPhone(seller.phone)} className="bg-amber-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow">
                                ब्लॉक
                              </button>
                              <button onClick={() => handleDeleteSeller(seller.id)} className="bg-red-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow">
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

        {activeTab === 'sell' && (
          <div className="max-w-xl mx-auto panel-grey-sculpted overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 border-b border-slate-700">
              <h2 className="text-base font-black flex items-center gap-2 text-amber-300">🌱 अपना बिचा बेचने के लिए विवरण दर्ज करें</h2>
              <p className="text-xs text-slate-300 mt-1 font-medium">आपका डाला गया बिचा सभी किसानों को तुरंत दिखेगा और 21 दिन बाद अपने आप हट जाएगा।</p>
            </div>
            <form onSubmit={handleSellerSubmit} className="p-5 space-y-4 text-xs">
              {formMessage.text && (
                <div className={`p-3.5 rounded-2xl font-black shadow-sm ${formMessage.type === 'error' ? 'bg-red-200 text-red-950' : 'bg-emerald-200 text-emerald-950'}`}>
                  {formMessage.text}
                </div>
              )}
              <div>
                <label className="block font-black text-slate-900 mb-2">फसल की कैटेगरी चुनें *</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSellerForm((prev) => ({ ...prev, category: cat.id }))}
                      className={`p-2.5 rounded-2xl text-center transition ${
                        sellerForm.category === cat.id ? 'cat-pill-active text-white' : 'cat-pill-grey text-slate-900'
                      }`}
                    >
                      <div className="text-xl">{cat.icon}</div>
                      <div className="font-black mt-1">{cat.nameHi}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-900 mb-1">आपका नाम *</label>
                  <input type="text" required placeholder="जैसे: रामेश्वर प्रसाद" value={sellerForm.sellerName} onChange={(e) => setSellerForm((prev) => ({ ...prev, sellerName: e.target.value }))} className="w-full px-3.5 py-2.5 input-grey-sculpted rounded-xl font-extrabold" />
                </div>
                <div>
                  <label className="block font-black text-slate-900 mb-1">मोबाइल नंबर *</label>
                  <input type="tel" required maxLength={10} placeholder="10 अंकों का नंबर" value={sellerForm.phone} onChange={(e) => setSellerForm((prev) => ({ ...prev, phone: e.target.value }))} className="w-full px-3.5 py-2.5 input-grey-sculpted rounded-xl font-extrabold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-900 mb-1">बिचा की किस्म (Variety)</label>
                  <input type="text" placeholder="जैसे: अर्ली स्नोबॉल / हाइब्रिड" value={sellerForm.varietyName} onChange={(e) => setSellerForm((prev) => ({ ...prev, varietyName: e.target.value }))} className="w-full px-3.5 py-2.5 input-grey-sculpted rounded-xl font-extrabold" />
                </div>
                <div>
                  <label className="block font-black text-slate-900 mb-1">कुल कितना बिचा है? *</label>
                  <input type="text" required placeholder="जैसे: 30,000 पौधे" value={sellerForm.capacity} onChange={(e) => setSellerForm((prev) => ({ ...prev, capacity: e.target.value }))} className="w-full px-3.5 py-2.5 input-grey-sculpted rounded-xl font-extrabold" />
                </div>
              </div>
              <div className="recessed-grey-box p-3.5 space-y-2.5">
                <label className="block font-black text-slate-950">मूल्य तय करें (Price Unit) *</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button type="button" onClick={() => setSellerForm((prev) => ({ ...prev, priceUnit: 'per_100' }))} className={`py-2.5 rounded-xl font-black ${sellerForm.priceUnit === 'per_100' ? 'btn-emerald-pro text-white' : 'cat-pill-grey text-slate-900'}`}>प्रति 100 पौधा</button>
                  <button type="button" onClick={() => setSellerForm((prev) => ({ ...prev, priceUnit: 'per_1' }))} className={`py-2.5 rounded-xl font-black ${sellerForm.priceUnit === 'per_1' ? 'btn-emerald-pro text-white' : 'cat-pill-grey text-slate-900'}`}>प्रति 1 पौधा</button>
                </div>
                <input type="number" required min="1" placeholder="मूल्य दर्ज करें (₹)" value={sellerForm.price} onChange={(e) => setSellerForm((prev) => ({ ...prev, price: e.target.value }))} className="w-full px-3.5 py-2.5 input-grey-sculpted rounded-xl font-black" />
              </div>
              <div className="recessed-grey-box p-3.5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-950">खेत का पता और Google Map लिंक *</span>
                  <button type="button" onClick={detectSellerLocation} disabled={sellerGpsLoading} className="btn-emerald-pro text-white px-3.5 py-2 rounded-xl font-black">
                    {sellerGpsLoading ? 'खोज रहा है...' : '📍 ऑटो GPS लोकेशन'}
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-800 mb-1">पूरा पता (गाँव, प्रखंड, जिला):</label>
                  <input type="text" required placeholder="जैसे: चांदी बाज़ार, नालंदा, बिहार" value={sellerForm.address} onChange={(e) => setSellerForm((prev) => ({ ...prev, address: e.target.value }))} className="w-full px-3.5 py-2.5 input-grey-sculpted rounded-xl font-extrabold" />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-800 mb-1">Google Map रास्ता लिंक (ऑटो-फिल्ड या पेस्ट करें):</label>
                  <input type="url" placeholder="https://www.google.com/maps?q=..." value={sellerForm.mapLink} onChange={(e) => setSellerForm((prev) => ({ ...prev, mapLink: e.target.value }))} className="w-full px-3.5 py-2 input-grey-sculpted rounded-xl text-[11px] font-bold" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-black text-slate-900">खेत की 4 फोटो ({sellerForm.photos.length}/4)</span>
                  <span className="text-[11px] text-emerald-900 font-black">⚡ स्मार्ट इमेज ऑप्टिमाइज़र</span>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {sellerForm.photos.map((p, i) => (
                    <div key={i} className="relative h-20 rounded-xl overflow-hidden bg-slate-800 shadow-md border border-white/60">
                      <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setSellerForm((prev) => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }))} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  {sellerForm.photos.length < 4 && (
                    <label className="h-20 rounded-xl border-2 border-dashed border-slate-600 recessed-grey-box hover:brightness-105 flex flex-col items-center justify-center cursor-pointer text-center p-1 transition">
                      <Camera className="w-5 h-5 text-slate-800" />
                      <span className="text-[10px] font-black text-slate-900 mt-1">{isCompressing ? 'प्रोसेस हो रहा...' : '+ फोटो जोड़ें'}</span>
                      <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
              <button type="submit" disabled={syncing} className="w-full btn-emerald-pro text-white font-black py-3.5 rounded-2xl text-sm">
                {syncing ? 'पब्लिश हो रहा है...' : '✅ बिचा लाइव पब्लिश करें'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="panel-grey-sculpted p-4 h-fit space-y-3">
              <h3 className="text-sm font-black flex items-center gap-1.5 text-slate-950"><Users className="w-4 h-4 text-emerald-800" /> किसान चौपाल में चर्चा करें</h3>
              <form onSubmit={handleCreatePost} className="space-y-2.5 text-xs">
                <select value={newPost.category} onChange={(e) => setNewPost((prev) => ({ ...prev, category: e.target.value }))} className="w-full px-3 py-2.5 input-grey-sculpted rounded-xl font-black">
                  {CATEGORIES.map((c) => (<option key={c.id} value={c.id}>{c.icon} {c.nameHi}</option>))}
                </select>
                <input type="text" required placeholder="आपका नाम" value={newPost.author} onChange={(e) => setNewPost((prev) => ({ ...prev, author: e.target.value }))} className="w-full px-3 py-2.5 input-grey-sculpted rounded-xl font-extrabold" />
                <input type="tel" required maxLength={10} placeholder="मोबाइल नंबर" value={newPost.phone} onChange={(e) => setNewPost((prev) => ({ ...prev, phone: e.target.value }))} className="w-full px-3 py-2.5 input-grey-sculpted rounded-xl font-extrabold" />
                <textarea rows={3} required placeholder="अपना सवाल या संदेश लिखें..." value={newPost.text} onChange={(e) => setNewPost((prev) => ({ ...prev, text: e.target.value }))} className="w-full px-3 py-2.5 input-grey-sculpted rounded-xl font-extrabold" />
                <button type="submit" className="w-full btn-emerald-pro text-white font-black py-2.5 rounded-xl">चौपाल में पोस्ट करें</button>
              </form>
            </div>
            <div className="md:col-span-2 space-y-4">
              {communityPosts.map((p) => {
                const cat = CATEGORIES.find((c) => c.id === p.category) || CATEGORIES[0];
                return (
                  <div key={p.id} className="panel-grey-sculpted p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="bg-slate-900 text-amber-300 px-3 py-0.5 rounded-full font-black">{cat.icon} {cat.nameHi}</span>
                      <span className="text-slate-700 text-[11px] font-extrabold">{p.createdAt}</span>
                    </div>
                    <h4 className="font-black text-sm text-slate-950">{p.author}</h4>
                    <p className="text-slate-900 font-bold leading-relaxed recessed-grey-box p-3">{p.text}</p>
                    {isAdmin && (
                      <button onClick={async () => { const updated = communityPosts.filter((item) => item.id !== p.id); setCommunityPosts(updated); await pushToCloud(sellers, updated, blockedPhones); }} className="text-red-800 font-black pt-1">🗑️ पोस्ट हटाएं</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {activePhotoModal && (
        <div onClick={() => setActivePhotoModal(null)} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full">
            <button onClick={() => setActivePhotoModal(null)} className="absolute -top-11 right-0 btn-gold-pro text-slate-950 px-4 py-1.5 rounded-full text-xs font-black">✕ बंद करें</button>
            <img src={activePhotoModal} alt="" className="w-full max-h-[80vh] object-contain rounded-3xl shadow-2xl border-2 border-white/20" />
          </div>
        </div>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="panel-grey-sculpted max-w-md w-full p-5 space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-400 pb-2.5">
              <h3 className="font-black text-sm text-slate-950">🔐 संचालक पैनल (Vijay Admin)</h3>
              <button onClick={() => setShowAdminModal(false)}><X className="w-5 h-5 text-slate-800" /></button>
            </div>
            {!isAdmin ? (
              <div className="space-y-3 pt-1">
                <p className="text-slate-800 font-extrabold">केवल संचालक (विजय कुमार) के लिए गुप्त पासवर्ड दर्ज करें:</p>
                <div className="flex gap-2">
                  <input type="password" placeholder="गुप्त पासवर्ड डालें" value={adminPinInput} onChange={(e) => setAdminPinInput(e.target.value)} className="flex-1 px-3.5 py-2.5 input-grey-sculpted rounded-xl font-black" />
                  <button onClick={() => { if (adminPinInput === adminPin) { setIsAdmin(true); setAdminPinInput(''); } else { alert('गलत पासवर्ड!'); } }} className="btn-emerald-pro text-white px-5 py-2.5 rounded-xl font-black">लॉगिन</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="recessed-grey-box p-3 text-emerald-950 font-black">✅ एडमिन मोड सक्रिय है।</div>
                <div className="space-y-1.5">
                  <span className="font-black text-slate-900">स्पैम नंबर ब्लॉक करें:</span>
                  <div className="flex gap-2">
                    <input type="tel" maxLength={10} placeholder="10 अंकों का नंबर" value={blockPhoneInput} onChange={(e) => setBlockPhoneInput(e.target.value)} className="flex-1 px-3 py-2 input-grey-sculpted rounded-xl font-extrabold" />
                    <button onClick={() => handleBlockPhone(blockPhoneInput)} className="bg-red-700 text-white px-4 py-2 rounded-xl font-black shadow">ब्लॉक</button>
                  </div>
                </div>
                <button onClick={() => setIsAdmin(false)} className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-black shadow">लॉगआउट</button>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="max-w-4xl mx-auto px-4 mt-12 text-center text-xs text-slate-900 relative z-10">
        <div className="panel-grey-sculpted py-4 px-6 inline-block">
          <p className="font-black text-slate-950 text-sm tracking-wide">Chandi Farm (चांदी फार्म) — सीधा किसान बाज़ार</p>
          <p className="mt-1 font-extrabold text-slate-800">संचालक: <strong className="text-emerald-900">विजय कुमार (Vijay Kumar)</strong> • MPG</p>
        </div>
      </footer>

      <AlenexaarienJSR />
    </div>
  );
}

// ==========================================================
// ALENEXAARIEN JSR - VOICE & TEXT AI ASSISTANT
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

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = getNaturalVoice(voices);
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.lang = 'hi-IN';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      const greeting = "नमस्ते किसान भाई! मैं Alenexaarien JSR हूँ। खेती-बाड़ी या फसल से जुड़े किसी भी सवाल के लिए मुझसे बात करें।";
      setMessages([{ sender: 'bot', text: greeting }]);
      setTimeout(() => speakText(greeting), 300);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('आपका ब्राउज़र बोलकर बात करने का समर्थन नहीं करता है।');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setInput(text);
      sendMessage(text);
    };
    recognition.start();
  };

  const sendMessage = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userText = textToSend.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    if (!customText) setInput('');
    setLoading(true);

    const systemPrompt = "तुम्हारा नाम 'Alenexaarien JSR' है। तुम किसानों के लिए एक बहुत स्मार्ट और मददगार AI असिस्टेंट हो। शुरुआत हमेशा हिंदी में करो। यूजर जिस भी भाषा में पूछे (हिंदी, मैथिली, भोजपुरी, अंग्रेजी आदि), उसी भाषा में तुरंत और सटीक जवाब दो। अगर कोई पूछे कि तुम्हें किसने बनाया है या तुम्हारा मालिक कौन है, तभी बताना कि 'मुझे विजय कुमार ने बनाया है।' बिना पूछे बार-बार निर्माता का जिक्र मत करना। Google, Gemini या OpenAI का नाम कभी मत लेना।";

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
      const reply = await res.text();
      const finalReply = reply || 'माफ़ करें, अभी उत्तर नहीं मिल पाया।';

      setMessages((prev) => [...prev, { sender: 'bot', text: finalReply }]);
      speakText(finalReply);
    } catch (err) {
      const errReply = 'नेटवर्क में थोड़ी दिक्कत है, कृपया दोबारा प्रयास करें।';
      setMessages((prev) => [...prev, { sender: 'bot', text: errReply }]);
      speakText(errReply);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '22px', right: '22px', zIndex: 9999, fontFamily: 'sans-serif' }}>
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          style={{
            background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
            color: '#fde047',
            padding: '14px 24px',
            borderRadius: '50px',
            border: '2px solid #eab308',
            boxShadow: '0 6px 0 #020617, 0 15px 30px rgba(0,0,0,0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '900',
            fontSize: '15px'
          }}
        >
          <span>🎙️ Alenexaarien JSR</span>
        </button>
      )}

      {isOpen && (
        <div style={{ width: '345px', height: '490px', background: 'linear-gradient(145deg, #e2e8f0, #cbd5e1)', borderRadius: '26px', boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 8px 0 #334155', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '2px solid #94a3b8' }}>
          <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '14px', background: 'linear-gradient(180deg, #fde047, #eab308)', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', boxShadow: '0 3px 0 #854d0e' }}>AJ</div>
              <div>
                <div style={{ fontWeight: '900', fontSize: '15px', color: '#fde047' }}>Alenexaarien JSR</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold' }}>{isSpeaking ? '🔊 बोल रहा है...' : '● किसान AI सहायक'}</div>
              </div>
            </div>
            <button onClick={() => { window.speechSynthesis?.cancel(); setIsOpen(false); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '50%', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>

          <div style={{ flex: 1, padding: '14px', overflowY: 'auto', backgroundColor: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.15)' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', background: m.sender === 'user' ? 'linear-gradient(180deg, #0f172a, #1e293b)' : 'linear-gradient(145deg, #f1f5f9, #e2e8f0)', color: m.sender === 'user' ? '#ffffff' : '#0f172a', padding: '11px 15px', borderRadius: '18px', maxWidth: '84%', fontSize: '14px', fontWeight: '700', lineHeight: '1.45', boxShadow: m.sender === 'user' ? '0 4px 0 #020617, 0 6px 12px rgba(0,0,0,0.2)' : '0 4px 0 #94a3b8, 0 6px 12px rgba(0,0,0,0.1)', whiteSpace: 'pre-wrap' }}>
                {m.text}
                {m.sender === 'bot' && (
                  <button onClick={() => speakText(m.text)} style={{ display: 'block', marginTop: '8px', background: '#cbd5e1', border: '1px solid #64748b', borderRadius: '8px', padding: '3px 10px', fontSize: '11px', cursor: 'pointer', color: '#0f172a', fontWeight: '900' }}>🔊 सुनें</button>
                )}
              </div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start', fontSize: '12px', color: '#0f172a', fontWeight: '900', padding: '6px' }}>✨ Alenexaarien JSR सोच रहा है...</div>}
            {isListening && <div style={{ alignSelf: 'center', fontSize: '12px', color: '#b91c1c', fontWeight: '900' }}>🎙️ बोलिए, मैं सुन रहा हूँ...</div>}
          </div>

          <div style={{ padding: '12px', borderTop: '2px solid #94a3b8', display: 'flex', gap: '8px', backgroundColor: '#e2e8f0', alignItems: 'center' }}>
            <button onClick={startListening} title="बोलकर पूछने के लिए दबाएं" style={{ background: isListening ? '#dc2626' : 'linear-gradient(180deg, #10b981, #047857)', color: 'white', border: 'none', borderRadius: '14px', padding: '11px 13px', cursor: 'pointer', boxShadow: '0 4px 0 #064e3b' }}><Mic className="w-4 h-4" /></button>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="हिंदी में पूछें..." style={{ flex: 1, padding: '11px', borderRadius: '14px', border: '1.5px solid #64748b', backgroundColor: '#f1f5f9', color: '#0f172a', fontSize: '14px', fontWeight: '800', outline: 'none' }} />
            <button onClick={() => sendMessage()} disabled={loading} style={{ background: 'linear-gradient(180deg, #0f172a, #1e293b)', color: '#fde047', border: 'none', borderRadius: '14px', padding: '11px 16px', cursor: 'pointer', fontWeight: '900', fontSize: '13px', boxShadow: '0 4px 0 #020617' }}>भेजें</button>
          </div>
        </div>
      )}
    </div>
  );
}
