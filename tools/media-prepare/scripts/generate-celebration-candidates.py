#!/usr/bin/env python3
"""
Generate candidate illustrations for Princess Zélie's Birthday Castle celebration
using the direct OpenAI Images API (gpt-image-2) adhering to project provenance
and US-billing guidelines without CLI wrappers.
"""

import argparse
import base64
import hashlib
import json
import os
import sys
import time
import urllib.request
import urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit_generator import PRICING_PER_1M_TOKENS, calculate_cost

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
CANDIDATES_DIR = os.path.join(REPO_ROOT, "shared", "edition", "source-media", "celebration", "candidates")

# Composable prompt fragments eliminating repetitive boilerplate
PREAMBLE_PREFIX = (
    "Use case: illustration-story. Asset type: 16:9 finale celebration illustration for a gentle "
    "children's storybook game. Inside a magnificent warm golden mosaic Birthday Castle terrace in "
    "bright fairytale Sicily"
)
PREAMBLE_EARLY = (
    f"{PREAMBLE_PREFIX}, Princess Rosie and her friendly white flying unicorn Stella have arrived "
    "at Princess Zélie's joyful first-birthday celebration."
)
PREAMBLE_LATER = (
    f"{PREAMBLE_PREFIX}, four-year-old Princess Rosie and her friendly white flying unicorn Stella "
    "have arrived at baby sister Princess Zélie's joyful first-birthday celebration."
)

ZELIE_1_2 = (
    "At the center of the celebration banquet table sits one-year-old baby Princess Zélie happily "
    "seated in an ornate golden storybook high chair, with authentic one-year-old toddler proportions, "
    "chubby rosy cheeks, soft dark brown baby curls, a tiny gold baby crown, and a sweet baby party dress, "
    "joyfully clapping her hands before her first-birthday cake with exactly one lit candle."
)
ZELIE_3 = (
    "At the center of the draped banquet table, one-year-old baby Princess Zélie is clearly visible and "
    "happily seated in an ornate golden storybook high chair, with authentic one-year-old toddler proportions, "
    "chubby rosy cheeks, soft dark brown baby curls, a tiny gold baby crown, and a sweet baby party dress, "
    "clapping joyfully before her birthday cake with exactly one lit candle."
)
ZELIE_4_5_6 = (
    "At the center of the draped banquet table, one-year-old baby Princess Zélie is happily seated in an "
    "ornate golden storybook high chair, with authentic one-year-old baby proportions, chubby rosy cheeks, "
    "soft dark brown baby curls, a tiny gold baby crown, and a sweet baby dress, joyfully clapping her hands "
    "before her birthday cake with exactly one lit candle."
)

ROSIE_1_2 = (
    "Princess Rosie is a fictional pale-skinned blonde storybook child in a rose-pink medieval-fantasy "
    "dress and small gold crown;"
)
ROSIE_3 = (
    "Princess Rosie stands lovingly right beside Princess Zélie's high chair at the table, smiling warmly "
    "at her baby sister in an ornate rose-pink medieval-fantasy dress and small gold crown."
)
ROSIE_4 = (
    "Standing right beside Zélie's high chair at the table is her elder sister Princess Rosie, who is a sweet "
    "four-year-old storybook child with authentic young four-year-old child proportions (about four heads tall, "
    "a young child's face and build, clearly a little girl and not a teenager or adult), with bright golden-blonde "
    "hair, a small gold crown, big cheerful dark eyes, rosy cheeks, and an ornate rose-pink storybook party dress, "
    "smiling lovingly at baby Zélie."
)
ROSIE_5_6 = ROSIE_4.replace(", who is a sweet", ", a sweet")

STELLA_1_2 = (
    "Stella is a kind white winged unicorn with lavender wings, pastel pink-lavender mane, and a "
    "luminous rainbow-striped horn, standing beside Rosie."
)
STELLA_3 = (
    "Stella is a kind, friendly white winged unicorn standing naturally on all four hooves and legs on the "
    "terrace floor beside Rosie (natural four-legged unicorn anatomy with all hooves on the ground, two lavender "
    "feathered wings, pastel pink-lavender mane and tail, and a luminous rainbow-striped horn)."
)
STELLA_4_5_6 = (
    "Stella is a kind, friendly white winged unicorn standing naturally on all four legs and hooves on the "
    "terrace floor beside Rosie (natural four-legged unicorn stance with all four hooves firmly on the ground, "
    "two lavender feathered wings, pastel pink-lavender mane and tail, and a luminous rainbow-striped horn; "
    "no human arms, no upright two-legged stance)."
)

