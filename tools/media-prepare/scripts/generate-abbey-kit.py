#!/usr/bin/env python3
"""
Generate the complete Golden Bell Abbey scenery kit, shared library additions,
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
                meta["reason"] = item["reason"]
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
            "reason": item["reason"],
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
        "reason": item["reason"],
    }

    meta_path = output_path + ".meta.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Done: {os.path.basename(output_path)} ({sha256[:8]}..., ${cost}, {elapsed}s)", flush=True)
    return metadata

ITEMS_TO_GENERATE = [
    {
        "id": "abbey.far-layer",
        "role": "far-layer",
        "category": "far",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "abbey", "far", "far-layer.png"),
        "size": "3072x1024",
        "transparent": False,
        "reason": "Opaque 3:1 panorama landscape vista of Golden Bell Abbey with sunny sapphire sky, distant Sicilian hillside bell tower, terracotta roofs, and rolling olive terraces; no characters, text, or foreground arches.",
        "prompt": "Use case: production game far scenery layer. A wide panoramic landscape of Golden Bell Abbey far layer: clear sunny sapphire blue sky with soft drifting fairytale clouds, distant Sicilian hillside with warm honey-colored stone abbey bell tower and terracotta roofs nestled among rolling green olive terraces, slender cypress spires, and distant purple misty mountains under warm golden Mediterranean light. Distant panoramic viewpoint, no foreground arcade, no foreground arches, no people, no characters, no text, no star. Painterly children's picture-book illustration matching Fairytale Sicily.",
    },
    {
        "id": "abbey.cloister-arcade",
        "role": "cloister-arcade",
        "category": "middle",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "abbey", "middle", "cloister-arcade.png"),
        "size": "3072x1024",
        "transparent": True,
        "reason": "Grand honey-stone abbey garden cloister arcade with carved capitals, open colonnade, hanging golden bells, and stained-glass roundels framing arrival at Rainbow Archway.",
        "prompt": "Use case: production game middle scenery Set Piece. Preserve the architectural and cloister composition from the approved reference painting of Golden Bell Abbey: a grand, sunlit abbey garden cloister arcade of warm honey-colored stone arches with carved capitals, an open colonnade hung with small swinging golden bells, high arched openings, colorful stained-glass rose roundels catching the light, flanked by low stone balustrades and carved stone urns overflowing with blooming purple lavender and blush roses. Wide panoramic Set Piece on transparent background. Clean alpha channel through all arch openings and colonnade pillars and outside the structure, no background sky, no ground plane below the stone base, no characters, no text. Storybook picture-book style matching Fairytale Sicily.",
    },
    {
        "id": "abbey.bell-tower-belfry",
        "role": "bell-tower-belfry",
        "category": "middle",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "abbey", "middle", "bell-tower-belfry.png"),
        "size": "1536x1024",
        "transparent": True,
        "reason": "Sunlit abbey bell tower belfry of warm honey-colored stone with tall arched openings revealing swinging golden church bells on transparent background.",
        "prompt": "Use case: production game middle scenery Set Piece. A graceful, sunlit abbey bell tower belfry of warm honey-colored stone with tall arched openings revealing swinging polished golden church bells, topped with a gentle terracotta tiled roof and delicate carved architectural finial. Isolated vertical tower Set Piece on transparent background. Clean alpha channel through open archways and around the tower silhouette, no background sky, no ground plane, no characters, no text. Storybook picture-book style matching Golden Bell Abbey.",
    },
    {
        "id": "abbey.rose-window-wall",
        "role": "rose-window-wall",
        "category": "middle",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "abbey", "middle", "rose-window-wall.png"),
        "size": "1536x1024",
        "transparent": True,
        "reason": "Honey-stone abbey wall with glowing jewel-toned stained-glass rose window and carved pilasters on transparent background.",
        "prompt": "Use case: production game middle scenery Set Piece. A lateral section of warm honey-colored stone abbey wall featuring a large, ornate stained-glass rose window glowing with jewel-toned sapphire, blush rose, and golden mosaic glass catching warm sunlight, flanked by carved stone columns with hanging small golden bells and climbing garden roses. Lateral Set Piece on transparent background. Clean alpha channel outside the stone structure and through wall cutouts, no sky, no ground below base, no characters, no text. Storybook picture-book style matching Golden Bell Abbey.",
    },
    {
        "id": "shared.stone-fountain",
        "role": "shared-set-piece",
        "category": "shared",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "shared", "stone-fountain.png"),
        "size": "1024x1024",
        "transparent": True,
        "reason": "Charming freestanding storybook tiered stone garden fountain of honey limestone with gentle spilling water on transparent background.",
        "prompt": "Use case: production game shared library Set Piece. A charming, freestanding storybook tiered stone fountain of warm honey-colored limestone with gentle clear water spilling between scallop-carved basins, resting on an ornate pedestal carved with floral reliefs and surrounded by miniature potted lavender at its base. Isolated vertical Set Piece on transparent background. Clean alpha channel, no ground plane outside the stone base, no background, no characters, no text. Storybook picture-book illustration style.",
    },
    {
        "id": "abbey.stone-terrace-ground",
        "role": "stone-terrace-ground",
        "category": "near",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "abbey", "near", "stone-terrace-ground.png"),
        "size": "1536x1024",
        "transparent": True,
        "reason": "Sunlit warm honey-and-terracotta paved stone terrace flagstones carrying Storybook Ground on transparent background.",
        "prompt": "Use case: production game near scenery Set Piece. A horizontal ground strip of sunlit warm honey-and-terracotta stone courtyard flagstones and mosaic tiles with soft dappled arch shadows and scattered purple lavender sprigs, carrying the Storybook Ground along the bottom of the screen. Low horizontal paved ground strip spanning the width on transparent background. Clean alpha channel everywhere above the paved ground surface, no sky, no background, no characters, no text. Storybook picture-book style matching Golden Bell Abbey.",
    },
    {
        "id": "abbey.lavender-herb-border",
        "role": "lavender-herb-border",
        "category": "near",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "abbey", "near", "lavender-herb-border.png"),
        "size": "1536x1024",
        "transparent": True,
        "reason": "Lush foreground border strip of fragrant purple lavender, marigolds, and climbing blush roses along carved stone garden kerb on transparent background.",
        "prompt": "Use case: production game near scenery Set Piece. A wide, lush foreground lateral border strip of blooming fragrant purple lavender bushes, golden marigolds, and climbing blush roses along a low carved honey-stone garden kerb. Low lateral foreground border Set Piece on transparent background. Clean alpha channel everywhere above the herb foliage, no sky, no ground below base, no characters, no text. Storybook picture-book style matching Golden Bell Abbey.",
    },
    {
        "id": "abbey.vaulted-arch-canopy",
        "role": "vaulted-arch-canopy",
        "category": "near",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "abbey", "near", "vaulted-arch-canopy.png"),
        "size": "1536x1024",
        "transparent": True,
        "reason": "Overarching top cloister rib vaulting and warm stone arches hung with small decorative golden bells on transparent background.",
        "prompt": "Use case: production game near scenery Set Piece. An overarching upper foreground canopy of carved honey-stone cloister rib vaulting and warm gothic stone arches hung with small decorative swinging golden bells, framing the top edge of the scene. Overhanging top-edge Set Piece on transparent background. Clean alpha channel everywhere below the arched vaulting, no background sky, no ground, no characters, no text. Storybook picture-book style matching Golden Bell Abbey.",
    },
    {
        "id": "abbey.bell-rope",
        "role": "bell-rope",
        "category": "cutouts",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "abbey", "cutouts", "bell-rope.png"),
        "size": "1024x1024",
        "transparent": True,
        "reason": "Charming braided golden bell rope obstacle with wool tassel and small swinging hand bell above lavender base on transparent background.",
        "prompt": "Use case: production game playful obstacle cutout. A charming, whimsical storybook bell rope obstacle cutout for a gentle children's game: a thick braided golden-amber pull rope hanging down from a carved honey-stone bracket, ending in a soft fluffy wool tassel and a small swinging polished golden bell, mounted above a small base of green moss and purple lavender sprigs. Genuine RGBA transparent background around the silhouette. Isolated cutout, no background, no ground plane outside the small base, no characters, no text. Flat modern children's picture-book illustration style matching Fairytale Sicily.",
    },
    {
        "id": "abbey.abbey-bell",
        "role": "abbey-bell",
        "category": "cutouts",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "abbey", "cutouts", "abbey-bell.png"),
        "size": "1024x1024",
        "transparent": True,
        "reason": "Gleaming golden abbey bell springboard on springy bronze mount with ivy and musical star glints on transparent background.",
        "prompt": "Use case: production game interactive springboard cutout. A joyful, magical storybook springboard cutout: an ornate, gleaming golden abbey bell resting on a springy, coiled bronze mount with soft leafy ivy and lavender accents, with a rounded clapper and glowing warm musical star chime glints, designed for Stella to bounce high into the sky. Upright and bouncy. Isolated cutout on transparent background. Clean alpha channel, no background, no ground outside base, no characters, no text. Storybook picture-book style matching Fairytale Sicily.",
    },
]

def write_provenance_files(results_by_id: dict):
    # 1. Far provenance
    far_item = results_by_id["abbey.far-layer"]
    far_prov = {
        "manifestVersion": "1.0.0",
        "updatedAt": "2026-09-07",
        "layer": "far",
        "depthFactor": 0.2,
        "totalSpendUsd": far_item.get("estimatedCostUsd", 0.0),
        "assets": [
            {
                "id": "abbey.far-layer",
                "role": "far-layer",
                "provider": "OpenAI OpCo, LLC",
                "model": "gpt-image-2",
                "size": "3072x1024",
                "background": "opaque",
                "prompt": far_item["prompt"],
                "outputPath": "source-media/abbey/far/far-layer.png",
                "sha256": far_item["sha256"],
                "costUsd": far_item.get("estimatedCostUsd", 0.0),
                "selection": {
                    "status": "candidate",
                    "selectedBy": "issue-135 implementation review",
                    "reason": far_item["reason"],
                    "ownerManualReview": "pending"
                }
            }
        ]
    }
    far_prov_file = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "abbey", "far", "provenance.json")
    os.makedirs(os.path.dirname(far_prov_file), exist_ok=True)
    with open(far_prov_file, "w") as f:
        json.dump(far_prov, f, indent=2)

    # 2. Middle provenance
    mid_ids = ["abbey.cloister-arcade", "abbey.bell-tower-belfry", "abbey.rose-window-wall"]
    mid_assets = []
    mid_cost = 0.0
    for mid_id in mid_ids:
        item = results_by_id[mid_id]
        mid_cost += item.get("estimatedCostUsd", 0.0)
        rel_path = f"source-media/abbey/middle/{os.path.basename(item['output'])}"
        mid_assets.append({
            "id": item["id"],
            "role": item["role"],
            "provider": "OpenAI OpCo, LLC",
            "model": "gpt-image-2",
            "size": item["size"],
            "background": "transparent",
            "prompt": item["prompt"],
            "outputPath": rel_path,
            "sha256": item["sha256"],
            "costUsd": item.get("estimatedCostUsd", 0.0),
            "selection": {
                "status": "candidate",
                "selectedBy": "issue-135 implementation review",
                "reason": item["reason"],
                "ownerManualReview": "pending"
            }
        })
    mid_prov = {
        "manifestVersion": "1.0.0",
        "updatedAt": "2026-09-07",
        "layer": "middle",
        "depthFactor": 0.5,
        "totalSpendUsd": round(mid_cost, 6),
        "assets": mid_assets
    }
    mid_prov_file = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "abbey", "middle", "provenance.json")
    os.makedirs(os.path.dirname(mid_prov_file), exist_ok=True)
    with open(mid_prov_file, "w") as f:
        json.dump(mid_prov, f, indent=2)

    # 3. Near provenance
    near_ids = ["abbey.stone-terrace-ground", "abbey.lavender-herb-border", "abbey.vaulted-arch-canopy"]
    near_assets = []
    near_cost = 0.0
    for near_id in near_ids:
        item = results_by_id[near_id]
        near_cost += item.get("estimatedCostUsd", 0.0)
        rel_path = f"source-media/abbey/near/{os.path.basename(item['output'])}"
        near_assets.append({
            "id": item["id"],
            "role": item["role"],
            "provider": "OpenAI OpCo, LLC",
            "model": "gpt-image-2",
            "size": item["size"],
            "background": "transparent",
            "prompt": item["prompt"],
            "outputPath": rel_path,
            "sha256": item["sha256"],
            "costUsd": item.get("estimatedCostUsd", 0.0),
            "selection": {
                "status": "candidate",
                "selectedBy": "issue-135 implementation review",
                "reason": item["reason"],
                "ownerManualReview": "pending"
            }
        })
    near_prov = {
        "manifestVersion": "1.0.0",
        "updatedAt": "2026-09-07",
        "layer": "near",
        "depthFactor": 1.0,
        "totalSpendUsd": round(near_cost, 6),
        "assets": near_assets
    }
    near_prov_file = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "abbey", "near", "provenance.json")
    os.makedirs(os.path.dirname(near_prov_file), exist_ok=True)
    with open(near_prov_file, "w") as f:
        json.dump(near_prov, f, indent=2)

    # 4. Cutouts provenance
    cutout_ids = ["abbey.bell-rope", "abbey.abbey-bell"]
    cutout_assets = []
    cutout_cost = 0.0
    for cid in cutout_ids:
        item = results_by_id[cid]
        cutout_cost += item.get("estimatedCostUsd", 0.0)
        role = "obstacle-cutout" if cid == "abbey.bell-rope" else "springboard-cutout"
        rel_path = f"source-media/abbey/cutouts/{os.path.basename(item['output'])}"
        cutout_assets.append({
            "id": item["id"],
            "role": role,
            "provider": "OpenAI OpCo, LLC",
            "model": "gpt-image-2",
            "size": item["size"],
            "background": "transparent",
            "prompt": item["prompt"],
            "outputPath": rel_path,
            "sha256": item["sha256"],
            "costUsd": item.get("estimatedCostUsd", 0.0),
            "selection": {
                "status": "candidate",
                "selectedBy": "issue-135 implementation review",
                "reason": item["reason"],
                "ownerManualReview": "pending"
            }
        })
    cutout_prov = {
        "manifestVersion": "1.0.0",
        "updatedAt": "2026-09-07",
        "category": "cutouts",
        "totalSpendUsd": round(cutout_cost, 6),
        "assets": cutout_assets
    }
    cutout_prov_file = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "abbey", "cutouts", "provenance.json")
    os.makedirs(os.path.dirname(cutout_prov_file), exist_ok=True)
    with open(cutout_prov_file, "w") as f:
        json.dump(cutout_prov, f, indent=2)

    # 5. Shared library provenance update
    shared_prov_file = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "shared", "provenance.json")
    with open(shared_prov_file, "r") as f:
        shared_prov = json.load(f)

    fountain_item = results_by_id["shared.stone-fountain"]
    existing_fountain = next((a for a in shared_prov.get("assets", []) if a["id"] == "shared.stone-fountain"), None)
    if not existing_fountain:
        shared_prov["assets"].append({
            "id": "shared.stone-fountain",
            "role": "shared-set-piece",
            "provider": "OpenAI OpCo, LLC",
            "model": "gpt-image-2",
            "size": fountain_item["size"],
            "background": "transparent",
            "prompt": fountain_item["prompt"],
            "outputPath": "source-media/shared/stone-fountain.png",
            "sha256": fountain_item["sha256"],
            "costUsd": fountain_item.get("estimatedCostUsd", 0.0),
            "selection": {
                "status": "candidate",
                "selectedBy": "issue-135 implementation review",
                "reason": fountain_item["reason"],
                "ownerManualReview": "pending"
            }
        })
        shared_prov["totalSpendUsd"] = round(shared_prov.get("totalSpendUsd", 0.0) + fountain_item.get("estimatedCostUsd", 0.0), 6)
        shared_prov["updatedAt"] = "2026-09-07"
        with open(shared_prov_file, "w") as f:
            json.dump(shared_prov, f, indent=2)

def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY is not set", file=sys.stderr, flush=True)
        sys.exit(1)

    print(f"Starting parallel generation of {len(ITEMS_TO_GENERATE)} Abbey kit assets (workers=4)...", flush=True)
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

    results_by_id = {r["id"]: r for r in results}

    summary_file = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "abbey", "generation_summary.json")
    with open(summary_file, "w") as f:
        json.dump({
            "totalCostUsd": round(total_cost, 4),
            "itemCount": len(results),
            "items": results
        }, f, indent=2)

    write_provenance_files(results_by_id)

    print(f"\nAll generations complete! Total cost: ${round(total_cost, 4)}", flush=True)
    print(f"Summary written to {summary_file}", flush=True)

if __name__ == "__main__":
    main()
