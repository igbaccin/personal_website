"""Regenerate the banner and portrait WebPs by hand after replacing an original."""
from pathlib import Path

from PIL import Image


def generate(images):
    for original, widths in (("banner-research.webp", (960, 1440)),
                             ("banner-projects.webp", (960, 1440)),
                             ("me.jpg", (400, 563))):
        with Image.open(images / original) as source:
            profile = source.info.get("icc_profile", b"")
            rgb = source.convert("RGB")
        for width in widths:
            size = (width, round(rgb.height * width / rgb.width))
            output = images / f"{Path(original).stem}-{width}.webp"
            rgb.resize(size, Image.Resampling.LANCZOS).save(output, quality=92, method=6, icc_profile=profile)
            print(f"{output.name} {size[0]} x {size[1]}")


if __name__ == "__main__":
    generate(Path(__file__).resolve().parents[1] / "images")