GIGI_1_2 = (
    "Full-height Gigi, the tall friendly giraffe party keeper, dances joyfully in a rose garland on the "
    "mosaic terrace floor."
)
GIGI_3 = (
    "Full-height Gigi, the tall friendly giraffe party keeper, stands dancing joyfully in a playful celebratory "
    "pose wearing a fresh rose garland around her long neck, on the mosaic terrace floor on the right side."
)
GIGI_4_5_6 = (
    "On the right side of the terrace floor, full-height Gigi, the tall friendly giraffe party keeper, dances "
    "joyfully in a playful celebratory pose wearing a lush rose garland around her long neck."
)

FAMILY_1_2 = (
    "The complete family group claps happily around the celebration table: Mom with long straight dirty-blonde "
    "hair and blue jeans; Dad with brown hair, white T-shirt under an open blue shirt, and brown trousers; "
    "Gram with short brown permed curls and lavender cardigan; Pop with short light strawberry-blonde hair; "
    "Aunt with dirty-blonde hair in a bun with bangs and teal top; and taller Uncle with brown pompadour hair "
    "and blue patterned shirt."
)
FAMILY_3_4 = (
    "The complete happy family group claps and cheers around the table: Mom with long straight dirty-blonde "
    "hair and blue jeans; Dad with brown hair, white T-shirt under an open blue shirt, and brown trousers; "
    "Gram with short brown permed curls and lavender cardigan; Pop with short light strawberry-blonde hair "
    "and yellow sweater; Aunt with dirty-blonde hair in a bun with bangs and teal top; and taller Uncle with "
    "brown pompadour hair and blue patterned shirt."
)
FAMILY_5 = (
    "The complete happy family group claps and cheers around the celebration table: "
    "Mom with long straight dirty-blonde hair and blue jeans; "
    "Dad with brown hair, white T-shirt under an open blue shirt, and brown trousers; "
    "Gram with short brown permed curls and lavender cardigan; "
    "Pop with short light strawberry-blonde hair and yellow sweater; "
    "Aunt with dirty-blonde hair in a bun with bangs and teal top; "
    "Uncle Rue, who is about the height of Dad with a slightly more portly build, short dirty-blonde hair, "
    "and glasses, wearing a friendly collared shirt and clapping happily; "
    "and the taller Uncle with brown pompadour hair, blue patterned shirt, and a cheerful smile."
)
FAMILY_6 = (
    "The complete happy family group claps and cheers around the celebration table: "
    "Mom with long straight dirty-blonde hair and blue jeans; "
    "Dad with brown hair, white T-shirt under an open blue shirt, and brown trousers; "
    "Gram with short brown permed curls, reading glasses, and a soft lavender cardigan; "
    "Pop with short light strawberry-blonde hair, glasses, and a neat short goatee, wearing a yellow sweater; "
    "Aunt with dirty-blonde hair in a bun with bangs and teal top; "
    "Uncle Rue, who is about the height of Dad with a medium everyday build (not heavy or portly), short dirty-blonde "
    "hair, and glasses, wearing a cheerful collared shirt and clapping happily; "
    "and the taller Uncle with brown pompadour hair, blue patterned shirt, and a big friendly smile."
)

BEASLEY_1_2 = "Beasley, an orange-and-white cat, plays happily with falling confetti on the terrace floor."
BEASLEY_3 = (
    "Beasley, a friendly orange-and-white family cat with normal feline anatomy (four paws), plays happily with "
    "falling confetti on the mosaic terrace floor."
)
BEASLEY_4_5_6 = (
    "Beasley, a friendly orange-and-white family cat with normal four-legged feline anatomy, plays happily with "
    "falling confetti on the mosaic terrace floor."
)

STARS_1_2 = (
    "In the open Arab-Norman sky arches above the castle terrace, exactly seven golden mosaic stars shine "
    "brightly together in the luminous sky, with gentle drifting confetti and soft fireworks."
)
STARS_3_TO_6 = (
    "In the open Arab-Norman sky arches above the castle terrace, exactly seven golden mosaic Birthday Stars shine "
    "brightly together in an arched constellation across the luminous blue sky, with gentle drifting confetti and "
    "soft fireworks."
)

