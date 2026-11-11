"""
qa_engine/deterministic_rules.py
Zero-tolerance deterministic rules and clerical error scanner for appraisal reports.
Evaluates formula breaks (#REF!), math sum reconciliations, and appraiser license compliance.
"""

import re
from typing import Dict, List, Any

# Strict Regex Patterns
ERROR_TOKEN_PATTERNS = [
    {
        "pattern": r"#REF!",
        "title": "Formula Reference Error (#REF!)",
        "severity": "CRITICAL",
        "category": "CALCULATION",
        "std": "SPI 105 Butir 5.1 & KEPI Butir 3 (Integritas Kalkulasi)",
        "impact": "Kalkulasi sel Excel terputus/rusak. Angka nilai tidak memiliki dasar matematis valid.",
        "action": "Buka lembar KKP sumber dan perbaiki referensi sel formula yang hilang/terhapus."
    },
    {
        "pattern": r"#VALUE!",
        "title": "Data Type Formula Error (#VALUE!)",
        "severity": "CRITICAL",
        "category": "CALCULATION",
        "std": "SPI 105 Butir 5.1 (Akurasi Matematika)",
        "impact": "Tipe data tidak kompatibel pada operasi aritmetika penilaian.",
        "action": "Pastikan seluruh sel input bertipe angka numerik murni tanpa karakter non-standar."
    },
    {
        "pattern": r"#DIV/0!",
        "title": "Division by Zero Error (#DIV/0!)",
        "severity": "CRITICAL",
        "category": "CALCULATION",
        "std": "SPI 105 Butir 5.1 (Akurasi Matematika)",
        "impact": "Pembagian dengan nilai nol pada pembobotan atau depresiasi.",
        "action": "Periksa variabel pembagi pada matriks penyesuaian pasar atau depresiasi bangunan."
    },
    {
        "pattern": r"#{4,}",
        "title": "Cell Display Overflow (####)",
        "severity": "MAJOR",
        "category": "CLERICAL",
        "std": "SPI 103 Butir 4 (Kelengkapan Penyajian Laporan)",
        "impact": "Angka nilai atau biaya tidak terbaca oleh komite kredit perbankan.",
        "action": "Perlebar lebar kolom pada tabel rincian biaya KKP sebelum mengekspor ke PDF."
    },
    {
        "pattern": r"Rp\.?\s*0\s*(?:,-|/m2|\(Nol\))?",
        "title": "Unallocated Zero Value Indication (Rp 0)",
        "severity": "MAJOR",
        "category": "CALCULATION",
        "std": "SPI 105 Butir 5.2 (Kelengkapan Objek Penilaian)",
        "impact": "Komponen aset bernilai Rp 0 dapat mengindikasikan kelalaian penaksiran fisik sarana.",
        "action": "Verifikasi apakah sarana/bangunan memang memiliki nilai nol atau belum diinput nilainya."
    },
    {
        "pattern": r"(?:00xxx|no\.?\s*xxx|tgl\.?\s*xx|tanggal\s*xx)",
        "title": "Unfilled Template Placeholder Token",
        "severity": "MAJOR",
        "category": "CLERICAL",
        "std": "SPI 104 Butir 3 (Kejelasan Identitas Laporan)",
        "impact": "Draf laporan memuat placeholder mentah yang belum diisi data riil penugasan.",
        "action": "Lengkapi nomor surat, tanggal, atau identitas debitur resmi sebelum finalisasi."
    }
]

NON_SIMPLE_COMMERCIAL_ASSETS = [
    "rumah sakit", "rsia", "klinik utama", "hotel", "resort", "mall", "mal", 
    "pusat perbelanjaan", "kawasan perumahan", "kyg", "apartemen", "kondominium", 
    "gedung perkantoran", "pabrik", "kawasan industri"
]


