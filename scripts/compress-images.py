"""Re-encode the big photo PNGs as WebP for the site.

The originals live in assets-src/images/ (kept in the repo, never deployed);
the WebP copies go to public/images/, which is what content.ts points at.
Same pixel dimensions, so nothing is resized — only the encoding changes.

    python scripts/compress-images.py            # every file listed below
    python scripts/compress-images.py gloves.png # just one
    python scripts/compress-images.py portrait.jpg  # a THUMBS entry

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

# Small copies for places that show an image small — the plain page's intro
# portrait (the `thumb` of the About deck's hero image). The full-size file is
# served too, so these read from public/images/. Name -> width in pixels.
THUMBS = {"portrait.jpg": 320}


def report(src: Path, dst: Path) -> None:
    print(f"{src.name:22} {src.stat().st_size / 1024:8.0f} KB -> {dst.name:22} {dst.stat().st_size / 1024:6.0f} KB")


def main() -> None:
    names = sys.argv[1:] or [*PHOTOS, *THUMBS]
    for name in names:
        if name in THUMBS:
            src = OUT / name
            dst = OUT / (src.stem + "-thumb.webp")
            with Image.open(src) as im:
                width = THUMBS[name]
                im = im.convert("RGB").resize((width, round(im.height * width / im.width)), Image.LANCZOS)
                im.save(dst, "WEBP", quality=QUALITY, method=6)
        else:
            src = SRC / name
            dst = OUT / (src.stem + ".webp")
            with Image.open(src) as im:
                im.convert("RGB").save(dst, "WEBP", quality=QUALITY, method=6)
        report(src, dst)


if __name__ == "__main__":
    main()