STYLE_1_2 = (
    "Style/medium: premium flat modern children's picture-book illustration, solid color blocks, gently rounded "
    "shapes, limited soft shadows, subtle paper texture, warm sunny lighting, expressive friendly faces. "
    "Wide cinematic 16:9 composition, all figures clearly visible and unobstructed on the terrace floor and "
    "around the table. Color palette: blush pink, lavender, sapphire, warm cream, jewel tones, luminous mosaic gold. "
    "Lighting/mood: sunny, safe, buoyant, celebratory, joyful."
)
STYLE_3_TO_6 = (
    "Style/medium: premium flat modern children's picture-book illustration, solid color blocks, gently rounded "
    "shapes, limited soft shadows, subtle paper texture, warm sunny lighting, expressive friendly faces. "
    "Wide cinematic 16:9 composition, all figures clearly visible and unobstructed. Color palette: blush pink, "
    "lavender, sapphire, warm cream, jewel tones, luminous mosaic gold. Lighting/mood: sunny, safe, buoyant, "
    "celebratory, joyful."
)

COMMON_NEGATIVE_CONSTRAINTS = (
    "no written text, no numbers, no watermark, no logos, no photorealism, no scary imagery, "
    "no weapons, no peril, no religious figures. Original style, not Disney or any named studio, "
    "no 3D render, no anime, no realistic child portrait."
)

CONSTRAINTS_1_2 = (
    "Constraints: exactly one one-year-old baby in a high chair, exactly one cake with exactly one lit candle, "
    "exactly seven golden stars in the sky arches; all figures standing or seated on the terrace floor, Gigi standing "
    "full-height; " + COMMON_NEGATIVE_CONSTRAINTS
)
CONSTRAINTS_3 = (
    "Constraints: Stella stands on all four legs on the ground with no human arms or upright stance; "
    "Beasley has four cat legs and paws; Gigi has all four giraffe legs and stands full-height; exactly one "
    "one-year-old baby in a high chair; exactly one cake with exactly one lit candle; exactly seven golden "
    "stars in the sky arch; Rosie stands beside Zélie; " + COMMON_NEGATIVE_CONSTRAINTS
)
CONSTRAINTS_4 = (
    "Constraints: Princess Rosie is strictly a four-year-old child with bright golden-blonde hair and young "
    "child proportions (not a teenager, not an adult, not brunette); Princess Zélie is a one-year-old baby with "
    "dark brown curls seated in her high chair; Stella stands naturally on all four legs on the ground (no human arms); "
    "Beasley has four cat paws; Gigi stands full-height on the terrace floor; exactly one birthday cake with exactly "
    "one lit candle; exactly seven golden stars in the sky arch; " + COMMON_NEGATIVE_CONSTRAINTS
)
CONSTRAINTS_5 = (
    "Constraints: Princess Rosie is strictly a four-year-old child with bright golden-blonde hair and young child "
    "proportions (not a teenager, not an adult, not brunette); Princess Zélie is a one-year-old baby with dark brown "
    "curls seated in her high chair; Stella stands naturally on all four legs on the ground (no human arms); Beasley "
    "has four cat paws; Gigi stands full-height on the terrace floor; exactly one birthday cake with exactly one lit "
    "candle; exactly seven golden stars in the sky arch; family includes both Uncle Rue (dirty-blonde hair, glasses, "
    "portly build, dad's height) and the taller Uncle (pompadour hair); " + COMMON_NEGATIVE_CONSTRAINTS
)
CONSTRAINTS_6 = (
    "Constraints: Princess Rosie is strictly a four-year-old child with bright golden-blonde hair and young child "
    "proportions (not a teenager, not an adult, not brunette); Princess Zélie is a one-year-old baby with dark brown "
    "curls seated in her high chair; Stella stands naturally on all four legs on the ground (no human arms); Beasley "
    "has four cat paws; Gigi stands full-height on the terrace floor; Gram and Pop both wear glasses; Pop has a goatee; "
    "Uncle Rue has a medium normal build (not portly) with glasses; exactly one birthday cake with exactly one lit candle; "
    "exactly seven golden stars in the sky arch; " + COMMON_NEGATIVE_CONSTRAINTS
)

def _join(*parts: str) -> str:
    return " ".join(p.strip() for p in parts)

