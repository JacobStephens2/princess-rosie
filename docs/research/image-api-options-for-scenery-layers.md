# Image APIs and local tools for Scenery Layers and character cutouts

Research date: 2026-09-05

## Bottom line

No single service does everything the project needs. The 3800x720 (5.28:1) panorama is the binding constraint: **every provider examined caps direct generation at 4:1 or narrower**, so a far layer at that width must be assembled by generating a legal-ratio image and then expanding it sideways, or by stitching. The second constraint is transparency: only Ideogram (Toronto — excluded by the US-billing rule) documents native RGBA generation at a wide ratio; every approved provider produces opaque pixels that must be cut out afterwards.

The practical shape of a compliant pipeline is therefore:

1. **Style and composition** from a US-billed generator that accepts the approved reference painting as a style/structure reference.
2. **Width** from a documented outpaint/expand endpoint, called iteratively.
3. **Transparency** from a background-removal step — either a paid endpoint or, at no cost and no provider, a local MIT-licensed cutout model.
4. **Seams, star removal, and the patch behind the wing** locally, where the work is deterministic, free, repeatable, and never leaves the machine.

Steps (b), (e), and (f) do not need a paid provider at all. That matters more than any price comparison below, because those three steps are the ones that get run over and over during iteration.

## The provider rule as applied here

The project requires that a paid service be billed directly by a company headquartered in the United States. Two findings need the project owner's judgment rather than an agent's:

