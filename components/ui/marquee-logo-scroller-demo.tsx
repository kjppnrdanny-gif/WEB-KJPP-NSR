import React, { useState } from 'react';
import { MarqueeLogoScroller, type Logo } from './marquee-logo-scroller';

export const globalTechPartners: Logo[] = [
  {
    src: 'https://cdn.21st.dev/assets/mirror/2b/2b87e7cd0c48dbf324666f347340afc1156fc86a466021e480ac9c288c618fd6.svg',
    alt: 'Procure',
    gradient: { from: '#668CFF', via: '#0049FF', to: '#003199' },
  },
  {
    src: 'https://cdn.21st.dev/assets/mirror/86/86e19afda708cead229b714d25de147ef0b920cfea807c5b2933b30d17a234db.svg',
    alt: 'Clerk',
    gradient: { from: '#FFE766', via: '#FFCE00', to: '#B38F00' },
  },
  {
    src: 'https://cdn.21st.dev/assets/mirror/60/60a4c31343f8356ecbaaee324bd6253deacd8a6c27c3fe33f06ecc59ed4bd164.svg',
    alt: 'Blender',
    gradient: { from: '#6690F0', via: '#255BE3', to: '#193B99' },
  },
  {
    src: 'https://cdn.21st.dev/assets/mirror/5b/5bcdea3417293412845b8298fe357fce3b192e8ff112d9b3fef315bc5cd127f6.svg',
    alt: 'Figma',
    gradient: { from: '#C4C2FF', via: '#9896FF', to: '#5B4DCC' },
  },
  {
    src: 'https://cdn.21st.dev/assets/mirror/d3/d3f7f94d90089fd318a2649807d5d57cf353affcf9d4cd2c5d373062822cf507.svg',
    alt: 'Mocha',
    gradient: { from: '#FF66A1', via: '#FF007A', to: '#B3005A' },
  },
  {
    src: 'https://cdn.21st.dev/assets/mirror/59/59c903cc3c11f4fc63286675a5460bbaa5c80643acf85c3dd2394b27ab00eaf5.svg',
    alt: 'Layers',
    gradient: { from: '#D9FF5A', via: '#AFFF01', to: '#7A9900' },
  },
  {
    src: 'https://cdn.21st.dev/assets/mirror/e3/e314a1d65f5035bdcebb84ed740ed0341cc5ba15ecf22fa2c1b10d39fbe18880.svg',
    alt: 'Google Cloud',
    gradient: { from: '#8AA7FF', via: '#5F86FF', to: '#3A5ACC' },
  },
  {
    src: 'https://cdn.21st.dev/assets/mirror/19/192d4671a23e40c7deb8fb16c48970e27f116a6ca5cc648eb6e3b366f5c8dd6d.svg',
    alt: 'Framer',
    gradient: { from: '#67F0D1', via: '#2AE5B9', to: '#1B8F72' },
  },
];

