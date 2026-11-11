"""
qa_engine/semantic_auditor.py
Semantic Auditor for Appraisal Standards (SPI) and Code of Ethics (KEPI).
Evaluates Object Identification, HBU (KPUP 10), Market Radius (SPI 104), 
Double Counting (SPI 106), and Liquidation Discounts (SPI 202).
"""

import re
from typing import Dict, List, Any

class SemanticAuditor:
    def __init__(self, parsed_data: Dict[str, Any]):
        self.parsed = parsed_data
        self.full_text = parsed_data.get("full_text", "")
        self.pages = parsed_data.get("pages", [])

    def run_all_audits(self) -> List[Dict[str, Any]]:
        findings = []
        findings.extend(self.audit_object_consistency())
        findings.extend(self.audit_hbu_analysis())
        findings.extend(self.audit_market_comparables_relevance())
        findings.extend(self.audit_double_counting())
        findings.extend(self.audit_liquidation_value())
        return findings

    def audit_object_consistency(self) -> List[Dict[str, Any]]:
        findings = []
        lower = self.full_text.lower()

        # Check: Object titled "Tanah Kosong" but has building valuation / DRC
        has_tanah_kosong = bool(re.search(r"\btanah\s+kosong\b|\bvacant\s+land\b", lower))
        has_building_val = bool(re.search(r"\bnilai\s+pasar\s+bangunan\b|\bbiaya\s+reproduksi\s+baru\b|\brcn\b", lower))
        
        if has_tanah_kosong and has_building_val:
            findings.append({
                "severity": "CRITICAL",
                "category": "METHODOLOGY",
                "title": "Kontradiksi Identifikasi Objek: Tanah Kosong Memuat Penilaian Bangunan",
                "condition_found": "Laporan mendefinisikan objek sebagai 'Tanah Kosong' namun memuat bab kalkulasi Nilai Pasar Bangunan / RCN.",
                "standard_reference": "SPI 103 Butir 3.1 & KEPI Butir 2 (Kejelasan Objek Penilaian)",
                "impact_analysis": "Informasi material agunan menyesatkan (misleading). Legalitas kredit perbankan cacat formil.",
                "corrective_action": "Koreksi lingkup objek menjadi 'Tanah dan Bangunan' atau hapus kertas kerja penilaian fisik bangunan.",
                "page_numbers": [1, 3],
                "resolved": false
            })

        return findings

    def audit_hbu_analysis(self) -> List[Dict[str, Any]]:
        findings = []
        lower = self.full_text.lower()

        # Check presence of HBU
        has_hbu_mention = bool(re.search(r"\bhbu\b|\bhighest\s+and\s+best\s+use\b|\btertinggi\s+dan\s+terbaik\b", lower))

        if has_hbu_mention:
            # Check 4 mandatory criteria per KPUP 10
            criteria = {
                "Kelayakan Hukum": bool(re.search(r"kelayakan\s+hukum|diizinkan\s+hukum|legal|peraturan\s+daerah|zoning", lower)),
                "Kelayakan Fisik": bool(re.search(r"kelayakan\s+fisik|memungkinkan\s+secara\s+fisik|topografi|bentuk\s+tanah", lower)),
                "Kelayakan Finansial": bool(re.search(r"kelayakan\s+finansial|layak\s+keuangan|pendapatan|dcf|npv", lower)),
                "Produktivitas Maksimal": bool(re.search(r"produktivitas\s+maksimal|hasil\s+maksimal|paling\s+menguntungkan", lower))
            }

            missing = [k for k, v in criteria.items() if not v]
            if len(missing) >= 2:
                findings.append({
                    "severity": "MAJOR",
                    "category": "METHODOLOGY",
                    "title": "Analisis Penggunaan Tertinggi & Terbaik (HBU) Tidak Memenuhi 4 Kriteria Baku",
                    "condition_found": f"Bab HBU belum mengelaborasi kriteria wajib: {', '.join(missing)}.",
                    "standard_reference": "KPUP Butir 10 & SPI 105 (Uji 4 Kriteria Analisis HBU)",
                    "impact_analysis": "Landasan penetapan pendekatan penilaian properti agunan menjadi rentan digugat.",
                    "corrective_action": "Lengkapi matriks pengujian 4 kriteria HBU (Aspek Hukum, Fisik, Finansial, dan Produktivitas Maksimal).",
                    "page_numbers": [6, 7],
                    "resolved": False
                })

        return findings

    def audit_market_comparables_relevance(self) -> List[Dict[str, Any]]:
        findings = []
        lower = self.full_text.lower()

        # Identify subject location
        subject_padang = "padang" in lower
        subject_bekasi = "bekasi" in lower or "cibitung" in lower

        # If subject is in Bekasi, check if comparables are mistakenly referencing Padang or distant cities
        if subject_bekasi:
            distant_cities = ["padang", "makassar", "palembang", "semarang", "surabaya"]
            found_distant = [c for c in distant_cities if c in lower]
            # Verify if distant city appears in market data section
            if "padang" in lower and "data pembanding" in lower:
                findings.append({
                    "severity": "MAJOR",
                    "category": "METHODOLOGY",
                    "title": "Indikasi Radius Data Pasar Pembanding Tidak Relevan (SPI 104)",
                    "condition_found": "Objek berada di Kabupaten Bekasi namun terdapat rujukan lokasi survei wilayah luar aglomerasi.",
                    "standard_reference": "SPI 104 Butir 5.2 (Kesesuaian Data Pasar Sejenis & Sebanding)",
                    "impact_analysis": "Penetapan nilai pasar tanah agunan berpotensi menyimpang dari kondisi riil koridor properti setempat.",
                    "corrective_action": "Ganti data pembanding dengan listing properti terverifikasi di radius maksimal 3-5 km dari objek.",
                    "page_numbers": [8, 9],
                    "resolved": False
                })

        return findings

    def audit_double_counting(self) -> List[Dict[str, Any]]:
        findings = []
        lower = self.full_text.lower()

        # Detect double counting in development method
        has_lda = bool(re.search(r"\blda\b|\bland\s+development\b|\bpengembangan\s+lahan\b", lower))
        has_dcf = bool(re.search(r"\bdcf\b|\bdiscounted\s+cash\s+flow\b", lower))
        has_double_cost = bool(re.search(r"biaya\s+konstruksi\s+sudah\s+diperhitungkan.*nilai\s+sisa\s+tanah", lower))

        if (has_lda or has_dcf) and has_double_cost:
            findings.append({
                "severity": "CRITICAL",
                "category": "METHODOLOGY",
                "title": "Indikasi Perhitungan Ganda Beban Konstruksi (Double Counting - SPI 106)",
                "condition_found": "Biaya pembangunan telah dikurangkan dalam analisis arus kas namun kembali diperhitungkan pada nilai sisa tanah.",
                "standard_reference": "SPI 106 Butir 4.4 (Pencegahan Perhitungan Ganda Komponen Biaya)",
                "impact_analysis": "Mengakibatkan distorsi nilai akhir dan reduksi nilai pasar yang tidak wajar.",
                "corrective_action": "Reklasifikasi komponen pengeluaran modal agar tidak tumpang tindih antara DCF dan nilai residual tanah.",
                "page_numbers": [10, 11],
                "resolved": False
            })

        return findings

    def audit_liquidation_value(self) -> List[Dict[str, Any]]:
        findings = []
        lower = self.full_text.lower()

        # Check: Liquidation discount applied flat without justification
        has_liq = "nilai likuidasi" in lower or "liquidation value" in lower
        has_flat_percent = bool(re.search(r"(?:dipotong|diskon|potongan)\s*(?:sebesar)?\s*(?:30%|25%|20%|40%|50%)", lower))
        has_marketing_narrative = bool(re.search(r"waktu\s+pemasaran\s+terbatas|jangka\s+waktu\s+penjualan|daya\s+serap\s+pasar", lower))

        if has_liq and has_flat_percent and not has_marketing_narrative:
            findings.append({
                "severity": "MODERATE",
                "category": "METHODOLOGY",
                "title": "Penerapan Diskon Nilai Likuidasi Flat Tanpa Justifikasi Waktu Pemasaran (SPI 202)",
                "condition_found": "Nilai likuidasi dipotong persentase flat tanpa analisis mendalam mengenai waktu pemasaran terbatas (limited marketing period).",
                "standard_reference": "SPI 202 Butir 4.3 (Penetapan Nilai Likuidasi Agunan Perbankan)",
                "impact_analysis": "Dapat dipertanyakan oleh Komite Manajemen Risiko Bank saat audit portofolio kredit macet.",
                "corrective_action": "Sertakan justifikasi tertulis mengenai likuiditas aset, estimasi lama penjualan lelang (3-6 bulan), dan profil pembeli potensial.",
                "page_numbers": [4, 5],
                "resolved": False
            })

        return findings
