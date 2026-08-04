import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const ReelsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showTapIndicator, setShowTapIndicator] = useState(false);
  const [tapIcon, setTapIcon] = useState('⏸️');
  const [likedMap, setLikedMap] = useState({});
  const [likesCountMap, setLikesCountMap] = useState({});
  const containerRef = useRef(null);
  const videoRefs = useRef({});

  // Reel Express Modal State
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userReelCountThisMonth, setUserReelCountThisMonth] = useState(0);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showWaveModal, setShowWaveModal] = useState(false);
  const [reelTitle, setReelTitle] = useState('');
  const [reelPrice, setReelPrice] = useState('');
  const [reelVideoUrl, setReelVideoUrl] = useState('');
  const [reelPhone, setReelPhone] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [wavePhoneInput, setWavePhoneInput] = useState('');

  // Demo videos fallbacks in case products don't have video files yet
  const sampleVideos = [
    'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-pink-outfit-41348-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-young-woman-holding-a-smartphone-41484-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-modern-smartphone-41477-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-stylish-woman-in-a-leather-jacket-41350-large.mp4',
  ];

  useEffect(() => {
    fetchReelProducts();
    checkCurrentUser();
  }, []);

  // Keyboard navigation for web
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showPublishModal || showWaveModal) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeIndex < products.length - 1) {
          const nextIndex = activeIndex + 1;
          setActiveIndex(nextIndex);
          if (containerRef.current) {
            containerRef.current.scrollTo({ top: nextIndex * containerRef.current.clientHeight, behavior: 'smooth' });
          }
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeIndex > 0) {
          const prevIndex = activeIndex - 1;
          setActiveIndex(prevIndex);
          if (containerRef.current) {
            containerRef.current.scrollTo({ top: prevIndex * containerRef.current.clientHeight, behavior: 'smooth' });
          }
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, products.length, showPublishModal, showWaveModal]);

  const togglePlayPause = () => {
    const currentVid = videoRefs.current[activeIndex];
    if (currentVid) {
      if (currentVid.paused) {
        currentVid.play();
        setIsPlaying(true);
        triggerTapFeedback('▶️');
      } else {
        currentVid.pause();
        setIsPlaying(false);
        triggerTapFeedback('⏸️');
      }
    }
  };

  const triggerTapFeedback = (icon) => {
    setTapIcon(icon);
    setShowTapIndicator(true);
    setTimeout(() => setShowTapIndicator(false), 700);
  };

  const checkCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setUserProfile(profile);
          setReelPhone(profile.whatsapp_number || profile.phone_number || '');
          setWavePhoneInput(profile.phone_number || profile.whatsapp_number || '');
        }

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', user.id)
          .gte('created_at', startOfMonth.toISOString());

        setUserReelCountThisMonth(count || 0);
      }
    } catch (err) {
      console.error('Error fetching user for reels:', err);
    }
  };

  const fetchReelProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          price,
          location,
          images,
          metadata,
          views_count,
          is_boosted,
          created_at,
          seller_id,
          profiles:seller_id (
            id,
            full_name,
            boutique_name,
            phone_number,
            avatar_url,
            is_verified
          )
        `)
        .order('is_boosted', { ascending: false })
        .order('views_count', { ascending: false })
        .limit(12);

      if (error) throw error;

      if (data && data.length > 0) {
        setProducts(data);
        const initialLikes = {};
        data.forEach(p => {
          initialLikes[p.id] = Math.floor(Math.random() * 45) + 12;
        });
        setLikesCountMap(initialLikes);
      }
    } catch (err) {
      console.error('Error fetching reels:', err);
    } finally {
      setLoading(false);
    }
  };

  const [reelMediaFile, setReelMediaFile] = useState(null);

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Le fichier vidéo ne doit pas dépasser 50 Mo.");
      return;
    }

    setReelMediaFile(file);
    const localUrl = URL.createObjectURL(file);
    setReelVideoUrl(localUrl);
    toast.success("📱 Média vidéo chargé avec succès !");
  };

  const handlePublishReelExpress = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Veuillez vous connecter pour publier un Reel.");
      navigate('/auth');
      return;
    }
    if (!reelVideoUrl) {
      toast.error("Veuillez importer votre vidéo ou 3 photos.");
      return;
    }
    if (!reelTitle.trim()) {
      toast.error("Veuillez saisir un titre court pour le Reel.");
      return;
    }

    const plan = userProfile?.subscription_plan || 'free';
    const isVip = plan === 'premium' || userProfile?.account_type === 'vip';
    const isPro = plan === 'basique' || userProfile?.account_type === 'pro' || userProfile?.account_type === 'boutique';

    // Quota Verification
    if (!isVip) {
      if (isPro && userReelCountThisMonth >= 3) {
        toast.error("Quota atteint (3 Reels/mois sur votre forfait Pro). Soumettez l'option Boost à 1 500 F pour publier ce Reel supplémentaire.", { duration: 6000 });
        setShowWaveModal(true);
        return;
      } else if (!isPro) {
        toast.error("Forfait Gratuit : L'option Boost Reel 1 500 FCFA (7 jours) est requise pour publier votre vidéo.", { duration: 6000 });
        setShowWaveModal(true);
        return;
      }
    }

    // VIP or Pro under 3 count -> Instant live publish
    setIsPublishing(true);
    toast.loading("Upload et publication de votre Reel...", { id: 'reel-express' });
    try {
      let finalVideoUrl = reelVideoUrl;

      // Upload actual File to Supabase Storage if local file selected
      if (reelMediaFile) {
        const fileExt = reelMediaFile.name.split('.').pop() || 'mp4';
        const fileName = `reel_${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const { error: uploadErr } = await supabase.storage.from('products').upload(filePath, reelMediaFile, { upsert: true });
        if (uploadErr) throw uploadErr;

        const { data: pubData } = supabase.storage.from('products').getPublicUrl(filePath);
        if (pubData?.publicUrl) {
          finalVideoUrl = pubData.publicUrl;
        }
      }

      const { data: inserted, error } = await supabase.from('products').insert([{
        seller_id: user.id,
        title: reelTitle.trim(),
        price: Number(reelPrice) || 0,
        category: 'reels_express',
        location: userProfile?.city || 'Dakar',
        images: [finalVideoUrl],
        metadata: {
          video_url: finalVideoUrl,
          is_reel_only: true,
          contact_whatsapp: reelPhone || userProfile?.whatsapp_number || userProfile?.phone_number || ''
        },
        status: 'available',
        is_boosted: true
      }]).select('*').single();

      if (error) throw error;

      toast.success("🎬 Reel Express publié avec succès ! Retrouvez-le en direct dans le flux.", { id: 'reel-express' });
      setShowPublishModal(false);
      setReelTitle('');
      setReelPrice('');
      setReelVideoUrl('');
      setReelMediaFile(null);
      fetchReelProducts();
      checkCurrentUser();
    } catch (err) {
      console.error('Publish reel error:', err);
      toast.error(err.message || "Erreur lors de la publication du Reel.", { id: 'reel-express' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleConfirmWavePayment = async () => {
    if (!wavePhoneInput.trim()) {
      toast.error("Veuillez saisir le numéro de téléphone utilisé pour le transfert Wave.");
      return;
    }

    try {
      toast.loading("Demande de validation Boost Reel 1 500F en cours...", { id: 'wave' });
      await supabase.from('payment_requests').insert([{
        user_id: user.id,
        plan_type: 'boost_reel_7j',
        amount: 1500,
        phone_used: wavePhoneInput.trim(),
        status: 'pending'
      }]);

      const adminNumber = "221773713175";
      const msg = encodeURIComponent(`👑 Demande Boost Reel 1 500F !\nClient: ${userProfile?.full_name || user.id}\nTitre: ${reelTitle}\nNuméro Wave: ${wavePhoneInput.trim()}\nVeuillez valider le déblocage du Reel.`);
      window.open(`https://wa.me/${adminNumber}?text=${msg}`, '_blank');

      toast.success("Demande transmise à l'administrateur ! Votre Reel 7 jours sera publié sous peu.", { id: 'wave', duration: 6000 });
      setShowWaveModal(false);
      setShowPublishModal(false);
    } catch (err) {
      toast.error("Erreur lors de la transmission.", { id: 'wave' });
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const height = containerRef.current.clientHeight;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / height);
    if (index !== activeIndex && index >= 0 && index < products.length) {
      setActiveIndex(index);
    }
  };

  const toggleLike = (productId) => {
    setLikedMap(prev => {
      const isLiked = !prev[productId];
      setLikesCountMap(l => ({
        ...l,
        [productId]: (l[productId] || 10) + (isLiked ? 1 : -1)
      }));
      if (isLiked) toast.success('Ajouté aux favoris ! ❤️');
      return { ...prev, [productId]: isLiked };
    });
  };

  const handleWhatsAppContact = (product) => {
    const rawPhone = product.metadata?.contact_whatsapp || product.profiles?.phone_number || '221773713175';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`;
    const priceText = product.price ? `${Number(product.price).toLocaleString('fr-FR')} FCFA` : 'Sur demande';
    const boutiqueName = product.profiles?.boutique_name || product.profiles?.full_name || 'Vendeur';

    const text = encodeURIComponent(
      `Bonjour ${boutiqueName} ! 👋\nJe souhaite commander votre produit vu sur le Reel "${product.title}" (${priceText}) sur Colobane Market !\nEst-il disponible pour une livraison rapide ? 🚚`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  const handleShare = async (product) => {
    const url = `${window.location.origin}/product/${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Découvre "${product.title}" sur Colobane Market !`,
          url: url,
        });
      } catch (_e) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Lien copié dans le presse-papier ! 🔗');
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        background: '#09090B',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(255,255,255,0.1)',
          borderTop: '4px solid #E11D48',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ marginTop: '16px', fontWeight: 600, color: '#A1A1AA' }}>
          Chargement des Reels Colobane... 🎥
        </p>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000000',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {/* Top Header Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)',
        zIndex: 100
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/');
          }}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#FFFFFF',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            fontSize: '18px'
          }}
        >
          ✕
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(225, 29, 72, 0.35)',
          border: '1px solid rgba(225, 29, 72, 0.6)',
          padding: '6px 16px',
          borderRadius: '20px',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: '14px',
          backdropFilter: 'blur(8px)'
        }}>
          <span>🎥</span> Reels Dakar
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPublishModal(true);
            }}
            className="active-scale"
            style={{
              background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '20px',
              fontWeight: 800,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(225,29,72,0.4)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <span>➕</span> Publier Reel
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#FFFFFF',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              fontSize: '18px'
            }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Snap Scroll Reels Feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: '100vh',
          width: '100vw',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {products.map((product, idx) => {
          const mainImg = product.images?.[0] || '/hero.png';
          const videoSrc = product.metadata?.video_url || product.video_url || sampleVideos[idx % sampleVideos.length];
          const isLiked = likedMap[product.id];
          const likesCount = likesCountMap[product.id] || 15;
          const boutiqueName = product.profiles?.boutique_name || product.profiles?.full_name || 'Vendeur Colobane';

          return (
            <div
              key={product.id}
              style={{
                height: '100vh',
                width: '100vw',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                position: 'relative',
                background: '#09090B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Media Player: Video if active, animated image fallback */}
              <div 
                onClick={togglePlayPause}
                style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor: 'pointer' }}
              >
                {idx === activeIndex ? (
                  <video
                    ref={el => (videoRefs.current[idx] = el)}
                    src={videoSrc}
                    poster={mainImg}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <img
                    src={mainImg}
                    alt={product.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'brightness(0.85)'
                    }}
                  />
                )}

                {/* Tap Feedback Animation Indicator */}
                {showTapIndicator && idx === activeIndex && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    zIndex: 40,
                    pointerEvents: 'none',
                    animation: 'pulse 0.4s ease-out'
                  }}>
                    {tapIcon}
                  </div>
                )}

                {/* Dark gradient overlays */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%)',
                  pointerEvents: 'none'
                }} />
              </div>

              {/* Floating Action Bar (Right Side) */}
              <div style={{
                position: 'absolute',
                right: '16px',
                bottom: '120px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                zIndex: 20
              }}>
                {/* Seller Avatar */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetSellerId = product.seller_id || product.profiles?.id;
                    if (targetSellerId) {
                      navigate(`/boutique/${targetSellerId}`);
                    } else {
                      navigate('/boutiques');
                    }
                  }}
                  style={{
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  <img
                    src={product.profiles?.avatar_url || mainImg}
                    alt=""
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      border: '2px solid #E11D48',
                      objectFit: 'cover'
                    }}
                  />
                  {product.profiles?.is_verified && (
                    <span style={{
                      position: 'absolute',
                      bottom: '-4px',
                      right: '-4px',
                      background: '#10B981',
                      color: '#FFF',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      ✓
                    </span>
                  )}
                </div>

                {/* Like Button */}
                <button
                  onClick={() => toggleLike(product.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: isLiked ? 'rgba(225, 29, 72, 0.9)' : 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}>
                    {isLiked ? '❤️' : '🤍'}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{likesCount}</span>
                </button>

                {/* WhatsApp Button */}
                <button
                  onClick={() => handleWhatsAppContact(product)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#25D366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    boxShadow: '0 4px 16px rgba(37, 211, 102, 0.4)'
                  }}>
                    💬
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>WhatsApp</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={() => handleShare(product)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    🔗
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Partager</span>
                </button>
              </div>

              {/* Bottom Glassmorphic Product Overlay */}
              <div style={{
                position: 'absolute',
                left: '16px',
                right: '80px',
                bottom: '30px',
                zIndex: 20,
                color: '#FFFFFF'
              }}>
                {/* Badges */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #09090B 0%, #BE123C 100%)',
                    color: '#FFFFFF',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    border: '1px solid rgba(244, 63, 94, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🎬 REEL PRO DAAR
                  </span>
                  {product.profiles?.is_verified && (
                    <span style={{
                      background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                      color: '#FFFFFF',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 800
                    }}>
                      🛡️ BOUTIQUE CERTIFIÉE
                    </span>
                  )}
                  {product.is_boosted && (
                    <span style={{
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      color: '#000000',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 800
                    }}>
                      👑 SPONSORISÉ
                    </span>
                  )}
                </div>

                {/* Boutique & Title */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetSellerId = product.seller_id || product.profiles?.id;
                    if (targetSellerId) {
                      navigate(`/boutique/${targetSellerId}`);
                    } else {
                      navigate('/boutiques');
                    }
                  }}
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#F43F5E',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '4px'
                  }}
                >
                  <span>🏬 {boutiqueName}</span>
                </div>

                <h2 style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  margin: '0 0 6px 0',
                  lineHeight: '1.2',
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                }}>
                  {product.title}
                </h2>

                <div style={{
                  fontSize: '13px',
                  color: '#A1A1AA',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>📍 {product.location || 'Dakar'}</span>
                  <span>•</span>
                  <span>👁️ {product.views_count || 120} vues</span>
                </div>

                {/* Price & Dual CTA Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    color: '#10B981',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                    whiteSpace: 'nowrap'
                  }}>
                    {Number(product.price).toLocaleString()} FCFA
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWhatsAppContact(product);
                    }}
                    style={{
                      flex: 1.2,
                      minWidth: '130px',
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      padding: '10px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>💬 Commander</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${product.id}`);
                    }}
                    style={{
                      flex: 1,
                      minWidth: '90px',
                      background: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      padding: '10px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🛒 Voir</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: Publier un Reel Express */}
      {showPublishModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#18181B',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            color: '#FFFFFF',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🎬</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Publier un Reel Express</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#A1A1AA' }}>Affichage exclusif dans le flux vidéo Reels</p>
                </div>
              </div>
              <button
                onClick={() => setShowPublishModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            {/* Quota Info Banner */}
            <div style={{
              background: userProfile?.subscription_plan === 'premium' || userProfile?.account_type === 'vip'
                ? 'linear-gradient(135deg, rgba(234,179,8,0.2) 0%, rgba(202,138,4,0.1) 100%)'
                : userProfile?.subscription_plan === 'basique' || userProfile?.account_type === 'pro' || userProfile?.account_type === 'boutique'
                ? 'linear-gradient(135deg, rgba(225,29,72,0.2) 0%, rgba(190,18,60,0.1) 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#F43F5E' }}>
                  {userProfile?.subscription_plan === 'premium' || userProfile?.account_type === 'vip'
                    ? '👑 VIP : Reels Illimités inclus'
                    : userProfile?.subscription_plan === 'basique' || userProfile?.account_type === 'pro' || userProfile?.account_type === 'boutique'
                    ? `🔥 Forfait Pro : ${userReelCountThisMonth} / 3 Reels utilisés ce mois-ci`
                    : '⚡ Compte Gratuit'}
                </div>
                <div style={{ fontSize: '11px', color: '#D4D4D8', marginTop: '2px' }}>
                  {userProfile?.subscription_plan === 'premium' || userProfile?.account_type === 'vip'
                    ? 'Publication vidéo instantanée sans limite'
                    : userProfile?.subscription_plan === 'basique' || userProfile?.account_type === 'pro' || userProfile?.account_type === 'boutique'
                    ? (userReelCountThisMonth < 3 ? 'Inclus dans votre forfait mensuel' : 'Quota mensuel atteint -> Option Boost 1 500F')
                    : 'Boost Reel disponible à 1 500 FCFA / 7 jours'}
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handlePublishReelExpress} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Media Uploader */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#E4E4E7' }}>
                  📱 Importer une Vidéo MP4 (ou 3 photos max) *
                </label>
                <div style={{
                  border: '2px dashed rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    accept="video/*,image/*"
                    onChange={handleMediaUpload}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                  {isUploadingMedia ? (
                    <div style={{ color: '#F43F5E', fontWeight: 700 }}>Chargement de la vidéo en cours...</div>
                  ) : reelVideoUrl ? (
                    <div>
                      <video src={reelVideoUrl} style={{ maxHeight: '140px', borderRadius: '12px', marginBottom: '8px' }} controls />
                      <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700 }}>✓ Fichier vidéo prêt pour le Reel</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '28px', marginBottom: '4px' }}>📲</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Cliquez pour choisir une vidéo depuis votre téléphone</div>
                      <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>MP4, MOV, WebM (Max 50 Mo)</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#E4E4E7' }}>
                  📝 Titre court du Reel *
                </label>
                <input
                  type="text"
                  placeholder="ex: Robe de soirée disponible à la boutique !"
                  value={reelTitle}
                  onChange={(e) => setReelTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#27272A',
                    border: '1px solid #3F3F46',
                    color: '#FFF',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#E4E4E7' }}>
                  💰 Prix (FCFA)
                </label>
                <input
                  type="number"
                  placeholder="ex: 15000"
                  value={reelPrice}
                  onChange={(e) => setReelPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#27272A',
                    border: '1px solid #3F3F46',
                    color: '#FFF',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#E4E4E7' }}>
                  📱 Téléphone WhatsApp de contact
                </label>
                <input
                  type="tel"
                  placeholder="77 000 00 00"
                  value={reelPhone}
                  onChange={(e) => setReelPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#27272A',
                    border: '1px solid #3F3F46',
                    color: '#FFF',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isPublishing || isUploadingMedia}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                  border: 'none',
                  color: '#FFF',
                  fontWeight: 800,
                  fontSize: '15px',
                  cursor: isPublishing ? 'wait' : 'pointer',
                  marginTop: '10px',
                  boxShadow: '0 4px 16px rgba(225, 29, 72, 0.4)'
                }}
              >
                {isPublishing ? 'Publication en cours...' : '🚀 Publier le Reel Express'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Paiement Wave Boost Reel (Non-Abonnés ou Quota Dépassé) */}
      {showWaveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#18181B',
            border: '1px solid #E11D48',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            color: '#FFFFFF',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>⚡</div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Boost Reel 1 500 FCFA</h3>
            <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '6px 0 16px 0' }}>
              Activez la diffusion de votre Reel pendant <strong>7 jours (1 semaine)</strong> sur le marché.
            </p>

            <div style={{ background: 'rgba(30, 64, 175, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '14px', borderRadius: '16px', marginBottom: '16px', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', color: '#93C5FD', fontWeight: 700, marginBottom: '4px' }}>📲 Mode de règlement Wave :</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFF' }}>1. Transférez 1 500 FCFA au : <strong>77 371 31 75</strong></div>
              <div style={{ fontSize: '12px', color: '#D4D4D8', marginTop: '4px' }}>2. Indiquez votre numéro ci-dessous après l'envoi.</div>
            </div>

            <input
              type="tel"
              placeholder="Numéro utilisé pour le paiement (ex: 77...)"
              value={wavePhoneInput}
              onChange={(e) => setWavePhoneInput(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                background: '#27272A',
                border: '1px solid #3F3F46',
                color: '#FFF',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '16px'
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowWaveModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', fontWeight: 700 }}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmWavePayment}
                style={{ flex: 2, padding: '12px', borderRadius: '12px', background: '#10B981', border: 'none', color: '#FFF', fontWeight: 800 }}
              >
                ✓ Valider paiement 1 500 F
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReelsPage;
