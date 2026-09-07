import os
from PIL import Image

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DIR = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "garden", "bake-off")
STAGE_WIDTH = 1280
STAGE_HEIGHT = 720
GROUND_Y = 560

entrants = [
    {
        "name": "gpt-image-2",
        "label": "OpenAI gpt-image-2",
        "far": os.path.join(DIR, "gpt-image-2-far-layer.png"),
        "arch": os.path.join(DIR, "gpt-image-2-arch-cluster.png"),
        "bush": os.path.join(DIR, "gpt-image-2-rose-bush.png"),
        "composite": os.path.join(DIR, "composite-gpt-image-2.png"),
    },
    {
        "name": "recraft",
        "label": "Recraft V4 Styles",
        "far": os.path.join(DIR, "recraft-far-layer.png"),
        "arch": os.path.join(DIR, "recraft-arch-cluster.png"),
        "bush": os.path.join(DIR, "recraft-rose-bush.png"),
        "composite": os.path.join(DIR, "composite-recraft.png"),
    },
    {
        "name": "flux-2-pro",
        "label": "FLUX-2 Pro (fal.ai + rembg)",
        "far": os.path.join(DIR, "flux-2-pro-far-layer.png"),
        "arch": os.path.join(DIR, "flux-2-pro-arch-cluster.png"),
        "bush": os.path.join(DIR, "flux-2-pro-rose-bush.png"),
        "composite": os.path.join(DIR, "composite-flux-2-pro.png"),
    }
]

frames = []

for entrant in entrants:
    # 1. Base frame 1280x720
    frame = Image.new("RGBA", (STAGE_WIDTH, STAGE_HEIGHT), (255, 255, 255, 255))
    
    # 2. Far layer fitted to cover 1280x720 maintaining aspect ratio (center-cropped slice of panorama)
    far_img = Image.open(entrant["far"]).convert("RGBA")
    far_w, far_h = far_img.size
    scale = max(STAGE_WIDTH / far_w, STAGE_HEIGHT / far_h)
    scaled_w = int(round(far_w * scale))
    scaled_h = int(round(far_h * scale))
    far_resized = far_img.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
    crop_x = (scaled_w - STAGE_WIDTH) // 2
    crop_y = (scaled_h - STAGE_HEIGHT) // 2
    far_cropped = far_resized.crop((crop_x, crop_y, crop_x + STAGE_WIDTH, crop_y + STAGE_HEIGHT))
    frame.paste(far_cropped, (0, 0))

    # 3. Arch cluster Set Piece scaled to Stage width (1280), keeping aspect ratio
    arch_img = Image.open(entrant["arch"]).convert("RGBA")
    arch_w, arch_h = arch_img.size
    arch_scaled_w = STAGE_WIDTH
    arch_scaled_h = int(round(STAGE_WIDTH * (arch_h / arch_w)))
    arch_resized = arch_img.resize((arch_scaled_w, arch_scaled_h), Image.Resampling.LANCZOS)
    # Position arch so its base aligns comfortably with ground or lower midground
    arch_y = max(0, min(GROUND_Y - arch_scaled_h + 40, STAGE_HEIGHT - arch_scaled_h))
    frame.paste(arch_resized, (0, arch_y), mask=arch_resized)

    # 4. Rose bush obstacle cutout on Storybook Ground (y = 560)
    bush_img = Image.open(entrant["bush"]).convert("RGBA")
    bush_w, bush_h = bush_img.size
    bush_target_h = 140
    bush_target_w = int(round(bush_target_h * (bush_w / bush_h)))
    bush_resized = bush_img.resize((bush_target_w, bush_target_h), Image.Resampling.LANCZOS)
    # Bottom of bush sits exactly on Storybook Ground (y = 560)
    bush_x = int(round(STAGE_WIDTH * 0.65))
    bush_y = GROUND_Y - bush_target_h
    frame.paste(bush_resized, (bush_x, bush_y), mask=bush_resized)

    # Save individual composite frame (unobscured Stage view)
    frame.save(entrant["composite"], "PNG")
    print(f"Saved {entrant['composite']}")
    frames.append(frame)

# Create 3-panel side-by-side contact sheet at Stage size: 3840 x 720
contact_sheet = Image.new("RGBA", (STAGE_WIDTH * len(frames), STAGE_HEIGHT), (0, 0, 0, 255))
for i, f in enumerate(frames):
    contact_sheet.paste(f, (i * STAGE_WIDTH, 0))

contact_sheet_path = os.path.join(DIR, "contact-sheet.png")
contact_sheet.save(contact_sheet_path, "PNG")
print(f"Saved contact sheet to {contact_sheet_path} ({contact_sheet.size[0]}x{contact_sheet.size[1]})")
