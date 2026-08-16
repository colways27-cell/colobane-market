import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductImageSlider({ images, alt, style }) {
  const [activeImage, setActiveImage] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 40;

  const validImages = images && images.length > 0 ? images : ['/hero.png'];

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = (e) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeImage < validImages.length - 1) {
      e.preventDefault();
      e.stopPropagation();
      setActiveImage(a => a + 1);
    }
    if (isRightSwipe && activeImage > 0) {
      e.preventDefault();
      e.stopPropagation();
      setActiveImage(a => a - 1);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeImage > 0) setActiveImage(a => a - 1);
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeImage < validImages.length - 1) setActiveImage(a => a + 1);
  };

  return (
    <div 
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ ...style, position: 'relative', overflow: 'hidden', touchAction: 'pan-y' }}
    >
      <img 
        src={validImages[activeImage]} 
        alt={alt} 
        loading="lazy" 
        decoding="async"
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
      
      {/* Navigation arrows for desktop/clicks */}
      {validImages.length > 1 && activeImage > 0 && (
        <div 
          onClick={handlePrev}
          style={{ position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', borderRadius: '50%', padding: '2px', cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={16} color="#000" />
        </div>
      )}
      
      {validImages.length > 1 && activeImage < validImages.length - 1 && (
        <div 
          onClick={handleNext}
          style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', borderRadius: '50%', padding: '2px', cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronRight size={16} color="#000" />
        </div>
      )}

      {/* Dots indicator */}
      {validImages.length > 1 && (
        <div style={{ position: 'absolute', bottom: '6px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '4px', zIndex: 10 }}>
          {validImages.slice(0, 5).map((_, i) => (
            <div key={i} style={{ width: i === activeImage ? '6px' : '4px', height: i === activeImage ? '6px' : '4px', borderRadius: '50%', background: i === activeImage ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.6)', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />
          ))}
        </div>
      )}
    </div>
  );
}
