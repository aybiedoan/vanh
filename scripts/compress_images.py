#!/usr/bin/env python3
"""
compress_images.py — Nén ảnh trong thư mục.

Cân bằng tốc độ / dung lượng / chất lượng:
  - JPEG: progressive, quality=85 (cấu hình qua --quality), subsampling 4:2:0
  - PNG : lossless tối ưu (compress_level=6). Cờ --aggressive để quantize palette.
  - WebP: lossy quality=85, method=6
  - Chạy đa tiến trình (ProcessPoolExecutor) để tận dụng nhiều CPU.
  - Backup (.bak) mặc định bật, tắt bằng --no-backup.

Cách dùng:
    pip install Pillow
    python scripts/compress_images.py --dir vanh/public/assets/img
    python scripts/compress_images.py --dir vanh/public/assets/img --quality 82 --workers 8
    python scripts/compress_images.py --dir vanh/public/assets/img --aggressive --no-backup
"""

from __future__ import annotations

import argparse
import hashlib
import os
import shutil
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

try:
    from PIL import Image

    Image.MAX_IMAGE_PIXELS = None  # cho phép ảnh lớn (poster, mockup...)
except ImportError:
    sys.exit("[!] Cần cài Pillow:  pip install Pillow")

SUPPORTED = {".jpg", ".jpeg", ".png", ".webp"}


def human_size(n: int) -> str:
    f = float(n)
    for unit in ("B", "KB", "MB", "GB"):
        if f < 1024:
            return f"{f:.1f}{unit}"
        f /= 1024
    return f"{f:.1f}TB"


def _compress_png(im: Image.Image, dst: Path, aggressive: bool) -> None:
    """Nén PNG lossless; nếu aggressive thì thử quantize và chỉ dùng khi nhỏ hơn rõ rệt."""
    # Bản lossless (giữ chất lượng tuyệt đối)
    im.save(dst, "PNG", optimize=True, compress_level=6)

    if not aggressive:
        return
    if im.mode not in ("RGB", "RGBA", "L", "LA"):
        return

    # Thử quantize palette, so sánh kích thước rồi mới quyết định
    try:
        quantized = im.quantize(colors=256, method=Image.FASTOCTREE)
    except Exception:
        return

    tmp_alts = dst.with_name(dst.stem + "__q.png")
    try:
        quantized.save(tmp_alts, "PNG", optimize=True, compress_level=9)
        # Chỉ chấp nhận quantize nếu tiết kiệm thực sự (>=20%)
        if tmp_alts.stat().st_size < dst.stat().st_size * 0.8:
            tmp_alts.replace(dst)
        else:
            tmp_alts.unlink(missing_ok=True)
    except Exception:
        tmp_alts.unlink(missing_ok=True)


def _file_hash(path: Path) -> str:
    """SHA-256 của nội dung file — fingerprint để nhận biết file đã nén hay chưa."""
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _write_marker(marker: Path, path: Path) -> None:
    """Ghi marker .compressed chứa hash hiện tại của file (im lặng nếu lỗi)."""
    try:
        marker.write_text(_file_hash(path))
    except Exception:
        pass


def compress_one(task) -> tuple[str, int, int, str]:
    path, quality, aggressive, backup = task
    path = Path(path)
    orig_size = path.stat().st_size
    if orig_size == 0:
        return str(path), 0, 0, "empty"

    # Bỏ qua nếu marker còn nguyên vẹn và khớp hash = nội dung chưa thay đổi
    marker = path.with_name(path.name + ".compressed")
    if marker.exists():
        try:
            if marker.read_text().strip() == _file_hash(path):
                return str(path), orig_size, orig_size, "skip-done"
        except Exception:
            pass

    tmp = path.with_name(path.name + ".tmp")
    tmp.unlink(missing_ok=True)  # dọn rác sót từ lần chạy trước

    try:
        with Image.open(path) as im:
            fmt = (im.format or "").upper()
            im.load()
            icc = im.info.get("icc_profile")
            exif = im.info.get("exif")

            if backup:
                bak = path.with_name(path.name + ".bak")
                if not bak.exists():
                    shutil.copy2(path, bak)

            suffix = path.suffix.lower()

            if fmt in ("JPEG", "JPG") or suffix in (".jpg", ".jpeg"):
                if im.mode not in ("RGB", "L"):
                    im = im.convert("RGB")
                kw = dict(
                    quality=quality,
                    progressive=True,
                    subsampling="4:2:0",
                    optimize=True,
                )
                if icc:
                    kw["icc_profile"] = icc
                if exif:
                    kw["exif"] = exif
                im.save(tmp, "JPEG", **kw)

            elif fmt == "PNG" or suffix == ".png":
                # Chuyển sang save dst=tmp
                _compress_png(im, tmp, aggressive)

            elif fmt == "WEBP" or suffix == ".webp":
                kw = dict(quality=quality, method=6)
                if icc:
                    kw["icc_profile"] = icc
                im.save(tmp, "WEBP", **kw)

            else:
                return str(path), orig_size, orig_size, f"skip-format({fmt})"

        new_size = tmp.stat().st_size

        if new_size < orig_size:
            tmp.replace(path)
            _write_marker(marker, path)
            return str(path), orig_size, new_size, "ok"
        else:
            tmp.unlink(missing_ok=True)
            _write_marker(marker, path)
            return str(path), orig_size, orig_size, "skip-bigger"

    except Exception as e:
        try:
            tmp.unlink(missing_ok=True)
        except Exception:
            pass
        return str(path), 0, 0, f"error: {e}"


