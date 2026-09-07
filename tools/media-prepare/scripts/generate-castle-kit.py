#!/usr/bin/env python3
"""
Generate the complete Birthday Castle Approach scenery kit, shared library addition,
and interactive cutouts using direct OpenAI Images API calls with parallel execution.
"""

import concurrent.futures
import hashlib
import json
import os
import sys
import time
import urllib.request
import urllib.error

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

PRICING_PER_1M_TOKENS = {
    "text_in": 5.00,
    "image_in": 8.00,
    "image_out": 30.00,
}

def calculate_cost(text_in: int, img_in: int, img_out: int) -> float:
    cost = (
        (text_in * PRICING_PER_1M_TOKENS["text_in"] / 1_000_000)
        + (img_in * PRICING_PER_1M_TOKENS["image_in"] / 1_000_000)
        + (img_out * PRICING_PER_1M_TOKENS["image_out"] / 1_000_000)
    )
    return round(cost, 6)

def generate_image(api_key: str, item: dict) -> dict:
    prompt = item["prompt"]
    output_path = item["output"]
    size = item["size"]
    transparent = item["transparent"]
    model = "gpt-image-2"

    if os.path.exists(output_path):
        print(f"Skipping existing: {os.path.basename(output_path)}", flush=True)
        with open(output_path, "rb") as f:
            sha256 = hashlib.sha256(f.read()).hexdigest()
        meta_path = output_path + ".meta.json"
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                meta = json.load(f)
                meta["id"] = item["id"]
                meta["role"] = item["role"]
                return meta
        return {
            "id": item["id"],
            "role": item["role"],
            "model": model,
            "size": size,
            "output": output_path,
            "sha256": sha256,
            "background": "transparent" if transparent else "opaque",
            "estimatedCostUsd": 0.0,
            "prompt": prompt,
        }

    background = "transparent" if transparent else "opaque"
    url = "https://api.openai.com/v1/images/generations"
    payload_data = {
        "model": model,
        "prompt": prompt,
        "size": size,
        "quality": "high",
        "background": background,
        "output_format": "png",
    }
    payload = json.dumps(payload_data).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    print(f"Starting {os.path.basename(output_path)} ({size}, {background})...", flush=True)
    t0 = time.time()
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            data = json.loads(resp_body)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"OpenAI API error for {os.path.basename(output_path)} ({e.code}): {error_body}", file=sys.stderr, flush=True)
        raise

    elapsed = round(time.time() - t0, 2)
    image_entry = data["data"][0]
    if "b64_json" in image_entry:
        import base64
        image_bytes = base64.b64decode(image_entry["b64_json"])
    elif "url" in image_entry:
        img_req = urllib.request.Request(image_entry["url"], headers={"User-Agent": "PrincessRosie/1.0"})
        with urllib.request.urlopen(img_req) as img_resp:
            image_bytes = img_resp.read()
    else:
        raise ValueError("No b64_json or url in response")

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(image_bytes)

    sha256 = hashlib.sha256(image_bytes).hexdigest()
    usage = data.get("usage", {})
    text_in = usage.get("input_tokens", 0)
    img_in = usage.get("image_input_tokens", 0)
    img_out = usage.get("output_tokens", 0)
    cost = calculate_cost(text_in, img_in, img_out)

    metadata = {
        "id": item["id"],
        "role": item["role"],
        "model": model,
        "size": size,
        "output": output_path,
        "sha256": sha256,
        "background": background,
        "tokens": {
            "text_in": text_in,
            "img_in": img_in,
            "img_out": img_out,
        },
        "estimatedCostUsd": cost,
        "elapsedSeconds": elapsed,
        "prompt": prompt,
        "revisedPrompt": image_entry.get("revised_prompt", prompt),
    }

    meta_path = output_path + ".meta.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Done: {os.path.basename(output_path)} ({sha256[:8]}..., ${cost}, {elapsed}s)", flush=True)
    return metadata

