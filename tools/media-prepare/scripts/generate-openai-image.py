#!/usr/bin/env python3
"""
Direct OpenAI Images API invoker for Princess Rosie scenery and cutouts.
Zero third-party dependencies (uses Python standard library).

Supports:
- Text-to-image generation (/v1/images/generations)
- Reference-guided edits (/v1/images/edits)
- Transparent background (gpt-image-2 preview)
- Arbitrary aspect ratios (up to 3:1, dimensions multiple of 16)
- Structured JSON output with SHA-256 and cost for provenance manifests
"""

import argparse
import hashlib
import json
import mimetypes
import os
import sys
import urllib.request
import urllib.error
import uuid

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

def main():
    parser = argparse.ArgumentParser(description="Directly invoke OpenAI Images API")
    parser.add_argument("--prompt", required=True, help="Image prompt text")
    parser.add_argument("--output", "-o", required=True, help="Output image file path")
    parser.add_argument("--model", default="gpt-image-2", help="Model name (default: gpt-image-2)")
    parser.add_argument("--size", default="1024x1024", help="Resolution WIDTHxHEIGHT (e.g. 3072x1024, 1024x1024)")
    parser.add_argument("--quality", default="high", choices=["standard", "high", "low", "medium", "auto"], help="Quality")
    parser.add_argument("--transparent", action="store_true", help="Request transparent background (RGBA PNG)")
    parser.add_argument("--image", help="Optional reference image path for /v1/images/edits")
    parser.add_argument("--mask", help="Optional alpha mask image path for /v1/images/edits")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    background = "transparent" if args.transparent else "opaque"

    if args.image:
        url = "https://api.openai.com/v1/images/edits"
        fields = {
            "model": args.model,
            "prompt": args.prompt,
            "size": args.size,
            "quality": args.quality,
            "background": background,
            "output_format": "png",
        }
        files = {}
        with open(args.image, "rb") as f:
            mime = mimetypes.guess_type(args.image)[0] or "image/png"
            files["image"] = (os.path.basename(args.image), f.read(), mime)

        if args.mask:
            with open(args.mask, "rb") as f:
                mask_mime = mimetypes.guess_type(args.mask)[0] or "image/png"
                files["mask"] = (os.path.basename(args.mask), f.read(), mask_mime)

        payload, content_type = create_multipart(fields, files)
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": content_type,
        }
    else:
        url = "https://api.openai.com/v1/images/generations"
        payload_data = {
            "model": args.model,
            "prompt": args.prompt,
            "size": args.size,
            "quality": args.quality,
            "background": background,
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

    # Download image bytes
    image_entry = data["data"][0]
    if "b64_json" in image_entry:
        import base64
        image_bytes = base64.b64decode(image_entry["b64_json"])
    elif "url" in image_entry:
        img_req = urllib.request.Request(image_entry["url"], headers={"User-Agent": "PrincessRosie/1.0"})
        with urllib.request.urlopen(img_req) as img_resp:
            image_bytes = img_resp.read()
    else:
        print("Error: No b64_json or url in response", file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "wb") as f:
        f.write(image_bytes)

    sha256 = hashlib.sha256(image_bytes).hexdigest()

    # Extract usage and cost if provided
    usage = data.get("usage", {})
    text_in = usage.get("input_tokens", 0)
    img_in = usage.get("image_input_tokens", 0)
    img_out = usage.get("output_tokens", 0)
    cost = calculate_cost(text_in, img_in, img_out)

    metadata = {
        "model": args.model,
        "size": args.size,
        "output": args.output,
        "sha256": sha256,
        "background": background,
        "tokens": {
            "text_in": text_in,
            "img_in": img_in,
            "img_out": img_out,
        },
        "estimatedCostUsd": cost,
        "revisedPrompt": image_entry.get("revised_prompt", args.prompt),
    }

    print(json.dumps(metadata, indent=2))

if __name__ == "__main__":
    main()
