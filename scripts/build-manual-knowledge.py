#!/usr/bin/env python3
"""Build the simulator knowledge index from the reviewed DOCX manual."""

from __future__ import annotations

import hashlib
import json
import re
import unicodedata
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "Manual_Maestro_Integrado_Operacion_Respuestas_Betxico_2026.docx"
OUTPUT = ROOT / "knowledge" / "betxico-support-manual.v1.json"
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

SECTION_CATEGORIES = {
    "modelo de funcionamiento": "governance",
    "retiros": "withdrawal",
    "depositos y conciliacion": "deposit",
    "bonos y promociones": "bonus_rollover",
    "kyc identidad y documentos": "kyc_identity",
    "doble cuenta titularidad y devwallet": "devwallet",
    "casino juegos y saldo": "casino",
    "apuestas deportivas": "sports_bet",
    "cuenta acceso y datos": "account_access",
    "cierre bloqueo y juego responsable": "responsible_gaming",
    "reclamos y manejo de cliente molesto": "complaint",
    "seguimiento y mensajes generales": "ticket_followup",
    "solicitud de evidencias": "evidence_request",
    "plantillas internas jira slack y notas": "internal_template",
    "controles transversales": "governance",
}

FIELD_PREFIXES = {
    "REVISAR:": "review",
    "EVITAR:": "avoid",
    "ESCALAR / REGISTRAR:": "escalation",
    "BORRADOR PARA EL CLIENTE": "customerDraft",
    "PLANTILLA INTERNA": "internalTemplate",
    "REGLAS Y RUTA DE CONSULTA": "guidance",
}


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source manual: {SOURCE}")

    records, source_catalog = parse_manual(SOURCE)
    scenario_count = sum(record["kind"] in {"scenario", "template"} for record in records)
    payload = {
        "schemaVersion": 2,
        "knowledgeId": "betxico-support-manual-2026",
        "title": "Manual maestro integrado de operación y respuestas Betxico 2026",
        "scope": "simulator_preview",
        "source": {
            "artifact": f"repo:docs/{SOURCE.name}",
            "sha256": file_sha256(SOURCE),
            "observedAt": "2026-08-13T00:00:00.000Z",
            "extractedAt": "2026-08-13T00:00:00.000Z",
        },
        "safety": {
            "guidanceOnly": True,
            "requiresHumanReview": True,
            "canAuthorizeActions": False,
            "canConfirmCaseOutcome": False,
            "maxResultsPerLookup": 5,
        },
        "counts": {
            "records": len(records),
            "scenarios": scenario_count,
            "sources": len(source_catalog),
        },
        "sources": source_catalog,
        "records": records,
    }

    if scenario_count != 91:
        raise SystemExit(f"Expected 91 scenarios, found {scenario_count}")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "ok": True,
        "output": str(OUTPUT.relative_to(ROOT)),
        "records": len(records),
        "scenarios": scenario_count,
        "sha256": payload["source"]["sha256"],
    }, ensure_ascii=False))