class DeterministicRuleChecker:
    def __init__(self, parsed_data: Dict[str, Any]):
        self.parsed = parsed_data
        self.full_text = parsed_data.get("full_text", "")
        self.pages = parsed_data.get("pages", [])

    def run_all_checks(self) -> List[Dict[str, Any]]:
        findings = []
        findings.extend(self.check_error_tokens())
        findings.extend(self.check_appraiser_license_compliance())
        findings.extend(self.check_reconciliation_math())
        findings.extend(self.check_date_consistency())
        return findings

    def check_error_tokens(self) -> List[Dict[str, Any]]:
        findings = []
        for rule in ERROR_TOKEN_PATTERNS:
            regex = re.compile(rule["pattern"], re.IGNORECASE)
            affected_pages = []
            matched_snippets = []

            for p in self.pages:
                text = p.get("text", "")
                m = regex.search(text)
                if m:
                    affected_pages.append(p.get("page_number", 1))
                    start = max(0, m.start() - 60)
                    end = min(len(text), m.end() + 60)
                    matched_snippets.append(text[start:end].replace("\n", " ").strip())

            if affected_pages:
                findings.append({
                    "severity": rule["severity"],
                    "category": rule["category"],
                    "title": rule["title"],
                    "condition_found": f"Terdeteksi token '{rule['pattern']}' pada halaman {affected_pages}. Contoh teks: \"{matched_snippets[0]}\"",
                    "standard_reference": rule["std"],
                    "impact_analysis": rule["impact"],
                    "corrective_action": rule["action"],
                    "page_numbers": affected_pages,
                    "resolved": False
                })

        return findings

    def check_appraiser_license_compliance(self) -> List[Dict[str, Any]]:
        findings = []
        lower_text = self.full_text.lower()

        # Check if asset is non-simple commercial
        is_complex_asset = False
        detected_asset_type = ""
        for asset in NON_SIMPLE_COMMERCIAL_ASSETS:
            if asset in lower_text:
                is_complex_asset = True
                detected_asset_type = asset.upper()
                break

        # Check if license is PS (Penilai Sederhana) without Properti (P)
        has_ps_license = bool(re.search(r"\bps[-\s]?(?:1|2|3|4)?\b|\bpenilai\s+sederhana\b", lower_text))
        has_p_license = bool(re.search(r"\bp[-\s]?(?:1|2|3|4)?\.\d{2}\.\d{5}\b|\bpenilai\s+publik\s+properti\b|\bizin\s+penilai\s+publik\s*:\s*p-", lower_text))

        # Check if signatory license is mismatched
        if is_complex_asset and has_ps_license and not has_p_license:
            findings.append({
                "severity": "CRITICAL",
                "category": "SPI_COMPLIANCE",
                "title": f"Lisensi Penilai Publik Tidak Sesuai Klasifikasi Aset ({detected_asset_type})",
                "condition_found": f"Objek teridentifikasi sebagai '{detected_asset_type}' (Komersial Non-Sederhana), namun laporan memuat kualifikasi Penilai Sederhana (PS).",
                "standard_reference": "KMK No. 248/KM.1/2019 & POJK Penilaian Agunan Bank",
                "impact_analysis": "Dokumen ditolak mutlak oleh pihak bank/BUMN kreditur dan berisiko sanksi pembekuan izin dari P2PK Kemenkeu RI.",
                "corrective_action": "Laporan wajib disupervisi dan ditandatangani oleh Rekan Penilai Publik Pemegang Izin Properti Penuh (P).",
                "page_numbers": [1, 2],
                "resolved": False
            })

        return findings

    def check_reconciliation_math(self) -> List[Dict[str, Any]]:
        findings = []
        # Extract Nilai Tanah, Bangunan, Sarana Pelengkap
        # Patterns like: Tanah: Rp 10.000.000.000 Bangunan: Rp 4.000.000.000
        tanah_match = re.search(r"(?:nilai\s+pasar\s+tanah|nilai\s+tanah)[^\d]*Rp\.?\s*([\d\.,]+)", self.full_text, re.IGNORECASE)
        bangunan_match = re.search(r"(?:nilai\s+pasar\s+bangunan|nilai\s+bangunan)[^\d]*Rp\.?\s*([\d\.,]+)", self.full_text, re.IGNORECASE)
        total_match = re.search(r"(?:total\s+nilai\s+pasar|kesimpulan\s+nilai\s+pasar|nilai\s+pasar\s+properti)[^\d]*Rp\.?\s*([\d\.,]+)", self.full_text, re.IGNORECASE)

        def parse_id_number(s: str) -> float:
            clean = s.replace(".", "").replace(",", ".")
            try:
                return float(clean)
            except Exception:
                return 0.0

        if tanah_match and bangunan_match and total_match:
            v_tanah = parse_id_number(tanah_match.group(1))
            v_bgn = parse_id_number(bangunan_match.group(1))
            v_total = parse_id_number(total_match.group(1))

            sum_calc = v_tanah + v_bgn
            diff = abs(v_total - sum_calc)

            if diff > 100000 and v_total > 0 and sum_calc > 0:
                findings.append({
                    "severity": "MAJOR",
                    "category": "CALCULATION",
                    "title": "Diskrepansi Rekonsiliasi Nilai Penjumlahan (Sum Discrepancy)",
                    "condition_found": f"Total Nilai Pasar tercatat Rp {v_total:,.2f}, sedangkan Nilai Tanah (Rp {v_tanah:,.2f}) + Bangunan (Rp {v_bgn:,.2f}) = Rp {sum_calc:,.2f}. Selisih: Rp {diff:,.2f}.",
                    "standard_reference": "SPI 105 Butir 5.3 (Rekonsiliasi Pendekatan Biaya)",
                    "impact_analysis": "Ketidaksesuaian tabel resume dengan rincian kertas kerja menimbulkan keraguan audit perbankan.",
                    "corrective_action": "Rekonsiliasi kembali nilai sarana pelengkap atau pembulatan nilai akhir pada KKP.",
                    "page_numbers": [3, 4],
                    "resolved": False
                })

        return findings

    def check_date_consistency(self) -> List[Dict[str, Any]]:
        findings = []
        # Scan for Valuation Dates and Report Dates
        date_matches = re.findall(r"(?:tanggal\s+penilaian|valuation\s+date)\s*:\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})", self.full_text, re.IGNORECASE)
        unique_dates = list(set([d.strip() for d in date_matches]))

        if len(unique_dates) > 1:
            findings.append({
                "severity": "MODERATE",
                "category": "CLERICAL",
                "title": "Inkonsistensi Tanggal Penilaian Antar-Bab (Date Mismatch)",
                "condition_found": f"Ditemukan perbedaan tanggal penilaian di dalam laporan: {', '.join(unique_dates)}.",
                "standard_reference": "SPI 104 Butir 2.2 (Tanggal Penilaian & Tanggal Laporan)",
                "impact_analysis": "Dapat memicu interpretasi ganda mengenai cut-off date kondisi fisik agunan.",
                "corrective_action": "Seragamkan tanggal penilaian di seluruh bab (Surat Pengantar, Ringkasan, dan Resume).",
                "page_numbers": [1, 2, 5],
                "resolved": False
            })

        return findings
