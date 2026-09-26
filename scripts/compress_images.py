#!/usr/bin/env python3
"""
compress_images.py — Chuẩn hoá toàn bộ ảnh về WebP + tối ưu nén.

Chiến lược:
  - Mọi ảnh (jpg/jpeg/png/webp) đều được xuất ra .webp.
  - Ảnh .jpg/.png: tạo file .webp mới, xoá file gốc (giữ .bak nếu bật backup).
  - Ảnh .webp: re-encode tại chỗ (chỉ ghi đè nếu nhỏ hơn).
  - Nén lossy: quality=85 (cấu hình qua --quality), method=6 (max), smart_subsample,
    alpha_quality=100, exact=True — giữ ICC/EXIF.
  - PNG có alpha: tuỳ chọn --lossless-png để dùng WebP lossless (giữ trong suốt tuyệt đối).
  - Chạy đa tiến trình (ProcessPoolExecutor).
  - Luỹ đẳng: marker .compressed lưu SHA-256 của file OUTPUT; chạy lại sẽ bỏ qua.

Cách dùng:
    pip install Pillow
    python scripts/compress_images.py --dir vanh/public/assets/img
    python scripts/compress_images.py --dir vanh/public/assets/img --quality 82 --workers 8
    python scripts/compress_images.py --dir vanh/public/assets/img --lossless-png
    python scripts/compress_images.py --dir vanh/public/assets/img --no-backup

LƯU Ý QUAN TRỌNG:
    Script này ĐỔI ĐUÔI file (jpg/png → webp). Mọi tham chiếu trong code
    (ví dụ '/assets/img/photo.jpg') sẽ hỏng. Sau khi chạy, cần cập nhật
    đường dẫn trong code sang '.webp' (hoặc dùng helper asset() để tự đổi đuôi).
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


def _has_alpha(im: Image.Image) -> bool:
    """Kiểm tra ảnh có kênh trong suốt thực sự hay không."""
    if im.mode in ("RGBA", "LA"):
        return True
    if im.mode == "P" and "transparency" in im.info:
        return True
    return False


def compress_one(task) -> tuple[str, int, int, str]:
    path, quality, backup, lossless_png = task
    path = Path(path)
    orig_size = path.stat().st_size
    if orig_size == 0:
        return str(path), 0, 0, "empty"

    is_webp_input = path.suffix.lower() == ".webp"
    target = path if is_webp_input else path.with_suffix(".webp")

    # Luỹ đẳng: nếu target đã tồn tại và marker khớp hash → bỏ qua
    marker = target.with_name(target.name + ".compressed")
    if target.exists() and marker.exists():
        try:
            if marker.read_text().strip() == _file_hash(target):
                return str(path), orig_size, target.stat().st_size, "skip-done"
        except Exception:
            pass

    tmp = target.with_name(target.name + ".tmp")
    tmp.unlink(missing_ok=True)  # dọn rác sót từ lần chạy trước

    try:
        with Image.open(path) as im:
            im.load()
            icc = im.info.get("icc_profile")
            exif = im.info.get("exif")

            # Backup file gốc (chỉ khi input không phải webp — vì webp input = target)
            if backup and not is_webp_input:
                bak = path.with_name(path.name + ".bak")
                if not bak.exists():
                    shutil.copy2(path, bak)

            has_alpha = _has_alpha(im)
            use_lossless = lossless_png and has_alpha

            # Chuẩn hoá mode cho WebP
            if has_alpha:
                if im.mode != "RGBA":
                    im = im.convert("RGBA")
            else:
                if im.mode not in ("RGB", "L"):
                    im = im.convert("RGB")

            kw: dict = {"method": 6}
            if use_lossless:
                kw["lossless"] = True
                kw["quality"] = 100  # bị bỏ qua khi lossless
            else:
                kw["quality"] = quality
                kw["smart_subsample"] = True   # chọn subsampling thông minh theo vùng
                kw["alpha_quality"] = 100      # giữ chất lượng kênh alpha tối đa
                kw["exact"] = True             # giữ nguyên RGB ở pixel trong suốt hoàn toàn

            if icc:
                kw["icc_profile"] = icc
            if exif:
                kw["exif"] = exif

            im.save(tmp, "WEBP", **kw)

        new_size = tmp.stat().st_size

        if is_webp_input:
            # Re-encode tại chỗ: chỉ ghi đè nếu nhỏ hơn
            if new_size < orig_size:
                tmp.replace(target)
                _write_marker(marker, target)
                return str(path), orig_size, new_size, "ok"
            else:
                tmp.unlink(missing_ok=True)
                _write_marker(marker, target)
                return str(path), orig_size, orig_size, "skip-bigger"
        else:
            # Chuyển đổi định dạng: luôn chấp nhận, xoá file gốc
            tmp.replace(target)
            _write_marker(marker, target)
            try:
                path.unlink()
            except Exception:
                pass
            return str(path), orig_size, new_size, "converted"

    except Exception as e:
        try:
            tmp.unlink(missing_ok=True)
        except Exception:
            pass
        return str(path), 0, 0, f"error: {e}"


def main() -> None:
    ap = argparse.ArgumentParser(description="Chuẩn hoá ảnh về WebP + tối ưu nén.")
    ap.add_argument(
        "--dir",
        default="./public/assets/img",
        help="Thư mục ảnh (mặc định: ./public/assets/img)",
    )
    ap.add_argument(
        "--quality",
        type=int,
        default=85,
        help="WebP lossy quality 1-100 (mặc định 85)",
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
        help="Không tạo file .bak cho ảnh gốc (nhanh hơn, không khuyến nghị)",
    )
    ap.add_argument(
        "--lossless-png",
        action="store_true",
        help="Dùng WebP lossless cho ảnh có kênh alpha (giữ trong suốt tuyệt đối)",
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

    print(f"[i] Thư mục     : {root}")
    print(f"[i] Số ảnh      : {len(files)}")
    print(f"[i] Quality     : {args.quality}  |  Lossless PNG: {args.lossless_png}  "
          f"|  Backup: {not args.no_backup}  |  Workers: {workers}")
    print(f"[i] Đích        : tất cả → .webp")
    print()

    tasks = [(str(p), args.quality, not args.no_backup, args.lossless_png) for p in files]

    t0 = time.time()
    total_before = total_after = 0
    ok_count = 0
    converted = 0
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
            elif status == "converted":
                converted += 1
                saved = before - after
                pct = (saved / before * 100) if before else 0
                print(
                    f"  [{i:>4}/{len(files)}] → {short}  "
                    f"{human_size(before)} → {human_size(after)}.webp  (-{pct:.0f}%)"
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
    print(f"    Re-encode      : {ok_count}")
    print(f"    Chuyển WebP    : {converted}")
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