def parse_manual(path: Path) -> tuple[list[dict], list[dict]]:
    with zipfile.ZipFile(path) as archive:
        styles = parse_styles(archive.read("word/styles.xml"))
        root = ET.fromstring(archive.read("word/document.xml"))

    body = root.find("w:body", NS)
    blocks = []
    for child in body if body is not None else []:
        if child.tag == f"{W}p":
            text = paragraph_text(child).strip()
            if not text:
                continue
            style_id = child.find("w:pPr/w:pStyle", NS)
            style = styles.get(style_id.get(f"{W}val"), "") if style_id is not None else ""
            blocks.append({"type": "paragraph", "style": style, "text": text})
        elif child.tag == f"{W}tbl":
            rows = []
            for row in child.findall("w:tr", NS):
                cells = []
                for cell in row.findall("w:tc", NS):
                    value = "\n".join(
                        paragraph_text(item).strip()
                        for item in cell.findall("w:p", NS)
                        if paragraph_text(item).strip()
                    )
                    cells.append(value)
                if any(cells):
                    rows.append(cells)
            if rows:
                blocks.append({"type": "table", "rows": rows})

    records = []
    section = ""
    section_blocks = []
    entry_title = ""
    entry_blocks = []
    started = False

    def flush_entry() -> None:
        nonlocal entry_title, entry_blocks
        if entry_title:
            records.append(build_record(section, entry_title, entry_blocks, "entry"))
        entry_title = ""
        entry_blocks = []

    def flush_section_intro() -> None:
        nonlocal section_blocks
        if section and section_blocks:
            records.append(build_record(section, section, section_blocks, "section"))
        section_blocks = []

    for block in blocks:
        style = normalize(block.get("style", ""))
        if block["type"] == "paragraph" and style == "heading 1":
            title = strip_section_number(block["text"])
            if normalize(title) == "modelo de funcionamiento":
                started = True
            if not started:
                continue
            flush_entry()
            flush_section_intro()
            section = title
            continue
        if not started or not section:
            continue
        if block["type"] == "paragraph" and style == "heading 2":
            flush_entry()
            flush_section_intro()
            entry_title = strip_section_number(block["text"])
            continue
        if entry_title:
            entry_blocks.append(block)
        else:
            section_blocks.append(block)

    flush_entry()
    flush_section_intro()
    records = [record for record in records if any([
        record["content"],
        record["tables"],
        record["review"],
        record["avoid"],
        record["guidance"],
        record["customerDraft"],
        record["internalTemplate"],
        record["escalation"],
    ])]
    source_catalog = extract_source_catalog(blocks)
    source_by_id = {source["id"]: source for source in source_catalog}
    policy_refs = {
        record["category"]: record["sourceRefs"]
        for record in records
        if record["kind"] == "policy" and record["category"] != "governance"
    }
    for record in records:
        inherited = policy_refs.get(record["category"], []) if record["kind"] in {"scenario", "template"} else []
        record["sourceRefs"] = sorted(set(["M1", *record["sourceRefs"], *inherited]))
        record["provenance"] = [
            {
                "sourceRef": ref,
                "authority": "internal" if ref == "M1" else "official",
                "observedAt": "2026-08-13T00:00:00.000Z",
                "title": source_by_id.get(ref, {}).get("title", ""),
            }
            for ref in record["sourceRefs"]
        ]
        record["freshness"] = record_freshness(record)
        record["requiredEvidence"] = required_evidence(record)
        record["humanGate"] = {
            "reviewRequired": True,
            "canAutoSend": False,
            "canAuthorize": False,
        }
    return records, source_catalog


def build_record(section: str, title: str, blocks: list[dict], level: str) -> dict:
    category = SECTION_CATEGORIES.get(normalize(section), "general")
    kind = record_kind(section, level)
    fields = {
        "review": [],
        "avoid": [],
        "guidance": [],
        "customerDraft": "",
        "internalTemplate": "",
        "escalation": "",
    }
    content = []
    tables = []
    rules = []

    for block in blocks:
        if block["type"] == "table":
            table = table_to_object(block["rows"])
            tables.append(table)
            rules.extend(table_rules(table))
            continue
        text = re.sub(r"\s+", " ", block["text"].replace("\n", " ")).strip()
        if not text or text in {"PARTE I", "PARTE II", "PARTE III"}:
            continue
        matched = False
        for prefix, field in FIELD_PREFIXES.items():
            if text.upper().startswith(prefix):
                value = text[len(prefix):].lstrip(" :").strip()
                if field in {"review", "avoid", "guidance"}:
                    if value:
                        fields[field].append(value)
                elif value:
                    fields[field] = value
                matched = True
                break
        if not matched:
            if normalize(block.get("style", "")) == "list bullet":
                fields["guidance"].append(text)
            else:
                content.append(text)

    combined = " ".join([
        section,
        title,
        *content,
        *fields["review"],
        *fields["avoid"],
        *fields["guidance"],
        fields["customerDraft"],
        fields["internalTemplate"],
        fields["escalation"],
        json.dumps(tables, ensure_ascii=False),
    ])
    source_refs = sorted(set(re.findall(r"\b(?:M1|F\d{1,2})\b", combined)))
    record_id = f"{category}.{slug(title)}"
    return {
        "id": record_id,
        "kind": kind,
        "category": category,
        "section": section,
        "title": title,
        "content": content,
        "review": fields["review"],
        "avoid": fields["avoid"],
        "guidance": fields["guidance"],
        "customerDraft": fields["customerDraft"],
        "internalTemplate": fields["internalTemplate"],
        "escalation": fields["escalation"],
        "tables": tables,
        "rules": rules,
        "sourceRefs": source_refs,
        "searchText": normalize(combined),
    }


