import React from 'react';
import { 
  FileText, 
  FileCheck2, 
  ShieldAlert, 
  Calculator, 
  FolderLock, 
  Clock, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface PortalCardProps {
  id: string;
  title: string;
  description: string;
  badge?: {
    text: string;
    variant: 'amber' | 'rose' | 'teal' | 'indigo' | 'emerald';
  };
  icon: React.ReactNode;
  iconBg: string;
  href: string;
  btnText: string;
  btnVariant?: 'primary' | 'secondary' | 'dark';
}

export const PortalCard: React.FC<PortalCardProps> = ({
  id,
  title,
  description,
  badge,
  icon,
  iconBg,
  href,
  btnText,
  btnVariant = 'secondary'
}) => {
  const getBadgeClasses = (variant: string) => {
    switch (variant) {
      case 'rose':
        return 'bg-rose-950/60 text-rose-400 border-rose-800/60';
      case 'amber':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'teal':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  const getBtnClasses = (variant: string) => {
    switch (variant) {
      case 'primary':
        return 'text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-amber-400/20';
      case 'dark':
        return 'text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700';
      default:
        return 'text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-750 border-slate-700';
    }
  };

  return (
    <div
      id={id}
      className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 md:p-4 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md group"
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl border flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform ${iconBg}`}>
            {icon}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug line-clamp-2">
                {title}
              </h4>
              {badge && (
                <span className={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase shrink-0 ${getBadgeClasses(badge.variant)}`}>
                  {badge.text}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-normal line-clamp-1 mt-0.5">
              {description}
            </p>
          </div>
        </div>
        <a
          href={href}
          className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-all shrink-0 inline-flex items-center gap-1 shadow-sm cursor-pointer active:scale-95 ${getBtnClasses(btnVariant)}`}
        >
          <span>{btnText}</span>
        </a>
      </div>
    </div>
  );
};

export const DashboardView: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Portal Terpadu Operasional KJPP NSR
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Sistem Ekosistem Manajemen Penilaian, Kendali Mutu SPM, dan Kepatuhan Regulasi Kemenkeu RI.
        </p>
      </div>

      {/* 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* ROW 1 */}
        <PortalCard
          id="kartu-penugasan-wrapper"
          title="Lingkup Penugasan & Job Order (JO)"
          description="Sistem Otomasi SPK, Surat Representasi & 7 Dokumen Bundel JO"
          icon={<FileText className="w-5 h-5 text-indigo-400" />}
          iconBg="bg-indigo-500/20 border-indigo-500/30"
          href="portal-penugasan-jo.html"
          btnText="Masuk Portal ↗"
        />

        <PortalCard
          id="box-card-nolap"
          title="Portal Nomor Laporan (NoLap)"
          description="Registrasi 7 Segmen Kemenkeu & SPM Mitigasi"
          icon={<FileCheck2 className="w-5 h-5 text-sky-400" />}
          iconBg="bg-sky-500/20 border-sky-500/30"
          href="portal-nolap.html"
          btnText="Masuk Portal ↗"
        />

        {/* ROW 2 */}
        <PortalCard
          id="kartu-kwitansi-wrapper"
          title="Portal Kwitansi & Keuangan"
          description="Draf Tagihan Cabang & Verifikasi Keuangan Pusat"
          icon={<Calculator className="w-5 h-5 text-amber-400" />}
          iconBg="bg-amber-500/20 border-amber-500/30"
          href="portal-kwitansi.html"
          btnText="Masuk Portal ↗"
        />

        <PortalCard
          id="kartu-e-operasional"
          title="Portal Biaya Operasional"
          description="Pengajuan Survey, Meeting & Beban Umum Kantor"
          badge={{ text: 'MEJA APPROVAL 3 TINGKAT', variant: 'emerald' }}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          iconBg="bg-emerald-500/20 border-emerald-500/30"
          href="portal-operasional.html"
          btnText="Masuk Portal ↗"
        />

        {/* ROW 3 */}
        <PortalCard
          id="kartu-surat-umum"
          title="Buku Agenda Surat Umum (SU)"
          description="Penomoran Surat Keluar Resmi & Arsip Drive"
          badge={{ text: 'PUSAT', variant: 'amber' }}
          icon={<FileText className="w-5 h-5 text-yellow-400" />}
          iconBg="bg-yellow-500/20 border-yellow-500/30"
          href="portal-surat-umum.html"
          btnText="Masuk Portal ↗"
        />

        <PortalCard
          id="kartu-sop-wrapper"
          title="Folder Dokumen & SOP Cabang"
          description="Format Laporan, Template & SOP Internal"
          icon={<FolderLock className="w-5 h-5 text-violet-400" />}
          iconBg="bg-violet-500/20 border-violet-500/30"
          href="javascript:void(0)"
          btnText="Buka Dokumen ↗"
        />

        {/* ROW 4 - LEFT COLUMN: MANAJEMEN PENUGASAN (7-MILESTONE) */}
        <PortalCard
          id="kartu-tracking-wrapper"
          title="Manajemen Penugasan (7-Milestone)"
          description="Registrasi SPK, Penunjukan Tim & Kendali Mutu SPM"
          badge={{ text: 'MULTI-PERAN', variant: 'amber' }}
          icon={<CheckCircle2 className="w-5 h-5 text-amber-400" />}
          iconBg="bg-amber-500/20 border-amber-500/30"
          href="portal-tracking.html"
          btnText="Buka Task Board ↗"
          btnVariant="primary"
        />

        {/* ROW 4 - RIGHT COLUMN: MODUL BARU PORTAL TECHNICAL REVIEW & QA */}
        <PortalCard
          id="kartu-qa-review-wrapper"
          title="Portal Technical Review & QA Laporan"
          description="Upload Draf Laporan PDF, Audit Kepatuhan SPI/KEPI, Red Flag Scanner (#REF!) & Rekonsiliasi Nilai..."
          badge={{ text: 'SPM & SPI CHECK', variant: 'rose' }}
          icon={<ShieldAlert className="w-5 h-5 text-cyan-400" />}
          iconBg="bg-cyan-950/40 border-cyan-800/50"
          href="portal-qa-review.html"
          btnText="Review Dokumen ↗"
          btnVariant="dark"
        />

        {/* ROW 5 - FULL WIDTH: PRESENSI KEHADIRAN ONLINE */}
        <div className="md:col-span-2">
          <PortalCard
            id="kartu-presensi-wrapper"
            title="Presensi Kehadiran Online"
            description="Presensi Kehadiran, Titik WFH & Layanan Cuti"
            icon={<Clock className="w-5 h-5 text-teal-400" />}
            iconBg="bg-teal-500/20 border-teal-500/30"
            href="portal-presensi.html"
            btnText="Buka Form ↗"
          />
        </div>
      </div>
    </section>
  );
};

export default DashboardView;
