#!/usr/bin/env python3
"""
restore_images.py — Khôi phục ảnh gốc từ file .bak và dọn dẹp các file do
compress_images.py tạo ra.

Hành vi:
  1. Với mỗi file *.bak trong thư mục:
     - Xoá file .webp tương ứng (nếu có) — đây là file đã được chuyển đổi.
     - Xoá marker .webp.compressed tương ứng (nếu có).
     - Đổi tên *.bak → tên gốc (bỏ đuôi .bak).
  2. Xoá toàn bộ file *.tmp còn sót lại.
  3. Xoá các marker .compressed mồ côi (không còn .webp tương ứng).
  4. (Tuỳ chọn --purge-webp) Xoá TẤT CẢ file .webp còn lại — kể cả file .webp
     gốc không có .bak. Cảnh báo: thao tác này không thể hoàn tác.

Cách dùng:
    python scripts/restore_images.py --dir vanh/public/assets/img
    python scripts/restore_images.py --dir vanh/public/assets/img --dry-run
    python scripts/restore_images.py --dir vanh/public/assets/img --purge-webp
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def human_size(n: int) -> str:
    f = float(n)
    for unit in ("B", "KB", "MB", "GB"):
        if f < 1024:
            return f"{f:.1f}{unit}"
        f /= 1024
    return f"{f:.1f}TB"


def main() -> None:
    ap = argparse.ArgumentParser(description="Khôi phục ảnh gốc từ .bak.")
    ap.add_argument(
        "--dir",
        default="./public/assets/img",
        help="Thư mục ảnh (mặc định: ./public/assets/img)",
    )
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="Chỉ in ra những gì sẽ làm, không thực sự thay đổi file.",
    )
    ap.add_argument(
        "--purge-webp",
        action="store_true",
        help="Xoá TẤT CẢ file .webp còn lại (kể cả .webp gốc không có .bak).",
    )
    args = ap.parse_args()

    root = Path(args.dir)
    if not root.is_dir():
        sys.exit(f"[!] Không tìm thấy thư mục: {root}")

    dry = args.dry_run
    prefix = "[dry-run] " if dry else ""

    # ─── Bước 1: Khôi phục từ .bak ─────────────────────────────────────────
    bak_files = sorted(p for p in root.rglob("*.bak") if p.is_file())
    restored = 0
    deleted_webp = 0
    deleted_marker = 0

    for bak in bak_files:
        original = bak.with_suffix("")  # bỏ đuôi .bak
        webp = original.with_suffix(".webp")
        marker = webp.with_name(webp.name + ".compressed")

        # Xoá file .webp đã chuyển đổi (nếu có và khác file gốc)
        if webp.exists() and webp != original:
            size = webp.stat().st_size
            print(f"  {prefix}✗ xoá {webp.relative_to(root)}  ({human_size(size)})")
            if not dry:
                webp.unlink()
            deleted_webp += 1

        # Xoá marker
        if marker.exists():
            print(f"  {prefix}✗ xoá {marker.relative_to(root)}")
            if not dry:
                marker.unlink()
            deleted_marker += 1

        # Khôi phục file gốc
        if original.exists():
            print(f"  {prefix}! {original.relative_to(root)} đã tồn tại — ghi đè bằng .bak")
            if not dry:
                original.unlink()
        print(f"  {prefix}✓ khôi phục {bak.relative_to(root)} → {original.relative_to(root)}")
        if not dry:
            bak.rename(original)
        restored += 1

    # ─── Bước 2: Xoá file .tmp còn sót ─────────────────────────────────────
    tmp_files = sorted(p for p in root.rglob("*.tmp") if p.is_file())
    deleted_tmp = 0
    for tmp in tmp_files:
        print(f"  {prefix}✗ xoá {tmp.relative_to(root)}")
        if not dry:
            tmp.unlink()
        deleted_tmp += 1

    # ─── Bước 3: Xoá marker mồ côi (không có .webp tương ứng) ──────────────
    orphan_markers = sorted(
        p for p in root.rglob("*.compressed")
        if p.is_file() and not p.with_suffix("").exists()
    )
    deleted_orphan = 0
    for m in orphan_markers:
        print(f"  {prefix}✗ xoá marker mồ côi {m.relative_to(root)}")
        if not dry:
            m.unlink()
        deleted_orphan += 1

    # ─── Bước 4 (tuỳ chọn): Xoá toàn bộ .webp còn lại ─────────────────────
    deleted_purge = 0
    if args.purge_webp:
        remaining_webp = sorted(p for p in root.rglob("*.webp") if p.is_file())
        for w in remaining_webp:
            print(f"  {prefix}✗ xoá (purge) {w.relative_to(root)}")
            if not dry:
                w.unlink()
            deleted_purge += 1

    # ─── Tổng kết ──────────────────────────────────────────────────────────
    print()
    print(f"[✓] {'(dry-run) ' if dry else ''}Hoàn tất")
    print(f"    Khôi phục từ .bak     : {restored}")
    print(f"    Xoá .webp (đã chuyển) : {deleted_webp}")
    print(f"    Xoá marker            : {deleted_marker}")
    print(f"    Xoá marker mồ côi     : {deleted_orphan}")
    print(f"    Xoá .tmp              : {deleted_tmp}")
    if args.purge_webp:
        print(f"    Xoá .webp (purge)     : {deleted_purge}")


if __name__ == "__main__":
    main()
