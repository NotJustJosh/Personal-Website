"""Re-encode the big photo PNGs as WebP for the site.

The originals live in assets-src/images/ (kept in the repo, never deployed);
the WebP copies go to public/images/, which is what content.ts points at.
Same pixel dimensions, so nothing is resized — only the encoding changes.

    python scripts/compress-images.py            # every file listed below
    python scripts/compress-images.py gloves.png # just one

Needs Pillow (`pip install pillow`). Re-run after replacing an original.
"""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src" / "images"
OUT = ROOT / "public" / "images"

# Photos only: a lossy encode suits them. Logos, diagrams and the paper scan
# stay as they are.
PHOTOS = ["gloves.png", "gloves-two.png", "aqua-project.png", "spider-robot.png"]
QUALITY = 82


def main() -> None:
    names = sys.argv[1:] or PHOTOS
    for name in names:
        src = SRC / name
        dst = OUT / (src.stem + ".webp")
        with Image.open(src) as im:
            im.convert("RGB").save(dst, "WEBP", quality=QUALITY, method=6)
        print(f"{name:22} {src.stat().st_size / 1024:8.0f} KB -> {dst.name:22} {dst.stat().st_size / 1024:6.0f} KB")


if __name__ == "__main__":
    main()
