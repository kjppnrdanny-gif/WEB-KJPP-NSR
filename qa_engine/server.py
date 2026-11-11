"""
qa_engine/server.py
FastAPI Server for Portal Technical Review & QA Laporan
Endpoint: POST /api/v1/qa/upload (Multipart upload up to 150 MB)
"""

import os
import shutil
import tempfile
from typing import Dict, Any

try:
    from fastapi import FastAPI, UploadFile, File, Form, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False

from .parser import DocumentParser
from .deterministic_rules import DeterministicRuleChecker
from .semantic_auditor import SemanticAuditor
from .pdf_generator import QAReportGenerator

if HAS_FASTAPI:
    app = FastAPI(
        title="KJPP NSR Technical Review & QA Engine",
        version="1.0.0",
        description="Quality Gatekeeper API compliant with SPI & KEPI"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.post("/api/v1/qa/upload")
    async def upload_and_audit(
        file: UploadFile = File(...),
        job_order_id: str = Form("JO-NSR-2026-0001"),
        uploaded_by: str = Form("Penilai Pelaksana")
    ) -> Dict[str, Any]:
        """
        Processes PDF upload, runs deterministic & semantic audits, and returns status verdict.
        """
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")

        # Save to temp
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        try:
            # 1. Parse
            parser = DocumentParser(tmp_path)
            parsed_data = parser.parse()
            parsed_data["file_name"] = file.filename

            # 2. Deterministic rules
            det_checker = DeterministicRuleChecker(parsed_data)
            det_findings = det_checker.run_all_checks()

            # 3. Semantic rules
            sem_auditor = SemanticAuditor(parsed_data)
            sem_findings = sem_auditor.run_all_audits()

            all_findings = det_findings + sem_findings

            # 4. Calculate verdict & score
            critical_count = sum(1 for f in all_findings if f["severity"] == "CRITICAL")
            major_count = sum(1 for f in all_findings if f["severity"] == "MAJOR")
            mod_count = sum(1 for f in all_findings if f["severity"] == "MODERATE")

            if critical_count > 0:
                verdict = "NOT_ACCEPTABLE"
                score = max(30.0, 60.0 - (critical_count * 15.0) - (major_count * 5.0))
            elif major_count > 0:
                verdict = "REQUIRES_MAJOR_REVISION"
                score = max(50.0, 75.0 - (major_count * 8.0) - (mod_count * 3.0))
            elif mod_count > 0:
                verdict = "ACCEPTABLE_WITH_REVISION"
                score = max(80.0, 92.0 - (mod_count * 3.0))
            else:
                verdict = "ACCEPTABLE"
                score = 98.0

            review_result = {
                "job_order_id": job_order_id,
                "file_name": file.filename,
                "file_hash": parsed_data["file_hash"],
                "total_pages": parsed_data["total_pages"],
                "uploaded_by": uploaded_by,
                "status": verdict,
                "compliance_score": round(score, 2),
                "findings": all_findings,
                "gate_nolap_unlocked": verdict in ["ACCEPTABLE", "ACCEPTABLE_WITH_REVISION"]
            }

            # 5. Generate Report PDF/HTML
            generator = QAReportGenerator(review_result)
            report_path = generator.save_report()
            review_result["report_path"] = report_path

            return review_result
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    @app.get("/api/v1/qa/health")
    def health():
        return {"status": "ok", "service": "NSR QA Engine"}
else:
    app = None
