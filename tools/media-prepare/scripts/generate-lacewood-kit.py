#!/usr/bin/env python3
"""
Generate the complete Zélie's Lacewood scenery kit, shared library additions,
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
    results_map, total_cost = run_kit_generation(api_key, ITEMS_TO_GENERATE, max_workers=4)
    results = list(results_map.values())

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
