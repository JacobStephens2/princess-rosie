#!/usr/bin/env python3
"""
Generate the complete Cloister of Clouds scenery kit, shared library additions,
and interactive cutouts using direct OpenAI Images API calls with parallel execution.
"""

import json
import os
import sys

from kit_generator import (
    PRICING_PER_1M_TOKENS,
    calculate_cost,
    generate_image,
    build_provenance_manifest,
    run_kit_generation,
)

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

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

def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY is not set", file=sys.stderr, flush=True)
        sys.exit(1)

    print(f"Starting parallel generation of {len(ITEMS_TO_GENERATE)} Cloister of Clouds kit assets (workers=4)...", flush=True)
    results, total_cost = run_kit_generation(api_key, ITEMS_TO_GENERATE, max_workers=4)

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
    far_manifest = build_provenance_manifest(far_items, "far", 0.2, repo_root=REPO_ROOT, selected_by="issue-136 implementation review")
    os.makedirs(os.path.join(cloister_dir, "far"), exist_ok=True)
    with open(os.path.join(cloister_dir, "far", "provenance.json"), "w") as f:
        json.dump(far_manifest, f, indent=2)

    # 2. Middle
    middle_items = [
        results["cloister.cloister-arcade"],
        results["cloister.cloud-colonnade-pavilion"],
        results["cloister.sunlit-stone-balustrade"]
    ]
    middle_manifest = build_provenance_manifest(middle_items, "middle", 0.5, repo_root=REPO_ROOT, selected_by="issue-136 implementation review")
    os.makedirs(os.path.join(cloister_dir, "middle"), exist_ok=True)
    with open(os.path.join(cloister_dir, "middle", "provenance.json"), "w") as f:
        json.dump(middle_manifest, f, indent=2)

    # 3. Near
    near_items = [
        results["cloister.soft-cloud-ground"],
        results["cloister.cloud-stepping-stones"],
        results["cloister.sunlit-arch-canopy"]
    ]
    near_manifest = build_provenance_manifest(near_items, "near", 1.0, repo_root=REPO_ROOT, selected_by="issue-136 implementation review")
    os.makedirs(os.path.join(cloister_dir, "near"), exist_ok=True)
    with open(os.path.join(cloister_dir, "near", "provenance.json"), "w") as f:
        json.dump(near_manifest, f, indent=2)

    # 4. Cutouts
    cutout_items = [
        results["cloister.soft-cloud"],
        results["cloister.cloud-updraft"]
    ]
    cutouts_manifest = build_provenance_manifest(cutout_items, "cutouts", repo_root=REPO_ROOT, selected_by="issue-136 implementation review")
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
