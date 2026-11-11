#!/usr/bin/env python3
"""
tests/test_batch_qa.py
Batch QA Test Runner across appraisal PDF documents in kjpp-nsr-netlify-production.
Scans directory, executes deterministic & semantic rules, outputs benchmark table,
and generates formal Independent Technical Review reports.
"""

import os
import sys
import glob
import json
import time

# Add root directory to sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
sys.path.insert(0, PROJECT_ROOT)

from qa_engine.parser import DocumentParser
from qa_engine.deterministic_rules import DeterministicRuleChecker
from qa_engine.semantic_auditor import SemanticAuditor
from qa_engine.pdf_generator import QAReportGenerator


def run_batch_qa(target_dir: str = PROJECT_ROOT):
    print("=" * 100)
    print("   KJPP NSR QUALITY GATEKEEPER: BATCH QA REVIEW TEST RUNNER (SPI & KEPI)")
    print("   Target Directory:", target_dir)
    print("=" * 100)

    pdf_files = glob.glob(os.path.join(target_dir, "*.pdf"))
    if not pdf_files:
        print("[-] Tidak ditemukan berkas PDF di:", target_dir)
        return

    print(f"\n[+] Menemukan {len(pdf_files)} berkas PDF untuk diuji.")
    print("-" * 100)

    results = []

    for idx, pdf_path in enumerate(pdf_files, start=1):
        file_name = os.path.basename(pdf_path)
        print(f"\n[{idx}/{len(pdf_files)}] Memproses: {file_name}")

        # 1. Parse
        start_t = time.time()
        parser = DocumentParser(pdf_path)
        parsed_data = parser.parse()
        parsed_data["file_name"] = file_name

        # 2. Deterministic Checks
        det_checker = DeterministicRuleChecker(parsed_data)
        det_findings = det_checker.run_all_checks()

        # 3. Semantic Checks
        sem_auditor = SemanticAuditor(parsed_data)
        sem_findings = sem_auditor.run_all_audits()

        all_findings = det_findings + sem_findings

        # 4. Status Verdict & Score
        critical_count = sum(1 for f in all_findings if f["severity"] == "CRITICAL")
        major_count = sum(1 for f in all_findings if f["severity"] == "MAJOR")
        moderate_count = sum(1 for f in all_findings if f["severity"] == "MODERATE")
        minor_count = sum(1 for f in all_findings if f["severity"] == "MINOR")

        if critical_count > 0:
            status = "NOT_ACCEPTABLE"
            score = max(30.0, 58.0 - (critical_count * 12.0) - (major_count * 4.0))
            nolap_gate = "TERKUNCI"
        elif major_count > 0:
            status = "REQUIRES_MAJOR_REVISION"
            score = max(55.0, 75.0 - (major_count * 6.0) - (moderate_count * 2.0))
            nolap_gate = "TERKUNCI"
        elif moderate_count > 0:
            status = "ACCEPTABLE_WITH_REVISION"
            score = max(80.0, 92.0 - (moderate_count * 3.0))
            nolap_gate = "LOLOS (DENGAN CATATAN)"
        else:
            status = "ACCEPTABLE"
            score = 98.0
            nolap_gate = "LOLOS (TERBUKA PENUH)"

        elapsed = time.time() - start_t

        res_entry = {
            "file_name": file_name,
            "sha256": parsed_data["file_hash"][:16] + "...",
            "total_pages": parsed_data["total_pages"],
            "status": status,
            "compliance_score": round(score, 1),
            "findings_summary": {
                "critical": critical_count,
                "major": major_count,
                "moderate": moderate_count,
                "minor": minor_count,
                "total": len(all_findings)
            },
            "nolap_gate": nolap_gate,
            "elapsed_sec": round(elapsed, 2),
            "findings": all_findings
        }

        # 5. Generate Formal Report
        gen = QAReportGenerator({
            "file_name": file_name,
            "job_order_id": f"JO-NSR-2026-{idx:04d}",
            "status": status,
            "compliance_score": score,
            "findings": all_findings
        })
        out_report = gen.save_report()
        res_entry["report_path"] = out_report

        results.append(res_entry)

    # 6. Print Benchmark Table Matrix
    print("\n" + "=" * 115)
    print("                                   BENCHMARK MATRIKS HASIL UJI BATCH QA")
    print("=" * 115)
    header = f"{'No':<3} | {'Nama Berkas PDF':<42} | {'Status Rekomendasi':<24} | {'Skor':<7} | {'Temuan (C/M/Mo/Mi)':<18} | {'Status NoLap':<12}"
    print(header)
    print("-" * 115)

    for i, r in enumerate(results, 1):
        f_counts = f"{r['findings_summary']['critical']}/{r['findings_summary']['major']}/{r['findings_summary']['moderate']}/{r['findings_summary']['minor']}"
        display_name = (r['file_name'][:39] + '...') if len(r['file_name']) > 42 else r['file_name']
        print(f"{i:<3} | {display_name:<42} | {r['status']:<24} | {r['compliance_score']:<5}% | {f_counts:<18} | {r['nolap_gate']:<12}")

    print("=" * 115)
    print(f"\n[✓] Laporan formal review tersimpan di folder: {os.path.join(PROJECT_ROOT, 'output', 'qa_reports')}")
    print("[✓] Pengujian Batch QA selesai dengan sukses 100%!\n")

    return results


if __name__ == "__main__":
    run_batch_qa()
