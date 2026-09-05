# gpt-image-2 for scenery layers

Research date: 2026-09-05

Scope: OpenAI's own documentation only. Every `platform.openai.com/docs/...` URL now returns a 301 to `developers.openai.com/api/docs/...`, so the links below point at the redirect targets, which are the same pages. The pages consulted were the [image generation guide](https://developers.openai.com/api/docs/guides/image-generation), the [Create image reference](https://developers.openai.com/api/reference/resources/images/methods/generate), the [Create image edit reference](https://developers.openai.com/api/reference/resources/images/methods/edit), the [gpt-image-2 model page](https://developers.openai.com/api/docs/models/gpt-image-2), the [gpt-image-1.5 model page](https://developers.openai.com/api/docs/models/gpt-image-1.5), the [pricing page](https://developers.openai.com/api/docs/pricing), the [changelog](https://developers.openai.com/api/docs/changelog), and the [images and vision guide](https://developers.openai.com/api/docs/guides/images-vision). Numbers labeled "calculator" were read from the interactive output-token calculator embedded in the image generation guide on 2026-09-05; they are not printed in the page text.

## Summary

| # | Question | Finding for `gpt-image-2` | Where `gpt-image-1.5` / `gpt-image-1` differ |
|---|---|---|---|
| 1 | Size | Any `WIDTHxHEIGHT` where both edges are multiples of 16, no edge exceeds 3840 px, long:short ratio is at most 3:1, and total pixels are between 655,360 and 8,294,400. Anything over 2560x1440 (3,686,400 px) is "experimental". 3600x720 and 4000x800 are both 5:1 and are rejected; the guide's calculator reports "Invalid size" for each. The widest legal strip is 3:1, e.g. 3840x1280 or 3072x1024. | Only `1024x1024`, `1536x1024`, `1024x1536` (plus `auto`). |
| 2 | Transparency | `background: "transparent"` is documented for `gpt-image-2` in both `/v1/images/generations` and `/v1/images/edits` (and the Responses image tool), labeled "preview". Output must be `png` or `webp`; `jpeg` is not supported. No quality restriction is stated. | Same parameter, documented as available (not "preview") for "supported GPT Image models". |
| 3 | Edits | `mask` is accepted (prompt-guided, applied to the first input image). Up to 16 input images. Image and mask must share format and size and be "less than 50MB"; JSON `image_url` data URLs are capped at 20,971,520 characters. `input_fidelity` must be omitted for `gpt-image-2`: the API "doesn't allow changing it" because every input is processed at high fidelity. The edit reference lists only the four standard `size` values; arbitrary sizes on edits are not documented. Outpainting is not documented by name. | `input_fidelity: "high"` / `"low"` is a real switch for `gpt-image-1.5` and `gpt-image-1` (`low` is the default). |
| 4 | Tiling | Nothing. No parameter, flag, or technique for seamless or tileable output appears in any of the pages checked. | Same. |
| 5 | Pricing | Billed per image output token at $30.00 per 1M (Batch $15.00). High quality: 1024x1024 = 7,024 tokens = $0.211; 1536x1024 = 5,488 tokens = $0.165; 3840x2160 (largest documented) = 13,342 tokens = $0.400; 2048x2048 = 14,272 tokens = $0.428. Text input $5.00/1M, image input $8.00/1M. | `gpt-image-1.5`: $32.00/1M output, high 1024x1024 = $0.133, 1536x1024 = $0.20. `gpt-image-1`: $40.00/1M output, high 1024x1024 = $0.167, 1536x1024 = $0.25. |

Practical consequence for a 5:1 parallax strip: no single request can produce it. The widest documented output is 3:1, so a 3600x720 or 4000x800 layer has to be assembled from at least two 3:1 (or narrower) generations, and the documentation offers no seam-matching or outpainting guarantee to make that assembly clean.

## 1. Size rules for arbitrary `WIDTHxHEIGHT`

