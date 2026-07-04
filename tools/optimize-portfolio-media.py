from __future__ import annotations

import re
import sys
import urllib.request
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps


REPO_ROOT = Path(__file__).resolve().parents[2]
PORTFOLIO_VIEW = REPO_ROOT / "siteportfolio" / "src" / "PortfolioView.tsx"
PUBLIC_OPTIMIZED_DIR = REPO_ROOT / "apps" / "portfolio" / "public" / "assets" / "optimized"
MANIFEST_PATH = REPO_ROOT / "siteportfolio" / "src" / "optimized-images.ts"


@dataclass(frozen=True)
class OptimizedVariant:
    width: int
    path: str


def slug_from_url(url: str) -> str:
    name = url.rstrip("/").split("/")[-1].split("?")[0]
    stem = re.sub(r"\.[a-zA-Z0-9]+$", "", name)
    stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", stem).strip("-")
    return stem or "image"


def collect_image_urls() -> list[str]:
    content = PORTFOLIO_VIEW.read_text(encoding="utf-8")
    urls = re.findall(r'src:\s*"([^"]+\.(?:png|jpe?g|webp|avif)(?:\?[^"]*)?)"', content, flags=re.I)
    return sorted(set(urls))


def fetch_image(url: str) -> Image.Image:
    request = urllib.request.Request(url, headers={"User-Agent": "portfolio-media-optimizer/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        data = response.read()

    image = Image.open(BytesIO(data))
    return ImageOps.exif_transpose(image).convert("RGB")


def target_widths(width: int) -> list[int]:
    widths = [480, 768, 1120, 1600]
    selected = [candidate for candidate in widths if candidate < width]

    if width not in selected:
        selected.append(width)

    return sorted(set(selected))


def save_variants(url: str, image: Image.Image) -> list[OptimizedVariant]:
    slug = slug_from_url(url)
    original_width, original_height = image.size
    variants: list[OptimizedVariant] = []

    for width in target_widths(original_width):
        if width == original_width:
            resized = image
        else:
            height = round(original_height * (width / original_width))
            resized = image.resize((width, height), Image.Resampling.LANCZOS)

        file_name = f"{slug}-{width}.webp"
        output_path = PUBLIC_OPTIMIZED_DIR / file_name
        resized.save(output_path, "WEBP", quality=78, method=6)
        variants.append(OptimizedVariant(width=width, path=f"/assets/optimized/{file_name}"))

    return variants


def write_manifest(manifest: dict[str, list[OptimizedVariant]]) -> None:
    lines = [
        "export type OptimizedImageSource = {",
        "  type: string;",
        "  srcSet: string;",
        "  sizes: string;",
        "};",
        "",
        "export const optimizedImageSources: Record<string, OptimizedImageSource> = {",
    ]

    for url, variants in sorted(manifest.items()):
        src_set = ", ".join(f"{variant.path} {variant.width}w" for variant in variants)
        lines.extend(
            [
                f"  {url!r}: {{",
                '    type: "image/webp",',
                f"    srcSet: {src_set!r},",
                '    sizes: "(max-width: 640px) calc(100vw - 44px), (max-width: 1100px) calc(100vw - 56px), 820px",',
                "  },",
            ]
        )

    lines.append("};")
    lines.append("")

    MANIFEST_PATH.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    PUBLIC_OPTIMIZED_DIR.mkdir(parents=True, exist_ok=True)
    urls = collect_image_urls()

    if not urls:
      print("No image URLs found.")
      return 0

    manifest: dict[str, list[OptimizedVariant]] = {}

    for url in urls:
        print(f"[optimize] {url}")
        image = fetch_image(url)
        variants = save_variants(url, image)
        manifest[url] = variants
        original_width, original_height = image.size
        variant_summary = ", ".join(f"{variant.width}w" for variant in variants)
        print(f"  source={original_width}x{original_height}; variants={variant_summary}")

    write_manifest(manifest)
    print(f"[optimize] wrote {MANIFEST_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
