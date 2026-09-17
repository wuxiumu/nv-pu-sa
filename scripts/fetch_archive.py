#!/usr/bin/env python3
"""从 nv-pu-sa Pages + R2 拉取全量 archive，并生成 enriched 数据。"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DEFAULT_RUNTIME = "https://nv-pu-sa.pages.dev/runtime-config.json"
UA = "nv-pu-sa-fetch/1.0 (+https://github.com/wuxiumu/nv-pu-sa)"


def get_json(url: str) -> object:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def resolve_avatar(avatar_url: str, r2: str) -> str:
    av = avatar_url or ""
    if av.startswith("/api/media"):
        qs = urllib.parse.urlparse(av).query
        key = urllib.parse.parse_qs(qs).get("key", [""])[0]
        return f"{r2}/{key}" if key else ""
    if av.startswith("http"):
        return av
    return f"{r2}/{av.lstrip('/')}" if av else ""


def enrich(items: list, r2: str) -> list:
    out = []
    for item in items:
        row = dict(item)
        row["avatar_resolved"] = resolve_avatar(item.get("avatar_url") or "", r2)
        out.append(row)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="Fetch nv-pu-sa R2 archive.json")
    ap.add_argument("--runtime-config", default=DEFAULT_RUNTIME)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    print(f"runtime-config ← {args.runtime_config}")
    try:
        cfg = get_json(args.runtime_config)
    except urllib.error.URLError as e:
        print(f"ERROR: 无法读取 runtime-config: {e}", file=sys.stderr)
        return 1

    if not isinstance(cfg, dict) or not cfg.get("r2_public_domain"):
        print("ERROR: runtime-config 缺少 r2_public_domain", file=sys.stderr)
        return 1

    r2 = str(cfg["r2_public_domain"]).rstrip("/")
    archive_url = f"{r2}/data/archive.json"
    print(f"archive ← {archive_url}")

    raw = get_json(archive_url)
    if not isinstance(raw, list):
        print("ERROR: archive.json 不是数组", file=sys.stderr)
        return 1

    enriched = enrich(raw, r2)
    meta = {
        "source": "https://nv-pu-sa.pages.dev/",
        "runtime_config": args.runtime_config,
        "r2_public_domain": r2,
        "archive_url": archive_url,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "count": len(enriched),
    }

    print(f"count = {len(enriched)}")
    if args.dry_run:
        print("dry-run: 不写盘")
        return 0

    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / "runtime-config.json").write_text(
        json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (DATA / "archive.json").write_text(
        json.dumps(raw, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (DATA / "archive.enriched.json").write_text(
        json.dumps(enriched, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (DATA / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"wrote → {DATA}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
