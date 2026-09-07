#!/usr/bin/env python3
"""
Generate the complete Sapphire Sea scenery kit, shared library additions,
and interactive cutouts using direct OpenAI Images API calls with parallel execution.
"""

import json
import os
import sys

from kit_generator import (
    PRICING_PER_1M_TOKENS,
    calculate_cost,
    generate_image,
    run_kit_generation,
)

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

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
    results_map, total_cost = run_kit_generation(api_key, ITEMS_TO_GENERATE, max_workers=4)
    results = list(results_map.values())

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