def main() -> None:
    ap = argparse.ArgumentParser(description="Nén ảnh hàng loạt.")
    ap.add_argument(
        "--dir",
        default="./public/assets/img",
        help="Thư mục ảnh (mặc định: vanh/public/assets/img)",
    )
    ap.add_argument(
        "--quality",
        type=int,
        default=85,
        help="JPEG/WebP quality 1-100 (mặc định 85)",
    )
    ap.add_argument(
        "--workers",
        type=int,
        default=0,
        help="Số tiến trình; 0 = auto (= số CPU)",
    )
    ap.add_argument(
        "--no-backup",
        action="store_true",
        help="Không tạo file .bak (nhanh hơn, không khuyến nghị)",
    )
    ap.add_argument(
        "--aggressive",
        action="store_true",
        help="Quantize PNG để giảm mạnh dung lượng (có thể mất gradient)",
    )
    args = ap.parse_args()

    root = Path(args.dir)
    if not root.is_dir():
        sys.exit(f"[!] Không tìm thấy thư mục: {root}")

    files = [
        p
        for p in root.rglob("*")
        if p.is_file()
        and p.suffix.lower() in SUPPORTED
        and not p.name.endswith((".bak", ".tmp", ".compressed"))
    ]
    if not files:
        print("[i] Không có ảnh nào để nén.")
        return

    workers = args.workers or min(os.cpu_count() or 4, len(files))

    print(f"[i] Thư mục : {root}")
    print(f"[i] Số ảnh  : {len(files)}")
    print(f"[i] Quality : {args.quality}  |  Aggressive: {args.aggressive}  "
          f"|  Backup: {not args.no_backup}  |  Workers: {workers}")
    print()

    tasks = [(str(p), args.quality, args.aggressive, not args.no_backup) for p in files]

    t0 = time.time()
    total_before = total_after = 0
    ok_count = 0
    skipped = 0
    errors: list[tuple[str, str]] = []

    with ProcessPoolExecutor(max_workers=workers) as ex:
        futures = [ex.submit(compress_one, t) for t in tasks]
        for i, fut in enumerate(as_completed(futures), 1):
            name, before, after, status = fut.result()
            total_before += before
            total_after += after

            short = Path(name).relative_to(root)
            if status == "ok":
                ok_count += 1
                saved = before - after
                pct = (saved / before * 100) if before else 0
                print(
                    f"  [{i:>4}/{len(files)}] ✓ {short}  "
                    f"{human_size(before)} → {human_size(after)}  (-{pct:.0f}%)"
                )
            elif status.startswith("error"):
                errors.append((name, status))
                print(f"  [{i:>4}/{len(files)}] ✗ {short}  {status}")
            else:
                skipped += 1
                print(f"  [{i:>4}/{len(files)}] · {short}  {status}")

    dt = time.time() - t0
    saved = total_before - total_after
    pct_total = (saved / total_before * 100) if total_before else 0

    print()
    print(f"[✓] Hoàn tất trong {dt:.1f}s")
    print(f"    Nén thành công : {ok_count}")
    print(f"    Bỏ qua         : {skipped}")
    print(f"    Lỗi            : {len(errors)}")
    print(f"    Trước          : {human_size(total_before)}")
    print(f"    Sau            : {human_size(total_after)}")
    print(f"    Tiết kiệm      : {human_size(saved)}  ({pct_total:.1f}%)")
    if errors:
        print()
        print("[!] Chi tiết lỗi:")
        for n, s in errors:
            print(f"    - {n}: {s}")


if __name__ == "__main__":
    main()
