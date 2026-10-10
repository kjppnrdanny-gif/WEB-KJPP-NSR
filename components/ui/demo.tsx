import React from 'react';
import { FAQ } from './faq-tabs';

export const FAQDemo = () => {
  const categories = {
    "legalitas": "Legalitas & Izin",
    "layanan": "Layanan Penilaian", 
    "psn": "PSN & Pertanahan",
    "prosedur": "Prosedur & Biaya",
    "cabang": "Jaringan Kantor"
  };

  const faqData = {
    "legalitas": [
      {
        question: "Apakah KJPP NSR berizin resmi Kementerian Keuangan RI?",
        answer: "Ya. KJPP Nanang Rahayu Sigit Paryanto & Rekan beroperasi di bawah Izin Usaha Kemenkeu RI No. 2.19.0160 (KMK No. 248/KM.1/2019) dan terdaftar di Otoritas Jasa Keuangan (OJK)."
      },
      {
        question: "Apakah laporan penilaian KJPP NSR diakui perbankan nasional?",
        answer: "Laporan opini nilai KJPP NSR diakui dan terdaftar sebagai rekanan resmi di perbankan nasional (Bank Mandiri, BRI, BCA, BNI, BSI, Bank DKI, dsb) untuk agunan kredit, sindikasi, dan audit."
      }
    ],
    "layanan": [
      {
        question: "Objek aset apa saja yang dapat dinilai oleh KJPP NSR?",
        answer: "Kami melayani Penilaian Properti (tanah, bangunan komersial, perumahan, instalasi pabrik, mesin & alat berat industri, perkebunan & aset biologis, serta studi kelayakan proyek & HBU)."
      },
      {
        question: "Apakah KJPP NSR melayani penilaian aset biologis & perkebunan?",
        answer: "Ya, kami memiliki tim spesialis penilai perkebunan kelapa sawit, karet, hutan tanaman industri, dan aset biologis berbasis PSAK 241 (SPI 304)."
      }
    ],
    "psn": [
      {
        question: "Apakah melayani pengadaan tanah PSN & Jalan Tol (SPI 204)?",
        answer: "Ya. KJPP NSR mengantongi Lisensi Penilai Pertanahan Kementerian ATR/BPN dengan pengalaman luas menilai ganti kerugian fisik dan non-fisik (solatium) sesuai UU No. 2/2012 dan SPI 204."
      }
    ],
    "prosedur": [
      {
        question: "Berapa lama proses penilaian aset dan apa syarat dokumennya?",
        answer: "Penyelesaian berkisar 3-7 hari kerja setelah site visit. Dokumen utama: fotokopi sertifikat kepemilikan (SHM/HGB), IMB/PBG, PBB terakhir, invoice/PO mesin, dan denah lokasi."
      },
      {
        question: "Bagaimana cara meminta surat penawaran biaya (RFP)?",
        answer: "Anda dapat mengirimkan rincian objek aset melalui formulir Minta Penawaran (RFP) di website atau langsung melalui kontak resmi WhatsApp admin kami."
      }
    ],
    "cabang": [
      {
        question: "Di mana saja lokasi kantor cabang KJPP NSR?",
        answer: "Kantor Pusat berada di Ragunan, Jakarta Selatan, dengan 4 Kantor Cabang berizin resmi di Bandung, Padang, Makassar, dan Palembang melayani seluruh wilayah Indonesia."
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <FAQ 
        title="Pertanyaan yang Sering Diajukan"
        subtitle="Panduan & Informasi Resmi"
        categories={categories}
        faqData={faqData}
      />
    </div>
  );
};

export default FAQDemo;