ITEMS_TO_GENERATE = [
    {
        "id": "castle.far-layer",
        "role": "far-layer",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "castle", "far", "far-layer.png"),
        "size": "3072x1024",
        "transparent": False,
        "prompt": "Use case: production game far scenery layer. A wide panoramic landscape of the Birthday Castle Approach far layer: luminous sapphire and powder-blue sunny sky with soft drifting fairytale clouds. In the right half of the panorama, the warm golden mosaic Birthday Castle stands waiting ahead under bright Mediterranean sun with rounded Arab-Norman domes, mosaic gold and cream walls, open arches, and colorful festive pennants. High in the luminous sky above the castle, the radiant golden Castle Star already shines brightly, casting a warm golden glow, and six gentle convergent rainbow light trails sweep across the sky toward the castle gates. Below, the sparkling Sapphire Sea meets gentle flowered coastal terraces. Distant panoramic viewpoint, wide open flight corridor through the left two-thirds. Scenery and architecture only, no people, no characters, no text. Painterly children's picture-book illustration matching Fairytale Sicily.",
    },
    {
        "id": "castle.gatehouse-pavilion",
        "role": "gatehouse-pavilion",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "castle", "middle", "gatehouse-pavilion.png"),
        "size": "3072x1024",
        "transparent": True,
        "prompt": "Use case: production game middle scenery Set Piece. Preserve the architectural and celebratory composition from the approved reference painting of Birthday Castle Approach: a grand, sunlit classical Arab-Norman palace entrance gatehouse arcade and pavilion of cream-and-honey stone pillars with delicate mosaic arches, supporting an ornate golden dome, flanked by low stone balustrades, stone urns overflowing with blooming pink roses, glowing glass lanterns, festive rainbow ribbons, and tall cypress spires, framing the arrival at the Rainbow Archway. Wide panoramic Set Piece on transparent background. Clean alpha channel through all arch openings and pavilion pillars and outside the structure, no background sky, no ground plane below the stone steps and balustrade base, no characters, no text. Storybook picture-book style matching Fairytale Sicily.",
    },
    {
        "id": "castle.terrace-balustrade-row",
        "role": "terrace-balustrade-row",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "castle", "middle", "terrace-balustrade-row.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game middle scenery Set Piece. A lateral row of classical cream stone courtyard terrace balustrades with golden mosaic borders, adorned with climbing pink roses, green ivy, draped festive rainbow ribbons, small celebratory pennants, and glowing storybook lanterns. Lateral Set Piece on transparent background. Clean alpha channel, no sky, no ground below pedestal and balustrade base, no characters, no text. Storybook picture-book style matching the Birthday Castle.",
    },
    {
        "id": "castle.mosaic-tower-spire",
        "role": "mosaic-tower-spire",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "castle", "middle", "mosaic-tower-spire.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game middle scenery Set Piece. A slender, elegant Arab-Norman palace watchtower and turret of warm cream and golden mosaic masonry, crowned with a small rounded golden dome, fluttering colorful pennants, and climbing blush roses entwined around arched windows. Isolated vertical tower Set Piece on transparent background. Clean alpha channel, no background sky, no ground plane outside tower base, no characters, no text. Storybook picture-book style matching the Birthday Castle.",
    },
    {
        "id": "shared.festive-banner-post",
        "role": "shared-set-piece",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "shared", "festive-banner-post.png"),
        "size": "1024x1024",
        "transparent": True,
        "prompt": "Use case: production game shared library Set Piece. A charming, freestanding storybook festive palace pennant banner pole: an ornate carved cream stone pedestal supporting a gilded post with fluttering colorful silk pennants and rainbow ribbons, draped with miniature pink rose garlands and glowing with subtle golden sparkle dust. Isolated vertical Set Piece on transparent background. Clean alpha channel, no ground plane outside the pedestal base, no background, no characters, no text. Storybook picture-book illustration style matching Fairytale Sicily.",
    },
    {
        "id": "castle.mosaic-stone-ground",
        "role": "mosaic-stone-ground",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "castle", "near", "mosaic-stone-ground.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game near scenery Set Piece. A horizontal ground strip of sunlit cream stone flagstones with ornate golden mosaic inlay patterns, soft dappled shadows, and scattered fallen blush-rose petals, carrying the Storybook Ground along the bottom of the screen. Low horizontal paved ground strip spanning the width on transparent background. Clean alpha channel everywhere above the paved stone surface, no sky, no background, no characters, no text. Storybook picture-book style matching the Birthday Castle Approach.",
    },
    {
        "id": "castle.coastal-flower-border",
        "role": "coastal-flower-border",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "castle", "near", "coastal-flower-border.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game near scenery Set Piece. A wide, lush foreground lateral border strip of coastal blush-rose bushes, lavender blooms, gentle leafy shrubs, and fluttering festive golden ribbons entwined along the garden edge. Low lateral foreground border Set Piece on transparent background. Clean alpha channel everywhere above the plant foliage, no sky, no ground below base, no characters, no text. Storybook picture-book style matching the Birthday Castle.",
    },
    {
        "id": "castle.palace-garland-canopy",
        "role": "palace-garland-canopy",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "castle", "near", "palace-garland-canopy.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game near scenery Set Piece. An overarching upper canopy border of sunlit palace courtyard awnings, ornate carved golden arch trims, cascading blush-rose garlands, and fluttering celebratory rainbow silk ribbon swags framing the top edge of the scene. Overhanging top-edge Set Piece on transparent background. Clean alpha channel everywhere below the upper arch and garland trim, no background sky, no ground, no characters, no text. Storybook picture-book style matching the Birthday Castle.",
    },
    {
        "id": "castle.castle-bunting",
        "role": "castle-bunting",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "castle", "cutouts", "castle-bunting.png"),
        "size": "1024x1024",
        "transparent": True,
        "prompt": "Use case: production game playful obstacle cutout. A charming, festive storybook castle bunting obstacle cutout for a gentle children's game: a cheerful swag of rich berry-rose and golden silk bunting pennants strung between two ornamental carved cream stone posts adorned with rosebuds and tied with fluttering rainbow ribbons, resting on a small stone base. Genuine RGBA transparent background around the bunting silhouette. Isolated cutout, no background, no ground plane outside base, no characters, no text. Flat modern children's picture-book illustration style matching Fairytale Sicily.",
    },
    {
        "id": "castle.castle-drum",
        "role": "castle-drum",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "castle", "cutouts", "castle-drum.png"),
        "size": "1024x1024",
        "transparent": True,
        "prompt": "Use case: production game interactive springboard cutout. A joyful, festive storybook celebration drum springboard cutout: a rounded ceremonial birthday castle drum in royal berry-crimson and golden mosaic trim, with a bouncy taut ivory drumhead glowing with warm golden starlight dust at its center, designed for Stella to bounce high into the sky. Upright and bouncy. Isolated cutout on transparent background. Clean alpha channel, no background, no ground outside base, no characters, no text. Storybook picture-book style matching Fairytale Sicily.",
    },
]

def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY is not set", file=sys.stderr, flush=True)
        sys.exit(1)

    print(f"Starting parallel generation of {len(ITEMS_TO_GENERATE)} Birthday Castle kit assets (workers=4)...", flush=True)
    results = []
    total_cost = 0.0

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(generate_image, api_key, item): item for item in ITEMS_TO_GENERATE}
        for future in concurrent.futures.as_completed(futures):
            item = futures[future]
            try:
                meta = future.result()
                results.append(meta)
                total_cost += meta.get("estimatedCostUsd", 0.0)
            except Exception as e:
                print(f"Error generating {item['id']}: {e}", file=sys.stderr, flush=True)
                sys.exit(1)

    summary_file = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "castle", "generation_summary.json")
    with open(summary_file, "w") as f:
        json.dump({
            "totalCostUsd": round(total_cost, 4),
            "itemCount": len(results),
            "items": results
        }, f, indent=2)

    print(f"\nAll generations complete! Total cost: ${round(total_cost, 4)}", flush=True)
    print(f"Summary written to {summary_file}", flush=True)

if __name__ == "__main__":
    main()
