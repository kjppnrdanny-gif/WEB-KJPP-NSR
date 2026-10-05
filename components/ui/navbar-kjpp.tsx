'use client';

import * as React from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { 
  Building2, 
  Briefcase, 
  MapPin, 
  Scale, 
  FileText, 
  ShieldCheck, 
  Award,
  Layers,
  PhoneCall,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface ListItemProps extends React.ComponentPropsWithoutRef<'li'> {
  title: string;
  href: string;
  icon?: React.ReactNode;
}

function ListItem({ title, children, href, icon, ...props }: ListItemProps) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <a
          href={href}
          className="group block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-all duration-200 hover:bg-slate-800/80 hover:text-white focus:bg-slate-800/80 focus:text-white"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100 group-hover:text-amber-400">
            {icon && <span className="text-amber-400 shrink-0">{icon}</span>}
            <span>{title}</span>
          </div>
          <p className="line-clamp-2 text-xs leading-snug text-slate-400 group-hover:text-slate-300">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
}

export function NavbarKJPP() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-xl">
      {/* Top Bar Informasi Kantor */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 text-slate-300 text-xs py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Izin Kemenkeu No. 2.19.0160
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-400">Terdaftar OJK & Lisensi BPN</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">Hotline: (021) 7884-9996</span>
            <a href="mailto:kjppnr.danny@gmail.com" className="hover:text-amber-400 transition">kjppnr.danny@gmail.com</a>
          </div>
        </div>
      </div>

      {/* Main Navbar Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <a href="#profil" className="flex items-center gap-3 group shrink-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 border border-amber-400/40 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:border-amber-400 transition duration-300">
            <span className="font-black text-amber-400 text-base tracking-wider">NSR</span>
          </div>
          <div>
            <div className="font-black text-white text-base tracking-tight leading-none group-hover:text-amber-300 transition">
              KJPP NANANG RAHAYU & REKAN
            </div>
            <p className="text-[11px] text-amber-400/90 font-medium tracking-wide mt-0.5">
              Penilai Publik & Konsultan Properti Terlisensi
            </p>
          </div>
        </a>

        {/* NavigationMenu Primitive Bar (Desktop) */}
        <nav className="hidden lg:flex items-center">
          <NavigationMenu viewport={true}>
            <NavigationMenuList className="gap-1 text-slate-200">
              
              {/* 1. Profil & Visi Misi */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white data-[state=open]:bg-slate-800 data-[state=open]:text-amber-400 text-xs font-bold uppercase tracking-wider">
                  Tentang Kami
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-slate-900 border border-slate-700/80 shadow-2xl rounded-2xl p-4 text-slate-200">
                  <ul className="grid gap-3 md:w-[500px] lg:w-[600px] lg:grid-cols-[.85fr_1.15fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-xl bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 border border-blue-900/60 p-6 no-underline outline-none hover:border-amber-500/50 transition-all duration-300 group"
                          href="#profil"
                        >
                          <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div className="text-base font-extrabold text-white group-hover:text-amber-300 transition">
                            KJPP NSR Berizin Resmi
                          </div>
                          <p className="text-xs leading-relaxed text-slate-300 mt-1.5">
                            Melayani penilaian properti, bisnis, dan pengadaan tanah jalan tol di seluruh Negara Kesatuan Republik Indonesia dengan standar KEPI & SPI.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="#visi-misi" title="Visi & Misi" icon={<Award className="w-4 h-4" />}>
                      Landasan filosofis, integritas moral, dan komitmen mutu pelayanan publik.
                    </ListItem>
                    <ListItem href="#sistem-mutu" title="Sistem Mutu & QA Cloud" icon={<Layers className="w-4 h-4" />}>
                      Technical Review berjenjang dan administrasi digital terintegrasi pusat-cabang.
                    </ListItem>
                    <ListItem href="#galeri" title="Galeri Kegiatan" icon={<Sparkles className="w-4 h-4" />}>
                      Dokumentasi inspeksi lapangan, diklat SPI 204, dan raker nasional.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* 2. Layanan Penilaian */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white data-[state=open]:bg-slate-800 data-[state=open]:text-amber-400 text-xs font-bold uppercase tracking-wider">
                  Layanan & SPI
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-slate-900 border border-slate-700/80 shadow-2xl rounded-2xl p-4 text-slate-200">
                  <ul className="grid w-[500px] gap-2 md:w-[600px] md:grid-cols-2">
                    <ListItem href="#layanan" title="Penilaian Properti Komersial" icon={<Building2 className="w-4 h-4" />}>
                      Gedung perkantoran, perhotelan, mall, apartemen, pelabuhan, dan pabrik.
                    </ListItem>
                    <ListItem href="#layanan" title="Penilaian Agunan Bank" icon={<Briefcase className="w-4 h-4" />}>
                      Valuasi jaminan kredit perbankan sesuai regulasi OJK & standar SPI.
                    </ListItem>
                    <ListItem href="#pengadaan-tanah" title="Pengadaan Tanah PSN (SPI 204)" icon={<Scale className="w-4 h-4" />}>
                      Ganti kerugian wajar proyek strategis nasional, jalan tol, dan bendungan.
                    </ListItem>
                    <ListItem href="#layanan" title="Studi Kelayakan & Konsultansi" icon={<FileText className="w-4 h-4" />}>
                      Feasibility study, analisa Highest and Best Use (HBU), dan advisory aset.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* 3. Manajemen & Cabang */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white data-[state=open]:bg-slate-800 data-[state=open]:text-amber-400 text-xs font-bold uppercase tracking-wider">
                  Kantor & Cabang
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-slate-900 border border-slate-700/80 shadow-2xl rounded-2xl p-4 text-slate-200">
                  <div className="p-2 mb-2 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Jaringan Nasional KJPP NSR</span>
                    <a href="#manajemen" className="text-[11px] text-sky-400 hover:underline flex items-center gap-1">
                      <span>Lihat 5 Kantor</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <ul className="grid w-[450px] gap-1 md:w-[550px] md:grid-cols-2">
                    <ListItem href="#manajemen" title="Kantor Pusat Jakarta" icon={<MapPin className="w-4 h-4 text-amber-400" />}>
                      Jl. Hankam No. 5, Ragunan, Pasar Minggu, Jakarta Selatan.
                    </ListItem>
                    <ListItem href="#manajemen" title="Cabang Bandung" icon={<MapPin className="w-4 h-4 text-sky-400" />}>
                      Komplek Mustika Hegar Regency, Margasari, Buahbatu.
                    </ListItem>
                    <ListItem href="#manajemen" title="Cabang Padang" icon={<MapPin className="w-4 h-4 text-teal-400" />}>
                      Jl. Gajah Mada No. 40-C, Alai Parak Kopi, Padang Utara.
                    </ListItem>
                    <ListItem href="#manajemen" title="Cabang Makassar" icon={<MapPin className="w-4 h-4 text-indigo-400" />}>
                      Jl. Danau Mahalona No. 102, Tanjung Merdeka, Tamalate.
                    </ListItem>
                    <ListItem href="#manajemen" title="Cabang Palembang" icon={<MapPin className="w-4 h-4 text-amber-400" />}>
                      Komplek Griya Hero Abadi Maskarebet, Alang-alang Lebar.
                    </ListItem>
                    <ListItem href="#manajemen" title="Personil & Tim Ahli" icon={<Award className="w-4 h-4 text-emerald-400" />}>
                      29+ Tenaga penilai teregistrasi RMK Kemenkeu & bersertifikat MAPPI.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Direct Links */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <a href="#pengalaman" className="bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-bold uppercase tracking-wider">
                    Portofolio
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <a href="#rekanan" className="bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-bold uppercase tracking-wider">
                    Mitra Bank & BUMN
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <a href="#kontak" className="bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-bold uppercase tracking-wider">
                    Kontak
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>

            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        {/* Action Buttons: RFP & Portal */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="#kontak"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm whitespace-nowrap"
          >
            <span>Minta Penawaran</span>
            <span>&rarr;</span>
          </a>

          <a
            href="https://portal.kjppnanangrahayu.com"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase tracking-tight shadow-md hover:shadow-amber-400/20 transition whitespace-nowrap flex items-center gap-1.5"
          >
            <span>Portal NSR</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </header>
  );
}
export default NavbarKJPP;
