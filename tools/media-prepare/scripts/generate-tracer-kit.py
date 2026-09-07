#!/usr/bin/env python3
"""
Generate the complete Rose Garden tracer scenery kit, shared library seeds,
and interactive cutouts using direct OpenAI Images API calls with parallel execution.
"""

import os
from openai_image_kit import REPO_ROOT, run_kit_generation

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
        "prompt": "Use case: production game radiant Star Sparkle cutout. A magical, radiant four-pointed celestial star sparkle with glowing golden light rays, shimmering stardust particles, and a brilliant diamond-white core. Floating starlight emblem on transparent background. Clean alpha channel, no background, no circular badge border, no text. Storybook picture-book style matching Fairytale Sicily.",
    },
    {
        "id": "shared.rainbow-archway",
        "role": "archway",
        "output": os.path.join(REPO_ROOT, "shared", "edition", "source-media", "shared", "rainbow-archway.png"),
        "size": "1024x1536",
        "transparent": True,
        "prompt": "Use case: production game Rainbow Archway cutout. A grand classical storybook archway of warm cream-and-gold marble pillars with carved floral reliefs, crowned with vibrant shining rainbow bands spanning the semicircular arch, topped with a glowing golden six-pointed star crest. Wide open portal between the two pillars. Isolated archway on transparent background with clean alpha transparency through the arch opening and outside the structure. No background, no ground plane, no characters, no text. Storybook picture-book style matching Fairytale Sicily.",
    },
]

def main():
    summary_file = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "garden", "generation_summary.json")
    run_kit_generation(ITEMS_TO_GENERATE, "Rose Garden kit", summary_file)

if __name__ == "__main__":
    main()
