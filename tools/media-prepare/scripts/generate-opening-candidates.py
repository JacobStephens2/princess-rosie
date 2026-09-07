#!/usr/bin/env python3
"""
Generate candidate illustrations for the Opening Storybook Moment ("celebration preparations")
using the direct OpenAI Images API (gpt-image-2), referencing the approved Birthday Castle
finale illustration (#158) to preserve architectural, garland, and lighting continuity.
Zero third-party dependencies (uses Python standard library).
"""

import argparse
import base64
import hashlib
import json
import mimetypes
import os
import sys
import time
import urllib.request
import urllib.error
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit_generator import PRICING_PER_1M_TOKENS, calculate_cost

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
CANDIDATES_DIR = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "opening-storybook", "candidates")
REFERENCE_IMAGE_PATH = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "celebration", "birthday-castle-celebration.png")

# Modular prompt fragments
PREAMBLE = (
    "Use case: illustration-story. Asset type: 16:9 Opening Storybook Moment illustration "
    "(\"celebration preparations\") for a gentle children's storybook game. Inside the magnificent "
    "warm golden mosaic Birthday Castle terrace in bright fairytale Sicily, strictly preserving "
    "architectural, garland, and lighting continuity from the reference image: warm cream and "
    "mosaic gold Arab-Norman arches, sunny open sky arches overlooking the sparkling Sapphire Sea, "
    "and warm mosaic terrace floor."
)

SUBJECT_CANDIDATE_1 = (
    "Gigi, the tall friendly stylized giraffe party keeper, stands full-height on the warm mosaic "
    "terrace floor near center-left, with all four giraffe hooves firmly on the floor. Gigi gracefully "
    "stretches her long slender neck upward toward the upper golden arches, joyfully hanging lush pink "
    "rose garlands and translucent pastel rainbow ribbons across the archway. To the right on the terrace "
    "floor, a festive draped banquet table holds Princess Zélie's rose-decorated first-birthday cake "
    "with exactly one unlit candle (short dark wick, strictly no flame, no fire, no smoke). Standing "
    "expectantly beside the table on the terrace floor is an empty ornate golden storybook high chair "
    "with a tiny gold baby crown resting on its front tray, waiting for the one-year-old birthday girl."
)

SUBJECT_CANDIDATE_2 = (
    "Gigi, the tall friendly stylized giraffe party keeper, stands full-height on the warm mosaic "
    "terrace floor on the right side of the frame, with all four giraffe hooves firmly on the floor. "
    "Gigi gracefully stretches her long slender neck upward to fasten lush pink rose garlands and "
    "fluttering translucent rainbow ribbons along the golden arches. On the left side of the terrace "
    "floor, a festive draped banquet table holds Princess Zélie's rose-decorated first-birthday cake "
    "with exactly one unlit candle (short dark wick, strictly no flame, no fire, no smoke), while an "
    "empty ornate golden storybook high chair waits expectantly beside it with a tiny gold baby crown "
    "resting on its front tray."
)

OFFSCREEN_CHARACTERS = (
    "Princess Zélie, Princess Rosie, Stella the winged unicorn, Beasley the cat, and all Family Guests "
    "remain deliberately offscreen. Gigi is the sole character in the illustration, preparing the castle "
    "before anyone arrives."
)

COMPOSITION_AND_STYLE = (
    "Composition/framing: wide cinematic 16:9 composition. Keep Gigi's face, neck, and decorating action, "
    "the arches, the cake, unlit candle, and the empty high chair with the tiny crown clearly visible in the "
    "central crop-safe area above the lower 35 percent reserved for the HTML story card. "
    "Style/medium: premium flat modern children's picture-book illustration, solid color blocks, gently rounded "
    "shapes, limited soft shadows, subtle paper texture, warm sunny morning lighting, expressive friendly face. "
    "Color palette: luminous mosaic gold, warm cream, blush pink, rose, lavender, sapphire, and restrained rainbow accents. "
    "Lighting/mood: warm sunny morning, safe, expectant, buoyant, celebratory."
)

CONSTRAINTS = (
    "Constraints: exactly one giraffe standing full-height on the terrace floor; exactly one cake with exactly "
    "one unlit candle (dark wick, no flame); exactly one empty golden storybook high chair with one tiny baby crown "
    "on its tray; no humans, no children, no unicorn, no cat, no extra giraffes; no flame, no fire, no smoke, no lit candle; "
    "no written text, no numbers, no watermark, no logos, no photorealism, no scary imagery, no weapons, no peril, "
    "no religious figures. Original style, not Disney or any named studio, no 3D render, no anime, no realistic portrait."
)

def _join(*parts: str) -> str:
    return " ".join(p.strip() for p in parts)

PROMPTS = {
    "candidate_1": _join(PREAMBLE, SUBJECT_CANDIDATE_1, OFFSCREEN_CHARACTERS, COMPOSITION_AND_STYLE, CONSTRAINTS),
    "candidate_2": _join(PREAMBLE, SUBJECT_CANDIDATE_2, OFFSCREEN_CHARACTERS, COMPOSITION_AND_STYLE, CONSTRAINTS),
}

def create_multipart(fields: dict, files: dict) -> tuple[bytes, str]:
    boundary = f"----DirectOpenAIBoundary{uuid.uuid4().hex}"
    body = bytearray()
    for name, value in fields.items():
        if value is not None:
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"))
            body.extend(f"{value}\r\n".encode("utf-8"))
    for name, (filename, content, content_type) in files.items():
        if content is not None:
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode("utf-8"))
            body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
            body.extend(content)
            body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))
    return bytes(body), f"multipart/form-data; boundary={boundary}"

