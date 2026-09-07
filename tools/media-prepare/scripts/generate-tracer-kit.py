#!/usr/bin/env python3
"""
Generate the complete Rose Garden tracer scenery kit, shared library seeds,
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
        "id": "garden.far-layer",
        "role": "far-layer",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "garden", "far", "far-layer.png"),
        "size": "3072x1024",
        "transparent": False,
        "prompt": "Use case: production game far scenery layer. A wide panoramic landscape of Rosalia's Rose Garden far layer: clear sunny sapphire blue sky with soft drifting clouds, sparkling sapphire Mediterranean sea along the coast, distant green rolling hills with a charming Sicilian hillside village and terracotta dome. Distant panoramic viewpoint, no foreground terrace, no foreground arches, no people, no characters, no text, no star. Painterly storybook illustration matching Fairytale Sicily.",
    },
    {
        "id": "garden.column-ribbon",
        "role": "column-ribbon",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "garden", "middle", "column-ribbon.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game middle scenery Set Piece. An elegant cream stone classical column wrapped in climbing pink roses, lush green leaves, and fluttering translucent silver lace ribbons. Standing vertically on transparent background. Clean alpha channel, isolated Set Piece, no background sky, no ground plane, no characters, no text. Storybook picture-book style matching Rosalia's Rose Garden.",
    },
    {
        "id": "garden.balustrade-run",
        "role": "balustrade-run",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "garden", "middle", "balustrade-run.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game middle scenery Set Piece. A horizontal run of sunlit cream stone balustrade with carved balusters, topped with stone urns overflowing with blooming pink roses and trailing green vines. Transparent background everywhere outside the balustrade and flowers. Clean alpha channel, isolated lateral Set Piece, no background sky, no ground below balustrade base, no characters, no text. Storybook picture-book style matching Rosalia's Rose Garden.",
    },
    {
        "id": "garden.rose-bush-cluster",
        "role": "rose-bush-cluster",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "garden", "near", "rose-bush-cluster.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game near scenery Set Piece. A wide, lush lateral cluster of blooming pink garden rose bushes with rich green leaves, buds, and delicate falling petals. Transparent background everywhere outside the rose foliage. Clean alpha channel, isolated lateral foreground Set Piece, no background sky, no ground, no characters, no text. Storybook picture-book style matching Rosalia's Rose Garden.",
    },
    {
        "id": "garden.border-strip",
        "role": "border-strip",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "garden", "near", "border-strip.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game near scenery Set Piece. A horizontal ground border strip of flowering purple lavender, green turf, and scattered pink rose petals, carrying the Storybook Ground. Low horizontal strip spanning the width. Transparent background everywhere above the low foliage. Clean alpha channel, isolated lateral Set Piece, no background, no characters, no text. Storybook picture-book style matching Rosalia's Rose Garden.",
    },
    {
        "id": "garden.terrace-edge",
        "role": "terrace-edge",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "garden", "near", "terrace-edge.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game near scenery Set Piece. A horizontal edge of sunlit cream stone terrace with paved flagstones, small mossy crevices, and scattered fallen pink rose petals along the surface. Low horizontal stone edge spanning the width. Transparent background everywhere above the terrace surface. Clean alpha channel, isolated lateral Set Piece, no background, no characters, no text. Storybook picture-book style matching Rosalia's Rose Garden.",
    },
    {
        "id": "shared.cypress-tree",
        "role": "cypress-tree",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "shared", "cypress-tree.png"),
        "size": "1024x1024",
        "transparent": True,
        "prompt": "Use case: production game shared library Set Piece. A classic slender Sicilian cypress tree with dense, textured emerald green foliage, standing tall in a gentle breeze. Isolated vertical tree on transparent background. Clean alpha channel, no ground plane, no background, no characters, no text. Storybook picture-book illustration style.",
    },
    {
        "id": "shared.cloud-bank",
        "role": "cloud-bank",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "shared", "cloud-bank.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game shared library Set Piece. A soft, voluminous bank of fairytale clouds with billowy cumulus mounds, luminous warm sunlight highlights, and pastel pink undersides. Isolated cloud cluster on transparent background. Clean alpha channel, no blue sky, no ground, no characters, no text. Storybook picture-book illustration style.",
    },
    {
        "id": "garden.giant-rose",
        "role": "springboard",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "garden", "cutouts", "giant-rose.png"),
        "size": "1024x1024",
        "transparent": True,
        "prompt": "Use case: production game interactive springboard cutout. A joyful, oversized giant blooming pink rose growing on a sturdy, springy green coiled stem with bouncy curved leaf pads at its base, designed for Stella to bounce high into the sky. Upright and bouncy, glowing with warm golden pollen in its center. Isolated cutout on transparent background. Clean alpha channel, no background, no ground outside base, no characters, no text. Storybook picture-book style matching Fairytale Sicily.",
    },
    {
        "id": "garden.star-sparkle",
        "role": "sparkle",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "garden", "cutouts", "star-sparkle.png"),
        "size": "1024x1024",
        "transparent": True,
        "prompt": "Use case: production game collectible Star Sparkle cutout. A magical, radiant four-pointed celestial star sparkle with glowing golden light rays, shimmering stardust particles, and a brilliant diamond-white core. Floating starlight emblem on transparent background. Clean alpha channel, no background, no circular badge border, no text. Storybook picture-book style matching Fairytale Sicily.",
    },
    {
        "id": "shared.rainbow-archway",
        "role": "archway",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "shared", "rainbow-archway.png"),
        "size": "1024x1536",
        "transparent": True,
        "prompt": "Use case: production game finish gate cutout. A grand classical storybook archway of warm cream-and-gold marble pillars with carved floral reliefs, crowned with vibrant shining rainbow bands spanning the semicircular arch, topped with a glowing golden six-pointed star crest. Wide open portal between the two pillars. Isolated archway on transparent background with clean alpha transparency through the arch opening and outside the structure. No background, no ground plane, no characters, no text. Storybook picture-book style matching Fairytale Sicily.",
    },
]

def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY is not set", file=sys.stderr, flush=True)
        sys.exit(1)

    print(f"Starting parallel generation of {len(ITEMS_TO_GENERATE)} kit assets (workers=4)...", flush=True)
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

    summary_file = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "garden", "generation_summary.json")
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