- **Non-US models on US platforms.** FLUX is made by BFL GmbH of Freiburg im Breisgau, Germany ([BFL imprint](https://bfl.ai/legal/imprint)). Replicate, LLC (San Francisco) and fal — Features & Labels, Inc. (San Francisco) are US companies that host and bill for FLUX. Billing is US-direct; the model is not US-origin. This satisfies the letter of the rule and is **flagged, not decided**.
- **Stability AI's split entity.** Users outside the UK/EU/Switzerland contract with "Stability AI US Services Corporation, a Delaware corporation with a business address at 10250 Constellation Blvd., Suite 2300, Los Angeles, CA 90067 (United States)" ([2025 Terms of Service](https://stability.ai/2025-terms-of-service)), but the group's parent is Stability AI Ltd of London. Whether "billed by a US-headquartered company" is satisfied by a US subsidiary of a UK parent is a **judgment call for the owner**, so Stability is listed under "Excluded or unverified".

## Summary matrix

Capabilities: **(a)** wide panorama layers to ~3800x720; **(b)** seamless horizontal tiling; **(c)** small transparent cutouts in a shared style; **(d)** outpaint / generative expand; **(e)** mask inpainting; **(f)** background removal to RGBA.

| Provider / tool | HQ | (a) ~5:1 wide | (b) tile | (c) transparent out | (d) expand | (e) inpaint | (f) remove bg | Price at top quality |
|---|---|---|---|---|---|---|---|---|
| **OpenAI gpt-image-2** | San Francisco, CA | No — 3:1 cap, 3840px max edge | No | Yes (`background:"transparent"`, preview) | No | Yes (alpha mask, same dims) | No | Token-priced; $30/1M image-output tokens |
| **Google Gemini (Nano Banana 2 / Pro)** | Mountain View, CA | No — 8:1 and 4:1 offered, no 5:1, no custom px | No | **No** — explicitly unsupported | No | Prompt-only "semantic masking" | No | $0.24/img (Pro 4K); $0.151 (2 4K) |
| **Adobe Firefly Services** | San Jose, CA | Via Expand only (3999x3999 cap) | No | No (Photoshop remove-bg cutout only) | **Yes** — `/v3/images/expand-async` | Yes — `/v3/images/fill-async` | Yes — Photoshop `/v2/remove-background` | Not published (enterprise sales) |
| **Recraft** | San Francisco, CA | Via V3 outpaint only (4096/side cap) | **Yes** — `substyle: seamless` | No (remove-bg cutout only) | **Yes** — `/v1/images/outpaint` | Yes — `/v1/images/inpaint` (V3) | Yes — $0.01 | $0.25/img (V4 Pro 2K) |
| **Scenario** | Covina, CA | Reframe to 6336x5504 | **Yes** — `model_scenario-texture`, `eraseSeam` | Via resold non-US models | **Yes** — `model_scenario-smart-reframe` | Third-party models | Via resold non-US models | Credit plans; per-call not published |
| **Amazon Nova Canvas (Bedrock)** | Seattle, WA | No — 4:1 cap, 4.19MP total | No | **Yes** — BACKGROUND_REMOVAL, 8-bit alpha | **Yes** — OUTPAINTING task | Yes — `maskImage` or `maskPrompt` | Yes | Not retrievable; **EOL 2026-09-30** |
| **FLUX via Replicate** | San Francisco, CA | Custom px exists; ratio limits undocumented | No | No | Yes — `flux-fill-pro` `outpaint` | Yes — `flux-fill-pro` mask | Hosted models, ~$0.0004–$0.004/run | $0.08 (Kontext max) |
| **FLUX via fal.ai** | San Francisco, CA | flux-2 caps 2048/side (4:1); pro undocumented | Yes — `z-image/turbo/tiling` (non-FLUX) | No on FLUX | **Yes** — `flux-2-pro/outpaint` | Yes — `flux-pro/v1/fill` | Yes — Bria $0.018 | $0.08 (Kontext max) |
| **Midjourney** | South San Francisco, CA | n/a | `--tile` (UI only) | No | Pan / Zoom Out (UI only) | Vary Region (UI only) | Erase Background (UI only) | **No public API; automation prohibited** |
| **xAI Grok Imagine** | Austin, TX (registered) | No — 21:9 widest | No | No | No | No mask documented | No | $0.05/img (quality) |
| **Runway Gen-4 Image** | Dover, DE / New York | No — 1680:720 widest (2.33:1) | No | No | No | No | No | $0.08 (1080p) |
| **Luma Uni-1** | Palo Alto, CA | No — 3:1 widest | No | No | No | **No** — "no mask parameter" | No | $0.10 (Uni-1 Max) |
| **Together AI** | San Francisco, CA | `width`/`height` free; limits undocumented | No | No | No | No | No | $0.03 (FLUX.2 pro) |
| **Krea** | San Francisco, CA | Not documented | No | No | No (UI only) | No (UI only) | No | $0.06 (Ideogram 3.0) |
| **Azure AI Foundry** | Redmond, WA | Mirrors OpenAI limits (3:1) | No | Yes (gpt-image-1 only) | No | Yes | No | Not captured |
| — **free local tools** — | | | | | | | | |
| **rembg** (MIT) | n/a | — | — | **Yes** — RGBA out, alpha matting | — | — | **Yes** | Free |
| **BiRefNet** (MIT) | n/a | — | — | **Yes** — matting variants, soft alpha | — | — | **Yes** | Free |
| **transparent-background** (MIT) | n/a | — | — | **Yes** — `--type rgba` | — | — | **Yes** | Free |
| **SAM 2** (Apache-2.0) | n/a | — | — | Binary masks only | — | Mask source | Object isolation | Free |
| **IOPaint + LaMa** (Apache-2.0) | n/a | — | Seam repair after roll | — | Via padded canvas | **Yes** | — | Free |
| **ComfyUI + seamless-tiling** (GPL-3.0) | n/a | — | **Yes** — `x_only` circular padding | — | **Yes** — Pad Image for Outpainting | **Yes** | — | Free |
| **ImageMagick / Pillow** | n/a | — | `-roll` half-width seam trick | RGBA compositing, alpha checks | — | Mask authoring | — | Free |

---

## OpenAI — gpt-image-2

**Headquarters.** The Terms of Use give the entity and address as "OpenAI OpCo, LLC / 1455 3rd Street / San Francisco, CA 94158 / Attn: General Counsel / Copyright Agent", and the governing-law section begins "California law will govern these Terms except for its conflicts of laws principles" ([Terms of Use](https://openai.com/policies/terms-of-use/)). San Francisco, California, USA.

**Sizes.** This is the decisive fact for the panorama. The images guide states the gpt-image-2 constraints as "Maximum edge length must be less than or equal to `3840px`", "Both edges must be multiples of `16px`", "Long edge to short edge ratio must not exceed `3:1`", and "Total pixels must be at least `655,360` and no more than `8,294,400`" ([image generation guide](https://developers.openai.com/api/docs/guides/image-generation)). The API reference confirms arbitrary sizes within that envelope: "For `gpt-image-2` and `gpt-image-2-2026-04-21`, arbitrary resolutions are supported as `WIDTHxHEIGHT` strings" and "Width and height must both be divisible by 16 and the requested aspect ratio must be between 1:3 and 3:1" ([images.generate](https://developers.openai.com/api/reference/python/resources/images/methods/generate)). So 3800x720 is rejected twice over — 5.28:1 exceeds 3:1, and 3800 is not a multiple of 16. The widest legal output is 3:1, e.g. 3840x1280. The guide also warns that "Outputs that contain more than `2560x1440` total pixels, typically referred to as 2K, are considered experimental."

**Transparency.** Supported, and the only major generator besides Ideogram that documents it: "Transparent backgrounds are available in preview for `gpt-image-2`. Set `background: "transparent"` to request one. Use `png` (the default) or `webp`; `jpeg` isn't supported with transparent backgrounds" ([guide](https://developers.openai.com/api/docs/guides/image-generation)). This makes gpt-image-2 a strong candidate for the ~16 character/prop cutouts (c) even though it cannot make the panorama.

**Inpainting.** Alpha-based, and the mask must match: "An additional image whose fully transparent areas (e.g. where alpha is zero) indicate where `image` should be edited... Must be a valid PNG file, less than 4MB, and have the same dimensions as `image`" ([images.edit](https://developers.openai.com/api/reference/python/resources/images/methods/edit)). Suits both (e) cases — the painted star and the patch behind the wing.

**Outpainting / tiling.** Not documented, either as a feature or a workaround.

**Reference images.** Up to 16 per edit request: "each image should be a `png`, `webp`, or `jpg` file less than 50MB. You can provide up to 16 images." Fidelity is automatic on this model: "For `gpt-image-2`, omit this parameter; the API doesn't allow changing it because the model processes every image input at high fidelity automatically."

**Price.** Token-based, with no per-image table for gpt-image-2: text input $5.00, image input $8.00, image output $30.00 per 1M tokens ([pricing](https://developers.openai.com/api/docs/pricing)). For scale, the previous model's page lists high quality at $0.133 (1024x1024) and $0.2 (1024x1536) per image ([gpt-image-1.5](https://developers.openai.com/api/docs/models/gpt-image-1.5)).

## Google — Gemini image models

**Headquarters.** "Google LLC organized under the laws of the State of Delaware, USA, and operating under the laws of the USA 1600 Amphitheatre Parkway Mountain View, California 94043 USA" ([Google Terms of Service](https://policies.google.com/terms)). Mountain View, California, USA.

**Sizes.** Gemini offers ratios wider than 5:1 but not 5:1 itself, and no custom pixel sizes. The `aspectRatio` enum is `"1:1","1:4","1:8","2:3","3:2","3:4","4:1","4:3","4:5","5:4","8:1","9:16","16:9","21:9"` with `imageSize` limited to `"512"`, `"1K"`, `"2K"`, `"4K"` ([image generation](https://ai.google.dev/gemini-api/docs/generate-content/image-generation)). The 3.1 Flash Image model page advertises "New 1:4, 4:1, 1:8 and 8:1 aspect ratios" ([gemini-3.1-flash-image](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image)). Pixel dimensions for non-square ratios are not documented, so a specific 3800x720 target cannot be requested.

**Transparency.** Ruled out explicitly, which is the single most important fact about Gemini for this project: "To create stickers, icons, or assets, be explicit about the style and request a white background. The model does not support generating a transparent background" ([image generation](https://ai.google.dev/gemini-api/docs/generate-content/image-generation)). Middle and near layers and all 16 cutouts would need a separate background-removal pass.

**Inpainting.** Prompt-driven only, with no raster mask. Under "Inpainting (Semantic masking)": "Conversationally define a 'mask' to edit a specific part of an image while leaving the rest untouched" ([image generation guide](https://ai.google.dev/gemini-api/docs/image-generation)). For removing a painted star this may be adequate; for a precise patch behind a wing it is much weaker than a real mask. Raster masks existed only on Vertex Imagen 3, whose capability model is listed with a June 30, 2026 discontinuation date.

**Outpainting.** Not documented for Nano Banana. Vertex Imagen 3 had `EDIT_MODE_OUTPAINT` — "a mask-based editing method that expands the content of a base image to fit a larger or differently sized mask canvas" ([Vertex outpainting](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/edit-outpainting)) — but the supporting model is discontinued.

**Reference images.** The strongest style-consistency story of any provider here: "Gemini 3 image models let you mix up to 14 reference images", with Gemini 3 Pro Image accepting "Up to 3 images to be used as style references" and "Up to 5 images of characters", and 3.1 Flash Image "Up to 4 images of characters to maintain character consistency" ([image generation](https://ai.google.dev/gemini-api/docs/image-generation)). For a 16-cutout set that must share one painted style, this matters.

**Imagen is gone.** "Imagen models are deprecated and will shut down on August 17, 2026" ([Imagen docs](https://ai.google.dev/gemini-api/docs/imagen)) — a date already past.

**Price.** Gemini 3 Pro Image: "Output images up to 4096x4096px (4K) consume 2000 tokens and are equivalent to $0.24 per image"; Gemini 3.1 Flash Image 4K "$0.151 per image", 1K "$0.067 per image" ([pricing](https://ai.google.dev/gemini-api/docs/pricing)).

## Adobe Firefly Services

**Headquarters.** "345 Park Avenue / San Jose, CA 95110-2704 / Tel: 408-536-6000" ([Adobe office locations](https://www.adobe.com/about-adobe/contact/offices.html)); the terms name "Adobe Inc.: 345 Park Avenue, San Jose, California 95110-2704, USA" ([Adobe general terms](https://www.adobe.com/legal/terms.html)). San Jose, California, USA.

**Generative Expand — the headline feature.** `POST /v3/images/expand-async` takes a target `size` documented as "The desired width and height for the final expanded image in pixels. The maximum size for the output images is 3999px by 3999px", together with `placement.alignment` (`center|left|right`, `center|top|bottom`) and `placement.inset` offsets. No aspect-ratio limit is stated for expand, so 3800x720 sits inside the documented cap — the most direct route to the panorama of any provider, if the enterprise access and pricing work out.

**Generative Fill.** `POST /v3/images/fill-async` takes `image.source`, `mask.source` ("Selected areas of a background image that Firefly uses to fill the source image") and `mask.invert`. Black/white mask semantics are not documented.

**Generate sizes.** Capped well short of the panorama: Image 4 supports "(1:1) 2048x2048; (4:3) 2304x1792; (3:4) 1792x2304; (16:9) 2688x1536; (9:16) 1440x2560", and Image 5 exposes only `aspectRatio` `["1:1","4:3","3:4","16:9","9:16","auto"]` with `resolutionLevel` `["1MP","2.4MP","4MP"]`. Widest is 16:9.

**Style consistency.** One style reference plus one structure reference per request: `style.imageReference` with `style.strength` (1–100, "0 means no adherence. 100 means full adherence") and `structure.imageReference` with `structure.strength`. Image 5 narrows this further — `referenceBlobs` has `maxItems: 1`, "Only one reference image is supported", with references required to be "between 512×512 and 2048×2048 pixels" and "aspect ratio must be between 1:5 and 5:1".

**Background removal.** Through the Photoshop API rather than Firefly: `POST https://image.adobe.io/v2/remove-background` with `mode` "cutout" or "mask", where "The cutout mode returns the subject on a transparent background", plus `colorDecontamination` ([remove background](https://developer.adobe.com/firefly-services/docs/photoshop/guides/remove-background/)).

**Transparency in generation.** Not documented. **Seamless tiling.** Not documented (no `tileable` property anywhere in the API spec).

**Rate limits and price.** "4 requests per minute (RPM)" and "9,000 requests per day (RPD)" per organization ([usage notes](https://developer.adobe.com/firefly-services/docs/firefly-api/getting-started/usage-notes/)). Per-call pricing is **not published**: Firefly Services requires an enterprise agreement, and "Enterprise customers must be assigned the System Administrator or Developer role in the Adobe Admin Console" ([get started](https://developer.adobe.com/firefly-services/docs/guides/get-started)). Consumer credit packs run "2,000 Credits US$9.99/mo … 50,000 Credits US$199.99/mo" ([generative credits](https://www.adobe.com/ai/overview/generative-credits.html)), which is not a usable API rate. Treat Firefly as capable but commercially opaque and gated behind a sales conversation.

Source for the API facts: the Firefly API reference viewer at [developer.adobe.com/firefly-services/docs/firefly-api/api/](https://developer.adobe.com/firefly-services/docs/firefly-api/api/), whose per-endpoint pages currently 404; the underlying `firefly-api.json` was read from Adobe's own documented docs-source repo, [AdobeDocs/ffs-firefly-api](https://raw.githubusercontent.com/AdobeDocs/ffs-firefly-api/main/static/firefly-api.json).

## Recraft

**Headquarters.** "Recraft Inc." at "450 Townsend St, Ste 100 San Francisco, CA 94107" ([Terms](https://www.recraft.ai/terms)); the same terms set governing law as New York with arbitration in San Francisco County. San Francisco, California, USA. This is the best-documented US-headquartered provider that covers expand, inpaint, background removal, style references, **and** a seamless option in one API.

**Seamless tiling — the only approved provider with a documented tile capability.** Recraft's studio docs state "Seamless patterns are tileable by nature, meaning they can be repeated across large areas without noticeable edges" ([seamless patterns](https://www.recraft.ai/docs/recraft-studio/styles/seamless-patterns)), and the API's Swagger spec exposes `substyle` with a `seamless` enum value under `digital_illustration` and `vector_illustration` ([Recraft Swagger spec](https://external.api.recraft.ai/doc/spec/internal/externalapi/api.yaml)). Caveat worth flagging: the current `endpoints.md` does not describe `substyle`, and seamless there means tiling in both axes, not the left-to-right-only tiling the near layer needs. Verify with a test call before depending on it for (b).

**Outpaint.** `POST /v1/images/outpaint` with `expand_left/right/top/bottom` (0–4096 px), an optional `size` in `WxH` where "The source image is placed inside the resulting image", and `zoom_out_percentage` (0–100). The cap is stated as "The resulting image dimensions (after applying `expand_*`) must not exceed 4096 pixels on either side" ([endpoints](https://www.recraft.ai/docs/api-reference/endpoints.md)) — so 3800x720 fits. Restriction: outpaint is V3-only, not V4.

**Inpaint.** `POST /v1/images/inpaint`, V3 only, with an unusually precise mask spec: "An image encoded in grayscale color mode... Each pixel of the image should be either pure black (value 0) or pure white (value 255)" — white marks the region to inpaint.

**Generate sizes.** Enumerated, widest 2:1 — V4 Pro tops out at 3072x1536. No custom pixel sizes for generation. The panorama must come through outpaint.

**Style consistency — the strongest reusable-style mechanism found.** `POST /v1/styles` accepts "1-10 images (PNG, JPG, WEBP)", each "<10 MB" and "<64 MB" total, and returns a persistent `style_id` usable on later calls. `style_match` defaults to precise: "'precise' (the default) — follows the style meticulously, holding every detail: rendering technique, color, composition, and lighting" ([styles](https://www.recraft.ai/docs/api-reference/styles.md)). For a project anchored to one approved reference painting across a panorama plus 16 props, a persistent style ID is a better fit than per-request reference images.

**Background removal.** `POST /v1/images/removeBackground` — "produce a transparent-background cutout of the subject" ([getting started](https://www.recraft.ai/docs/api-reference/getting-started)) — at $0.01. The output file type (PNG vs other) is not explicitly stated.

**Transparency in generation.** Not documented; only `controls.background_color`.

**Price** ("$1.00 buys 1,000 units", [pricing](https://www.recraft.ai/docs/api-reference/pricing.md)): raster generate V4.1 $0.035, V4 $0.04; **top quality V4 Pro (2K) $0.25/image**, V4.1 Pro $0.21; inpaint/outpaint/image-to-image $0.04 raster; remove background $0.01; erase region $0.002; style creation $0.005.

## Scenario

**Headquarters.** "Scenario Inc., a Delaware corporation", with notices to "440 N Barranca Ave #9893, Covina, CA 91723, USA" and Delaware governing law ([terms](https://www.scenario.com/terms-and-conditions)). Covina, California, USA.

Scenario is a US company that resells many third-party models through one API, all via `POST /generate/custom/{modelId}` ([third-party model generation](https://docs.scenario.com/get-started/generation/third-party-model-generation/third-party-model-generation-scenario)). Two first-party models map directly onto this project:

- **Expand:** `model_scenario-smart-reframe` — "AI-powered recomposition + outpainting that reframes any image to exact (width, height) while preserving art style", with `width` 64–6336 and `height` 64–5504. That range covers 3800x720 in a single call, the largest documented expand target of any provider here.
- **Seamless tiling:** `model_scenario-texture` — "Generates a tileable texture from a text prompt, optionally erasing both the left/right and top/bottom seams", with `width`/`height` 16–3840 (multiples of 16), plus `eraseSeam`, `overlap` (16–1024), `featherRadius`, and `referenceImages`.

**Background removal** is available only through resold non-US models (Bria, Photoroom, Pixelcut, Ideogram) — e.g. `model_bria-remove-background` with `preserveAlpha`, "When true, maintains original transparency" ([background removal](https://docs.scenario.com/get-started/generation/background-removal-models/background-removal-models-bria)). The billing relationship is with Scenario (US), the model vendors are not; **flag this** the same way as FLUX-on-Replicate.

**Price.** Credit plans only — Starter $15/mo for 1,500 credits, Pro $45/mo for 5,000, Max $75/mo for 10,000 ([pricing](https://www.scenario.com/pricing)). Per-call credit costs are not published, so cost per image cannot be computed from primary sources.

## Amazon Nova Canvas (Bedrock)

**Headquarters.** The AWS Customer Agreement names "Amazon Web Services, Inc." at "410 Terry Avenue North, Seattle, WA 98109-5210 U.S.A." with "The laws of the State of Washington" governing ([AWS Customer Agreement](https://aws.amazon.com/agreement/)). Seattle, Washington, USA.

On paper this is the most complete single-API match — outpainting, mask inpainting, and true alpha background removal in one model — but it is **end-of-life within weeks of this research date**, which disqualifies it for new work.

**Lifecycle.** "Model launch date: Dec 3, 2024", "Model EOL date: September 30, 2026", "Model lifecycle: Legacy" ([Nova Canvas model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-canvas.html)). No successor image model is documented.

**Transparency.** "The `BACKGROUND_REMOVAL` task will return a PNG image with full 8-bit transparency" ([request/response structure](https://docs.aws.amazon.com/nova/latest/userguide/image-gen-req-resp-structure.html)) — the cleanest transparency statement of any paid provider examined.

**Masks.** "You must specify either the `maskPrompt` or the `maskImage` parameter, but not both", and the mask image "must be the same size as the input image. Areas to be edited are shaded pure black and areas to ignore are shaded pure white. No other colors are allowed", with the note that "inpainting and outpainting requests are opposites in regard to the color requirements of the mask images."

**Sizes.** "Each side must be between 320-4096 pixels, inclusive. Each side must be evenly divisible by 16. The aspect ratio must be between 1:4 and 4:1... The total pixel count must be less than 4,194,304." 3800x720 is 5.28:1, so it fails the ratio test even though its pixel count would pass.

**Price.** Not retrievable — the Bedrock pricing table renders dynamically and did not resolve in fetches.

## FLUX via Replicate and fal.ai — non-US model, US billing

**The flag.** FLUX is developed by **BFL GmbH**, "Ingeborg-Krummer-Schroth-Straße 18, 79106 Freiburg im Breisgau, Germany" ([imprint](https://bfl.ai/legal/imprint)). BFL's own about page says "From our labs in Freiburg and San Francisco...", and its terms are Delaware-governed while naming no entity, but the imprint is unambiguous: the company is German. **Direct BFL API billing therefore fails the project rule.** The question the owner must settle is whether the same models, billed by a US platform, pass.

**Replicate, LLC** — "101 Townsend St, San Francisco, CA 94107"; "These Terms shall be governed by the Laws of the State of California" ([terms](https://replicate.com/terms)). San Francisco, California, USA.

**fal — Features & Labels, Inc.** — "2261 Market St. Suite 10467, San Francisco, CA 94114", California law, San Francisco venue ([terms](https://fal.ai/terms)). San Francisco, California, USA.

Both are unambiguously US-headquartered and bill the customer directly. Under a literal reading of the rule, FLUX through either platform qualifies; under a reading that looks through to model origin, it does not.

**Inpainting.** Replicate's `flux-fill-pro` documents `image` ("Can contain an alpha mask") and `mask` — "A black-and-white image that describes the part of the image to inpaint. Black areas will be preserved while white areas will be inpainted." fal's `flux-pro/v1/fill` takes `image_url` and `mask_url` ("Needs to match the dimensions of the input image"), though the black/white-vs-alpha encoding is not documented there.

**Outpainting.** fal has the cleaner endpoint: `fal-ai/flux-2-pro/outpaint` with `expand_top/bottom/left/right` ("Pixels to expand at the top of the image"), plus `auto_crop` and `mode` high|fast; and `fal-ai/image-apps-v2/outpaint` at "$0.035 per megapixel" with `expand_left/right/top/bottom` limited to "(0-700)". Replicate's `flux-fill-pro` exposes only a coarse `outpaint` string — "A quick option for outpainting an input image. Mask will be ignored", example value "Zoom out 2x" — with no per-side pixel control.

For reference, BFL's own docs (which the project cannot bill directly, but which describe the underlying model) put the outpainting canvas cap at 4,194,304 pixels and give "1024 × 4096" as an example — 3800x720 is 2.74 MP and within that envelope. Whether Replicate or fal exposes that full range is not documented on either platform.

**Sizes.** fal's open `fal-ai/flux-2` is explicit and too narrow: "The width and height must be between 512 and 2048 pixels", i.e. 4:1 at best. `fal-ai/flux-2-pro` takes custom width/height with "up to 4 megapixels" but no documented ratio limit — so 5:1 there is **not documented** rather than confirmed. Replicate's `flux-2-pro` documents `width`/`height` "Must be a multiple of 16" and cites 2048x2048 as maximum size; full ranges are rendered client-side and not retrievable.

**Transparency.** Not documented on any FLUX endpoint at either platform. A `transparent_bg` parameter appeared in a search index for BFL's Klein 9B page but is absent from the fetchable spec — treat as unconfirmed.

**Seamless tiling.** Not on FLUX. fal separately hosts `fal-ai/z-image/turbo/tiling` ("$0.02 per megapixel", seamless tiling images) and `fal-ai/patina/material`.

**Background removal.** fal: `fal-ai/bria/background/remove` at "$0.018 per generation", "PNG with alpha channel transparency"; `fal-ai/birefnet/v2` with `model` variants including Matting and `operating_resolution` up to 2304x2304 (its price line renders as an unfilled "$0 per compute second" placeholder — not documented). Replicate hosts `lucataco/remove-bg` ("approximately $0.00035 to run"), `men1scus/birefnet` ("approximately $0.0014"), and `cjwbw/rembg` ("approximately $0.0038"). Note that these are the same open models covered in the free-local section below — paying per run buys convenience, not capability.

**Price.** Replicate: `flux-1.1-pro` "$0.04 per output image", ultra "$0.06 per image", Kontext pro $0.04, **Kontext max $0.08**, `flux-2-pro` "$0.015 + $0.015 per input and output megapixel". fal: Kontext $0.04, **Kontext max $0.08**, `flux-pro/v1/fill` "$0.05 per megapixel", `flux-2-pro` "$0.03 for the first megapixel of output, plus $0.015 per extra megapixel".

## Midjourney — no official API

**Headquarters.** "Midjourney, Inc. / Attn: Takedowns Department / 611 Gateway Blvd. Ste 120 / South San Francisco, CA, 94080-7066, US", with "Governing Law. This Agreement shall be governed by the laws of the State of California, USA" and arbitration "in Santa Clara County, California" ([Terms of Service](https://docs.midjourney.com/hc/en-us/articles/32083055291277-Terms-of-Service)). South San Francisco, California, USA.

**Midjourney is disqualified on access, not on capability or headquarters.** The Terms state: "You may not use automated tools to access, interact with, or generate Assets through the Services." The Community Guidelines are blunter: "Midjourney does not provide an API, nor provide third-party apps or scripts, and automating interactions with Midjourney service is strictly prohibited according to their Terms of Service. Accounts who do not comply with these rules may be blocked" ([Community Guidelines](https://docs.midjourney.com/hc/en-us/articles/32013696484109-Community-Guidelines)). The only official forward signal is an "Enterprise API Survey" dated July 16, 2025 — "We're starting to investigate opening up an Enterprise API" ([updates](https://updates.midjourney.com/enterprise-api-survey/)) — with no launched product.

This is worth recording because Midjourney's UI features map unusually well onto the project's needs: `--tile` ("The --tile parameter creates seamless repeating patterns"), Pan ("expands the 'canvas' of your image in a direction you choose"), Zoom Out, Vary Region for inpainting, `--sref`/`--oref` style references, and an Editor whose "'Erase Background' button erases everything outside your mask". None of it is reachable programmatically. Max resolution is also modest: "Midjourney version 8.2 creates HD images that are 2048 x 2048 pixels (px)".

## xAI, Runway, Luma, Together, Krea, Azure — US-headquartered, insufficient features

These are US-headquartered and priced per image, but none documents the expand/transparency/tiling combination the project needs. Recorded so the option is not revisited.

**xAI.** "SpaceXAI LLC is a Nevada company, with its registered offices at 800 W Cesar Chavez St., Austin, TX 78701, USA" ([Terms of Service](https://x.ai/legal/terms-of-service)), with disputes under Texas law; the careers page separately references a "Palo Alto headquarters". Austin, Texas (registered). The image API offers `aspect_ratio` values up to "21:9" and `resolution` "1k"/"2k" ([generation](https://docs.x.ai/developers/model-capabilities/images/generation)); editing accepts up to 5 source images but **no mask parameter is documented** ([editing](https://docs.x.ai/developers/model-capabilities/images/editing)). No outpaint, transparency, or tiling. Pricing: "grok-imagine-image-quality — $0.05 / image" ([models](https://docs.x.ai/docs/models)).

**Runway.** "RUNWAY AI, INC.", "800 North State Street Suite 304, Dover, DE 19901", New York governing law ([terms](https://runway.com/terms-of-use)); the about page says "We have offices in New York, San Francisco, Seattle, London, Paris, Tel Aviv and Tokyo" ([about](https://runway.com/about)) without naming a headquarters. The `ratio` enum for `gen4_image` tops out at `1680:720` (2.33:1) with a 2112px long edge, and `referenceImages` allows "maximum 3 items" ([API reference](https://docs.dev.runwayml.com/api.md)). No mask, expand, transparency, or tiling. "Gen4_image: 5 credits per 720p image, or 8 credits per 1080p image" at "$0.01 per credit" ([pricing](https://docs.dev.runwayml.com/guides/pricing/)).

**Luma.** "Luma AI, Inc.", "715 Alma Street, Palo Alto, CA 94301", California law ([terms](https://lumalabs.ai/legal/tos)). Palo Alto, California. Ruled out explicitly for (e): "There is no mask parameter. Editing is prompt-based" ([FAQ](https://docs.agents.lumalabs.ai/guides/faq/)). Widest ratio 3:1; references "Up to 9 for type: 'image'". Uni-1.1 Max $0.1000 ([pricing](https://lumalabs.ai/api/pricing)).

**Together AI.** "Together Computer, Inc., a Delaware corporation", "251 Rhode Island Street, Suite 200, San Francisco, CA 94103", California law ([terms](https://www.together.ai/terms-of-service)). Accepts `width`/`height` and `reference_images` ([API](https://docs.together.ai/reference/post-images-generations)) but documents no mask, outpaint, transparency, or tiling. FLUX.2 [pro] "$0.03" ([pricing](https://www.together.ai/pricing)). Same FLUX-origin flag as Replicate/fal.

**Krea.** "KREA.AI, INC.", "2637 Buchanan Street, San Francisco, CA 94115", California law ([terms](https://www.krea.ai/terms)). The API covers text-to-image, image-to-image, and upscale only; inpaint/outpaint exist as UI features with no documented API surface. Ideogram 3.0 through Krea "$0.06" ([API](https://www.krea.ai/features/api)).

**Microsoft Azure AI Foundry.** "One Microsoft Way, Redmond, WA 98052-6399" ([terms of use](https://www.microsoft.com/en-us/legal/terms-of-use)). Redmond, Washington. Foundry re-hosts OpenAI's models with the same limits — gpt-image-2 "Long edge up to 3,840 px", "Aspect ratio up to 3:1" — and documents transparency only on the older model: "Set the background parameter to transparent and output_format to PNG... to get an image with a transparent background" for gpt-image-1 ([DALL-E / image how-to](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/dall-e)). No outpaint or tiling. A viable fallback route to the same OpenAI capability under a different US vendor, not an added capability.

---

## Free local tools — steps (b), (e), (f)

These need no provider, no billing, and no policy exception. They run on the project's own Mac. Three licensing traps are called out first because each would otherwise silently contaminate a commercial game.

### Licensing traps

1. **rembg's default model is non-commercial.** The default is now `bria-rmbg` (RMBG-2.0), and rembg's own README says: "Note that RMBG-2.0 is released under a BRIA license that requires a paid agreement for commercial use." The model card confirms: "The model is released under a CC BY-NC 4.0 license for non-commercial use" and "Commercial use is subject to a commercial agreement with BRIA" ([briaai/RMBG-2.0](https://huggingface.co/briaai/RMBG-2.0)). **Always pass an explicit `-m`** (e.g. `-m isnet-anime`, `-m birefnet-general`).
2. **FLUX.1-Fill-dev is non-commercial.** Its license grants use "solely for your Non-Commercial Purposes" and states that commercial activity "must request a license from Company" ([FLUX.1 [dev] license](https://raw.githubusercontent.com/black-forest-labs/flux/main/model_licenses/LICENSE-FLUX1-dev)). There is no Apache-2.0 "schnell" Fill variant. Use LaMa or SDXL inpainting instead.
3. **IOPaint is archived.** The GitHub repo is read-only (last push 2025-04-29; PyPI 1.6.0 from 2025-03-18). It still installs and works under Apache-2.0, but it is unmaintained.

### (f) Background removal to RGBA

**rembg** — MIT ([repo](https://github.com/danielgatis/rembg)), actively maintained, ONNX-based, outputs RGBA via `putalpha`. The model most relevant to painted, non-photographic art is `isnet-anime`, described in the README as "A high-accuracy segmentation for anime character" — the only model in the set documented for illustrated content. Soft edges come from `-a/--alpha-matting` (with `-af`, `-ab`, `-ae` trimap thresholds, backed by pymatting closed-form matting), `-vm/--vitmatte` ("refine the edges with ViTMatte, recovering more fine detail than -a"), and `-dc/--decontaminate` ("remove the background color fringing left on soft edges"). Avoid `-ppm/--post-process-mask`, which thresholds the mask to a hard binary edge. Install: `pip install "rembg[cpu,cli]"`; run `rembg i -m isnet-anime -a -dc in.png out.png`. On Apple Silicon it runs CPU-only — the provider list is CUDA/ROCm/OpenVINO/CPU with no CoreML path — which is fine for 16 cutouts.

**BiRefNet** — MIT ([repo](https://github.com/ZhengPeng7/BiRefNet)). The `-matting` variants are the ones trained for soft alpha rather than binary segmentation; `BiRefNet_HR` is "trained with images in `2048x2048` for higher resolution inference" and `BiRefNet_dynamic` handles "arbitrary shapes (256x256 ~ 2304x2304)". Memory is modest: 4.8 GB FP32 / 3.45 GB FP16 at 1024x1024. MPS support is not documented; the simplest Mac route is rembg's ONNX `birefnet-*` models.

**transparent-background (InSPyReNet)** — MIT ([repo](https://github.com/plemeri/transparent-background)). `pip install transparent-background`, then `transparent-background --source in.png --dest out/ --type rgba --mode base`. Omit `--threshold` to keep a soft matte; `--type map` gives the grayscale matte alone. The README documents MPS via `PYTORCH_ENABLE_MPS_FALLBACK=1`.

**SAM 2** — Apache-2.0 ([repo](https://github.com/facebookresearch/sam2)): "The SAM 2 model checkpoints, SAM 2 demo code (front-end and back-end), and SAM 2 training code are licensed under Apache 2.0". Point/box prompting is the right tool for isolating one specific object — such as the painted star — but output is a **binary** mask with no soft alpha, so feather it or use it as a trimap seed. Apple Silicon is supported with a caveat printed by the official notebook: "Support for MPS devices is preliminary. SAM 2 is trained with CUDA and might give numerically different outputs and sometimes degraded performance on MPS."

### (e) Local inpainting — star removal and the patch behind the wing

**IOPaint + LaMa** is the recommended default. IOPaint is Apache-2.0 and its README claims "Completely free and open-source, fully self-hosted, support CPU & GPU & Apple Silicon" ([repo](https://github.com/Sanster/IOPaint)). Start the brush UI with `iopaint start --model=lama --device=cpu --port=8080`, or batch with `iopaint run --model=lama --device=cpu --image=... --mask=... --output=...`. **Apple Silicon caveat:** IOPaint's source lists `MPS_UNSUPPORT_MODELS = ["lama", "ldm", "zits", "mat", "fcf", "cv2", "manga"]` and logs "not support mps, switch to cpu" — only the diffusion models use `mps`. LaMa on CPU is still fast enough for single images.

**LaMa** itself is Apache-2.0 ([repo](https://github.com/advimman/lama)) and is the right model for the star: its README notes it "generalizes surprisingly well to much higher resolutions (~2k) than it saw during training (256x256)" and "achieves excellent performance even in challenging scenarios, e.g. completion of periodic structures". It fills plausible background texture; it does not invent new semantic content. For the patch behind the wing, try LaMa first, then fall back to a prompted SDXL inpaint (`diffusers/stable-diffusion-xl-1.0-inpainting-0.1`, CreativeML Open RAIL++-M) or Paint-by-Example with a crop of the same character.

**diffusers inpainting** documents the mask convention — "the area to inpaint is represented by white pixels and the area to keep is represented by black pixels" — plus `mask_processor.blur(mask, blur_factor=33)` for soft transitions, `padding_mask_crop=32` for higher local detail, and `image_processor.apply_overlay(...)` to force unmasked pixels to stay byte-identical ([inpaint guide](https://huggingface.co/docs/diffusers/using-diffusers/inpaint)). On Apple Silicon: `pipe.to("mps")` plus `pipe.enable_attention_slicing()`, which is "Recommended if your computer has < 64 GB of RAM" ([mps guide](https://huggingface.co/docs/diffusers/optimization/mps)).

**ComfyUI** — GPL-3.0 ([repo](https://github.com/comfyanonymous/ComfyUI)) — gives finer control and is also the outpainting route. Its official example explains that "the alpha channel is what we will be using as a mask for the inpainting" and that masks can be drawn by "right clicking an image in the LoadImage node and 'Open in MaskEditor'" ([inpaint examples](https://comfyanonymous.github.io/ComfyUI_examples/inpaint/)). The two nodes differ in a way that matters here: `VAEEncodeForInpaint` greys out the masked pixels and fully regenerates them (with `grow_mask_by`, default 6), while `SetLatentNoiseMask` keeps the original pixels under the mask and supports partial repaints at lower denoise — the gentler choice for a small patch. For canvas extension, "There is a 'Pad Image for Outpainting' node to automatically pad the image for outpainting while creating the proper mask", with `feathering` (default 40) controlling the blend ([outpaint tutorial](https://docs.comfy.org/tutorials/basic/outpaint)).

### (b) Seamless left-to-right tiling

**ComfyUI-seamless-tiling** — GPL-3.0 ([repo](https://github.com/spinagon/ComfyUI-seamless-tiling)) — is the most direct free route, and critically it supports **X-only** tiling, which is exactly what a horizontally scrolling near layer needs. Its `tiling` option takes `["enable", "x_only", "y_only", "disable"]`, replacing each Conv2d's `_conv_forward` with circular padding on the chosen axis and constant padding on the other. Apply it to both the model and the VAE ("Circular VAE Decode" / "Make Circular VAE" — the latter "more efficient, since it only modifies the VAE model once instead of on each decode"), and use the bundled "Offset Image" node to check for seams.

**Why the model choice matters.** The circular-padding trick works by patching Conv2d layers, so it applies to SD1.5/SDXL UNets but not to DiT architectures like FLUX or SD3, which have almost no Conv2d. This is not stated in official docs, so treat it as an engineering expectation to verify, not a documented fact.

**The diffusers version** is user-side only. A maintainer on the tiling issue posted the `patch_conv(padding_mode='circular')` snippet and stated plainly: "Native support for tiling in `diffusers` is unlikely to come, as it would either be hacky, or complicate the model design with additional arguments" ([diffusers #556](https://github.com/huggingface/diffusers/issues/556)). A contributor added the essential caveat: "Note this must be applied to both the diffusion model _and_ the decoder (VAE)." An X-only variant appears in [diffusers #2633](https://github.com/huggingface/diffusers/issues/2633), with the tip to set `pipe.vae.use_tiling` to `False` first.

**AUTOMATIC1111** has a built-in symmetric "Tiling" option (`apply_circular` sets `layer.padding_mode = 'circular'`), and the [asymmetric-tiling extension](https://github.com/tjm35/asymmetric-tiling-sd-webui) (CC0-1.0) adds `Tile X` / `Tile Y` checkboxes — with the honest disclaimer "this won't guarantee seamless tiling 100% of the time, but it should manage it for most prompts." The extension has been dormant since 2022.

**The model-agnostic fallback — roll and inpaint.** This works with any generator, including ones the conv trick cannot touch, and is the recommended approach if the near layer comes from a paid API:

1. Roll the image by half its width so the seam moves to the centre. ImageMagick: `magick layer.png -roll +50%x+0 rolled.png`, documented as "Roll an image vertically or horizontally. A negative x offset rolls the image left-to-right" ([command-line options](https://imagemagick.org/command-line-options/)). Pillow equivalent: `ImageChops.offset(image, xoffset)` — "Returns a copy of the image where data has been offset by the given distances. Data wraps around the edges."
2. Mask a vertical strip over the centre seam and inpaint it with IOPaint/LaMa.
3. Roll back by the same amount, then verify with `magick out.png out.png +append check.png`.

No officially documented seamless-tiling LoRA or first-party texture model was found; community LoRAs are unverified.

### RGBA handling and mask authoring

Pillow documents the premultiplication semantics the game engine will care about: mode "RGBa (true color with premultiplied alpha)" where "an RGBA pixel of (10, 20, 30, 127) would convert to an RGBa pixel of (5, 10, 15, 127)". PNG has no premultiplied mode, so **save straight RGBA and let the engine premultiply**.

ImageMagick checks worth building into the asset pipeline ([command-line options](https://imagemagick.org/command-line-options/)):

- `magick cutout.png -alpha extract matte.png` — "Copies the alpha channel values into all the color channels... so as to generate a grayscale mask of the image's shape."
- `magick cutout.png -background magenta -alpha remove halo_check.png` — reveals edge fringing that would otherwise ship.
- `-compose CopyOpacity -composite` applies a grayscale mask as alpha.

To author a mask from an existing painting: `rembg i -m isnet-anime -om painting.png mask.png` for a whole-subject matte; SAM 2 point/box prompts for one object; ComfyUI's MaskEditor or IOPaint's brush for hand-drawn regions. Always dilate the mask a few pixels beyond the object (rembg `-ae`, ComfyUI `grow_mask_by`, IOPaint `sd_mask_blur`, default 11) so no halo of the removed element survives.

---

## Excluded or unverified

Providers excluded under the US-headquarters rule, or whose US status could not be settled from a primary source.

| Provider | Evidence | Status |
|---|---|---|
| **Ideogram** | ToS contact address: "Ideogram AI, 320 Bay St, Suite 700, Toronto, ON M5H 4A6" ([tos](https://ideogram.ai/legal/tos)). The ToS names no governing law. Footer reads "© 2026 Ideogram, Inc." with no US address; the Privacy Policy names "Ideogram, Inc." without an address. | **Excluded — Canada.** Painful, because Ideogram is the only provider with native wide transparent generation: `/v1/ideogram-v4/generate-transparent` — "The result is delivered as a PNG with an alpha channel" — at ratios up to `4x1` and `output_resolution` up to `8K`, plus mask inpaint ("Black regions in the mask should match up with the regions... you would like to edit"), Reframe outpainting, and `/v1/remove-background`. $0.10/image at Quality. Record as the closest functional match that the rule excludes. |
| **Black Forest Labs (direct)** | "BFL GmbH", "Ingeborg-Krummer-Schroth-Straße 18, 79106 Freiburg im Breisgau, Germany" ([imprint](https://bfl.ai/legal/imprint)). | **Excluded for direct billing — Germany.** Available indirectly via Replicate/fal (flagged above). |
| **Stability AI** | Non-UK/EU users contract with "Stability AI US Services Corporation, a Delaware corporation with a business address at 10250 Constellation Blvd., Suite 2300, Los Angeles, CA 90067 (United States)"; UK/EU users with "Stability AI Ltd... Fora-United House, 9 Pembridge Road, London W11 3JY, England, UK" ([2025 ToS](https://stability.ai/2025-terms-of-service)). No page on stability.ai states a headquarters city; `/about`, `/company`, and `/news-updates` contain no such statement. | **Unverified — owner call.** US billing entity, UK parent. Features are a good fit: `edit/outpaint` with `left/right/up/down` "a number between 0 and 2000", `edit/inpaint` ("White / Transparent areas: Regions that will be regenerated"), `edit/remove-background`, `control/style`. Generation caps at 21:9 / ~1MP. Ultra $0.08, outpaint $0.04, inpaint and remove-bg $0.05 at "1 credit = $0.01". |
| **Bria** | "Bria Artificial Intelligence Ltd.", addresses "Kremenetski 10, Tel Aviv-Yafo, Israel, 6789910" and "1412 Broadway, New York, NY, 10018"; New York governing law ([terms](https://bria.ai/terms-of-use)). | **Excluded — Israeli entity with a NY office.** Reachable indirectly through fal ($0.018) and Scenario. |
| **Leonardo.Ai** | "Leonardo Interactive Pty Ltd T/A Leonardo.Ai (ACN 662 209 485)", "Suite 1007, 120 High St, North Sydney, NSW 2060"; "governed by the laws of New South Wales" ([tos](https://leonardo.ai/terms-of-service)). | **Excluded — Australia.** |
| **Photoroom** | "French joint stock company having its head office in 229 rue Saint-Honoré, 75001, Paris, France" ([legal](https://www.photoroom.com/legal)). | **Excluded — France.** |
| **remove.bg** | Operator "Canva Austria GmbH"; "Legal disputes arising from this Contract are governed exclusively by Austrian law" ([tos](https://www.remove.bg/tos)). | **Excluded — Austria.** |
| **Freepik** | "Freepik Company, S.L.U.", "13 Molina Lario St., 5th floor, 29015, Málaga, Spain"; "governed by Spanish Law" ([terms](https://www.freepik.com/legal/terms-of-use)). | **Excluded — Spain.** |
| **Clipdrop / Jasper** | Clipdrop's Uncrop API is documented (`extend_left/right/up/down`, "maximum of 2k" px each, "1 successful uncrop API call = 1 credits") but every page says "Clipdrop is part of Jasper now. For more up to date image models and credits please contact Jasper's team." Owner: "Jasper AI, Inc.", "575 Market Street, Unit 507, San Francisco, CA 94105" ([terms](https://www.jasper.ai/legal/terms-of-service)); footer still reads "InitML". | **US-owned but unverified as a product.** Credits beyond the free 100 require contacting Jasper; treat the API as legacy. |
| **Playground** | "Playground AI only provides API access to a select number of partners... prioritizing potential partners whose users will generate more than 1 million images a month" ([help article](https://help.playgroundai.com/en/articles/6861708-does-playground-ai-have-an-api-i-can-access-to-generate-images)). | **Excluded — no access at this scale.** US entity ("AI Playground, Inc.", Dover, DE). |
| **Reve** | "Reve's API sunset on August 14th and is no longer available. If you have unused credits, they will be refunded before August 31st 2026" ([help](https://help.reve.com/hc/en-us/articles/46837930295316-Reve-API)). | **Excluded — API discontinued.** |
| **Fireworks AI** | "Fireworks.ai, Inc.", "900 Concar Drive, Floor 5, San Mateo, CA 94402" ([terms](https://fireworks.ai/terms-of-service)). US-headquartered. | **Excluded on features.** No dedicated image-generation guides; the FLUX FAQ states "Image-to-image generation is not currently supported". No mask, outpaint, transparency, or tiling. |
| **Amazon Nova Canvas** | US-headquartered and feature-complete, but "Model EOL date: September 30, 2026", "Model lifecycle: Legacy". | **Excluded on lifecycle.** Would be a top pick otherwise. |
| **Midjourney** | US-headquartered (South San Francisco). "You may not use automated tools to access, interact with, or generate Assets through the Services." | **Excluded — no API, automation prohibited by ToS.** |

## Could not verify

Facts that could not be established from a primary source on the date checked. Each would need a test call or a sales conversation.

- **Adobe Firefly Services per-call pricing.** No reachable Adobe page publishes API credit rates. The enterprise page routes to a sales form; the helpx credits pages timed out on every attempt. Cost per expand or fill call is unknown.
- **Whether Firefly's Expand accepts a 5.28:1 target.** The spec caps output at "3999px by 3999px" and states no aspect-ratio limit, but silence is not permission.
- **Recraft's `substyle: seamless` through the current API.** Present in the Swagger spec and the legacy API doc, absent from the current `endpoints.md`. Also unclear whether it can tile in X only.
- **Recraft's remove-background output format.** Documented as a "transparent-background cutout"; PNG is not stated explicitly.
- **Scenario per-call credit costs.** Only monthly plan totals are published.
- **Amazon Nova Canvas per-image pricing.** The Bedrock pricing table renders dynamically and did not resolve.
- **Ideogram's per-endpoint API pricing.** The pricing page loads dynamically ("Loading current prices."). Only the model page figures — Turbo $0.03, Default $0.06, Quality $0.10 — were retrievable. Moot given the exclusion.
- **Replicate `flux-fill-pro` per-image price**, and the full enum for its `outpaint` parameter. Both render client-side.
- **Ratio limits for `flux-2-pro` custom width/height** on both Replicate and fal. A 4 MP ceiling is documented; a maximum aspect ratio is not. Whether 3800x720 is accepted must be tested.
- **fal's `birefnet/v2` and `imageutils/rembg` prices.** Both pages show an unrendered "$0 per compute second" placeholder.
- **BFL `flux-pro-1.0-expand` and `flux-tools/outpainting-v1` pricing.** Absent from the pricing docs. Moot for direct billing.
- **A gpt-image-2 per-image price.** OpenAI publishes only token rates for this model and directs users to a calculator.
- **Pixel dimensions behind Gemini's non-square aspect ratios.** Only square sizes are anchored on the pricing page.
- **Stability's exact input pixel limits for inpaint/outpaint**, and Stability's headquarters city as stated by Stability itself. The API reference and pricing pages are client-rendered; several Stability facts here come from search-index snippets of those URLs rather than direct fetches.
- **Whether circular-padding tiling works on DiT-architecture models** (FLUX, SD3). No official documentation either way.
- **Big-LaMa checkpoint licensing.** The repo code is Apache-2.0; the weights are distributed via a third-party Hugging Face mirror with no separate license statement.

## Still to verify

Ranked by how much the answer would change the plan. Everything above this line is sourced; everything here is not.

1. **Does any US-billed API accept a 5.28:1 canvas?** Not documented anywhere. Test Recraft V3 outpaint (4096/side cap, no stated ratio limit), fal `flux-2-pro/outpaint` (4 MP cap, no stated ratio limit), and Scenario `smart-reframe` (64–6336 x 64–5504). This single question decides step (a).
2. **Firefly Services pricing and access.** No published per-call rate; enterprise agreement required. Until a sales conversation happens, Firefly cannot be costed or committed to, despite having the best-documented expand endpoint.
3. **Recraft `substyle: seamless` through the live API**, and whether it can tile in X only rather than both axes. Present in the Swagger spec, absent from current docs.
4. **Whether circular-padding tiling works on DiT models** (FLUX, SD3). Affects whether the free ComfyUI tiling route can be paired with a FLUX-generated near layer, or whether the roll-and-inpaint fallback is mandatory.
5. **Stability AI's status under the project rule** — US billing entity (Los Angeles), UK parent (London), no self-stated headquarters city on stability.ai. Owner judgment, not further research.
6. **The FLUX-on-US-platform question** — German model, US biller. Owner judgment, not further research.
7. **Scenario, Nova Canvas, and Replicate `flux-fill-pro` per-call prices.** All render client-side or are unpublished.
8. **Several Stability API facts** (outpaint parameters, credit costs, upscale limits) come from search-index snippets of client-rendered pages rather than direct fetches. Re-verify in a browser before relying on them.
9. **Big-LaMa checkpoint licensing.** Code is Apache-2.0; weights ship from a third-party mirror with no license statement. Matters only if LaMa becomes load-bearing for commercial output.
10. **Not researched at all:** Bedrock's non-Nova image models, Vertex AI's current non-Imagen image offerings, and any provider that launched after this date.

## Suggested next step

Before committing to a provider, run one test that settles the two facts that decide everything else: ask Recraft's V3 outpaint for a 3800x720 canvas from a legal-ratio seed painted in the approved style, and ask fal's `flux-2-pro/outpaint` for the same. Both are cheap ($0.04 and ~$0.05/MP), both are US-billed, and the answer to "does a 5.28:1 canvas come back" is not documented anywhere. In parallel, install rembg and IOPaint locally — steps (b), (e), and (f) can be settled entirely for free, and doing so shrinks the paid surface to steps (a), (c), and (d).