def generate_candidate(api_key: str, candidate_id: str, prompt: str, output_path: str, reference_path: str, force: bool = False) -> dict:
    meta_path = output_path + ".meta.json"
    if not force and os.path.exists(output_path) and os.path.exists(meta_path):
        print(f"Candidate {candidate_id} already exists at {output_path}, reading existing metadata.", flush=True)
        with open(meta_path, "r") as f:
            return json.load(f)

    print(f"Generating candidate {candidate_id} via direct OpenAI Images API (gpt-image-2)...", flush=True)
    start_time = time.time()

    url = "https://api.openai.com/v1/images/edits"
    fields = {
        "model": "gpt-image-2",
        "prompt": prompt,
        "size": "1680x944",
        "quality": "high",
        "background": "opaque",
        "output_format": "png",
    }
    files = {}
    with open(reference_path, "rb") as f:
        mime = mimetypes.guess_type(reference_path)[0] or "image/png"
        files["image"] = (os.path.basename(reference_path), f.read(), mime)

    payload, content_type = create_multipart(fields, files)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": content_type,
    }

    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            data = json.loads(resp_body)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"OpenAI API error ({e.code}): {error_body}", file=sys.stderr)
        sys.exit(1)

    image_entry = data["data"][0]
    if "b64_json" in image_entry:
        image_bytes = base64.b64decode(image_entry["b64_json"])
    elif "url" in image_entry:
        img_req = urllib.request.Request(image_entry["url"], headers={"User-Agent": "PrincessRosie/1.0"})
        with urllib.request.urlopen(img_req) as img_resp:
            image_bytes = img_resp.read()
    else:
        print("Error: No b64_json or url in response", file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(image_bytes)

    sha256 = hashlib.sha256(image_bytes).hexdigest()
    elapsed = round(time.time() - start_time, 2)

    usage = data.get("usage", {})
    text_in = usage.get("input_tokens", 0)
    img_in = usage.get("image_input_tokens", 0)
    img_out = usage.get("output_tokens", 0)
    cost = calculate_cost(text_in, img_in, img_out)

    metadata = {
        "id": candidate_id,
        "model": "gpt-image-2",
        "provider": "OpenAI",
        "providerHeadquarters": "United States",
        "size": "1680x944",
        "quality": "high",
        "output": os.path.relpath(output_path, REPO_ROOT),
        "sha256": sha256,
        "background": "opaque",
        "referenceAsset": os.path.relpath(reference_path, REPO_ROOT),
        "tokens": {
            "text_in": text_in,
            "img_in": img_in,
            "img_out": img_out,
        },
        "estimatedCostUsd": cost,
        "elapsedSeconds": elapsed,
        "prompt": prompt,
        "revisedPrompt": image_entry.get("revised_prompt", prompt),
        "status": "candidate",
    }

    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Generated {candidate_id} in {elapsed}s: cost=${cost:.5f}, sha256={sha256[:12]}...", flush=True)
    return metadata

def main():
    parser = argparse.ArgumentParser(description="Generate opening storybook moment illustration candidates")
    parser.add_argument("--candidate", choices=["1", "2", "all"], default="all", help="Candidate to generate")
    parser.add_argument("--force", action="store_true", help="Force regeneration even if candidates exist")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(REFERENCE_IMAGE_PATH):
        print(f"Error: Approved reference image not found at {REFERENCE_IMAGE_PATH}", file=sys.stderr)
        sys.exit(1)

    os.makedirs(CANDIDATES_DIR, exist_ok=True)

    candidate_configs = [
        ("opening.candidate-1", PROMPTS["candidate_1"], os.path.join(CANDIDATES_DIR, "opening-candidate-1.png")),
        ("opening.candidate-2", PROMPTS["candidate_2"], os.path.join(CANDIDATES_DIR, "opening-candidate-2.png")),
    ]

    selected_configs = []
    if args.candidate == "all":
        selected_configs = candidate_configs
    else:
        idx = int(args.candidate) - 1
        selected_configs = [candidate_configs[idx]]

    results = []
    for cid, prompt, out_path in selected_configs:
        meta = generate_candidate(api_key, cid, prompt, out_path, REFERENCE_IMAGE_PATH, force=args.force)
        results.append(meta)

    # Read or update candidates_summary.json
    summary_path = os.path.join(CANDIDATES_DIR, "candidates_summary.json")
    all_items = {}
    if os.path.exists(summary_path):
        with open(summary_path, "r") as f:
            try:
                prev = json.load(f)
                for item in prev.get("items", []):
                    all_items[item["id"]] = item
            except json.JSONDecodeError:
                pass

    for r in results:
        all_items[r["id"]] = r

    items_list = [all_items[k] for k in sorted(all_items.keys())]
    total_cost = round(sum(item.get("estimatedCostUsd", 0) for item in items_list), 6)

    summary = {
        "title": "Opening Storybook Moment Illustration Candidates",
        "referenceAsset": os.path.relpath(REFERENCE_IMAGE_PATH, REPO_ROOT),
        "totalCostUsd": total_cost,
        "itemCount": len(items_list),
        "items": items_list,
    }

    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    print(f"\nCandidates summary written to {summary_path}")
    print(f"Total estimated cost across {len(items_list)} candidate(s): ${total_cost:.5f}")

if __name__ == "__main__":
    main()
