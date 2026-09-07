import os
import hashlib
import json

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DIR = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "garden", "bake-off")

def get_sha256(path: str) -> str:
    if not os.path.exists(path):
        return ""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

generations = [
    # gpt-image-2
    {
        "id": "bake-off.gpt-image-2.arch-cluster",
        "provider": "gpt-image-2 (OpenAI via inkvoke)",
        "model": "gpt-image-2",
        "role": "arch-cluster",
        "size": "3072x1024",
        "prompt": "Use case: production game scenery layer. Preserve the architectural and floral style from the reference Rose Garden painting: elegant sunlit cream stone archways, pergolas, and balustrades adorned with lush climbing pink roses, green foliage, and silver lace ribbons. Render this as a wide transparent Set Piece: a panoramic cluster of cream arches and flower-draped columns that will layer over the sky and distant hills. Ensure genuine transparent background everywhere outside the arches and balustrade, and through the open arch openings. Clean alpha channel, no background sky, no ground plane below the balustrade, no people, no characters, no text, premium flat modern picture-book illustration style.",
        "reference": "source-media/flight/rose-garden-background.png",
        "costUsd": 0.131334,
        "outputPath": "source-media/garden/bake-off/gpt-image-2-arch-cluster.png",
        "sha256": get_sha256(os.path.join(DIR, "gpt-image-2-arch-cluster.png")),
        "selection": {
            "status": "candidate",
            "reason": "Candidate Rose Garden arch-cluster Set Piece generated with gpt-image-2 for issue #131 provider bake-off."
        }
    },
    {
        "id": "bake-off.gpt-image-2.rose-bush",
        "provider": "gpt-image-2 (OpenAI via inkvoke)",
        "model": "gpt-image-2",
        "role": "rose-bush",
        "size": "1024x1024",
        "prompt": "Use case: production game obstacle cutout. A charming, rounded storybook rose bush obstacle cutout for a gentle children's game: a lush green leafy bush clustered with blooming bright pink roses, soft rounded thorns, and cheerful golden flower centers, resting on a small patch of storybook garden grass. Genuine RGBA transparent background around the bush silhouette. Isolated cutout, no background, no ground plane outside the bush base, no characters, no text. Flat modern children's picture-book illustration style matching Fairytale Sicily.",
        "costUsd": 0.211270,
        "outputPath": "source-media/garden/bake-off/gpt-image-2-rose-bush.png",
        "sha256": get_sha256(os.path.join(DIR, "gpt-image-2-rose-bush.png")),
        "selection": {
            "status": "candidate",
            "reason": "Candidate rose bush obstacle cutout generated with gpt-image-2 for issue #131 provider bake-off."
        }
    },
    {
        "id": "bake-off.gpt-image-2.far-layer",
        "provider": "gpt-image-2 (OpenAI via inkvoke)",
        "model": "gpt-image-2",
        "role": "far-layer",
        "size": "3072x1024",
        "prompt": "Use case: production game background layer. 16:9 character-free Rosalia's Rose Garden far scenery layer panorama: sunny sapphire sky with soft gentle clouds, distant green rolling hills dotted with wildflowers, distant sparkling sapphire sea, and warm sunlit atmosphere. Opaque panoramic vista, no people, no unicorns, no animals, no Birthday Stars, no text, no arches, flat modern children's picture-book illustration style.",
        "costUsd": 0.119015,
        "outputPath": "source-media/garden/bake-off/gpt-image-2-far-layer.png",
        "sha256": get_sha256(os.path.join(DIR, "gpt-image-2-far-layer.png")),
        "selection": {
            "status": "candidate",
            "reason": "Candidate far layer attempt generated with gpt-image-2 for issue #131 provider bake-off."
        }
    },
    # Recraft
    {
        "id": "bake-off.recraft.style-reference",
        "provider": "Recraft (Recraft Inc.)",
        "model": "recraft-style",
        "role": "style-reference",
        "size": "reference-style",
        "prompt": "Style reference extraction from approved Rose Garden painting (source-media/flight/rose-garden-background.png) creating style ID aacf4fbf-775a-4553-80ad-56aa783669ff.",
        "costUsd": 0.005,
        "outputPath": "source-media/garden/bake-off/recraft-style-reference.json",
        "sha256": get_sha256(os.path.join(REPO_ROOT, "shared", "edition", "source-media", "flight", "rose-garden-background.png")),
        "selection": {
            "status": "candidate",
            "reason": "Style model created from reference painting for issue #131 provider bake-off."
        }
    },
    {
        "id": "bake-off.recraft.arch-cluster",
        "provider": "Recraft (Recraft Inc.)",
        "model": "recraftv4_styles + removeBackground",
        "role": "arch-cluster",
        "size": "1536x768 (2:1)",
        "prompt": "A wide panoramic cluster of elegant sunlit cream stone archways, pergolas, and balustrades adorned with climbing blooming pink roses, lush green vines, and delicate silver lace ribbons. Solid plain white background. Flat modern children's picture-book illustration style, no text, no characters.",
        "referenceStyleId": "aacf4fbf-775a-4553-80ad-56aa783669ff",
        "costUsd": 0.045,
        "outputPath": "source-media/garden/bake-off/recraft-arch-cluster.png",
        "sha256": get_sha256(os.path.join(DIR, "recraft-arch-cluster.png")),
        "selection": {
            "status": "candidate",
            "reason": "Candidate Rose Garden arch-cluster Set Piece generated with Recraft for issue #131 provider bake-off."
        }
    },
    {
        "id": "bake-off.recraft.rose-bush",
        "provider": "Recraft (Recraft Inc.)",
        "model": "recraftv4_styles + removeBackground",
        "role": "rose-bush",
        "size": "1024x1024",
        "prompt": "A charming, rounded storybook rose bush obstacle cutout for a gentle children's game: a lush green leafy bush clustered with blooming bright pink roses, soft rounded thorns, and cheerful golden flower centers, resting on a small patch of storybook garden grass. Solid plain white background. Flat modern children's picture-book illustration style, no characters, no text.",
        "referenceStyleId": "aacf4fbf-775a-4553-80ad-56aa783669ff",
        "costUsd": 0.045,
        "outputPath": "source-media/garden/bake-off/recraft-rose-bush.png",
        "sha256": get_sha256(os.path.join(DIR, "recraft-rose-bush.png")),
        "selection": {
            "status": "candidate",
            "reason": "Candidate rose bush obstacle cutout generated with Recraft for issue #131 provider bake-off."
        }
    },
    {
        "id": "bake-off.recraft.far-layer",
        "provider": "Recraft (Recraft Inc.)",
        "model": "recraftv4_styles",
        "role": "far-layer",
        "size": "1344x768 (16:9)",
        "prompt": "Spacious character-free panoramic vista of Rosalia's Rose Garden: sunny sapphire sky with soft gentle clouds, distant green rolling hills dotted with wildflowers, distant sparkling blue sea, and warm sunlit atmosphere. Flat modern children's picture-book illustration style, no characters, no text.",
        "referenceStyleId": "aacf4fbf-775a-4553-80ad-56aa783669ff",
        "costUsd": 0.035,
        "outputPath": "source-media/garden/bake-off/recraft-far-layer.png",
        "sha256": get_sha256(os.path.join(DIR, "recraft-far-layer.png")),
        "selection": {
            "status": "candidate",
            "reason": "Candidate far layer attempt generated with Recraft for issue #131 provider bake-off."
        }
    },
    # FLUX-2 Pro
    {
        "id": "bake-off.flux-2-pro.arch-cluster",
        "provider": "fal.ai (Features & Labels, Inc.)",
        "model": "FLUX-2 Pro (fal-ai/flux-2-pro) + local rembg (isnet-anime)",
        "role": "arch-cluster",
        "size": "2560x1024",
        "prompt": "A wide panoramic cluster of elegant sunlit cream stone archways, pergolas, and balustrades adorned with climbing blooming pink roses, lush green vines, and delicate silver lace ribbons, on an ancient stone terrace. Solid clean white background. Flat modern children's picture-book illustration, solid color blocks, soft gentle shadows, picture-book style, no text, no characters, no people.",
        "costUsd": 0.054,
        "outputPath": "source-media/garden/bake-off/flux-2-pro-arch-cluster.png",
        "sha256": get_sha256(os.path.join(DIR, "flux-2-pro-arch-cluster.png")),
        "selection": {
            "status": "candidate",
            "reason": "Candidate Rose Garden arch-cluster Set Piece generated with FLUX-2 Pro via fal.ai for issue #131 provider bake-off."
        }
    },
    {
        "id": "bake-off.flux-2-pro.rose-bush",
        "provider": "fal.ai (Features & Labels, Inc.)",
        "model": "FLUX-2 Pro (fal-ai/flux-2-pro) + local rembg (isnet-anime)",
        "role": "rose-bush",
        "size": "1024x1024",
        "prompt": "A charming, rounded storybook rose bush obstacle cutout for a gentle children's game: a lush green leafy bush clustered with blooming bright pink roses, soft rounded thorns, and cheerful golden flower centers, resting on a small patch of storybook garden grass. Solid plain white background. Flat modern children's picture-book illustration, solid color blocks, soft shadows, no text, no characters.",
        "costUsd": 0.030,
        "outputPath": "source-media/garden/bake-off/flux-2-pro-rose-bush.png",
        "sha256": get_sha256(os.path.join(DIR, "flux-2-pro-rose-bush.png")),
        "selection": {
            "status": "candidate",
            "reason": "Candidate rose bush obstacle cutout generated with FLUX-2 Pro via fal.ai for issue #131 provider bake-off."
        }
    },
    {
        "id": "bake-off.flux-2-pro.far-layer",
        "provider": "fal.ai (Features & Labels, Inc.)",
        "model": "FLUX-2 Pro (fal-ai/flux-2-pro)",
        "role": "far-layer",
        "size": "2560x1024",
        "prompt": "A spacious character-free panoramic landscape vista of Rosalia's Rose Garden: sunny sapphire blue sky with soft gentle clouds, distant green rolling hills dotted with wildflowers, distant sparkling sapphire sea, and warm sunlit atmosphere. Flat modern children's picture-book illustration, solid color blocks, soft shadows, no characters, no text.",
        "costUsd": 0.054,
        "outputPath": "source-media/garden/bake-off/flux-2-pro-far-layer.png",
        "sha256": get_sha256(os.path.join(DIR, "flux-2-pro-far-layer.png")),
        "selection": {
            "status": "candidate",
            "reason": "Candidate far layer attempt generated with FLUX-2 Pro via fal.ai for issue #131 provider bake-off."
        }
    }
]

total_spend = sum(g["costUsd"] for g in generations)

doc = {
    "manifestVersion": "1.0.0",
    "updatedAt": "2026-09-07",
    "purpose": "Provider bake-off candidate assets for issue #131 (gpt-image-2, Recraft, FLUX-2 Pro).",
    "totalSpendUsd": round(total_spend, 6),
    "spendByProvider": {
        "gpt-image-2": round(sum(g["costUsd"] for g in generations if "gpt-image-2" in g["id"]), 6),
        "recraft": round(sum(g["costUsd"] for g in generations if "recraft" in g["id"]), 6),
        "flux-2-pro": round(sum(g["costUsd"] for g in generations if "flux-2-pro" in g["id"]), 6)
    },
    "assets": generations
}

prov_path = os.path.join(DIR, "provenance.json")
with open(prov_path, "w") as f:
    json.dump(doc, f, indent=2)

print(f"Successfully generated {prov_path}")
print(f"Total bake-off spend: ${doc['totalSpendUsd']:.4f}")
print("Spend breakdown:")
for provider, amount in doc["spendByProvider"].items():
    print(f"  {provider:15}: ${amount:.4f}")