export const nsrIndonesianPartners: Logo[] = [
  {
    name: 'BCA (Bank Central Asia)',
    alt: 'BCA',
    src: '/images/logos/bca.svg',
    gradient: { from: '#003893', via: '#0060DF', to: '#002060' },
  },
  {
    name: 'Bank BRI',
    alt: 'Bank BRI',
    src: '/images/logos/bri.svg',
    gradient: { from: '#00529C', via: '#0073E6', to: '#F37021' },
  },
  {
    name: 'Bank Mandiri',
    alt: 'Bank Mandiri',
    src: '/images/logos/mandiri.svg',
    gradient: { from: '#002D62', via: '#0C4A8E', to: '#F5A623' },
  },
  {
    name: 'Bank BNI 46',
    alt: 'Bank BNI',
    src: '/images/logos/bni.svg',
    gradient: { from: '#005E6A', via: '#008290', to: '#F15A24' },
  },
  {
    name: 'Bank BTN',
    alt: 'Bank BTN',
    src: '/images/logos/btn.svg',
    gradient: { from: '#002C6C', via: '#00529C', to: '#ED1C24' },
  },
  {
    name: 'Bank BJB',
    alt: 'Bank BJB',
    src: '/images/logos/bjb.svg',
    gradient: { from: '#005596', via: '#0074B7', to: '#F7941D' },
  },
  {
    name: 'Bank Danamon',
    alt: 'Bank Danamon',
    src: '/images/logos/danamon.svg',
    gradient: { from: '#004B87', via: '#0072CE', to: '#F37021' },
  },
  {
    name: 'Bank DKI',
    alt: 'Bank DKI',
    src: '/images/logos/bank-dki.svg',
    gradient: { from: '#C8102E', via: '#E02444', to: '#1E293B' },
  },
  {
    name: 'Otoritas Jasa Keuangan (OJK)',
    alt: 'OJK',
    src: '/images/logos/ojk.png',
    gradient: { from: '#8B0000', via: '#C41230', to: '#E67E22' },
  },
  {
    name: 'Pertamina',
    alt: 'Pertamina',
    src: '/images/logos/pertamina.svg',
    gradient: { from: '#0B286D', via: '#00783E', to: '#ED1B2D' },
  },
  {
    name: 'PLN (Persero)',
    alt: 'PLN',
    src: '/images/logos/pln.svg',
    gradient: { from: '#0072CE', via: '#0093DD', to: '#FFCC00' },
  },
  {
    name: 'Kementerian ATR / BPN',
    alt: 'ATR BPN',
    src: '/images/logos/atr-bpn.png',
    gradient: { from: '#453210', via: '#855E10', to: '#D4AF37' },
  },
  {
    name: 'Kemenkeu RI',
    alt: 'Kemenkeu',
    src: '/images/logos/kemenkeu.svg',
    gradient: { from: '#0B1B4F', via: '#1E3A8A', to: '#F59E0B' },
  },
  {
    name: 'Semen Indonesia (SIG)',
    alt: 'SIG',
    src: '/images/logos/sig.svg',
    gradient: { from: '#8B0000', via: '#C00000', to: '#FF4B4B' },
  },
  {
    name: 'Bio Farma',
    alt: 'Bio Farma',
    src: '/images/logos/bio-farma.svg',
    gradient: { from: '#046A38', via: '#0D9488', to: '#2DD4BF' },
  },
  {
    name: 'Holding Perkebunan Nusantara (PTPN)',
    alt: 'PTPN',
    src: '/images/logos/ptpn.png',
    gradient: { from: '#064E3B', via: '#15803D', to: '#4ADE80' },
  },
  {
    name: 'Waskita Karya',
    alt: 'Waskita Karya',
    src: '/images/logos/waskita.svg',
    gradient: { from: '#1E3A8A', via: '#0284C7', to: '#F59E0B' },
  },
  {
    name: 'Adhi Karya',
    alt: 'Adhi Karya',
    src: '/images/logos/adhi-karya.png',
    gradient: { from: '#1D4ED8', via: '#2563EB', to: '#EF4444' },
  },
];

export const MarqueeLogoScrollerDemo = () => {
  const [speed, setSpeed] = useState<'normal' | 'slow' | 'fast'>('normal');
  const [activeTab, setActiveTab] = useState<'global' | 'nsr'>('global');

  return (
    <div className="bg-background min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-2 bg-secondary rounded-xl border">
        <button
          onClick={() => setActiveTab('global')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'global' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
          }`}
        >
          Global Tech
        </button>
        <button
          onClick={() => setActiveTab('nsr')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'nsr' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
          }`}
        >
          KJPP NSR Partners
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          onClick={() => setSpeed('normal')}
          className={`px-2.5 py-1 rounded text-xs ${speed === 'normal' ? 'bg-sky-600 text-white font-bold' : 'text-muted-foreground'}`}
        >
          Normal (40s)
        </button>
        <button
          onClick={() => setSpeed('slow')}
          className={`px-2.5 py-1 rounded text-xs ${speed === 'slow' ? 'bg-sky-600 text-white font-bold' : 'text-muted-foreground'}`}
        >
          Slow (80s)
        </button>
        <button
          onClick={() => setSpeed('fast')}
          className={`px-2.5 py-1 rounded text-xs ${speed === 'fast' ? 'bg-sky-600 text-white font-bold' : 'text-muted-foreground'}`}
        >
          Fast (15s)
        </button>
      </div>

      {/* Component Instance */}
      {activeTab === 'global' ? (
        <MarqueeLogoScroller
          title="Trusted by Businesses Worldwide"
          description="Founders, developers, and business leaders across the globe chose us for their digital asset operations."
          logos={globalTechPartners}
          speed={speed}
        />
      ) : (
        <MarqueeLogoScroller
          title="Dipercaya Lembaga Keuangan & Korporasi Nasional"
          description="Mitra independen penilaian properti dan pengadaan tanah kepentingan umum berizin resmi OJK dan Kementerian ATR/BPN."
          logos={nsrIndonesianPartners}
          speed={speed}
          badge="Rekanan Resmi"
        />
      )}
    </div>
  );
};

export default MarqueeLogoScrollerDemo;
