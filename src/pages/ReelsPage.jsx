import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

import imageCompression from 'browser-image-compression';
import { TOP_REELS_SOUNDS } from '../data/reelsSounds';

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
  const [videoErrorMap, setVideoErrorMap] = useState({});
  const [imageSlideIndex, setImageSlideIndex] = useState({});
  const lastTapRef = useRef(0);
  const [doubleTapHeart, setDoubleTapHeart] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const containerRef = useRef(null);
  const videoRefs = useRef({});

  const handleVideoError = (productId) => {
    console.warn(`Video playback error for reel ${productId}, falling back to image.`);
    setVideoErrorMap(prev => ({ ...prev, [productId]: true }));
  };

  // Reel Express Modal State
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userReelCountThisMonth, setUserReelCountThisMonth] = useState(0);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showWaveModal, setShowWaveModal] = useState(false);
  const [reelTitle, setReelTitle] = useState('');
  const [reelPrice, setReelPrice] = useState('');
  const [reelPhone, setReelPhone] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [wavePhoneInput, setWavePhoneInput] = useState('');

  // Media Selection State (Video vs Photos)
  const [mediaMode, setMediaMode] = useState('video'); // 'video' | 'photos'
  const [reelVideoFile, setReelVideoFile] = useState(null);
  const [reelImageFiles, setReelImageFiles] = useState([]);
  const [reelMediaPreviews, setReelMediaPreviews] = useState([]);

  // Top Sounds State
  const [selectedSound, setSelectedSound] = useState(TOP_REELS_SOUNDS[0]);
  const [previewSoundId, setPreviewSoundId] = useState(null);
  const [customAudioFile, setCustomAudioFile] = useState(null);
  const [customAudioName, setCustomAudioName] = useState('');
  const previewAudioRef = useRef(null);
  const bgAudioRef = useRef(null);

  // 📹 Camera Recording State
  const MAX_RECORD_SECONDS = 60;
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTimeLeft, setRecordTimeLeft] = useState(MAX_RECORD_SECONDS);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'user' | 'environment'
  const cameraVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  // Auto-play background sound track when active Reel changes
  useEffect(() => {
    if (products.length === 0) return;
    const activeProduct = products[activeIndex];
    if (!activeProduct) return;

    const soundUrl = activeProduct.metadata?.sound_url;

    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
      bgAudioRef.current = null;
    }

    if (soundUrl && !isMuted) {
      const audio = new Audio(soundUrl);
      audio.loop = true;
      audio.play().catch(_e => {});
      bgAudioRef.current = audio;
    }

    return () => {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current = null;
      }
    };
  }, [activeIndex, products, isMuted]);

  // Auto-slideshow for image-based Reels
  useEffect(() => {
    if (products.length === 0) return;
    const activeProduct = products[activeIndex];
    if (!activeProduct) return;
    
    const rawVideoUrl = activeProduct.metadata?.video_url || (activeProduct.images?.[0] && activeProduct.images[0].match(/\.(mp4|mov|webm|m4v)$/i) ? activeProduct.images[0] : null);
    const isVideo = !!rawVideoUrl && !videoErrorMap[activeProduct.id];
    
    // Only auto-slide for image-based Reels with multiple images
    if (isVideo || !activeProduct.images || activeProduct.images.length <= 1) return;
    
    const interval = setInterval(() => {
      setImageSlideIndex(prev => {
        const currentIdx = prev[activeProduct.id] || 0;
        const nextIdx = (currentIdx + 1) % activeProduct.images.length;
        return { ...prev, [activeProduct.id]: nextIdx };
      });
    }, 3500); // Change image every 3.5 seconds
    
    return () => clearInterval(interval);
  }, [activeIndex, products, videoErrorMap]);

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
        currentVid.play().catch(() => {});
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
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      if (data && data.length > 0) {
        setProducts(data);

        // Charger les likes en 1 seule requête réseau au lieu de 30 requêtes individuelles
        const productIds = data.map(p => p.id);
        const { data: allFavs } = await supabase
          .from('favorites')
          .select('product_id, user_id')
          .in('product_id', productIds);

        const countsMap = {};
        const likedState = {};
        if (allFavs) {
          allFavs.forEach(f => {
            countsMap[f.product_id] = (countsMap[f.product_id] || 0) + 1;
            if (user && f.user_id === user.id) {
              likedState[f.product_id] = true;
            }
          });
        }
        setLikesCountMap(countsMap);
        setLikedMap(likedState);
      }
    } catch (err) {
      console.error('Error fetching reels:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("La vidéo ne doit pas dépasser 50 Mo.");
      return;
    }

    setReelVideoFile(file);
    const localUrl = URL.createObjectURL(file);
    setReelMediaPreviews([localUrl]);
    toast.success("📱 Vidéo chargée avec succès !");
  };

  const handleImagesUpload = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    if (files.length === 0) return;

    const oversized = files.some(f => f.size > 15 * 1024 * 1024);
    if (oversized) {
      toast.error("Chaque image ne doit pas dépasser 15 Mo.");
      return;
    }

    const localUrls = files.map(f => URL.createObjectURL(f));
    setReelImageFiles(files);
    setReelMediaPreviews(localUrls);
    toast.success(`🖼️ ${files.length} photo(s) chargée(s) avec succès !`);
  };

  const handleCustomAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error("L'audio ne doit pas dépasser 25 Mo.");
      return;
    }

    setCustomAudioFile(file);
    setCustomAudioName(file.name);
    const localUrl = URL.createObjectURL(file);
    setSelectedSound({
      id: 'custom_audio',
      title: `🎙️ ${file.name.replace(/\.[^/.]+$/, "").substring(0, 24)}`,
      artist: userProfile?.full_name || 'Vendeur Colobane',
      url: localUrl,
      icon: '🎙️'
    });
    toast.success("🎙️ Son audio / Voix-Off personnalisé chargé avec succès !");
  };

  // ═══════════════════════════════════════════
  // 📹 CAMERA RECORDING FUNCTIONS
  // ═══════════════════════════════════════════
  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true
      });
      mediaStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current.play().catch(() => {});
      }
      setIsCameraOpen(true);
      setRecordTimeLeft(MAX_RECORD_SECONDS);
      toast.success("📹 Caméra ouverte ! Appuyez sur le bouton rouge pour filmer.");
    } catch (err) {
      console.error('Camera error:', err);
      toast.error("Impossible d'accéder à la caméra. Vérifiez vos permissions.");
    }
  }, [cameraFacing]);

  const closeCamera = useCallback(() => {
    // Stop all tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    // Clear timer
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    // Reset recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (_) {}
    }
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    setIsCameraOpen(false);
    setIsRecording(false);
    setRecordTimeLeft(MAX_RECORD_SECONDS);
  }, []);

  const startRecording = useCallback(() => {
    if (!mediaStreamRef.current) return;

    recordedChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';
    const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      // Build the file from recorded chunks
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([blob], `reel-camera-${Date.now()}.${ext}`, { type: mimeType });

      if (file.size > 50 * 1024 * 1024) {
        toast.error("La vidéo filmée dépasse 50 Mo. Essayez une durée plus courte.");
        return;
      }

      // Use the same flow as handleVideoUpload
      setReelVideoFile(file);
      const localUrl = URL.createObjectURL(file);
      setReelMediaPreviews([localUrl]);
      setMediaMode('video');
      toast.success(`📹 Vidéo de ${MAX_RECORD_SECONDS - recordTimeLeft}s enregistrée !`);

      // Close camera after saving
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      setIsCameraOpen(false);
      setIsRecording(false);
    };

    recorder.start(200); // Collect data every 200ms
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordTimeLeft(MAX_RECORD_SECONDS);

    // Countdown timer
    recordTimerRef.current = setInterval(() => {
      setRecordTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-stop when time runs out
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [recordTimeLeft]);

  const stopRecording = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const flipCamera = useCallback(() => {
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);
    // Re-open camera with new facing
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
    }
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: newFacing, width: { ideal: 1080 }, height: { ideal: 1920 } },
      audio: true
    }).then(stream => {
      mediaStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current.play().catch(() => {});
      }
    }).catch(() => toast.error("Impossible de changer de caméra."));
  }, [cameraFacing]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  const handlePublishReelExpress = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Veuillez vous connecter pour publier un Reel.");
      navigate('/auth');
      return;
    }
    if (!reelTitle.trim()) {
      toast.error("Veuillez saisir un titre court pour le Reel.");
      return;
    }
    if (mediaMode === 'video' && !reelVideoFile) {
      toast.error("Veuillez choisir une vidéo MP4 / MOV.");
      return;
    }
    if (mediaMode === 'photos' && reelImageFiles.length === 0) {
      toast.error("Veuillez choisir au moins 1 photo (3 max).");
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

    setIsPublishing(true);
    toast.loading("Upload et publication de votre Reel en cours...", { id: 'reel-express' });
    try {
      let uploadedUrls = [];
      let isVideo = false;
      let videoUrl = null;
      let finalSoundUrl = selectedSound.url;

      if (customAudioFile) {
        const fileExt = customAudioFile.name.split('.').pop() || 'mp3';
        const fileName = `reel_sound_${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const { error: soundErr } = await supabase.storage.from('products').upload(filePath, customAudioFile, { upsert: true });
        if (!soundErr) {
          const { data: pubData } = supabase.storage.from('products').getPublicUrl(filePath);
          if (pubData?.publicUrl) {
            finalSoundUrl = pubData.publicUrl;
          }
        }
      }

      if (mediaMode === 'video' && reelVideoFile) {
        isVideo = true;
        const allowedVideoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
        const fileExt = (reelVideoFile.name.split('.').pop() || 'mp4').toLowerCase();
        if (!allowedVideoExts.includes(fileExt)) {
          toast.error('Format vidéo non supporté. Utilisez MP4, WebM ou MOV.');
          setIsPublishing(false);
          return;
        }
        const fileName = `reel_vid_${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const { error: uploadErr } = await supabase.storage.from('products').upload(filePath, reelVideoFile, { upsert: true });
        if (uploadErr) throw uploadErr;

        const { data: pubData } = supabase.storage.from('products').getPublicUrl(filePath);
        if (pubData?.publicUrl) {
          videoUrl = pubData.publicUrl;
          uploadedUrls = [pubData.publicUrl];
        }
      } else if (mediaMode === 'photos' && reelImageFiles.length > 0) {
        isVideo = false;
        const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true };
        for (const imgFile of reelImageFiles) {
          let compressed = imgFile;
          try {
            compressed = await imageCompression(imgFile, options);
          } catch (_e) {
            // Keep original if compression fails
          }
          const fileName = `reel_img_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.webp`;
          const filePath = `${user.id}/${fileName}`;
          const { error: uploadErr } = await supabase.storage.from('products').upload(filePath, compressed, { upsert: true });
          if (uploadErr) throw uploadErr;

          const { data: pubData } = supabase.storage.from('products').getPublicUrl(filePath);
          if (pubData?.publicUrl) {
            uploadedUrls.push(pubData.publicUrl);
          }
        }
      }

      const { data: inserted, error } = await supabase.from('products').insert([{
        seller_id: user.id,
        title: reelTitle.trim(),
        price: Number(reelPrice) || 0,
        category: 'reels_express',
        location: userProfile?.city || 'Dakar',
        images: uploadedUrls,
        metadata: {
          is_video: isVideo,
          video_url: videoUrl,
          is_reel_only: true,
          sound_id: selectedSound.id,
          sound_title: selectedSound.title,
          sound_artist: selectedSound.artist,
          sound_url: finalSoundUrl,
          contact_whatsapp: reelPhone || userProfile?.whatsapp_number || userProfile?.phone_number || ''
        },
        status: 'available',
        is_boosted: true
      }]).select('*').single();

      if (error) throw error;

      toast.success("🎬 Reel Express publié avec succès !", { id: 'reel-express' });
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewSoundId(null);
      setShowPublishModal(false);
      setReelTitle('');
      setReelPrice('');
      setReelVideoFile(null);
      setReelImageFiles([]);
      setReelMediaPreviews([]);
      fetchReelProducts();
      checkCurrentUser();
    } catch (err) {
      console.error('Publish reel error:', err);
      toast.error(err.message || "Erreur lors de la publication du Reel.", { id: 'reel-express' });
    } finally {
      setIsPublishing(false);
    }
  };


  // Handle background sound preview in modal
  const toggleSoundPreview = (sound) => {
    if (!sound.url) {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      setPreviewSoundId(null);
      return;
    }
    if (previewSoundId === sound.id) {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      setPreviewSoundId(null);
    } else {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      const audio = new Audio(sound.url);
      audio.play().catch(console.error);
      previewAudioRef.current = audio;
      setPreviewSoundId(sound.id);
      audio.onended = () => setPreviewSoundId(null);
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
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewSoundId(null);
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

  const toggleLike = async (productId) => {
    if (!user) {
      toast.error('Connectez-vous pour liker un Reel');
      navigate('/auth');
      return;
    }

    const wasLiked = likedMap[productId];
    // Optimistic update
    setLikedMap(prev => ({ ...prev, [productId]: !wasLiked }));
    setLikesCountMap(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + (wasLiked ? -1 : 1)
    }));

    try {
      if (wasLiked) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        if (error) throw error;
      } else {
        toast.success('Ajouté aux favoris ! ❤️', { duration: 2000 });
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Rollback on error
      setLikedMap(prev => ({ ...prev, [productId]: wasLiked }));
      setLikesCountMap(prev => ({
        ...prev,
        [productId]: (prev[productId] || 0) + (wasLiked ? 1 : -1)
      }));
      toast.error('Erreur lors du like');
    }
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

  const handleDeleteReel = async (reelId) => {
    if (!user) return;
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce Reel ? Cette action est définitive.")) {
      return;
    }
    const toastId = toast.loading("Suppression du Reel en cours...");
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', reelId);

      if (error) throw error;

      toast.dismiss(toastId);
      toast.success("🎬 Reel supprimé avec succès !");
      setProducts(prev => prev.filter(p => p.id !== reelId));
    } catch (err) {
      toast.dismiss(toastId);
      console.error("Erreur de suppression du Reel:", err);
      toast.error("Impossible de supprimer ce Reel pour le moment.");
    }
  };

  const handleMediaTap = (e, product, isVideo) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap - LIKE
      e.preventDefault();
      if (!likedMap[product.id]) {
        toggleLike(product.id);
      }
      setDoubleTapHeart({ x: e.clientX || e.touches?.[0]?.clientX || window.innerWidth / 2, y: e.clientY || e.touches?.[0]?.clientY || window.innerHeight / 2 });
      setTimeout(() => setDoubleTapHeart(null), 900);
    } else {
      // Single tap
      if (isVideo) {
        togglePlayPause();
      } else if (product.images && product.images.length > 1) {
        setImageSlideIndex(prev => {
          const currentIdx = prev[product.id] || 0;
          const nextIdx = (currentIdx + 1) % product.images.length;
          return { ...prev, [product.id]: nextIdx };
        });
      }
    }
    lastTapRef.current = now;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        height: '100dvh',
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

  if (!loading && products.length === 0) {
    return (
      <div style={{ minHeight: '100vh', height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎬</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem' }}>Aucun Reel pour le moment</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '2rem' }}>Soyez le premier à publier un Reel !</p>
        <button onClick={() => setShowPublishModal(true)} style={{ padding: '12px 28px', background: 'var(--primary, #8a1c1c)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer' }}>📹 Créer un Reel</button>
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
      <style>{`
        @keyframes heartBurst {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
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
          minHeight: '100vh',
          height: '100dvh',
          width: '100vw',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {products.map((product, idx) => {
          const rawVideoUrl = product.metadata?.video_url || (product.images?.[0] && product.images[0].match(/\.(mp4|mov|webm|m4v)$/i) ? product.images[0] : null);
          const isVideoSupported = !!rawVideoUrl && !videoErrorMap[product.id];
          const videoSrc = isVideoSupported ? rawVideoUrl : null;
          const isVideo = isVideoSupported;
          const mainImg = product.images?.[0] || '/hero.png';
          const isLiked = likedMap[product.id];
          const likesCount = likesCountMap[product.id] || 15;
          const boutiqueName = product.profiles?.boutique_name || product.profiles?.full_name || 'Vendeur Colobane';

          return (
            <div
              key={product.id}
              style={{
                minHeight: '100vh',
                height: '100dvh',
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
                onClick={(e) => handleMediaTap(e, product, isVideo)}
                style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor: 'pointer' }}
              >
                {isVideo ? (
                  idx === activeIndex ? (
                    <video
                      ref={el => (videoRefs.current[idx] = el)}
                      src={videoSrc}
                      poster={mainImg}
                      autoPlay
                      loop
                      muted={isMuted || !!product.metadata?.sound_url}
                      playsInline
                      preload="auto"
                      onError={() => handleVideoError(product.id)}
                      onWaiting={() => setIsBuffering(true)}
                      onPlaying={() => setIsBuffering(false)}
                      onCanPlay={() => setIsBuffering(false)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (idx === activeIndex + 1 || idx === activeIndex - 1) ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${mainImg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px) brightness(0.35)', transform: 'scale(1.2)' }} />
                      <img
                        src={mainImg}
                        alt={product.title}
                        loading="lazy"
                        style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', zIndex: 2 }}
                      />
                      <video
                        src={videoSrc}
                        preload="auto"
                        muted
                        playsInline
                        style={{ display: 'none' }}
                      />
                    </div>
                  ) : (
                    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${mainImg})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px) brightness(0.35)', transform: 'scale(1.2)' }} />
                      <img
                        src={mainImg}
                        alt={product.title}
                        loading="lazy"
                        style={{
                          position: 'relative',
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          zIndex: 2
                        }}
                      />
                    </div>
                  )
                ) : (
                  <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Arrière-plan flou d'ambiance */}
                    <div 
                      style={{ 
                        position: 'absolute', 
                        inset: 0, 
                        backgroundImage: `url(${product.images?.[imageSlideIndex[product.id] || 0] || mainImg})`, 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center', 
                        filter: 'blur(30px) brightness(0.35)', 
                        transform: 'scale(1.25)',
                        transition: 'background-image 0.8s ease-in-out'
                      }} 
                    />
                    {/* Images with crossfade */}
                    {(product.images || [mainImg]).map((imgUrl, imgIdx) => (
                      <img
                        key={imgIdx}
                        src={imgUrl}
                        alt={`${product.title} ${imgIdx + 1}`}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: `translate(-50%, -50%) scale(${(imageSlideIndex[product.id] || 0) === imgIdx && idx === activeIndex ? 1.04 : 1})`,
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          zIndex: (imageSlideIndex[product.id] || 0) === imgIdx ? 3 : 2,
                          opacity: (imageSlideIndex[product.id] || 0) === imgIdx ? 1 : 0,
                          transition: 'opacity 0.8s ease-in-out, transform 8s ease-out',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
                        }}
                      />
                    ))}
                    {/* Dot indicators for multiple images */}
                    {product.images && product.images.length > 1 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '120px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '6px',
                        zIndex: 10
                      }}>
                        {product.images.map((_, dotIdx) => (
                          <div
                            key={dotIdx}
                            style={{
                              width: (imageSlideIndex[product.id] || 0) === dotIdx ? '20px' : '8px',
                              height: '8px',
                              borderRadius: '4px',
                              background: (imageSlideIndex[product.id] || 0) === dotIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageSlideIndex(prev => ({ ...prev, [product.id]: dotIdx }));
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
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

                {/* Double-tap heart animation */}
                {doubleTapHeart && idx === activeIndex && (
                  <div style={{
                    position: 'fixed',
                    left: doubleTapHeart.x - 40,
                    top: doubleTapHeart.y - 40,
                    fontSize: '80px',
                    zIndex: 9999,
                    pointerEvents: 'none',
                    animation: 'heartBurst 0.9s ease-out forwards'
                  }}>❤️</div>
                )}

                {/* Buffering spinner */}
                {isBuffering && isVideo && idx === activeIndex && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 20,
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      border: '3px solid rgba(255,255,255,0.2)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
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

                {/* Bouton Publier Reel Direct */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!user) {
                      toast.error('Connectez-vous pour publier un Reel.');
                      navigate('/auth');
                    } else {
                      setShowPublishModal(true);
                    }
                  }}
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
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    boxShadow: '0 4px 16px rgba(225, 29, 72, 0.5)',
                    border: '2px solid rgba(255, 255, 255, 0.8)'
                  }}>
                    ➕
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#FFF', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>Publier</span>
                </button>

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

                {/* Owner / Admin Delete Reel Button */}
                {(product.seller_id === user?.id || userProfile?.is_admin) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReel(product.id);
                    }}
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
                      background: 'rgba(225, 29, 72, 0.9)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      boxShadow: '0 4px 16px rgba(225, 29, 72, 0.5)'
                    }}>
                      🗑️
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#FFD1D1', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>Supprimer</span>
                  </button>
                )}

                {/* Spinning Music Vinyl Disk Icon */}
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #18181B 0%, #27272A 100%)',
                  border: '3px solid rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
                  animation: isPlaying && !isMuted ? 'spin 3s linear infinite' : 'none',
                  marginTop: '4px'
                }}>
                  💿
                </div>
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
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>📍 {product.location || 'Dakar'}</span>
                  <span>•</span>
                  <span>👁️ {product.views_count || 120} vues</span>
                </div>

                {/* Music Track Ticker Banner */}
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#F43F5E',
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(6px)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '12px',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  <span>🎵</span> {product.metadata?.sound_title || 'Son d\'origine de la vidéo 🎤'}
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
                onClick={() => {
                  if (previewAudioRef.current) {
                    previewAudioRef.current.pause();
                    previewAudioRef.current = null;
                  }
                  setPreviewSoundId(null);
                  setShowPublishModal(false);
                }}
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
              {/* Media Mode Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#E4E4E7' }}>
                  📱 Type de Média du Reel *
                </label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaMode('video');
                      setReelImageFiles([]);
                      setReelMediaPreviews([]);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '12px',
                      border: mediaMode === 'video' ? '2px solid #E11D48' : '1px solid #3F3F46',
                      background: mediaMode === 'video' ? 'rgba(225, 29, 72, 0.15)' : '#27272A',
                      color: mediaMode === 'video' ? '#F43F5E' : '#A1A1AA',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    🎥 Vidéo MP4 / MOV
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMediaMode('photos');
                      setReelVideoFile(null);
                      setReelMediaPreviews([]);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '12px',
                      border: mediaMode === 'photos' ? '2px solid #E11D48' : '1px solid #3F3F46',
                      background: mediaMode === 'photos' ? 'rgba(225, 29, 72, 0.15)' : '#27272A',
                      color: mediaMode === 'photos' ? '#F43F5E' : '#A1A1AA',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    📸 Photos (1 à 3)
                  </button>
                </div>

                {/* 📹 Filmer Direct Button */}
                <button
                  type="button"
                  onClick={openCamera}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    border: '2px dashed #E11D48',
                    background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.12), rgba(168, 85, 247, 0.12))',
                    color: '#F43F5E',
                    fontWeight: 800,
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    marginBottom: '12px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{ fontSize: '22px' }}>📹</span>
                  <span>Filmer Direct mon Reel (60s max)</span>
                </button>

                {/* ═══ CAMERA RECORDING OVERLAY ═══ */}
                {isCameraOpen && (
                  <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 99999,
                    background: '#000',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Camera Preview */}
                    <video
                      ref={cameraVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none'
                      }}
                    />

                    {/* Top Bar */}
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0,
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
                      zIndex: 2
                    }}>
                      {/* Close Button */}
                      <button
                        onClick={closeCamera}
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px', height: '40px',
                          color: '#FFF',
                          fontSize: '20px',
                          cursor: 'pointer',
                          backdropFilter: 'blur(8px)'
                        }}
                      >✕</button>

                      {/* Timer Display */}
                      <div style={{
                        background: isRecording ? 'rgba(225, 29, 72, 0.85)' : 'rgba(0,0,0,0.5)',
                        padding: '8px 18px',
                        borderRadius: '25px',
                        color: '#FFF',
                        fontSize: '18px',
                        fontWeight: 800,
                        fontVariantNumeric: 'tabular-nums',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backdropFilter: 'blur(8px)'
                      }}>
                        {isRecording && (
                          <span style={{
                            width: '10px', height: '10px',
                            background: '#FF0000',
                            borderRadius: '50%',
                            animation: 'pulse 1s infinite'
                          }} />
                        )}
                        <span>{recordTimeLeft}s</span>
                        <span style={{ fontSize: '11px', opacity: 0.7 }}>/ 60s</span>
                      </div>

                      {/* Flip Camera */}
                      <button
                        onClick={flipCamera}
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px', height: '40px',
                          color: '#FFF',
                          fontSize: '18px',
                          cursor: 'pointer',
                          backdropFilter: 'blur(8px)'
                        }}
                      >🔄</button>
                    </div>

                    {/* Progress Bar */}
                    {isRecording && (
                      <div style={{
                        position: 'absolute',
                        top: '76px',
                        left: '16px', right: '16px',
                        height: '4px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                        zIndex: 3,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, #E11D48, #A855F7)',
                          borderRadius: '4px',
                          width: `${((60 - recordTimeLeft) / 60) * 100}%`,
                          transition: 'width 1s linear'
                        }} />
                      </div>
                    )}

                    {/* Bottom Controls */}
                    <div style={{
                      position: 'absolute',
                      bottom: '40px',
                      left: 0, right: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px',
                      zIndex: 2
                    }}>
                      {/* Record / Stop Button */}
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          style={{
                            width: '80px', height: '80px',
                            borderRadius: '50%',
                            border: '5px solid rgba(255,255,255,0.8)',
                            background: '#E11D48',
                            cursor: 'pointer',
                            boxShadow: '0 0 30px rgba(225, 29, 72, 0.6)',
                            transition: 'transform 0.2s'
                          }}
                        />
                      ) : (
                        <button
                          onClick={stopRecording}
                          style={{
                            width: '80px', height: '80px',
                            borderRadius: '50%',
                            border: '5px solid rgba(255,255,255,0.8)',
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <div style={{
                            width: '30px', height: '30px',
                            borderRadius: '6px',
                            background: '#E11D48'
                          }} />
                        </button>
                      )}

                      <div style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '13px',
                        fontWeight: 600,
                        textShadow: '0 1px 4px rgba(0,0,0,0.8)'
                      }}>
                        {isRecording ? '⏹ Appuyez pour arrêter' : '🔴 Appuyez pour filmer'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Sounds Music Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#E4E4E7' }}>
                    🎵 Musique & Sons Tendances (22 sons)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                    {TOP_REELS_SOUNDS.map((sound) => {
                      const isSelected = selectedSound.id === sound.id;
                      const isPreviewing = previewSoundId === sound.id;
                      return (
                        <div
                          key={sound.id}
                          onClick={() => {
                            setSelectedSound(sound);
                            setCustomAudioFile(null);
                            setCustomAudioName('');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: '12px',
                            background: isSelected ? 'rgba(225, 29, 72, 0.18)' : '#27272A',
                            border: isSelected ? '1.5px solid #E11D48' : '1px solid #3F3F46',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <span style={{ fontSize: '18px' }}>{sound.icon}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#F43F5E' : '#FFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {sound.title}
                              </div>
                              <div style={{ fontSize: '11px', color: '#A1A1AA' }}>{sound.artist}</div>
                            </div>
                          </div>

                          {sound.url && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSoundPreview(sound);
                              }}
                              style={{
                                background: isPreviewing ? '#E11D48' : 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: '#FFF',
                                padding: '6px 10px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                            >
                              {isPreviewing ? '⏸️ Stop' : '▶️ Ecouter'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Audio Upload Button */}
                  <div style={{ marginTop: '10px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: customAudioFile ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                      border: customAudioFile ? '1.5px solid #10B981' : '1px dashed #52525B',
                      color: customAudioFile ? '#10B981' : '#E4E4E7',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                      <span>🎙️</span>
                      <span>{customAudioName ? `Son chargé : ${customAudioName}` : 'Ou importer un MP3 / Voix off (Optionnel)'}</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleCustomAudioUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
                <div style={{
                  border: '2px dashed rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  {mediaMode === 'video' ? (
                    <>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                      {reelMediaPreviews[0] ? (
                        <div>
                          <video src={reelMediaPreviews[0]} style={{ maxHeight: '140px', borderRadius: '12px', marginBottom: '8px' }} controls />
                          <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700 }}>✓ Vidéo prête pour le Reel</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '28px', marginBottom: '4px' }}>📲</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Cliquez pour choisir une vidéo</div>
                          <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>MP4, MOV, WebM (Max 50 Mo)</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImagesUpload}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                      {reelMediaPreviews.length > 0 ? (
                        <div>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                            {reelMediaPreviews.map((url, i) => (
                              <img key={i} src={url} alt="" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E11D48' }} />
                            ))}
                          </div>
                          <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700 }}>✓ {reelMediaPreviews.length} photo(s) prête(s) pour le Reel</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '28px', marginBottom: '4px' }}>🖼️</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Cliquez pour choisir 1 à 3 photos</div>
                          <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>JPG, PNG, WebP (Max 3 photos)</div>
                        </div>
                      )}
                    </>
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
                disabled={isPublishing}
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