The image generation guide, section "Size and quality options", is the most specific statement ([guide](https://developers.openai.com/api/docs/guides/image-generation)):

> gpt-image-2 accepts any resolution in the size parameter when it satisfies the constraints below. Square images are typically fastest to generate.
>
> Popular sizes: 1024x1024 (square), 1536x1024 (landscape), 1024x1536 (portrait), 2048x2048 (2K square), 2048x1152 (2K landscape), 3840x2160 (4K landscape), 2160x3840 (4K portrait), auto (default)
>
> Size constraints
> - Maximum edge length must be less than or equal to 3840px
> - Both edges must be multiples of 16px
> - Long edge to short edge ratio must not exceed 3:1
> - Total pixels must be at least 655,360 and no more than 8,294,400

And, a few lines later in the same section:

> Outputs that contain more than 2560x1440 (3,686,400) total pixels, typically referred to as 2K, are considered experimental.

The Create image reference states the same rules for the `size` parameter and adds the 1:3 lower bound and a catch-all ([Create image reference](https://developers.openai.com/api/reference/resources/images/methods/generate)):

> The size of the generated images. For gpt-image-2 and gpt-image-2-2026-04-21, arbitrary resolutions are supported as WIDTHxHEIGHT strings, for example 1536x864. Width and height must both be divisible by 16 and the requested aspect ratio must be between 1:3 and 3:1. Resolutions above 2560x1440 are experimental, and the maximum supported resolution is 3840x2160. The requested size must also satisfy the model's current pixel and edge limits. The standard sizes 1024x1024, 1536x1024, and 1024x1536 are supported by the GPT image models; auto is supported for models that allow automatic sizing. For dall-e-2, use one of 256x256, 512x512, or 1024x1024. For dall-e-3, use one of 1024x1024, 1792x1024, or 1024x1792.

Derived limits (arithmetic on the quoted rules, not additional doc text):

- Minimum total pixels 655,360 is exactly 1024x640; maximum 8,294,400 is exactly 3840x2160.
- No explicit minimum edge is stated. The binding constraints on a small edge are the pixel floor and the 3:1 ratio: at exactly 3:1 the smallest legal strip is 1440x480 (691,200 px); the next step down, 1392x464 (645,888 px), falls below the 655,360 floor.
- 3600x720: edges are multiples of 16 and 2,592,000 px is in range, but the ratio is 5:1, which exceeds 3:1. Rejected. The guide's calculator shows "Invalid size" for 3600x720.
- 4000x800: ratio 5:1 and the 4000 px edge exceeds 3840. Rejected on two rules. The guide's calculator shows "Invalid size" for 4000x800.
- 3840x1264 is rejected by the calculator ("Invalid size") because 1264 is not a multiple of 16, confirming the widget enforces that rule too.
- Widest accepted strips at exactly 3:1: 3840x1280 (4,915,200 px, in the experimental band) and 3072x1024 (3,145,728 px, below the experimental threshold). Both return token counts in the calculator (see section 5).

Where earlier models differ: the reference sentence above only grants arbitrary resolutions to `gpt-image-2` and `gpt-image-2-2026-04-21`; the other GPT image models get the three standard sizes plus `auto`. The guide's "Models prior to gpt-image-2" token table lists only Square (1024x1024), Portrait (1024x1536), and Landscape (1536x1024) ([guide](https://developers.openai.com/api/docs/guides/image-generation)). The edit reference is stricter still; see section 3.

## 2. Transparency (`background: "transparent"`)

Generations. The Create image reference documents the parameter as ([Create image reference](https://developers.openai.com/api/reference/resources/images/methods/generate)):

> Set the background of the generated image(s). This parameter is only supported for the GPT image models. Must be one of transparent, opaque, or auto (default value). When auto is used, the model will automatically determine the best background for the image.
> Transparent backgrounds are available for supported GPT Image models. For gpt-image-2 and gpt-image-2-2026-04-21, this support is in preview. When using transparent, set the output format to png or webp.

Edits. The Create image edit reference has its own `background` parameter with the same restriction ([Create image edit reference](https://developers.openai.com/api/reference/resources/images/methods/edit)):

> Set the background of the generated image output. Transparent backgrounds are available for supported GPT Image models. For gpt-image-2 and gpt-image-2-2026-04-21, this support is in preview. When using transparent, set the output format to png or webp.

Guide. Section "Customize Image Output" ([guide](https://developers.openai.com/api/docs/guides/image-generation)):

> Transparent backgrounds are available in preview for gpt-image-2. Set background: "transparent" to request one. Use png (the default) or webp; jpeg isn't supported with transparent backgrounds.

The guide's overview also says, of the Image API and the Responses API: "Both APIs let you customize output by adjusting quality, size, format, and compression. Transparent backgrounds depend on model support."

Changelog, under the "August, 2026" heading, entry dated "Aug 20", tagged `gpt-image-2`, `gpt-image-2-2026-04-21`, `v1/images/generations`, `v1/images/edits`, `v1/responses` ([changelog](https://developers.openai.com/api/docs/changelog)):

> Transparent backgrounds are now available in preview for gpt-image-2 and gpt-image-2-2026-04-21 in the Images API and the Responses API image generation tool. Set background to transparent and use png or webp output; jpeg does not support transparent backgrounds. Learn more in the image generation guide.

The response object echoes the setting: `ImagesResponse.background` is "The background parameter used for the image generation. Either transparent or opaque." ([Create image reference](https://developers.openai.com/api/reference/resources/images/methods/generate)).

Constraints found: output format must be `png` or `webp`. No quality restriction is stated anywhere on these pages; `quality` is documented independently as `low`, `medium`, `high`, or `auto`. The only model-specific caveat is the word "preview" attached to `gpt-image-2`.

Where earlier models differ: the same parameter text says transparent backgrounds "are available for supported GPT Image models" without the preview label, so for `gpt-image-1.5` and `gpt-image-1` it is presented as a non-preview feature. The docs do not enumerate which models are "supported".

## 3. Edits: masks, input images, size limits, `input_fidelity`

Endpoint description ([Create image edit reference](https://developers.openai.com/api/reference/resources/images/methods/edit)):

> Creates an edited or extended image given one or more source images and a prompt. This endpoint supports GPT Image models (gpt-image-1.5, gpt-image-1, gpt-image-1-mini, and chatgpt-image-latest) and dall-e-2.

That sentence omits `gpt-image-2`, but the `model` parameter on the same page lists `"gpt-image-1.5"`, `"gpt-image-2"`, `"gpt-image-2-2026-04-21"`, `"gpt-image-1"`, `"gpt-image-1-mini"`, `"chatgpt-image-latest"` and describes itself as "The GPT image model to use for image editing, including gpt-image-2 and its dated snapshot gpt-image-2-2026-04-21." The changelog's release entry for GPT Image 2 (under "April, 2026", "Apr 21") is tagged `v1/images/generations`, `v1/images/edits`, and `v1/batch` ([changelog](https://developers.openai.com/api/docs/changelog)).

Mask. The reference documents `mask` as an object ([Create image edit reference](https://developers.openai.com/api/reference/resources/images/methods/edit)):

> mask: optional object { file_id, image_url }
> Reference an input image by either URL or uploaded file ID. Provide exactly one of image_url or file_id.

The guide, section "Edit an image using a mask", explains the behavior ([guide](https://developers.openai.com/api/docs/guides/image-generation)):

> You can provide a mask to indicate which part of the image should be edited.
> When using a mask with GPT Image, additional instructions are sent to the model to help guide the editing process accordingly.
> Masking with GPT Image is entirely prompt-based. The model uses the mask as guidance, but may not follow its exact shape with complete precision.
> If you provide multiple input images, the mask will be applied to the first image.

and, under "Mask requirements":

> The image to edit and mask must be of the same format and size (less than 50MB in size).
> The mask image must also contain an alpha channel. If you're using an image editing tool to create the mask, make sure to save the mask with an alpha channel.

Neither page says "inpainting" or "outpainting". The word "extended" in the endpoint description is the only nod toward outpainting, and no page describes extending a canvas beyond the input's bounds, nor what happens if the mask is larger than the source image.

Number and size of input images ([Create image edit reference](https://developers.openai.com/api/reference/resources/images/methods/edit)):

> images: array of object { file_id, image_url }
> Input image references to edit.
> For GPT image models, you can provide up to 16 images.
> file_id: optional string. The File API ID of an uploaded image to use as input.
> image_url: optional string. A fully qualified URL or base64-encoded data URL. maxLength 20971520

So the documented per-image ceilings are: "less than 50MB" for the image and mask files (guide), and 20,971,520 characters for a base64 data URL in the JSON body (reference). The reference page shows only the JSON body; its "JSON" label is static, not a toggle, so the multipart `image` file parameter (formats, per-file size) is no longer separately documented there. The multipart example on the page uses repeated `-F "image[]=@file.png"` fields. JSON bodies were added on 2026-02-09 ([changelog](https://developers.openai.com/api/docs/changelog)): "Added support for application/json requests on /v1/images/edits for GPT image models. JSON requests use images (and optional mask) with image_url or file_id references instead of multipart uploads."

`input_fidelity`. The reference lists it without a model caveat ([Create image edit reference](https://developers.openai.com/api/reference/resources/images/methods/edit)):

> input_fidelity: optional "high" or "low" or null
> Controls fidelity to the original input image(s).

The guide, section "Image input fidelity", is explicit that it must be left out for `gpt-image-2` ([guide](https://developers.openai.com/api/docs/guides/image-generation)):

> The input_fidelity parameter controls how strongly a model preserves details from input images during edits and reference-image workflows. For gpt-image-2, omit this parameter; the API doesn't allow changing it because the model processes every image input at high fidelity automatically.
> Because gpt-image-2 always processes image inputs at high fidelity, image input tokens can be higher for edit requests that include reference images.

So `input_fidelity: "high"` is not something to send to `gpt-image-2`; the docs say the API does not allow changing it, though they do not state the exact error you get if you send it.

Output `size` on edits. The edit reference enumerates `size` as `"auto"`, `"1024x1024"`, `"1536x1024"`, `"1024x1536"` with the description "Requested output image size." It does not carry the arbitrary `WIDTHxHEIGHT` sentence that the generations reference has ([Create image edit reference](https://developers.openai.com/api/reference/resources/images/methods/edit)). The guide's "Size and quality options" text is written generically for `gpt-image-2` and sits under "Customize Image Output", which the guide introduces as applying to both the Image API and the Responses API, but it never says "edits" explicitly.

Other edit parameters for completeness: `n` is 1 to 10; `quality` is `low`/`medium`/`high`/`auto`; `output_format` is `png`/`jpeg`/`webp`; `partial_images` is 0 to 3; `stream` is a boolean ([Create image edit reference](https://developers.openai.com/api/reference/resources/images/methods/edit)).

Where earlier models differ: `input_fidelity` is a working switch for `gpt-image-1.5` and `gpt-image-1`, with `low` as the default. The changelog (under "January, 2026", "Jan 9") records: "Fixed an issue where gpt-image-1.5 and chatgpt-image-latest were incorrectly using high fidelity for image edits through /v1/images/edits, even when fidelity was explicitly set to low (the default)." ([changelog](https://developers.openai.com/api/docs/changelog)). The images and vision guide gives the input-token consequence only for `gpt-image-1`: "When input fidelity is set to low, the base cost is 65 image tokens, and each tile costs 129 image tokens." and "When using high input fidelity, we add a set number of tokens based on the image's aspect ratio in addition to the image tokens described above. If your image is square, we add 4160 extra input image tokens. If it is closer to portrait or landscape, we add 6240 extra tokens." ([images and vision guide](https://developers.openai.com/api/docs/guides/images-vision)).

## 4. Tiling

None of the pages checked documents a parameter, mode, or technique for seamless or tileable output. Searches of the image generation guide, both reference pages, the model page, the pricing page, and the changelog for "tile", "tiling", "seamless", and "repeat" return nothing about output tiling. The only "tile" vocabulary in OpenAI's docs is the input-token accounting in the images and vision guide, where an input image is divided into tiles for billing ([images and vision guide](https://developers.openai.com/api/docs/guides/images-vision)); that has nothing to do with generating repeatable textures.

The guide's "Limitations" section is the closest relevant text and points the other way ([guide](https://developers.openai.com/api/docs/guides/image-generation)):

> Consistency: While capable of producing consistent imagery, the model may occasionally struggle to maintain visual consistency for recurring characters or brand elements across multiple generations.
> Composition Control: Despite improved instruction following, the model may have difficulty placing elements precisely in structured or layout-sensitive compositions.

Any tileable result would therefore be a prompt-engineering outcome with no documented guarantee, and edge-matching would have to be verified and, if necessary, fixed outside the API.

## 5. Pricing

Per-token list prices, "Prices per 1M tokens", from the "Image generation models" table ([pricing page](https://developers.openai.com/api/docs/pricing)):

| Model | Modality | Input | Cached input | Output |
|---|---|---|---|---|
| gpt-image-2 (Standard) | Image | $8.00 | $2.00 | $30.00 |
| gpt-image-2 (Standard) | Text | $5.00 | $1.25 | - |
| gpt-image-2 (Batch) | Image | $4.00 | $1.00 | $15.00 |
| gpt-image-2 (Batch) | Text | $2.50 | $0.625 | - |
| gpt-image-1.5 (Standard) | Image | $8.00 | $2.00 | $32.00 |
| gpt-image-1 (Standard) | Image | $10.00 | $2.50 | $40.00 |

The pricing page carries no per-image table for `gpt-image-2`; both the Standard and Batch tables say "For image generation cost estimates, use the calculator in the image generation guide." The `gpt-image-2` model page likewise defers: "see the pricing page and image generation calculator for cost estimates." ([gpt-image-2 model page](https://developers.openai.com/api/docs/models/gpt-image-2)).

The guide's "Cost and latency" section states the billing model and the fixed table ([guide](https://developers.openai.com/api/docs/guides/image-generation)):

> For gpt-image-2, use the calculator to estimate output tokens from the requested quality and size

> gpt-image-2 supports thousands of valid resolutions; the table below lists the same sizes used for previous GPT Image models for comparison. For GPT Image 1.5, GPT Image 1, and GPT Image 1 Mini, the legacy per-image output pricing table is also listed below. You should still account for text and image input tokens when estimating the total cost of a request.
> A larger non-square resolution can sometimes produce fewer output tokens than a smaller or square resolution at the same quality setting.

> The final cost is the sum of: input text tokens; input image tokens if using the edits endpoint; image output tokens

> If you want to stream image generation using the partial_images parameter, each partial image will incur an additional 100 image output tokens.

Per-image table printed in the guide (Standard, output tokens only):

| Model | Quality | 1024x1024 | 1024x1536 | 1536x1024 |
|---|---|---|---|---|
| GPT Image 2 ("Additional sizes available") | Low | $0.006 | $0.005 | $0.005 |
| GPT Image 2 | Medium | $0.053 | $0.041 | $0.041 |
| GPT Image 2 | High | $0.211 | $0.165 | $0.165 |
| GPT Image 1.5 | High | $0.133 | $0.2 | $0.2 |
| GPT Image 1 | High | $0.167 | $0.25 | $0.25 |
| GPT Image 1 Mini | High | $0.036 | $0.052 | $0.052 |

Calculator readings for `gpt-image-2` at quality High (interactive widget in the guide, read 2026-09-05), with the arithmetic at $30.00 per 1M output tokens:

| Size | Ratio | Total pixels | Output tokens (calculator) | Tokens x $30 / 1,000,000 | Guide table |
|---|---|---|---|---|---|
| 1024x1024 | 1:1 | 1,048,576 | 7,024 | $0.21072 | $0.211 |
| 1536x1024 | 3:2 | 1,572,864 | 5,488 | $0.16464 | $0.165 |
| 1024x1536 | 2:3 | 1,572,864 | 5,488 | $0.16464 | $0.165 |
| 1024x640 | 8:5 (pixel floor) | 655,360 | 3,824 | $0.11472 | not listed |
| 3072x1024 | 3:1 | 3,145,728 | 3,952 | $0.11856 | not listed |
| 2560x1440 | 16:9 (experimental threshold) | 3,686,400 | 7,370 | $0.22110 | not listed |
| 3840x1280 | 3:1 | 4,915,200 | 5,311 | $0.15933 | not listed |
| 2048x2048 | 1:1 | 4,194,304 | 14,272 | $0.42816 | not listed |
| 3840x2160 | 16:9 (documented maximum) | 8,294,400 | 13,342 | $0.40026 | not listed |

Cross-check: at quality Low the calculator's default 1024x1024 reading is 196 tokens; 196 x $30 / 1,000,000 = $0.00588, which rounds to the table's $0.006. The two printed High prices also match the calculator to the cent, so the calculator and the table are consistent with the $30.00 per 1M rate.

Answers to the specific asks: High 1024x1024 is $0.211 (7,024 tokens); High 1536x1024 is $0.165 (5,488 tokens); the largest documented size, 3840x2160, is about $0.400 at High (13,342 tokens). Note the non-monotonic behavior the guide warns about: 2048x2048 costs more than 3840x2160, and the widest 3:1 strips (3072x1024, 3840x1280) cost less than a 1024x1024 square. Batch halves every figure. Input tokens (prompt text at $5.00/1M, reference images at $8.00/1M) are extra on every request.

Where earlier models differ: `gpt-image-1.5` bills output at $32.00/1M and `gpt-image-1` at $40.00/1M, and their per-image prices are fixed by the three-size table above because they do not accept other sizes. The guide's token table for "Models prior to gpt-image-2" gives High as 4160 tokens (1024x1024), 6240 (1024x1536), and 6208 (1536x1024) ([guide](https://developers.openai.com/api/docs/guides/image-generation)).

## Could not verify

- Whether `/v1/images/edits` accepts arbitrary `WIDTHxHEIGHT` sizes for `gpt-image-2`. The generations reference documents them; the edits reference lists only `auto`, `1024x1024`, `1536x1024`, `1024x1536`; the guide's generic `gpt-image-2` size text does not name either endpoint.
- Whether transparent output works at `quality: "low"`. No quality restriction is stated, but none is ruled out either; the only stated constraints are `png`/`webp` output and the "preview" label.
- Exact API behavior when `input_fidelity` is sent to `gpt-image-2`. The guide says the API "doesn't allow changing it"; no page states the resulting error code or whether the value is silently ignored.
- Any outpainting behavior: whether a mask or requested `size` larger than the source extends the canvas. The endpoint description says "edited or extended image" and nothing more.
- Any tileable or seamless output technique. Nothing is documented.
- The formula behind the `gpt-image-2` output-token calculator. Only the widget's readings are available; the guide prints no per-pixel or per-patch rule for `gpt-image-2`, so prices for sizes not sampled above have to be read from the calculator.
- How input image tokens are computed for `gpt-image-2` on edits. The images and vision guide gives tile and fidelity rules only for `gpt-image-1`; for `gpt-image-2` the docs say only that input tokens "can be higher" because fidelity is always high.
- Multipart per-file limits (accepted formats, per-file size) for the `image` field on edits. The current edit reference documents only the JSON body; the "less than 50MB" figure comes from the guide's mask-requirements text.
- The `gpt-image-2` model page's "Features" list marks Streaming as "Not supported", while both reference pages document a `stream` parameter and `partial_images` for GPT image models. The pages disagree and neither explains the discrepancy.
- A minimum edge length. None is stated; the effective minimum follows from the 655,360-pixel floor and the 3:1 ratio cap.
