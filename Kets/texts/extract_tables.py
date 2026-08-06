"""Extract tabular data from Petrie 1926 register column PNGs using Claude Vision."""

import anthropic
import argparse
import base64
import csv
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
IMG_DIR = Path(__file__).parent / "1926 pngs of columns "
OUTPUT_CSV = REPO_ROOT / "data" / "qedet_1926.csv"

SYSTEM_PROMPT = """You are transcribing rows from a scanned column of Petrie's 1926 archaeological register of stone weights (QEDET section, weights 137-1524 grs).

The image shows a column of tabular data. Each row has up to 7 fields:
1. No. — catalog number (integer). Often blank; only printed at intervals (e.g. every 5 entries). Leave blank for intervening rows.
2. MATERIAL — abbreviated stone/material name (e.g. BAS., QUARTZITE, DIORITE, ALAB., GY.MARB., GY.SY., LIM., HAEM., BRUTE, etc.)
3. Hmm — shape/dimension code (integer mm, sometimes a range like 33-34, sometimes blank)
4. G.R.S. — weight in grams (number, may be integer or decimal)
5. x — multiplier (integer, often blank)
6. UNIT — unit weight (integer, often blank)
7. DETAIL — site/find code or note (e.g. XVII, XVI, MAHASN, GAUOB., KARAK.XVI, or blank)

Return ONLY a JSON array of objects, one per data row (skip header rows). Use empty string "" for blank cells. Do not include any markdown formatting or code fences."""

USER_PROMPT = """Transcribe every data row from this register column image into a JSON array. Each element should be:
{"No": "", "Material": "", "Form_mm": "", "GRS": "", "x": "", "Unit": "", "Detail": ""}

Return only the JSON array, no other text."""


def extract_rows_from_image(client: anthropic.Anthropic, image_path: Path) -> list[dict]:
    image_data = base64.standard_b64encode(image_path.read_bytes()).decode("utf-8")

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": image_data,
                        },
                    },
                    {"type": "text", "text": USER_PROMPT},
                ],
            }
        ],
    )

    raw = response.content[0].text.strip()
    # Strip markdown code fences if present
    raw = re.sub(r"^```[a-z]*\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)

    try:
        rows = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  WARNING: JSON parse failed for {image_path.name}: {e}", file=sys.stderr)
        print(f"  Raw response:\n{raw[:500]}", file=sys.stderr)
        return []

    if not isinstance(rows, list):
        print(f"  WARNING: Expected list, got {type(rows)} for {image_path.name}", file=sys.stderr)
        return []

    return rows


def get_sorted_column_images() -> list[Path]:
    images = list(IMG_DIR.glob("p*_col*.png"))

    def sort_key(p: Path):
        m = re.match(r"p(\d+)_col(\d+)", p.stem)
        if m:
            return (int(m.group(1)), int(m.group(2)))
        return (9999, 9999)

    return sorted(images, key=sort_key)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true", help="Test on p93_col1.png only")
    args = parser.parse_args()

    client = anthropic.Anthropic()

    if args.test:
        images = [IMG_DIR / "p93_col1.png"]
    else:
        images = get_sorted_column_images()

    print(f"Processing {len(images)} image(s)...")

    all_rows = []
    for img_path in images:
        m = re.match(r"p(\d+)_col(\d+)", img_path.stem)
        page = m.group(1) if m else "?"
        col = m.group(2) if m else "?"
        print(f"  {img_path.name} ...", end=" ", flush=True)

        rows = extract_rows_from_image(client, img_path)
        print(f"{len(rows)} rows")

        for row in rows:
            all_rows.append({
                "source_page": page,
                "source_col": col,
                "No": row.get("No", ""),
                "Material": row.get("Material", ""),
                "Form_mm": row.get("Form_mm", ""),
                "GRS": row.get("GRS", ""),
                "x": row.get("x", ""),
                "Unit": row.get("Unit", ""),
                "Detail": row.get("Detail", ""),
            })

    if args.test:
        print("\n--- Extracted rows (test mode) ---")
        for r in all_rows:
            print(r)
        print(f"\nTotal: {len(all_rows)} rows")
        print("\nReference (qedet_poc.py) has 67 rows for p93_col1.")
    else:
        OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
        fieldnames = ["source_page", "source_col", "No", "Material", "Form_mm", "GRS", "x", "Unit", "Detail"]
        with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_rows)
        print(f"\nWrote {len(all_rows)} rows to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