def record_kind(section: str, level: str) -> str:
    normalized = normalize(section)
    if level == "section" or normalized == "modelo de funcionamiento":
        return "policy"
    if normalized == "plantillas internas jira slack y notas":
        return "template"
    if normalized == "controles transversales":
        return "control"
    return "scenario"


def table_to_object(rows: list[list[str]]) -> dict:
    if len(rows) > 1 and all(rows[0]):
        headers = [clean_key(value, index) for index, value in enumerate(rows[0])]
        return {
            "headers": rows[0],
            "rows": [
                {headers[index]: value for index, value in enumerate(row) if index < len(headers)}
                for row in rows[1:]
            ],
        }
    return {"headers": [], "rows": rows}


def table_rules(table: dict) -> list[str]:
    rules = []
    headers = table.get("headers", [])
    rows = table.get("rows", [])
    if headers:
        for row in rows:
            rules.append("; ".join(
                f"{headers[index]}: {row.get(clean_key(header, index), '')}"
                for index, header in enumerate(headers)
                if row.get(clean_key(header, index), "")
            ))
    else:
        for row in rows:
            if isinstance(row, list):
                rules.extend(value.replace("\n", ": ", 1) for value in row if value)
    return [re.sub(r"\s+", " ", value).strip() for value in rules if value.strip()]


def record_freshness(record: dict) -> dict:
    if record["category"] == "bonus_rollover":
        return {
            "mode": "live_required",
            "status": "ambiguous",
            "reason": "Las promociones visibles y sus umbrales pueden cambiar o presentar texto contradictorio.",
        }
    if any(word in record["searchText"] for word in ["variable", "vigente", "confirmar fuente", "confirmacion"]):
        return {
            "mode": "dated",
            "status": "current",
            "reason": "Confirmar el dato variable en una fuente operativa vigente antes de afirmarlo.",
        }
    return {"mode": "static", "status": "current", "reason": "Guia operativa revisada."}


def required_evidence(record: dict) -> list[dict]:
    sources = []
    if record["category"] == "withdrawal":
        sources = ["atena", "jira", "slack_list_8"]
    elif record["category"] == "deposit":
        sources = ["atena"]
    elif record["category"] == "kyc_identity":
        sources = ["kyc"]
    elif record["category"] == "bonus_rollover":
        sources = ["live_promotion"]
    return [{"source": source, "maxAgeSeconds": 300} for source in sources]


def extract_source_catalog(blocks: list[dict]) -> list[dict]:
    paragraphs = [block["text"].strip() for block in blocks if block["type"] == "paragraph"]
    catalog = []
    for index, text in enumerate(paragraphs):
        match = re.match(r"^(M1|F\d{1,2})\s{2,}(.+)$", text)
        if not match:
            continue
        source_id, title = match.groups()
        location = paragraphs[index + 1] if index + 1 < len(paragraphs) else ""
        note = paragraphs[index + 2] if index + 2 < len(paragraphs) else ""
        catalog.append({"id": source_id, "title": title, "location": location, "note": note})
    return catalog


def parse_styles(xml: bytes) -> dict[str, str]:
    root = ET.fromstring(xml)
    styles = {}
    for style in root.findall("w:style", NS):
        style_id = style.get(f"{W}styleId", "")
        name = style.find("w:name", NS)
        styles[style_id] = name.get(f"{W}val", "") if name is not None else style_id
    return styles


def paragraph_text(paragraph: ET.Element) -> str:
    parts = []
    for item in paragraph.iter():
        if item.tag == f"{W}t":
            parts.append(item.text or "")
        elif item.tag == f"{W}tab":
            parts.append("\t")
        elif item.tag in {f"{W}br", f"{W}cr"}:
            parts.append("\n")
    return "".join(parts)


def strip_section_number(value: str) -> str:
    return re.sub(r"^\d+\.\s*", "", value).strip()


def normalize(value: str) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def slug(value: str) -> str:
    return normalize(value).replace(" ", "-")[:100] or "registro"


def clean_key(value: str, index: int) -> str:
    key = normalize(value).replace(" ", "_")[:60]
    return key or f"columna_{index + 1}"


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


if __name__ == "__main__":
    main()
