#!/usr/bin/env python3
"""
Generate the complete Zélie's Lacewood scenery kit, shared library additions,
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
        "id": "lacewood.far-layer",
        "role": "far-layer",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "lacewood", "far", "far-layer.png"),
        "size": "3072x1024",
        "transparent": False,
        "prompt": "Use case: production game far scenery layer. A wide panoramic landscape of Zélie's Lacewood far layer: clear sunny sapphire blue sky with soft drifting fairytale clouds, distant Sicilian hillside village nestled among rolling green olive terraces, slender cypress spires, and distant purple misty mountains under warm golden Mediterranean light. Distant panoramic viewpoint, no foreground canopy, no foreground trees, no pavilion, no people, no characters, no text, no star. Painterly children's picture-book illustration matching Fairytale Sicily.",
    },
    {
        "id": "lacewood.lace-pavilion",
        "role": "lace-pavilion",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "lacewood", "middle", "lace-pavilion.png"),
        "size": "3072x1024",
        "transparent": True,
        "prompt": "Use case: production game middle scenery Set Piece. Preserve the architectural and floral composition from the approved reference painting of Zélie's Lacewood: a grand, sunlit classical circular gazebo or garden pavilion of cream-and-honey stone pillars with delicate carved archways, supporting an ornate golden dome, flanked by low stone balustrades, stone urns overflowing with blooming pink roses, glowing glass lanterns, and tall cypress spires. Wide panoramic Set Piece on transparent background. Clean alpha channel through all arch openings and gazebo pillars and outside the structure, no background sky, no ground plane below the stone steps and balustrade base, no characters, no text. Storybook picture-book style matching Fairytale Sicily.",
    },
    {
        "id": "lacewood.lace-ribbon-tree",
        "role": "lace-ribbon-tree",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "lacewood", "middle", "lace-ribbon-tree.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game middle scenery Set Piece. A graceful, spreading sunlit forest tree with textured brown bark and lush green foliage, wrapped in climbing pink garden roses and draped with fluttering delicate translucent silver lace ribbons flowing between branches in the gentle breeze. Isolated vertical tree Set Piece on transparent background. Clean alpha channel, no background sky, no ground plane, no characters, no text. Storybook picture-book style matching Zélie's Lacewood.",
    },
    {
        "id": "lacewood.pillar-lantern-row",
        "role": "pillar-lantern-row",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "lacewood", "middle", "pillar-lantern-row.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game middle scenery Set Piece. A lateral row of classical cream stone pedestals and low balustrades adorned with climbing pink roses, green ivy, draped silver lace ribbons, and topped with glowing fairytale glass lanterns with golden candlelight and stone urns with trailing blossoms. Lateral Set Piece on transparent background. Clean alpha channel, no sky, no ground below pedestal bases, no characters, no text. Storybook picture-book style matching Zélie's Lacewood.",
    },
    {
        "id": "shared.garden-lantern",
        "role": "garden-lantern",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "shared", "garden-lantern.png"),
        "size": "1024x1024",
        "transparent": True,
        "prompt": "Use case: production game shared library Set Piece. A charming, freestanding storybook garden lantern of warm antiqued bronze and beveled glass glowing warmly with gentle golden candlelight, resting on an ornate carved cream stone pedestal wrapped with delicate green ivy and miniature rosebuds. Isolated vertical Set Piece on transparent background. Clean alpha channel, no ground plane outside the stone base, no background, no characters, no text. Storybook picture-book illustration style.",
    },
    {
        "id": "lacewood.stone-tile-ground",
        "role": "stone-tile-ground",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "lacewood", "near", "stone-tile-ground.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game near scenery Set Piece. A horizontal ground strip of sunlit cream-and-gold patterned stone courtyard flagstones and mosaic tiles with soft dappled leaf shadows and scattered fallen pink rose petals, carrying the Storybook Ground along the bottom of the screen. Low horizontal paved ground strip spanning the width on transparent background. Clean alpha channel everywhere above the paved ground surface, no sky, no background, no characters, no text. Storybook picture-book style matching Zélie's Lacewood.",
    },
    {
        "id": "lacewood.rose-woodland-border",
        "role": "rose-woodland-border",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "lacewood", "near", "rose-woodland-border.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game near scenery Set Piece. A wide, lush foreground lateral border strip of wild woodland rose bushes blooming with vibrant pink roses, rich dark green foliage, and delicate silver lace ribbons entwined through the leafy branches. Low lateral foreground border Set Piece on transparent background. Clean alpha channel everywhere above the bush foliage, no sky, no ground below base, no characters, no text. Storybook picture-book style matching Zélie's Lacewood.",
    },
    {
        "id": "lacewood.canopy-arch",
        "role": "canopy-arch",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "lacewood", "near", "canopy-arch.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game near scenery Set Piece. An overarching upper canopy border of lush leafy green woodland tree branches covered in climbing pink roses and draped with fluttering delicate translucent silver lace ribbons framing the top of the scene. Overhanging top-edge Set Piece on transparent background. Clean alpha channel everywhere below the upper canopy branches, no background sky, no ground, no characters, no text. Storybook picture-book style matching Zélie's Lacewood.",
    },
    {
        "id": "lacewood.silver-ribbon",
        "role": "silver-ribbon",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "lacewood", "cutouts", "silver-ribbon.png"),
        "size": "1024x1024",
        "transparent": True,
        "prompt": "Use case: production game playful obstacle cutout. A charming, delicate storybook silver lace ribbon obstacle cutout for a gentle children's game: an ornate, fluttering loop of translucent silver lace ribbon tied in a soft airy bow, floating gracefully above a small rounded base of woodland moss and miniature pink rosebuds. Genuine RGBA transparent background around the ribbon silhouette. Isolated cutout, no background, no ground plane outside the small base, no characters, no text. Flat modern children's picture-book illustration style matching Fairytale Sicily.",
    },
    {
        "id": "lacewood.lace-sprout",
        "role": "lace-sprout",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "lacewood", "cutouts", "lace-sprout.png"),
        "size": "1024x1024",
        "transparent": True,
        "prompt": "Use case: production game interactive springboard cutout. A joyful, magical storybook springboard cutout: a springy coiled green botanical sprout curling upward from a mossy base, unfurling into delicate, bouncy translucent silver-and-lilac lace petals and leaf pads, glowing with warm golden starlight pollen at its center, designed for Stella to bounce high into the sky. Upright and bouncy. Isolated cutout on transparent background. Clean alpha channel, no background, no ground outside base, no characters, no text. Storybook picture-book style matching Fairytale Sicily.",
    },
]

def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY is not set", file=sys.stderr, flush=True)
        sys.exit(1)

    print(f"Starting parallel generation of {len(ITEMS_TO_GENERATE)} Lacewood kit assets (workers=4)...", flush=True)
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

    summary_file = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "lacewood", "generation_summary.json")
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
