#!/usr/bin/env python3
"""
Shared kit generation helpers for Princess Rosie scenery and cutout kits.
Provides OpenAI Images API invoker, token pricing calculations, parallel execution,
and standardized provenance manifest generation.
"""

import concurrent.futures
import hashlib
import json
import os
import sys
import time
import urllib.request
import urllib.error

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

def generate_image(api_key: str, item: dict, default_model: str = "gpt-image-2") -> dict:
    prompt = item["prompt"]
    output_path = item["output"]
    size = item["size"]
    transparent = item.get("transparent", True)
    model = item.get("model", default_model)

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
                if "reason" in item:
                    meta["reason"] = item["reason"]
                if "category" in item:
                    meta["category"] = item["category"]
                return meta
        return {
            "id": item["id"],
            "role": item["role"],
            "category": item.get("category", ""),
            "reason": item.get("reason", ""),
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
        "category": item.get("category", ""),
        "reason": item.get("reason", ""),
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

def build_provenance_manifest(
    items: list,
    category: str,
    depth_factor: float = None,
    repo_root: str = None,
    selected_by: str = "implementation review",
    date_str: str = "2026-09-07",
) -> dict:
    assets = []
    total_cost = 0.0
    for it in items:
        cost = it.get("estimatedCostUsd", 0.0)
        total_cost += cost
        output_path = it["output"]
        if repo_root:
            rel_output = os.path.relpath(output_path, os.path.join(repo_root, "shared", "edition"))
        else:
            rel_output = output_path
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
                "selectedBy": selected_by,
                "reason": it.get("reason", ""),
                "ownerManualReview": "pending"
            }
        })
    manifest = {
        "manifestVersion": "1.0.0",
        "updatedAt": date_str,
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

def run_kit_generation(
    api_key: str,
    items: list,
    max_workers: int = 4,
) -> tuple[dict[str, dict], float]:
    results = {}
    total_cost = 0.0
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(generate_image, api_key, item): item for item in items}
        for future in concurrent.futures.as_completed(futures):
            item = futures[future]
            try:
                meta = future.result()
                results[item["id"]] = meta
                total_cost += meta.get("estimatedCostUsd", 0.0)
            except Exception as e:
                print(f"Error generating {item['id']}: {e}", file=sys.stderr, flush=True)
                raise
    return results, total_cost
