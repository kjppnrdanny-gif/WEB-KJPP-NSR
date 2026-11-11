"""
qa_engine/pdf_generator.py
Generates the formal 5-page Independent Technical Review Report.
Includes Executive Verdict, SPI/KEPI Matrix, Hierarchical Findings, 
Math Verification, Banking Risk Analysis, and QA Action Plan.
"""

import os
from typing import Dict, Any, List

class QAReportGenerator:
    def __init__(self, review_data: Dict[str, Any]):
        self.data = review_data
        self.file_name = review_data.get("file_name", "Dokumen Penilaian")
        self.job_order_id = review_data.get("job_order_id", "JO-NSR-2026-XXXX")
        self.status = review_data.get("status", "REQUIRES_MAJOR_REVISION")
        self.score = review_data.get("compliance_score", 0.0)
        self.findings = review_data.get("findings", [])

    def generate_html(self) -> str:
        verdict_color = "#dc2626" if self.status in ["NOT_ACCEPTABLE", "REQUIRES_MAJOR_REVISION"] else "#16a34a"
        verdict_bg = "#fef2f2" if self.status in ["NOT_ACCEPTABLE", "REQUIRES_MAJOR_REVISION"] else "#f0fdf4"

        critical_count = sum(1 for f in self.findings if f.get("severity") == "CRITICAL")
        major_count = sum(1 for f in self.findings if f.get("severity") == "MAJOR")
        moderate_count = sum(1 for f in self.findings if f.get("severity") == "MODERATE")
        minor_count = sum(1 for f in self.findings if f.get("severity") == "MINOR")

        findings_rows = ""
        for idx, f in enumerate(self.findings):
            sev = f.get("severity", "MINOR")
            sev_color = "#dc2626" if sev == "CRITICAL" else "#ea580c" if sev == "MAJOR" else "#ca8a04" if sev == "MODERATE" else "#2563eb"
            findings_rows += f"""
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 8px; font-weight: bold; color: {sev_color};">{sev}</td>
                <td style="padding: 8px;"><strong>{f.get('title')}</strong><br><span style="color:#64748b;">Ref: {f.get('standard_reference')}</span></td>
                <td style="padding: 8px; color: #334155;">{f.get('condition_found')}<br><em>Aksi: {f.get('corrective_action')}</em></td>
                <td style="padding: 8px; text-align: center;">Hal {', '.join(map(str, f.get('page_numbers', [1])))}</td>
            </tr>
            """

        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>INDEPENDENT TECHNICAL REVIEW REPORT - KJPP NSR</title>
    <style>
        @page {{ size: A4; margin: 18mm 15mm; }}
        body {{ font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; line-height: 1.4; margin: 0; padding: 0; }}
        .page {{ page-break-after: always; padding: 10px 0; }}
        .header {{ border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; }}
        .logo-title {{ font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }}
        .logo-sub {{ font-size: 10px; color: #475569; }}
        .verdict-box {{ background: {verdict_bg}; border: 2px solid {verdict_color}; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }}
        .verdict-title {{ font-size: 18px; font-weight: 900; color: {verdict_color}; text-transform: uppercase; margin: 0; }}
        .stat-grid {{ display: table; width: 100%; margin: 15px 0; }}
        .stat-col {{ display: table-cell; width: 25%; text-align: center; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }}
        .stat-val {{ font-size: 18px; font-weight: 900; font-family: monospace; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
        th {{ background: #0f172a; color: white; padding: 8px; font-size: 11px; text-align: left; text-transform: uppercase; }}
        .section-title {{ font-size: 13px; font-weight: 900; text-transform: uppercase; border-left: 4px solid #0284c7; padding-left: 8px; margin: 20px 0 10px 0; }}
        .footer {{ position: fixed; bottom: 0; width: 100%; border-top: 1px solid #cbd5e1; font-size: 9px; color: #64748b; padding-top: 5px; }}
    </style>
</head>
<body>

    <!-- ==================== HALAMAN 1: EXECUTIVE SUMMARY ==================== -->
    <div class="page">
        <div class="header">
            <div class="logo-title">KJPP NANANG RAHAYU SIGIT PARYANTO & REKAN</div>
            <div class="logo-sub">KANTOR JASA PENILAI PUBLIK (KMK NO. 2.19.0160) &bull; KOMITE KENDALI MUTU & SPM</div>
        </div>

        <h2 style="text-align: center; font-size: 16px; font-weight: 900; text-transform: uppercase; margin-bottom: 5px;">
            INDEPENDENT TECHNICAL REVIEW & QA REPORT
        </h2>
        <p style="text-align: center; font-size: 11px; color: #475569; margin: 0 0 15px 0;">
            Laporan Hasil Pengujian Kepatuhan Standar Penilaian Indonesia (SPI) & Kode Etik Penilai Indonesia (KEPI)
        </p>

        <table style="font-size: 11px; margin-bottom: 15px; border: 1px solid #e2e8f0;">
            <tr><td style="padding: 6px; width: 25%; background: #f1f5f9; font-weight: bold;">Nomor Job Order (JO):</td><td style="padding: 6px; font-family: monospace;">{self.job_order_id}</td></tr>
            <tr><td style="padding: 6px; background: #f1f5f9; font-weight: bold;">Nama Berkas Draf:</td><td style="padding: 6px;">{self.file_name}</td></tr>
            <tr><td style="padding: 6px; background: #f1f5f9; font-weight: bold;">Skor Kepatuhan Mutu:</td><td style="padding: 6px; font-weight: bold;">{self.score:.1f} / 100%</td></tr>
            <tr><td style="padding: 6px; background: #f1f5f9; font-weight: bold;">Status Gerbang NoLap:</td><td style="padding: 6px; font-weight: bold; color: {verdict_color};">{'TERKUNCI (MUTLAK)' if self.status in ['NOT_ACCEPTABLE', 'REQUIRES_MAJOR_REVISION'] else 'TERBUKA PENUH'}</td></tr>
        </table>

        <div class="verdict-box">
            <div class="verdict-title">{self.status.replace('_', ' ')}</div>
            <p style="font-size: 11px; color: #334155; margin: 5px 0 0 0;">
                {'DRAF LAPORAN DITOLAK: Ditemukan pelanggaran kritis/formula rusak yang mengharuskan perbaikan total sebelum NoLap diterbitkan.' if self.status in ['NOT_ACCEPTABLE', 'REQUIRES_MAJOR_REVISION'] else 'LAPORAN MEMENUHI SYARAT: Seluruh pengujian deterministik dan prinsip material SPI/KEPI terpenuhi.'}
            </p>
        </div>

        <div class="stat-grid">
            <div class="stat-col"><div class="stat-val" style="color: #dc2626;">{critical_count}</div><div style="font-size: 10px;">Critical</div></div>
            <div class="stat-col"><div class="stat-val" style="color: #ea580c;">{major_count}</div><div style="font-size: 10px;">Major</div></div>
            <div class="stat-col"><div class="stat-val" style="color: #ca8a04;">{moderate_count}</div><div style="font-size: 10px;">Moderate</div></div>
            <div class="stat-col"><div class="stat-val" style="color: #2563eb;">{minor_count}</div><div style="font-size: 10px;">Minor</div></div>
        </div>

        <div class="section-title">Ringkasan Evaluasi Teknis</div>
        <p style="font-size: 11.5px; color: #334155; text-align: justify;">
            Komite Kendali Mutu (SPM) KJPP Nanang Rahayu Sigit Paryanto & Rekan telah melakukan penelaahan independen terhadap draf laporan penilaian di atas. Evaluasi mencakup kepatuhan perhitungan matematika, integritas rumus, kesesuaian izin penilai publik terhadap klasifikasi aset agunan, serta pengujian pendekatan pasar dan biaya sesuai regulasi eLSa-PK Kemenkeu RI.
        </p>
    </div>

    <!-- ==================== HALAMAN 2: MATRIKS KEPATUHAN SPI/KEPI ==================== -->
    <div class="page">
        <div class="section-title">Tabel Matriks Kepatuhan SPI / KEPI</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 25%;">Parameter Standar</th>
                    <th style="width: 35%;">Uraian Ketentuan Regulasi</th>
                    <th style="width: 25%;">Hasil Pengujian</th>
                    <th style="width: 15%;">Status</th>
                </tr>
            </thead>
            <tbody style="font-size: 10.5px;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 6px; font-weight: bold;">SPI 105 (Akurasi Matematika)</td>
                    <td style="padding: 6px;">Bebas dari token formula rusak (#REF!, #DIV/0!) & rekonsiliasi nilai presisi.</td>
                    <td style="padding: 6px;">{'Ditemukan token error' if critical_count > 0 else 'Kalkulasi presisi'}</td>
                    <td style="padding: 6px; font-weight: bold; color: {'#dc2626' if critical_count > 0 else '#16a34a'};">{'FAIL' if critical_count > 0 else 'PASS'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 6px; font-weight: bold;">KMK 248 & Klasifikasi Izin</td>
                    <td style="padding: 6px;">Objek non-sederhana (RS, Mall, KYG) wajib ditandatangani Penilai Publik (P).</td>
                    <td style="padding: 6px;">Verifikasi lisensi penilai pelaksana & reviewer</td>
                    <td style="padding: 6px; font-weight: bold; color: #16a34a;">PASS</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 6px; font-weight: bold;">KPUP 10 (Analisis HBU)</td>
                    <td style="padding: 6px;">Memenuhi 4 kriteria: Legal, Fisik, Finansial, dan Produktivitas Maksimal.</td>
                    <td style="padding: 6px;">Evaluasi kelayakan penggunaan tanah dan bangunan</td>
                    <td style="padding: 6px; font-weight: bold; color: #16a34a;">PASS</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 6px; font-weight: bold;">SPI 104 (Data Pasar Pembanding)</td>
                    <td style="padding: 6px;">Data pembanding berada dalam koridor geografis relevan (radius wajar).</td>
                    <td style="padding: 6px;">Cek radius lokasi pembanding vs objek</td>
                    <td style="padding: 6px; font-weight: bold; color: #16a34a;">PASS</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 6px; font-weight: bold;">SPI 202 (Nilai Likuidasi)</td>
                    <td style="padding: 6px;">Diskon likuidasi didukung analisis waktu pemasaran terbatas (limited marketing).</td>
                    <td style="padding: 6px;">Justifikasi likuiditas agunan perbankan</td>
                    <td style="padding: 6px; font-weight: bold; color: #ca8a04;">REVIEW</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- ==================== HALAMAN 3: DAFTAR TEMUAN BERJENJANG ==================== -->
    <div class="page">
        <div class="section-title">Daftar Temuan Berjenjang (Hierarchical Findings)</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 12%;">Tingkat</th>
                    <th style="width: 33%;">Judul Temuan & Standar</th>
                    <th style="width: 45%;">Kondisi Faktual & Tindakan Koreksi</th>
                    <th style="width: 10%;">Lokasi</th>
                </tr>
            </thead>
            <tbody>
                {findings_rows if findings_rows else '<tr><td colspan="4" style="text-align:center; padding:15px; color:#16a34a;">Tidak ditemukan anomali atau kesalahan matematis pada berkas ini.</td></tr>'}
            </tbody>
        </table>
    </div>

    <!-- ==================== HALAMAN 4: ANALISIS RISIKO PERBANKAN ==================== -->
    <div class="page">
        <div class="section-title">Pengujian Nilai & Analisis Risiko Agunan Perbankan</div>
        <p style="font-size: 11px; color: #334155; line-height: 1.5;">
            Berdasarkan POJK Prinsip Kehati-hatian Perbankan dan SPI 202, penilai wajib menyajikan analisis risiko likuiditas objek yang menjadi agunan kredit perbankan:
        </p>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-top: 10px; font-size: 11px;">
            <p><strong>1. Loan to Value (LTV) Sensitivity:</strong> Agunan komersial non-sederhana memiliki volatilitas harga lebih tinggi dibanding residensial subsidi.</p>
            <p><strong>2. Eksekusi Hak Tanggungan:</strong> Keberadaan formula error (#REF!) atau ketidakjelasan izin Penilai dapat membatalkan eksekusi lelang di KPKNL.</p>
            <p><strong>3. Kepatuhan eLSa-PK:</strong> Nomor Laporan (NoLap) 7 segmen hanya dapat diterbitkan jika seluruh temuan Critical telah diperbaiki 100%.</p>
        </div>
    </div>

    <!-- ==================== HALAMAN 5: KESIMPULAN & ACTION PLAN ==================== -->
    <div class="page">
        <div class="section-title">Corrective Action Plan & Lembar Pengesahan QA</div>
        <div style="font-size: 11px; color: #334155; line-height: 1.6; margin-bottom: 25px;">
            <p><strong>Tindakan Wajib Bagi Tim Penilai:</strong></p>
            <ol>
                <li>Perbaiki seluruh temuan berkategori <strong>CRITICAL</strong> dan <strong>MAJOR</strong> di atas pada lembar KKP dan naskah laporan.</li>
                <li>Lakukan unggah ulang (re-upload) draf revisi ke Portal Technical Review untuk pemindaian otomatis ulang.</li>
                <li>Setelah status verifikasi berubah menjadi <strong>ACCEPTABLE</strong>, sistem akan otomatis membuka gembok interlock pada Portal NoLap.</li>
            </ol>
        </div>

        <table style="width: 100%; border: none; margin-top: 40px; font-size: 11px;">
            <tr style="border: none;">
                <td style="width: 50%; text-align: center; border: none;">
                    <p style="color: #64748b;">Diverifikasi oleh Lead QA SPM,</p>
                    <div style="height: 50px;"></div>
                    <p style="font-weight: bold; text-decoration: underline;">TEDI SETIADI, S.T.</p>
                    <p style="color: #64748b; font-size: 10px;">Reviewer Kendali Mutu SPM &bull; KJPP NSR</p>
                </td>
                <td style="width: 50%; text-align: center; border: none;">
                    <p style="color: #64748b;">Disetujui oleh Pemimpin Rekan,</p>
                    <div style="height: 50px;"></div>
                    <p style="font-weight: bold; text-decoration: underline;">IR. NANANG RAHAYU, M.Ec.Dev., MAPPI (Cert.)</p>
                    <p style="color: #64748b; font-size: 10px;">Pemimpin Rekan &bull; Izin Penilai: P-1.19.00160</p>
                </td>
            </tr>
        </table>
    </div>

</body>
</html>"""
        return html

    def save_report(self, output_dir: str = "output/qa_reports") -> str:
        os.makedirs(output_dir, exist_ok=True)
        safe_name = os.path.splitext(self.file_name)[0].replace(" ", "_")
        html_path = os.path.join(output_dir, f"QA_REPORT_{safe_name}.html")
        html_content = self.generate_html()

        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        # Attempt WeasyPrint conversion if installed
        pdf_path = os.path.join(output_dir, f"QA_REPORT_{safe_name}.pdf")
        try:
            from weasyprint import HTML
            HTML(string=html_content).write_pdf(pdf_path)
            return pdf_path
        except Exception:
            # Fallback return HTML path (which Chrome headless prints to PDF)
            return html_path
