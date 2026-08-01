import { useState } from 'react';
import { MapPin, Navigation, X, Check, Compass } from 'lucide-react';
import { senegalRegions } from '../data/locations';
import { getUserCoordinates, SENEGAL_LOCATION_COORDS } from '../utils/geolocation';
import toast from 'react-hot-toast';

const AroundMeModal = ({
  isOpen,
  onClose,
  activeUserCoords,
  setActiveUserCoords,
  selectedRadius,
  setSelectedRadius,
  selectedRegion,
  setSelectedRegion,
  selectedQuartier,
  setSelectedQuartier,
  onApply
}) => {
  const [locating, setLocating] = useState(false);

  if (!isOpen) return null;

  const handleAutoGeolocate = async () => {
    setLocating(true);
    try {
      const coords = await getUserCoordinates();
      setActiveUserCoords(coords);
      setSelectedRegion('GPS');
      setSelectedQuartier('Ma position GPS');
      toast.success("Position GPS détectée avec succès ! 🎯");
    } catch (_err) {
      toast.error("Impossible de vous géolocaliser. Choisissez votre quartier manuellement.");
    } finally {
      setLocating(false);
    }
  };

  const handleManualQuartierSelect = (regionName, quartierName) => {
    setSelectedRegion(regionName);
    setSelectedQuartier(quartierName);

    const key = (quartierName || regionName).toLowerCase();
    const coords = SENEGAL_LOCATION_COORDS[key] || SENEGAL_LOCATION_COORDS[regionName.toLowerCase()] || SENEGAL_LOCATION_COORDS["colobane"];
    setActiveUserCoords(coords);
  };

  const handleReset = () => {
    setActiveUserCoords(null);
    setSelectedRegion('');
    setSelectedQuartier('');
    setSelectedRadius(null);
    if (onApply) onApply(null, null);
    onClose();
  };

  const handleSave = () => {
    if (onApply) onApply(activeUserCoords, selectedRadius);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', zIndex: 2500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="animate-fade-in-up" style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Compass size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '900', margin: 0, fontFamily: 'var(--font-heading)' }}>
                Autour de moi 🎯
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Trouvez les annonces les plus proches de chez vous
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Bouton Géolocalisation GPS */}
        <button
          onClick={handleAutoGeolocate}
          disabled={locating}
          className="active-scale"
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            fontWeight: '800',
            fontSize: '0.98rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
            marginBottom: '20px'
          }}
        >
          <Navigation size={20} className={locating ? "spin" : ""} />
          {locating ? "Localisation en cours..." : "Me géolocaliser automatiquement (GPS)"}
        </button>

        {/* Rayon de recherche (Slider) */}
        <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>Rayon maximal de recherche :</span>
            <span style={{ fontWeight: '900', color: '#10B981', fontSize: '0.95rem' }}>
              {selectedRadius ? `${selectedRadius} km` : 'Tout le Sénégal'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[1, 5, 10, 25, 50, null].map((r) => (
              <button
                key={r || 'all'}
                onClick={() => setSelectedRadius(r)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '10px',
                  border: selectedRadius === r ? '2px solid #10B981' : '1px solid #CBD5E1',
                  background: selectedRadius === r ? '#ECFDF5' : 'white',
                  color: selectedRadius === r ? '#047857' : '#475569',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                {r ? `${r} km` : 'Tout'}
              </button>
            ))}
          </div>
        </div>

        {/* Sélection Manuelle par Région & Quartier */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '800', fontSize: '0.9rem', marginBottom: '8px' }}>
            Ou choisissez votre Quartier / Ville du Sénégal :
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => {
              const reg = e.target.value;
              setSelectedRegion(reg);
              const firstQ = senegalRegions[reg]?.[0] || '';
              handleManualQuartierSelect(reg, firstQ);
            }}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', fontSize: '0.95rem', marginBottom: '10px' }}
          >
            <option value="">-- Sélectionner une Région --</option>
            {Object.keys(senegalRegions).map((reg) => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>

          {selectedRegion && senegalRegions[selectedRegion] && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '140px', overflowY: 'auto', padding: '6px', background: '#F1F5F9', borderRadius: '12px' }}>
              {senegalRegions[selectedRegion].map((q) => (
                <button
                  key={q}
                  onClick={() => handleManualQuartierSelect(selectedRegion, q)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: selectedQuartier === q ? '2px solid #10B981' : '1px solid #CBD5E1',
                    background: selectedQuartier === q ? '#10B981' : 'white',
                    color: selectedQuartier === q ? 'white' : '#334155',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <MapPin size={12} />
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={handleReset}
            style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#64748B', fontWeight: '700', cursor: 'pointer' }}
          >
            Réinitialiser
          </button>
          <button
            onClick={handleSave}
            style={{ flex: 2, padding: '12px', borderRadius: '14px', border: 'none', background: 'var(--color-primary, #4F46E5)', color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Check size={18} />
            Appliquer le filtre
          </button>
        </div>

      </div>
    </div>
  );
};

export default AroundMeModal;
