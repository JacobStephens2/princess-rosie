# Provider Bake-off Decision: gpt-image-2, Recraft, and FLUX-2 Pro

Date: 2026-09-07  
Issue: [#131](https://github.com/JacobStephens2/princess-rosie/issues/131) (Parent: [#124](https://github.com/JacobStephens2/princess-rosie/issues/124))  
Contact Sheet: [`shared/edition/source-media/garden/bake-off/contact-sheet.png`](../../shared/edition/source-media/garden/bake-off/contact-sheet.png)

## Decision

**OpenAI gpt-image-2 (invoked directly via the OpenAI Images API) is selected as the image provider for all Princess Rosie Scenery Layers and cutouts to come.**

The owner evaluated the three entrants across the two hardest pieces — the Rose Garden arch-cluster Set Piece (3072×1024 transparent, reference-guided) and the rose bush obstacle cutout (1024×1024 transparent) — composited over each entrant's far-layer attempt at 1280×720 Stage size with the obstacle on the Storybook Ground ($y=560$).

All losing entrant assets (Recraft and FLUX-2 Pro) as well as the bake-off candidate assets are preserved under `shared/edition/source-media/garden/bake-off/` with `"status": "candidate"` in [`provenance.json`](../../shared/edition/source-media/garden/bake-off/provenance.json); none are marked approved (per ADR-0017).

> [!TIP]
> **API Invocation Preference for Future Generations:** While the bake-off initially exercised `inkvoke`, future Scenery Layer and cutout generation tasks should invoke the OpenAI Images API (`/v1/images/generations` and `/v1/images/edits`) directly via scripts or SDKs rather than CLI wrappers like `inkvoke`. Direct API calls capture full response metadata (timings, token usage, exact pricing, dimensions) directly into provenance manifests and eliminate wrapper file-handling quirks.

---

## What Decided It

| Evaluation Axis | gpt-image-2 (OpenAI Images API) | Recraft (Recraft V4 Styles) | FLUX-2 Pro (fal.ai + rembg) |
|---|---|---|---|
| **Alpha Transparency** | **Flawless native RGBA.** Clean transparency through the arch openings allows the far-layer sea and rolling hills to show naturally behind the colonnade. Obstacle cutout has zero fringe. | **Flawed.** Recraft `removeBackground` failed to isolate arches from the terrace floor, leaving an opaque lower ground strip across the middle layer. | **Matting artifacts.** Local `rembg` (`isnet-anime`) struggled on fine climbing vines and left edge fringing and blurred voids. |
| **Reference Fidelity** | **Superior.** Faithfully reproduced the approved Rose Garden departure painting's architectural language: warm cream stone arches, climbing pink roses, and silver lace ribbons in flat picture-book style. | **Mixed.** Matched the soft pink palette via `POST /v1/styles`, but copied the reference star into the daytime sky and struggled with side-scrolling Set Piece semantics. | **Poor.** Prompted arch cluster produced ground flower beds and distant hillocks rather than vertical arches and pergolas. |
| **Stage Geometry** | **Understands lateral Set Pieces.** 3072×1024 canvas framed a true side-scroller middle layer that composited seamlessly over the far layer. | **Receding perspective.** Generated an orthogonal central walkway leading into the horizon rather than a lateral scrolling Set Piece. | **Flat landscape.** Lacked architectural depth or vertical framing for game parallax. |
| **Rule Compliance** | **100% US-headquartered.** OpenAI OpCo, LLC (San Francisco, CA). Direct billing. | **100% US-headquartered.** Recraft Inc. (San Francisco, CA). Direct billing. | **Flagged origin.** Hosted/billed by fal.ai (San Francisco, CA), but model originates from BFL GmbH (Freiburg, Germany). |

---

## Generation Log and Spend Breakdown

Every generation was executed at production quality, with provider, model, size, prompt, and cost recorded in `shared/edition/source-media/garden/bake-off/provenance.json`:

### 1. gpt-image-2 (OpenAI)
- **Arch-cluster Set Piece** (`3072x1024`, transparent):
  - Model: `gpt-image-2` via `inkvoke edit` with `shared/edition/source-media/flight/rose-garden-background.png`
  - Output: `shared/edition/source-media/garden/bake-off/gpt-image-2-arch-cluster.png`
  - Tokens: text_in=142, img_in=1508, img_out=3952
  - Cost: **$0.1313**
- **Rose Bush Obstacle Cutout** (`1024x1024`, transparent):
  - Model: `gpt-image-2` via `inkvoke generate`
  - Output: `shared/edition/source-media/garden/bake-off/gpt-image-2-rose-bush.png`
  - Tokens: text_in=110, img_out=7024
  - Cost: **$0.2113**
- **Far-layer Attempt** (`3072x1024`, opaque):
  - Model: `gpt-image-2` via `inkvoke generate`
  - Output: `shared/edition/source-media/garden/bake-off/gpt-image-2-far-layer.png`
  - Tokens: text_in=91, img_out=3952
  - Cost: **$0.1190**
- *gpt-image-2 Subtotal:* **$0.4616**

### 2. Recraft (Recraft Inc.)
- **Style Extraction**:
  - Model: `recraft-style` via `POST /v1/styles` from reference painting (style ID `aacf4fbf-775a-4553-80ad-56aa783669ff`)
  - Cost: **$0.0050**
- **Arch-cluster Set Piece** (`1536x768` [2:1], transparent):
  - Model: `recraftv4_styles` + `/v1/images/removeBackground`
  - Output: `shared/edition/source-media/garden/bake-off/recraft-arch-cluster.png`
  - Cost: $0.0350 (gen) + $0.0100 (bg removal) = **$0.0450**
- **Rose Bush Obstacle Cutout** (`1024x1024`, transparent):
  - Model: `recraftv4_styles` + `/v1/images/removeBackground`
  - Output: `shared/edition/source-media/garden/bake-off/recraft-rose-bush.png`
  - Cost: $0.0350 (gen) + $0.0100 (bg removal) = **$0.0450**
- **Far-layer Attempt** (`1344x768` [16:9], opaque):
  - Model: `recraftv4_styles`
  - Output: `shared/edition/source-media/garden/bake-off/recraft-far-layer.png`
  - Cost: **$0.0350**
- *Recraft Subtotal:* **$0.1300**

### 3. FLUX-2 Pro (fal.ai + local rembg)
- **Arch-cluster Set Piece** (`2560x1024`, transparent):
  - Model: `FLUX-2 Pro` (`fal-ai/flux-2-pro`) + local `rembg` (`isnet-anime` model with alpha matting)
  - Output: `shared/edition/source-media/garden/bake-off/flux-2-pro-arch-cluster.png`
  - Cost: **$0.0540** (2.62 MP)
- **Rose Bush Obstacle Cutout** (`1024x1024`, transparent):
  - Model: `FLUX-2 Pro` (`fal-ai/flux-2-pro`) + local `rembg` (`isnet-anime` model with alpha matting)
  - Output: `shared/edition/source-media/garden/bake-off/flux-2-pro-rose-bush.png`
  - Cost: **$0.0300** (1.00 MP)
- **Far-layer Attempt** (`2560x1024`, opaque):
  - Model: `FLUX-2 Pro` (`fal-ai/flux-2-pro`)
  - Output: `shared/edition/source-media/garden/bake-off/flux-2-pro-far-layer.png`
  - Cost: **$0.0540** (2.62 MP)
- *FLUX-2 Pro Subtotal:* **$0.1380**

---

## Total Bake-off Spend

$$\text{Total Spend} = \$0.4616 + \$0.1300 + \$0.1380 = \mathbf{\$0.7296}$$

The total spend for the complete nine-image bake-off across all three US billers was **$0.73** USD.
