"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import Map, { Marker } from 'react-map-gl';
import type { MapRef } from 'react-map-gl';
import { createClient } from '@supabase/supabase-js';
import 'mapbox-gl/dist/mapbox-gl.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface LguData {
  id?: number;
  name: string;
  official_name: string;
  role: string;
  contact: string;
  fb_link: string;
  photo_url?: string;
  lat: number;
  lng: number;
  category?: 'LCE' | 'NGA' | string;
}

const NIR_BOUNDS: [[number, number], [number, number]] = [
  [122.1, 8.9],
  [123.8, 11.1]
];

export default function MapComponent() {
  const mapRef = useRef<MapRef>(null);
  const [officialsData, setOfficialsData] = useState<LguData[]>([]);
  const [selectedLgu, setSelectedLgu] = useState<LguData | null>(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'LCE' | 'NGA'>('ALL');

  useEffect(() => {
    async function fetchOfficials() {
      const { data } = await supabase.from('lgus').select('*');
      if (data) setOfficialsData(data as LguData[]);
    }
    fetchOfficials();
  }, []);

  // Filter based on both category tab and search input
  const filteredLgus = useMemo(() => {
    return officialsData.filter(item => {
      const matchesCategory = 
        selectedCategory === 'ALL' || 
        (selectedCategory === 'NGA' && item.category === 'NGA') ||
        (selectedCategory === 'LCE' && item.category !== 'NGA');

      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.official_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.role.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [officialsData, selectedCategory, searchQuery]);

  const handleSelectLgu = (lgu: LguData) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    setSelectedLgu(lgu);
    
    if (lgu.lng && lgu.lat) {
      mapRef.current?.flyTo({
        center: [lgu.lng, lgu.lat],
        zoom: 10,
        duration: 1800
      });
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
      
      {/* Search & Filter Docked Panel */}
      <div style={{
        position: 'absolute', top: '20px', left: '20px', 
        width: '360px', zIndex: 20,
        background: 'white', borderRadius: '14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '18px', color: '#111827', fontWeight: 700 }}>L.I.N.K. NIR</h1>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
              {filteredLgus.length} pinned
            </span>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {(['ALL', 'LCE', 'NGA'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: selectedCategory === cat ? '#111827' : '#f3f4f6',
                  color: selectedCategory === cat ? 'white' : '#4b5563',
                  transition: 'background 0.2s'
                }}
              >
                {cat === 'ALL' ? 'All' : cat === 'LCE' ? 'Local Chiefs' : 'Agencies'}
              </button>
            ))}
          </div>

          <input 
            type="text" 
            placeholder="Search municipality, agency, or leader..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '8px',
              border: '1px solid #d1d5db', backgroundColor: '#f9fafb',
              fontSize: '14px', outline: 'none', color: '#111',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        {/* Search Results Dropdown */}
        {isSearchOpen && searchQuery && (
          <div style={{ maxHeight: '300px', overflowY: 'auto', borderTop: '1px solid #f3f4f6' }}>
            {filteredLgus.length > 0 ? (
              filteredLgus.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelectLgu(item)}
                  style={{
                    padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f9fafb',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.official_name}</div>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '3px 7px', borderRadius: '6px',
                    backgroundColor: item.category === 'NGA' ? '#dcfce7' : '#fee2e2',
                    color: item.category === 'NGA' ? '#15803d' : '#b91c1c'
                  }}>
                    {item.category === 'NGA' ? 'NGA' : 'LCE'}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: '14px', color: '#6b7280', fontSize: '13px', textAlign: 'center' }}>
                No matches found
              </div>
            )}
          </div>
        )}
      </div>

      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 122.95,
          latitude: 10.0,
          zoom: 6.8
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        maxBounds={NIR_BOUNDS}
        minZoom={5.5}
        maxZoom={14}
        renderWorldCopies={false}
        maxTileCacheSize={10}
        reuseMaps
      >
        {filteredLgus.map((lgu, index) => {
          const isNGA = lgu.category === 'NGA';
          const isSelected = selectedLgu?.name === lgu.name;

          return (
            lgu.lng && lgu.lat && (
              <Marker 
                key={index} 
                longitude={lgu.lng} 
                latitude={lgu.lat} 
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleSelectLgu(lgu);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  backgroundColor: isNGA ? '#059669' : '#dc2626', // Emerald for NGA, Red for LCE
                  border: '2px solid white',
                  borderRadius: isNGA ? '8px' : '50%', // Square-rounded for NGA, Round for LCE
                  boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
                  transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                  transition: 'transform 0.15s ease-in-out'
                }}>
                  {isNGA ? (
                    // Agency / Building Icon
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                      <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 2.84L18 11v7H6v-7l6-5.16zM9 13h2v4H9v-4zm4 0h2v4h-2v-4z"/>
                    </svg>
                  ) : (
                    // Official / Person Icon
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                </div>
              </Marker>
            )
          );
        })}
      </Map>

      {/* Official Detail Card */}
      {selectedLgu && (
        <div style={{
          position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
          background: 'white', padding: '20px', borderRadius: '16px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', width: '90%', maxWidth: '360px', zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                backgroundColor: selectedLgu.category === 'NGA' ? '#dcfce7' : '#fee2e2',
                color: selectedLgu.category === 'NGA' ? '#15803d' : '#b91c1c'
              }}>
                {selectedLgu.category === 'NGA' ? 'National Agency' : 'Local Government'}
              </span>
              <h2 style={{ margin: '8px 0 2px 0', fontSize: '19px', color: '#111' }}>{selectedLgu.name}</h2>
              <p style={{ margin: '0 0 14px 0', color: '#6b7280', fontSize: '13px', fontWeight: 500 }}>
                {selectedLgu.role}
              </p>
            </div>
            {selectedLgu.photo_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={selectedLgu.photo_url} 
                alt={selectedLgu.official_name} 
                style={{ width: '52px', height: '52px', borderRadius: '26px', objectFit: 'cover', border: '1px solid #e5e7eb' }} 
              />
            )}
            <button 
              onClick={() => setSelectedLgu(null)} 
              style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}
            >
              ×
            </button>
          </div>
          
          <div style={{ background: '#f9fafb', padding: '14px', borderRadius: '10px', marginBottom: '14px', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, marginBottom: '2px' }}>Appointee / Executive</div>
            <h3 style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '16px' }}>{selectedLgu.official_name}</h3>
            {selectedLgu.contact && (
              <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>{selectedLgu.contact}</p>
            )}
          </div>

          {selectedLgu.fb_link && (
            <a href={selectedLgu.fb_link} target="_blank" rel="noreferrer" style={{
              display: 'block', width: '100%', padding: '10px 0', background: '#1877F2', 
              color: 'white', textAlign: 'center', borderRadius: '8px', 
              textDecoration: 'none', fontWeight: 600, fontSize: '14px'
            }}>
              Official Social Page
            </a>
          )}
        </div>
      )}
    </div>
  );
}