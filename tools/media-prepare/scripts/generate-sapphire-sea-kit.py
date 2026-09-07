#!/usr/bin/env python3
"""
Generate the complete Sapphire Sea scenery kit, shared library additions,
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
        "id": "sapphire-sea.far-layer",
        "role": "far-layer",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "sapphire-sea", "far", "far-layer.png"),
        "size": "3072x1024",
        "transparent": False,
        "prompt": "Use case: production game far scenery layer. A wide panoramic seascape of Sapphire Sea far layer: clear sunny sapphire blue sky with soft drifting clouds, wide open sparkling sapphire Mediterranean ocean beneath warm golden sunlight, soft trails of sun sparkle across the open water, and distant low purple coastal headlands on the far horizon. Distant panoramic viewpoint, no foreground shore, no foreground rocks, no obstacles, no people, no characters, no text, no star, no boats. Painterly children's picture-book illustration matching Fairytale Sicily.",
    },
    {
        "id": "sapphire-sea.sea-promontory",
        "role": "sea-promontory",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "sapphire-sea", "middle", "sea-promontory.png"),
        "size": "3072x1024",
        "transparent": True,
        "prompt": "Use case: production game middle scenery Set Piece. Preserve the coastal and floral composition from the approved reference painting of Sapphire Sea: a grand sunlit coastal promontory of warm cream limestone with a natural arched sea grotto framing glowing turquoise tide pools, draped with blooming blush-rose rock-roses, purple sea lavender, and glistening sunlit water ripples. Wide panoramic Set Piece on transparent background. Clean alpha channel through all arch openings and outside the rock promontory, no background sky, no ground plane below the limestone base, no characters, no text. Storybook picture-book style matching Fairytale Sicily.",
    },
    {
        "id": "sapphire-sea.limestone-sea-stack",
        "role": "limestone-sea-stack",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "sapphire-sea", "middle", "limestone-sea-stack.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game middle scenery Set Piece. A picturesque sunlit limestone sea stack rising from gentle turquoise coastal water, with warm honey-cream textured rock, small ledges adorned with blooming pink coastal flowers and green samphire, glowing under warm Mediterranean sun. Vertical Set Piece on transparent background. Clean alpha channel, no background sky, no ground plane outside the sea stack base, no characters, no text. Storybook picture-book style matching Sapphire Sea.",
    },
    {
        "id": "sapphire-sea.coral-tide-terrace",
        "role": "coral-tide-terrace",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "sapphire-sea", "middle", "coral-tide-terrace.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game middle scenery Set Piece. A lateral stepped terrace of warm cream-and-gold limestone tide pools glowing with clear turquoise water, trailing blush-rose coastal blossoms, delicate sea lavender, and sparkling gentle ripples. Lateral Set Piece on transparent background. Clean alpha channel, no sky, no ground below the limestone terrace base, no characters, no text. Storybook picture-book style matching Sapphire Sea.",
    },
    {
        "id": "shared.flowered-coastal-rock",
        "role": "flowered-coastal-rock",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "shared", "flowered-coastal-rock.png"),
        "size": "1024x1024",
        "transparent": True,
        "prompt": "Use case: production game shared library Set Piece. A charming, freestanding storybook rounded cream limestone rock boulder adorned with clusters of blooming blush-rose wildflowers, delicate purple sea lavender, and soft green moss. Isolated compact Set Piece on transparent background. Clean alpha channel, no ground plane outside the rock base, no background, no characters, no text. Storybook picture-book illustration style.",
    },
    {
        "id": "sapphire-sea.coastal-shelf-ground",
        "role": "coastal-shelf-ground",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "sapphire-sea", "near", "coastal-shelf-ground.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game near scenery Set Piece. A horizontal ground strip of sunlit pale cream limestone shore and shallow glowing turquoise tide pools with smooth sea pebbles and scattered pink and lavender petals, carrying the Storybook Ground along the bottom of the screen. Low horizontal paved ground strip spanning the width on transparent background. Clean alpha channel everywhere above the ground surface, no sky, no background, no characters, no text. Storybook picture-book style matching Sapphire Sea.",
    },
    {
        "id": "sapphire-sea.flowered-rock-border",
        "role": "flowered-rock-border",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "sapphire-sea", "near", "flowered-rock-border.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game near scenery Set Piece. A wide foreground lateral border strip of warm cream limestone coastal rocks blooming with clusters of blush-rose rock-roses, dark green succulent leaves, and purple sea lavender trailing over glowing turquoise water edges. Low lateral foreground border Set Piece on transparent background. Clean alpha channel everywhere above the rocks and foliage, no sky, no ground below base, no characters, no text. Storybook picture-book style matching Sapphire Sea.",
    },
    {
        "id": "sapphire-sea.turquoise-shallows-pool",
        "role": "turquoise-shallows-pool",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "sapphire-sea", "near", "turquoise-shallows-pool.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game near scenery Set Piece. A lateral foreground border of sparkling crystalline turquoise tide pools with gently glowing ripples, rounded cream sea stones, and tiny scattered pink coastal flower petals along the water's edge. Low lateral foreground Set Piece on transparent background. Clean alpha channel everywhere above the pool and stones, no background sky, no characters, no text. Storybook picture-book style matching Sapphire Sea.",
    },
    {
        "id": "sapphire-sea.wave-crest",
        "role": "wave-crest",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "sapphire-sea", "cutouts", "wave-crest.png"),
        "size": "1024x1024",
        "transparent": True,
        "prompt": "Use case: production game playful obstacle cutout. A charming, stylized storybook wave crest obstacle cutout for a gentle children's game: a sparkling curved curl of deep sapphire and luminous turquoise sea water with a soft foamy pearly-white frothing crest and glistening sunlit water droplets floating above a small base of sea spray. Genuine RGBA transparent background around the wave silhouette. Isolated cutout, no background, no ground plane outside the small base, no characters, no text. Flat modern children's picture-book illustration style matching Fairytale Sicily.",
    },
    {
        "id": "sapphire-sea.sea-geyser",
        "role": "sea-geyser",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "sapphire-sea", "cutouts", "sea-geyser.png"),
        "size": "1024x1024",
        "transparent": True,
        "prompt": "Use case: production game interactive springboard cutout. A joyful, magical storybook springboard cutout: a springy vertical sea geyser spout shooting upward from a bubbly turquoise pool, unfurling into frothy translucent water crests and crystalline bouncing droplets, glowing with warm golden starlight spray at its crest, designed for Stella to bounce high into the sky. Upright and bouncy. Isolated cutout on transparent background. Clean alpha channel, no background, no ground outside base, no characters, no text. Storybook picture-book style matching Fairytale Sicily.",
    },
]

def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY is not set", file=sys.stderr, flush=True)
        sys.exit(1)

    print(f"Starting parallel generation of {len(ITEMS_TO_GENERATE)} Sapphire Sea kit assets (workers=4)...", flush=True)
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

    summary_file = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "sapphire-sea", "generation_summary.json")
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
