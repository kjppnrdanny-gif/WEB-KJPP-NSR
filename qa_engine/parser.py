"""
qa_engine/parser.py
PDF Parser module using PyMuPDF (fitz) or pdfplumber with fallback stream reader.
Extracts text per page with bounding box coordinates, table data, and TOC metadata.
"""

import os
import re
import hashlib
from typing import Dict, List, Any, Optional

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False


class DocumentParser:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.file_name = os.path.basename(file_path)
        self.file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
        self.file_hash = self._calculate_sha256()

    def _calculate_sha256(self) -> str:
        if not os.path.exists(self.file_path):
            return ""
        sha = hashlib.sha256()
        with open(self.file_path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha.update(chunk)
        return sha.hexdigest()

    def parse(self) -> Dict[str, Any]:
        """
        Parses PDF document, returning text per page, metadata, tables, and TOC.
        """
        if HAS_FITZ:
            return self._parse_with_fitz()
        elif HAS_PDFPLUMBER:
            return self._parse_with_pdfplumber()
        else:
            return self._parse_fallback_raw()

    def _parse_with_fitz(self) -> Dict[str, Any]:
        doc = fitz.open(self.file_path)
        pages_data = []
        total_pages = len(doc)
        full_text_list = []

        toc = doc.get_toc()

        for page_num in range(total_pages):
            page = doc[page_num]
            text = page.get_text("text")
            full_text_list.append(text)

            # Words with bounding boxes (x0, y0, x1, y1, word, block_no, line_no, word_no)
            words = page.get_text("words")
            word_boxes = [
                {
                    "text": w[4],
                    "bbox": [w[0], w[1], w[2], w[3]],
                    "block": w[5],
                    "line": w[6]
                }
                for w in words
            ]

            pages_data.append({
                "page_number": page_num + 1,
                "text": text,
                "words": word_boxes,
                "width": page.rect.width,
                "height": page.rect.height
            })

        doc.close()

        return {
            "file_name": self.file_name,
            "file_size": self.file_size,
            "file_hash": self.file_hash,
            "total_pages": total_pages,
            "pages": pages_data,
            "full_text": "\n".join(full_text_list),
            "toc": toc
        }

    def _parse_with_pdfplumber(self) -> Dict[str, Any]:
        pages_data = []
        full_text_list = []
        with pdfplumber.open(self.file_path) as pdf:
            total_pages = len(pdf.pages)
            for idx, p in enumerate(pdf.pages):
                text = p.extract_text() or ""
                full_text_list.append(text)
                tables = p.extract_tables() or []
                pages_data.append({
                    "page_number": idx + 1,
                    "text": text,
                    "tables": tables,
                    "width": p.width,
                    "height": p.height
                })

        return {
            "file_name": self.file_name,
            "file_size": self.file_size,
            "file_hash": self.file_hash,
            "total_pages": total_pages,
            "pages": pages_data,
            "full_text": "\n".join(full_text_list),
            "toc": []
        }

    def _parse_fallback_raw(self) -> Dict[str, Any]:
        """
        Streamlined fallback reader using native zlib decompressed streams.
        """
        import zlib
        with open(self.file_path, "rb") as f:
            buf = f.read()

        pages_data = []
        full_text = []
        pos = 0
        page_counter = 1

        while True:
            stream_idx = buf.find(b"stream", pos)
            if stream_idx == -1:
                break
            end_stream_idx = buf.find(b"endstream", stream_idx)
            if end_stream_idx == -1:
                break

            stream_start = stream_idx + 6
            if buf[stream_start:stream_start+1] == b"\r":
                stream_start += 1
            if buf[stream_start:stream_start+1] == b"\n":
                stream_start += 1

            slice_bytes = buf[stream_start:end_stream_idx]
            try:
                uncompressed = zlib.decompress(slice_bytes).decode("latin1", errors="ignore")
                if "BT" in uncompressed:
                    # Extract string segments
                    tokens = []
                    bt_matches = re.findall(r"BT([\s\S]*?)ET", uncompressed)
                    for block in bt_matches:
                        tj_matches = re.findall(r"\[(.*?)\]\s*TJ", block)
                        for tm in tj_matches:
                            inner = re.findall(r"\(([^)]*)\)|(-?\d+(?:\.\d+)?)", tm)
                            line = ""
                            for s, num in inner:
                                if s:
                                    line += s
                                elif num and float(num) < -180:
                                    line += " "
                            if line:
                                tokens.append(line)
                        single_tj = re.findall(r"\(([^)]*)\)\s*Tj", block)
                        for st in single_tj:
                            tokens.append(st)

                    page_text = " ".join(tokens)
                    if len(page_text.strip()) > 30:
                        pages_data.append({
                            "page_number": page_counter,
                            "text": page_text,
                            "words": []
                        })
                        full_text.append(page_text)
                        page_counter += 1
            except Exception:
                pass

            pos = end_stream_idx + 9

        total_pages = max(1, len(pages_data))
        return {
            "file_name": self.file_name,
            "file_size": self.file_size,
            "file_hash": self.file_hash,
            "total_pages": total_pages,
            "pages": pages_data,
            "full_text": "\n".join(full_text),
            "toc": []
        }