PROMPTS = {
    "candidates_1_2": _join(
        PREAMBLE_EARLY, ZELIE_1_2, GIGI_1_2, ROSIE_1_2, STELLA_1_2,
        FAMILY_1_2, BEASLEY_1_2, STARS_1_2, STYLE_1_2, CONSTRAINTS_1_2,
    ),
    "candidate_3": _join(
        PREAMBLE_EARLY, ZELIE_3, ROSIE_3, STELLA_3, GIGI_3,
        FAMILY_3_4, BEASLEY_3, STARS_3_TO_6, STYLE_3_TO_6, CONSTRAINTS_3,
    ),
    "candidate_4": _join(
        PREAMBLE_LATER, ZELIE_4_5_6, ROSIE_4, STELLA_4_5_6, GIGI_4_5_6,
        FAMILY_3_4, BEASLEY_4_5_6, STARS_3_TO_6, STYLE_3_TO_6, CONSTRAINTS_4,
    ),
    "candidate_5": _join(
        PREAMBLE_LATER, ZELIE_4_5_6, ROSIE_5_6, STELLA_4_5_6, GIGI_4_5_6,
        FAMILY_5, BEASLEY_4_5_6, STARS_3_TO_6, STYLE_3_TO_6, CONSTRAINTS_5,
    ),
    "candidate_6_approved": _join(
        PREAMBLE_LATER, ZELIE_4_5_6, ROSIE_5_6, STELLA_4_5_6, GIGI_4_5_6,
        FAMILY_6, BEASLEY_4_5_6, STARS_3_TO_6, STYLE_3_TO_6, CONSTRAINTS_6,
    ),
}

def generate_candidate(api_key: str, candidate_id: str, prompt: str, output_path: str, force: bool = False) -> dict:
    meta_path = output_path + ".meta.json"
    if not force and os.path.exists(output_path) and os.path.exists(meta_path):
        print(f"Candidate {candidate_id} already exists at {output_path}, reading existing metadata.", flush=True)
        with open(meta_path, "r") as f:
            return json.load(f)

    print(f"Generating candidate {candidate_id} via direct OpenAI Images API (gpt-image-2)...", flush=True)
    start_time = time.time()

    url = "https://api.openai.com/v1/images/generations"
    payload_data = {
        "model": "gpt-image-2",
        "prompt": prompt,
        "size": "1680x944",
        "quality": "high",
        "background": "opaque",
        "output_format": "png",
    }
    payload = json.dumps(payload_data).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
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
        "output": output_path,
        "sha256": sha256,
        "background": "opaque",
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
    parser = argparse.ArgumentParser(description="Generate celebration illustration candidates")
    parser.add_argument("--candidate", choices=["1", "2", "3", "4", "5", "6", "all"], default="all", help="Candidate to generate")
    parser.add_argument("--force", action="store_true", help="Force regeneration even if candidates exist")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    os.makedirs(CANDIDATES_DIR, exist_ok=True)

    candidate_configs = [
        ("celebration.candidate-1", PROMPTS["candidates_1_2"], os.path.join(CANDIDATES_DIR, "celebration-candidate-1.png")),
        ("celebration.candidate-2", PROMPTS["candidates_1_2"], os.path.join(CANDIDATES_DIR, "celebration-candidate-2.png")),
        ("celebration.candidate-3", PROMPTS["candidate_3"], os.path.join(CANDIDATES_DIR, "celebration-candidate-3.png")),
        ("celebration.candidate-4", PROMPTS["candidate_4"], os.path.join(CANDIDATES_DIR, "celebration-candidate-4.png")),
        ("celebration.candidate-5", PROMPTS["candidate_5"], os.path.join(CANDIDATES_DIR, "celebration-candidate-5.png")),
        ("celebration.candidate-6", PROMPTS["candidate_6_approved"], os.path.join(CANDIDATES_DIR, "celebration-candidate-6.png")),
    ]

    selected_configs = []
    if args.candidate == "all":
        selected_configs = candidate_configs
    else:
        idx = int(args.candidate) - 1
        selected_configs = [candidate_configs[idx]]

    results = []
    for cid, prompt, out_path in selected_configs:
        meta = generate_candidate(api_key, cid, prompt, out_path, force=args.force)
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
        "title": "Birthday Castle Finale Illustration Candidates",
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
