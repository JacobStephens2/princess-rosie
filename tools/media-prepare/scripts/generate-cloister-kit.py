#!/usr/bin/env python3
"""
Generate the complete Cloister of Clouds scenery kit, shared library additions,
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
                meta["category"] = item["category"]
                return meta
        return {
            "id": item["id"],
            "role": item["role"],
            "category": item["category"],
            "reason": item["reason"],
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
        "category": item["category"],
        "reason": item["reason"],
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
        "id": "cloister.far-layer",
        "role": "far-layer",
        "category": "far",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "cloister", "far", "far-layer.png"),
        "size": "3072x1024",
        "transparent": False,
        "prompt": "Use case: production game far scenery layer. A wide panoramic landscape of Cloister of Clouds far layer: clear sunny sapphire blue and radiant golden sky with soft drifting fairytale clouds, distant Sicilian mountain peaks rising softly through a morning sea of pastel clouds, and golden sunbeams under warm Mediterranean light. Distant panoramic viewpoint, no foreground arches, no foreground buildings, no people, no characters, no text, no star. Painterly children's picture-book illustration matching Fairytale Sicily.",
        "reason": "Opaque 3:1 panorama landscape vista of tranquil open sky, soft morning cloud banks, and distant Sicilian mountain peaks under warm Mediterranean light; no characters, text, or foreground arches.",
    },
    {
        "id": "cloister.cloister-arcade",
        "role": "cloister-arcade",
        "category": "middle",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "cloister", "middle", "cloister-arcade.png"),
        "size": "3072x1024",
        "transparent": True,
        "prompt": "Use case: production game middle scenery Set Piece. Preserve the architectural and atmospheric composition from the approved reference painting of Cloister of Clouds: a grand, sunlit classical cloister arcade of warm honey-colored stone pillars and semicircular arches floating gracefully in the open sky, catching radiant golden light, flanked by low stone balustrades, stone urns overflowing with blooming pink roses and lavender, with clouds drifting around the base. Wide panoramic Set Piece on transparent background. Clean alpha channel through all arch openings and outside the stone structure, no background sky, no ground plane below the stone base, no characters, no text. Storybook picture-book style matching Fairytale Sicily.",
        "reason": "Grand sunlit classical cloister arcade of warm honey-colored stone arches and pillars on transparent background framing arrival at Rainbow Archway.",
    },
    {
        "id": "cloister.cloud-colonnade-pavilion",
        "role": "cloud-colonnade-pavilion",
        "category": "middle",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "cloister", "middle", "cloud-colonnade-pavilion.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game middle scenery Set Piece. A classical floating open pavilion or colonnade of warm honey stone pillars supporting elegant rounded arches and a delicate carved stone cornice, resting upon a soft voluminous white and blush cloud bank floating in mid-air. Lateral Set Piece on transparent background. Clean alpha channel through arch openings and around structure, no background sky, no ground below cloud base, no characters, no text. Storybook picture-book style matching Cloister of Clouds.",
        "reason": "Classical floating colonnade pavilion of warm honey stone arches resting upon a billowy cloud base on transparent background.",
    },
    {
        "id": "cloister.sunlit-stone-balustrade",
        "role": "sunlit-stone-balustrade",
        "category": "middle",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "cloister", "middle", "sunlit-stone-balustrade.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game middle scenery Set Piece. A lateral run of classical sunlit cream-and-honey stone balustrades with carved balusters and stone pedestals topped with ornate urn planters of blooming blush roses, lavender, and trailing green vines, resting atop pillowy fairytale clouds. Lateral Set Piece on transparent background. Clean alpha channel, no sky, no ground below clouds, no characters, no text. Storybook picture-book style matching Cloister of Clouds.",
        "reason": "Classical sunlit cream-and-honey stone balustrade with carved balusters and flowering urn planters on soft clouds on transparent background.",
    },
    {
        "id": "shared.stone-planter",
        "role": "stone-planter",
        "category": "shared",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "shared", "stone-planter.png"),
        "size": "1024x1024",
        "transparent": True,
        "prompt": "Use case: production game shared library Set Piece. A charming freestanding storybook classical stone urn planter of warm carved cream limestone, overflowing with vibrant blooming pink roses, purple lavender, and trailing ivy vines, resting on a sturdy carved stone pedestal. Isolated vertical Set Piece on transparent background. Clean alpha channel, no ground plane outside stone pedestal base, no background, no characters, no text. Storybook picture-book illustration style.",
        "reason": "Charming freestanding storybook classical stone urn planter overflowing with pink roses and lavender on carved pedestal on transparent background.",
    },
    {
        "id": "cloister.soft-cloud-ground",
        "role": "soft-cloud-ground",
        "category": "near",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "cloister", "near", "soft-cloud-ground.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game near scenery Set Piece. A horizontal ground strip of soft, voluminous banked cumulus clouds, pale and pillowy and rounded, with warm golden sunlit rim highlights and pastel pink and lavender shaded undersides, carrying the Storybook Ground along the bottom of the screen. Low horizontal cloud bank spanning the width on transparent background. Clean alpha channel everywhere above the upper billowing cloud contour, no sky, no ground below, no characters, no text. Storybook picture-book style matching Cloister of Clouds.",
        "reason": "Soft voluminous rounded banked cumulus clouds with golden rim highlights carrying Storybook Ground on transparent background.",
    },
    {
        "id": "cloister.cloud-stepping-stones",
        "role": "cloud-stepping-stones",
        "category": "near",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "cloister", "near", "cloud-stepping-stones.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game near scenery Set Piece. A horizontal ground strip of smooth cream flagstone pavers and stepping stones nestled among billowy soft white clouds with scattered fallen flower petals and tiny flowering cloud-moss, carrying the Storybook Ground. Low horizontal paved stone and cloud strip spanning the width on transparent background. Clean alpha channel everywhere above the ground surface, no sky, no background, no characters, no text. Storybook picture-book style matching Cloister of Clouds.",
        "reason": "Smooth cream flagstone pavers and stepping stones nestled in soft clouds carrying Storybook Ground on transparent background.",
    },
    {
        "id": "cloister.sunlit-arch-canopy",
        "role": "sunlit-arch-canopy",
        "category": "near",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "cloister", "near", "sunlit-arch-canopy.png"),
        "size": "1536x1024",
        "transparent": True,
        "prompt": "Use case: production game near scenery Set Piece. An overarching upper canopy border of sunlit honey-colored stone arches and classical carved architectural mouldings framing the top of the scene, with climbing pink roses and soft wisps of cloud curling around the arch keystones. Overhanging top-edge Set Piece on transparent background. Clean alpha channel everywhere below the arched stone openings and lower border, no background sky, no ground, no characters, no text. Storybook picture-book style matching Cloister of Clouds.",
        "reason": "Overarching upper canopy of sunlit honey stone arches and carved mouldings framing the top of the scene on transparent background.",
    },
    {
        "id": "cloister.soft-cloud",
        "role": "soft-cloud",
        "category": "cutouts",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "cloister", "cutouts", "soft-cloud.png"),
        "size": "1024x1024",
        "transparent": True,
        "prompt": "Use case: production game playful obstacle cutout. A charming, gentle storybook soft cloud obstacle cutout for a gentle children's game: a fluffy, pillowy rounded white cloud puff with gentle lavender-tinged shadows and a warm golden starlight outline, hovering softly above a small wisp of cloud mist. Genuine RGBA transparent background around the cloud silhouette. Isolated cutout, no background, no ground plane, no characters, no text. Flat modern children's picture-book illustration style matching Fairytale Sicily.",
        "reason": "Charming gentle fluffy pillowy cloud puff obstacle hovering with golden outline on transparent background.",
    },
    {
        "id": "cloister.cloud-updraft",
        "role": "cloud-updraft",
        "category": "cutouts",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "cloister", "cutouts", "cloud-updraft.png"),
        "size": "1024x1024",
        "transparent": True,
        "prompt": "Use case: production game interactive springboard cutout. A joyful, magical storybook springboard cutout: a spiraling, springy cloud updraft swirling upward like a soft coiled vortex of luminous white cloud ribbons and glowing golden starlight pollen at its buoyant crest, designed for Stella to bounce high into the sky. Upright and bouncy. Isolated cutout on transparent background. Clean alpha channel, no background, no ground outside base, no characters, no text. Storybook picture-book style matching Fairytale Sicily.",
        "reason": "Joyful spiraling springy cloud updraft vortex with glowing golden starlight crest on transparent background.",
    },
]

def build_provenance_manifest(items: list, category: str, depth_factor: float = None) -> dict:
    assets = []
    total_cost = 0.0
    for it in items:
        cost = it.get("estimatedCostUsd", 0.0)
        total_cost += cost
        rel_output = os.path.relpath(it["output"], os.path.join(REPO_ROOT, "shared", "edition"))
        assets.append({
            "id": it["id"],
            "role": it["role"],
            "provider": "OpenAI OpCo, LLC",
            "model": it.get("model", "gpt-image-2"),
            "size": it["size"],
            "background": it.get("background", "transparent"),
            "prompt": it["prompt"],
            "outputPath": rel_output,
            "sha256": it["sha256"],
            "costUsd": cost,
            "selection": {
                "status": "candidate",
                "selectedBy": "issue-136 implementation review",
                "reason": it["reason"],
                "ownerManualReview": "pending"
            }
        })
    manifest = {
        "manifestVersion": "1.0.0",
        "updatedAt": "2026-09-07",
    }
    if category in ("far", "middle", "near"):
        manifest["layer"] = category
        if depth_factor is not None:
            manifest["depthFactor"] = depth_factor
    else:
        manifest["category"] = category
    manifest["totalSpendUsd"] = round(total_cost, 6)
    manifest["assets"] = assets
    return manifest

def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY is not set", file=sys.stderr, flush=True)
        sys.exit(1)

    print(f"Starting parallel generation of {len(ITEMS_TO_GENERATE)} Cloister of Clouds kit assets (workers=4)...", flush=True)
    results = {}
    total_cost = 0.0

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(generate_image, api_key, item): item for item in ITEMS_TO_GENERATE}
        for future in concurrent.futures.as_completed(futures):
            item = futures[future]
            try:
                meta = future.result()
                results[item["id"]] = meta
                total_cost += meta.get("estimatedCostUsd", 0.0)
            except Exception as e:
                print(f"Error generating {item['id']}: {e}", file=sys.stderr, flush=True)
                sys.exit(1)

    # Write generation summary
    cloister_dir = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "cloister")
    summary_file = os.path.join(cloister_dir, "generation_summary.json")
    with open(summary_file, "w") as f:
        json.dump({
            "totalCostUsd": round(total_cost, 4),
            "itemCount": len(results),
            "items": list(results.values())
        }, f, indent=2)

    # Write layer provenance files
    # 1. Far
    far_items = [results["cloister.far-layer"]]
    far_manifest = build_provenance_manifest(far_items, "far", 0.2)
    os.makedirs(os.path.join(cloister_dir, "far"), exist_ok=True)
    with open(os.path.join(cloister_dir, "far", "provenance.json"), "w") as f:
        json.dump(far_manifest, f, indent=2)

    # 2. Middle
    middle_items = [
        results["cloister.cloister-arcade"],
        results["cloister.cloud-colonnade-pavilion"],
        results["cloister.sunlit-stone-balustrade"]
    ]
    middle_manifest = build_provenance_manifest(middle_items, "middle", 0.5)
    os.makedirs(os.path.join(cloister_dir, "middle"), exist_ok=True)
    with open(os.path.join(cloister_dir, "middle", "provenance.json"), "w") as f:
        json.dump(middle_manifest, f, indent=2)

    # 3. Near
    near_items = [
        results["cloister.soft-cloud-ground"],
        results["cloister.cloud-stepping-stones"],
        results["cloister.sunlit-arch-canopy"]
    ]
    near_manifest = build_provenance_manifest(near_items, "near", 1.0)
    os.makedirs(os.path.join(cloister_dir, "near"), exist_ok=True)
    with open(os.path.join(cloister_dir, "near", "provenance.json"), "w") as f:
        json.dump(near_manifest, f, indent=2)

    # 4. Cutouts
    cutout_items = [
        results["cloister.soft-cloud"],
        results["cloister.cloud-updraft"]
    ]
    cutouts_manifest = build_provenance_manifest(cutout_items, "cutouts")
    os.makedirs(os.path.join(cloister_dir, "cutouts"), exist_ok=True)
    with open(os.path.join(cloister_dir, "cutouts", "provenance.json"), "w") as f:
        json.dump(cutouts_manifest, f, indent=2)

    # 5. Update shared provenance
    shared_prov_path = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "shared", "provenance.json")
    with open(shared_prov_path, "r") as f:
        shared_prov = json.load(f)

    shared_item = results["shared.stone-planter"]
    rel_output = os.path.relpath(shared_item["output"], os.path.join(REPO_ROOT, "shared", "edition"))
    existing_asset_ids = {a["id"] for a in shared_prov["assets"]}
    if "shared.stone-planter" not in existing_asset_ids:
        shared_prov["assets"].append({
            "id": "shared.stone-planter",
            "role": "shared-set-piece",
            "provider": "OpenAI OpCo, LLC",
            "model": shared_item.get("model", "gpt-image-2"),
            "size": shared_item["size"],
            "background": shared_item.get("background", "transparent"),
            "prompt": shared_item["prompt"],
            "outputPath": rel_output,
            "sha256": shared_item["sha256"],
            "costUsd": shared_item.get("estimatedCostUsd", 0.0),
            "selection": {
                "status": "candidate",
                "selectedBy": "issue-136 implementation review",
                "reason": shared_item["reason"],
                "ownerManualReview": "pending"
            }
        })
    shared_prov["totalSpendUsd"] = round(sum(a["costUsd"] for a in shared_prov["assets"]), 6)
    with open(shared_prov_path, "w") as f:
        json.dump(shared_prov, f, indent=2)

    print(f"\nAll generations complete! Total cost: ${round(total_cost, 4)}", flush=True)
    print(f"Provenance manifests written under {cloister_dir} and shared/provenance.json", flush=True)

if __name__ == "__main__":
    main()
