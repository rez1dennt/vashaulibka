from __future__ import annotations

import sys
from io import BytesIO
from os import replace
from pathlib import Path

from PIL import Image, ImageOps
from pypdf import PdfReader, PdfWriter


MAXIMUM_OUTPUT_BYTES = 95_000_000


def prepared_page(page, index: int) -> Image.Image:
    images = list(page.images)
    if len(images) != 1:
        raise ValueError(f"page {index + 1} contains {len(images)} images instead of one")

    image = images[0].image
    if index == 0:
        return image.convert("RGB")

    threshold = 190
    grayscale = ImageOps.autocontrast(image.convert("L"), cutoff=0.2)
    return grayscale.point(lambda value: 255 if value >= threshold else 0, mode="1")


def optimize(input_path: Path, output: Path, expected_pages: int) -> None:
    source = PdfReader(str(input_path))
    if len(source.pages) != expected_pages:
        raise ValueError(
            f"source page count mismatch: expected {expected_pages}, got {len(source.pages)}"
        )

    writer = PdfWriter()
    page_buffers: list[BytesIO] = []
    for index, page in enumerate(source.pages):
        image = prepared_page(page, index)
        buffer = BytesIO()
        save_options = {
            "format": "PDF",
            "resolution": 300.0,
        }
        if image.mode == "RGB":
            save_options.update({"quality": 78, "optimize": True})
        image.save(buffer, **save_options)
        image.close()
        buffer.seek(0)
        single_page = PdfReader(buffer)
        writer.add_page(single_page.pages[0])
        page_buffers.append(buffer)

        if (index + 1) % 50 == 0 or index + 1 == expected_pages:
            print(f"prepared {index + 1}/{expected_pages}", flush=True)

    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = Path(f"{output}.tmp")
    temporary.unlink(missing_ok=True)
    try:
        with temporary.open("wb") as stream:
            writer.write(stream)

        with temporary.open("rb") as stream:
            if stream.read(4) != b"%PDF":
                raise ValueError("optimized output does not have a PDF signature")

        result = PdfReader(str(temporary))
        if len(result.pages) != expected_pages:
            raise ValueError(
                f"output page count mismatch: expected {expected_pages}, got {len(result.pages)}"
            )
        for index, page in enumerate(result.pages):
            box = page.mediabox
            if float(box.width) <= 0 or float(box.height) <= 0:
                raise ValueError(f"output page {index + 1} has an invalid media box")

        if temporary.stat().st_size >= MAXIMUM_OUTPUT_BYTES:
            raise ValueError(
                f"optimized output is {temporary.stat().st_size} bytes; limit is {MAXIMUM_OUTPUT_BYTES - 1}"
            )

        replace(temporary, output)
    except BaseException:
        temporary.unlink(missing_ok=True)
        raise
    finally:
        for buffer in page_buffers:
            buffer.close()


def main() -> int:
    if len(sys.argv) != 4:
        print(
            "usage: optimize-scanned-regulation.py INPUT OUTPUT EXPECTED_PAGES",
            file=sys.stderr,
        )
        return 2

    try:
        optimize(Path(sys.argv[1]), Path(sys.argv[2]), int(sys.argv[3]))
    except BaseException as error:
        print(f"optimization failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
