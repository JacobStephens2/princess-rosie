# Nano Banana 2 (Gemini 3.1 Flash Image) for scenery layer assets

Research date: 2026-09-05

All claims below come from Google's own pages (ai.google.dev, deepmind.google, blog.google, support.google.com, one.google.com, gemini.google), checked on 2026-09-05. Quoted text is verbatim from the page cited. Where a page's own "Last updated" stamp is visible it is noted, because the image-generation guide is revised often.

## Summary

| # | Question | Finding |
|---|---|---|
| 1 | Identity | "Nano Banana 2" is `gemini-3.1-flash-image` (Gemini 3.1 Flash Image). Preview launched 2026-02-26; GA on 2026-05-28. Distinct from Nano Banana (`gemini-2.5-flash-image`, legacy), Nano Banana Pro (`gemini-3-pro-image`, premium), and Nano Banana 2 Lite (`gemini-3.1-flash-lite-image`, 1K only). |
| 2 | Size and aspect | Fixed enums only: `aspect_ratio` in {1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9, 1:4, 4:1, 1:8, 8:1}; `image_size` in {512, 1K, 2K, 4K}. No arbitrary WIDTHxHEIGHT. 5:1 is not offered; 3600x720 must be cropped from 4:1 (up to 8192x2048) or 8:1 (up to 12288x1536). |
| 3 | Transparency | Not documented anywhere. The API reference lists `image/jpeg` as the only output `mime_type`; the guide, model card, and Gemini app help never mention transparency or alpha. Treat RGBA output as unsupported. |
| 4 | Editing | Up to 14 reference images per request; for this model the doc table allows up to 10 object images, up to 4 character images, and up to 3 style references. No mask parameter exists; "inpainting" is prompt-only "semantic masking". Character consistency is a documented feature with a documented caveat that it "is not always perfect". |
| 5 | Access and billing | Google AI Ultra covers Google AI Studio quota only; "Direct use of the Gemini API ... is billed and managed separately." API list price (Standard): $60 per 1M image-output tokens = $0.045 (512px, 747 tokens), $0.067 (1K, 1120), $0.101 (2K, 1680), $0.151 (4K, 2520). Batch halves these. Ultra is "Starting at: $99.99/month" with a $199.99 tier and includes monthly Google Cloud credits usable on the API if Cloud Billing is set up. |
| 6 | Watermarks | Gemini app: a "Media Watermark" setting turns the visible watermark on or off; only in India, South Korea, or Vietnam is that setting gated to AI Ultra. The invisible SynthID watermark and C2PA credentials are always applied and are unaffected by the setting. API: "All generated images include a SynthID watermark"; no visible watermark is documented for API output. |

## 1. Identity

**Model ID.** The Gemini API image-generation guide defines the family and the exact IDs ([Image generation guide](https://ai.google.dev/gemini-api/docs/image-generation)):

> Nano Banana refers to four distinct models available in the Gemini API:
>
> Nano Banana 2 Lite (Gemini 3.1 Flash Lite Image) (gemini-3.1-flash-lite-image): Our fastest and cheapest Gemini image model, engineered for velocity and scale where speed and cost are the primary operational constraints. Not optimized for multiple reference inputs or multi-turn sequential editing.
>
> Nano Banana 2 (Gemini 3.1 Flash Image) (gemini-3.1-flash-image): Serves as the most versatile model, generalist workhorse model for all tasks. It balances speed with state-of-the-art 4K generation, world knowledge, and reliable text rendering. Excelling at multiple reference image processing and consistency.
>
> Nano Banana Pro (Gemini 3 Pro Image) (gemini-3-pro-image): The premium choice for the most complex visual tasks, offering the highest level of world knowledge, advanced localization, accurate brand consistency, and precision creative control.
>
> Nano Banana (Gemini 2.5 Flash Image) (gemini-2.5-flash-image): The legacy pioneer of the Nano Banana series. While it has been a reliable workhorse, we strongly recommend that customers transition to Nano Banana 2 Lite to experience enhanced quality, faster generation speeds, and lower API pricing.

The model page confirms the model code and its stable alias ([Gemini 3.1 Flash image model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image), page stamp "Last updated 2026-09-03 UTC"):

> Model code | gemini-3.1-flash-image
> ...
> Stable: gemini-3.1-flash-image
> ...
> Latest update | February 2026

The same page summarizes what Nano Banana 2 adds over its predecessors:

> Nano Banana 2 provides high-quality image generation and conversational editing at a mainstream price point and low latency. It serves as the high-efficiency counterpart to Gemini 3 Pro Image, optimized for speed and high-volume developer use cases.
> Key updates:
> New output resolution options: New support for 0.5K, 2K and 4K, default 1K
> New Image Search Grounding: Integration of both text and image search results to inform generation with real-time web data
> Supported with Thinking on or off
> New 1:4, 4:1, 1:8 and 8:1 aspect ratios
> Improved aspect ratio adherence
> Improved image quality and consistency
> Improved i18n text rendering

**Release dates.** From the Gemini API release notes ([Release notes](https://ai.google.dev/gemini-api/docs/changelog)):

> February 26, 2026
> Launched Nano Banana 2, Gemini 3.1 Flash Image Preview, a high-efficiency model optimized for speed and high-volume use cases.

> May 28, 2026
> Released gemini-3.1-flash-image (Nano Banana 2) and gemini-3-pro-image (Nano Banana Pro), the generally available (GA) versions of our native visual models, Gemini 3.1 Flash Image and Gemini 3 Pro Image.
> ...
> Deprecation announcement: The gemini-3.1-flash-image-preview and gemini-3-pro-image-preview models are deprecated and will be shut down on June 25, 2026.

> June 30, 2026
> Released gemini-3.1-flash-lite-image (Nano Banana 2 Lite) to general availability (GA) ...

> November 20, 2025
> Released Gemini 3 Pro Image Preview, gemini-3-pro-image-preview, the next iteration to the Nano Banana model.

Google's announcement post is dated February 26, 2026 and uses the name "Nano Banana 2 (Gemini 3.1 Flash Image)" ([Nano Banana 2 announcement](https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/); [developer announcement](https://blog.google/innovation-and-ai/technology/developers-tools/build-with-nano-banana-2/)). The DeepMind model card is stamped "Published 26 February 2026" and states "Gemini 3.1 Flash Image is based on Gemini 3 Flash" and "The knowledge cutoff date for Gemini 3.1 Flash Image was January 2025." ([Gemini 3.1 Flash Image model card](https://deepmind.google/models/model-cards/gemini-3-1-flash-image/)).

**Practical consequence.** Use `gemini-3.1-flash-image`. The `-preview` ID has been shut down since June 25, 2026.

## 2. Size and aspect

**Enumerated values only.** The Interactions API reference defines `ImageResponseFormat` with closed enums ([Interactions API reference](https://ai.google.dev/api/interactions-api)):

> aspect_ratio enum (string) (optional) The aspect ratio for the image output. Possible values: 1:1 1:1 aspect ratio. 2:3 2:3 aspect ratio. 3:2 3:2 aspect ratio. 3:4 3:4 aspect ratio. 4:3 4:3 aspect ratio. 4:5 4:5 aspect ratio. 5:4 5:4 aspect ratio. 9:16 9:16 aspect ratio. 16:9 16:9 aspect ratio. 21:9 21:9 aspect ratio. 1:8 1:8 aspect ratio. 8:1 8:1 aspect ratio. 1:4 1:4 aspect ratio. 4:1 4:1 aspect ratio.
> ...
> image_size enum (string) (optional) The size of the image output. Possible values: 512 512px image size. 1K 1K image size. 2K 2K image size. 4K 4K image size.

There is no width/height field. Arbitrary WIDTHxHEIGHT sizes are not accepted; output dimensions are fully determined by the (aspect_ratio, image_size) pair.

**Resolution rules.** From the guide ([Image generation guide](https://ai.google.dev/gemini-api/docs/image-generation)):

> Gemini 3 image models generate 1K images by default but can also output 2K, 4K, and 512px (05.K) (Gemini 3.1 Flash Image only) images. To generate higher resolution assets, specify the image_size in the response_format.
> Note: Gemini 3.1 Flash Lite image model only supports 1K images.
> You must use an uppercase 'K' (e.g. 512px (05.K), 1K, 2K, 4K). Lowercase parameters (e.g., 1k) will be rejected.

> By default, the model matches the output image size to that of your input image, or otherwise generates 1:1 squares. You can control the aspect ratio and the size of the output image using the aspect_ratio and image_size fields under response_format when type is set to "image".

**Exact output dimensions for `gemini-3.1-flash-image`.** The guide's "3.1 Flash Image" table (reproduced verbatim, cells joined with "|"):

| Aspect ratio | 512px resolution | 0.5K tokens | 1K resolution | 1K tokens | 2K resolution | 2K tokens | 4K resolution | 4K tokens |
|---|---|---|---|---|---|---|---|---|
| 1:1 | 512x512 | 747 | 1024x1024 | 1120 | 2048x2048 | 1680 | 4096x4096 | 2520 |
| 1:4 | 256x1024 | 747 | 512x2048 | 1120 | 1024x4096 | 1680 | 2048x8192 | 2520 |
| 1:8 | 192x1536 | 747 | 384x3072 | 1120 | 768x6144 | 1680 | 1536x12288 | 2520 |
| 2:3 | 424x632 | 747 | 848x1264 | 1120 | 1696x2528 | 1680 | 3392x5056 | 2520 |
| 3:2 | 632x424 | 747 | 1264x848 | 1120 | 2528x1696 | 1680 | 5056x3392 | 2520 |
| 3:4 | 448x600 | 747 | 896x1200 | 1120 | 1792x2400 | 1680 | 3584x4800 | 2520 |
| 4:1 | 1024x256 | 747 | 2048x512 | 1120 | 4096x1024 | 1680 | 8192x2048 | 2520 |
| 4:3 | 600x448 | 747 | 1200x896 | 1120 | 2400x1792 | 1680 | 4800x3584 | 2520 |
| 4:5 | 464x576 | 747 | 928x1152 | 1120 | 1856x2304 | 1680 | 3712x4608 | 2520 |
| 5:4 | 576x464 | 747 | 1152x928 | 1120 | 2304x1856 | 1680 | 4608x3712 | 2520 |
| 8:1 | 1536x192 | 747 | 3072x384 | 1120 | 6144x768 | 1680 | 12288x1536 | 2520 |
| 9:16 | 384x688 | 747 | 768x1376 | 1120 | 1536x2752 | 1680 | 3072x5504 | 2520 |
| 16:9 | 688x384 | 747 | 1376x768 | 1120 | 2752x1536 | 1680 | 5504x3072 | 2520 |
| 21:9 | 792x168 | 747 | 1584x672 | 1120 | 3168x1344 | 1680 | 6336x2688 | 2520 |

Source: [Image generation guide, "Aspect ratios and image size"](https://ai.google.dev/gemini-api/docs/image-generation). Note two typographical oddities in the guide itself: it writes "05.K" for 0.5K, and the sibling table for Nano Banana Pro is headed "3.1 Pro Image" although the model is Gemini 3 Pro Image.

**Extreme ratios such as 5:1 (3600x720).** 5:1 is not in the enum, and no arbitrary size is accepted, so 3600x720 cannot be requested directly. The extreme wide ratios that are offered are 4:1 (1024x256, 2048x512, 4096x1024, 8192x2048) and 8:1 (1536x192, 3072x384, 6144x768, 12288x1536), plus 21:9. A 5:1 asset therefore has to be derived by cropping or padding a 4:1 or 8:1 render. This derivation is an inference from the table, not a documented workflow:

- 4:1 at 2K is 4096x1024; centre-cropping to 5:1 yields 4096x819, which downscales to 3600x720 (no upscaling needed).
- 4:1 at 4K is 8192x2048; centre-cropping to 5:1 yields 8192x1638, which downscales to 3600x720 with headroom.
- 8:1 at 4K is 12288x1536; cropping to 5:1 yields 7680x1536, which downscales to 3600x720 but discards 37% of the width.

The comparison models are narrower: the guide's Nano Banana Pro table lists only 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, and 21:9 at 1K/2K/4K (no 512px, no 4:1/8:1), and the Gemini 2.5 Flash Image table lists the same ten ratios at a single roughly 1-megapixel size (for example 1024x1024, 1344x768, 1536x672) ([Image generation guide](https://ai.google.dev/gemini-api/docs/image-generation)). The developer announcement states the aspect-ratio additions explicitly: "with native support for all existing aspect ratios we have now added 4:1, 1:4, 8:1 and 1:8." ([Build with Nano Banana 2](https://blog.google/innovation-and-ai/technology/developers-tools/build-with-nano-banana-2/)).

## 3. Transparency

**API.** No Google page documents transparent, RGBA, or alpha-channel output for any Nano Banana model. The Interactions API reference lists a single allowed output MIME type ([Interactions API reference](https://ai.google.dev/api/interactions-api)):

> mime_type enum (string) (optional) The MIME type of the image output. Possible values: image/jpeg JPEG image format.

JPEG has no alpha channel. The image-generation guide's feature list, "Optional configurations" section, and "Limitations" section do not mention transparency ([Image generation guide](https://ai.google.dev/gemini-api/docs/image-generation)). The model card's inputs/outputs statement is "Image and text output is generated in the response" with no format detail ([model card](https://deepmind.google/models/model-cards/gemini-3-1-flash-image/)).

**Gemini app.** The Gemini Apps help page on image generation describes model selection, 1K/2K downloads, editing, avatars, and export, and does not mention transparent backgrounds or output file format ([Generate & edit images with Gemini Apps](https://support.google.com/gemini/answer/14286560?hl=en&co=GENIE.Platform%3DDesktop)).

**Practical consequence.** Plan on opaque output. Any transparent scenery layer will need a separate matting/background-removal step outside the model, and the model's own rendering of a "transparent" background will be a painted checkerboard or flat colour, not alpha.

## 4. Editing

**Reference-image limits.** From the guide's "Use up to 14 reference images" section ([Image generation guide](https://ai.google.dev/gemini-api/docs/image-generation)):

> Gemini 3 image models let you to mix up to 14 reference images. These 14 images can include the following:

| Gemini 3.1 Flash Lite Image | Gemini 3.1 Flash Image | Gemini 3 Pro Image |
|---|---|---|
| Up to 14 images of objects with high-fidelity to include in the final image | Up to 10 images of objects with high-fidelity to include in the final image | Up to 6 images of objects with high-fidelity to include in the final image |
| N/A | Up to 4 images of characters to maintain character consistency | Up to 5 images of characters to maintain character consistency |
| N/A | N/A | Up to 3 images to be used as style references |

The guide's "Limitations" section restates the per-model numbers:

> gemini-2.5-flash-image works best with up to 3 images as input, while gemini-3-pro-image supports 5 images with high fidelity, and up to 14 images in total. gemini-3.1-flash-image supports character resemblance of up to 4 characters and the fidelity of up to 10 objects in a single workflow.

Note that Google's launch blog gives higher numbers for the same model: "Maintain character resemblance of up to five characters and the fidelity of up to 14 objects in a single workflow" ([Nano Banana 2 announcement](https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/)). The developer documentation (4 characters, 10 objects, 14 total) is the operative limit for API planning.

Video is also accepted as editing context: "Video inputs are only supported for Gemini 3.1 Flash Image and Gemini 3.1 Flash Lite Image." and, from the release notes, "You can now pass a video file (via direct upload or as a public YouTube URL) as multimodal context alongside a text prompt ... This feature is supported exclusively on the gemini-3.1-flash-image model." ([Image generation guide](https://ai.google.dev/gemini-api/docs/image-generation); [Release notes](https://ai.google.dev/gemini-api/docs/changelog)).

**Masks and region edits.** There is no mask input in the API. The `ImageResponseFormat` schema has only `aspect_ratio`, `delivery`, `image_size`, `mime_type`, and `type` ([Interactions API reference](https://ai.google.dev/api/interactions-api)). The guide's only "mask" feature is prompt-driven:

> 2. Inpainting (semantic masking)
> Conversationally define a "mask" to edit a specific part of an image while leaving the rest untouched.
> Template
> Using the provided image, change only the [specific element] to [new element/description]. Keep everything else in the image exactly the same, preserving the original style, lighting, and composition.

The model card acknowledges that ink/doodle-marked edits are an evaluated capability and a known weakness: the evaluation set covers "ink (doodle) based editing", and Known Limitations include "Masked/Doodle based editing: partial instruction following and persistent ink" and "When editing images: infrequent copying/pasting from user's input image to generated image" ([model card](https://deepmind.google/models/model-cards/gemini-3-1-flash-image/)). So region hints are possible by drawing on an input image, but nothing is documented as a structured mask, and Google itself lists the behaviour as partial.

Also relevant to edits: "By default, the model matches the output image size to that of your input image, or otherwise generates 1:1 squares." ([Image generation guide](https://ai.google.dev/gemini-api/docs/image-generation)).

**Character consistency.** Documented as a feature via the character-image slots above, and as a prompting pattern:

> 7. Character consistency: 360 view
> You can generate 360-degree views of a character by iteratively prompting for different angles. For best results, include previously generated images in subsequent prompts to maintain consistency. For complex poses, include a reference image of the selected pose.

with the documented caveat "Character consistency is not always perfect between input images and generated output image" ([model card](https://deepmind.google/models/model-cards/gemini-3-1-flash-image/)). The model page also lists "Thinking: Supported", and the guide explains that thinking "generates interim 'thought images' (visible in the backend but not charged) to refine the composition before producing the final high-quality output" ([model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image); [Image generation guide](https://ai.google.dev/gemini-api/docs/image-generation)).

## 5. Access and billing

**Does Google AI Ultra include Gemini API usage?** No. The Gemini API's own plan page is explicit ([Google AI plans, Gemini API docs](https://ai.google.dev/gemini-api/docs/google-ai-plans), page stamp "Last updated 2026-08-18 UTC"):

> Google AI Pro and Ultra subscription plans provide greater model access and increased rate limits for prototyping and development in AI Studio compared to the free tier.

> AI Studio UI only: Google AI plan benefits for developer usage apply only within the Google AI Studio web interface. Direct use of the Gemini API (such as using API keys or external applications) is billed and managed separately.

> Different from API billing: Google AI plans for AI Studio are separate from Gemini API usage tiers, which cover development and production API usage.

> Google One credits: Google One AI credits are a separate credit system that isn't supported within AI Studio and don't overlap with Google Cloud credits.

> When daily baseline subscription quotas are exhausted in AI Studio, you can continue your workflows using a Gemini API key with Cloud Billing enabled for pay-per-request usage of the Gemini API directly.

The plan table on that page reads: "AI Pro | Higher quota | Access to premium models like Gemini Pro, Nano Banana, and Lyria." and "AI Ultra | Highest quota | Highest limits for prototyping, development, and advanced frontier models."

There is one indirect path from Ultra to API spend: "Subscribers with Google Cloud Platform (GCP) projects and Cloud Billing enabled are eligible to receive monthly Cloud credits from the Google Developer Program for Cloud services, including the Gemini API. ... For users on prepay billing, a paid balance greater than $0 is required in AI Studio to activate promotional credits." ([Google AI plans](https://ai.google.dev/gemini-api/docs/google-ai-plans)). The Google One plan comparison lists for Ultra "$40 in monthly Google Cloud credits from Google Developer Program" and "Higher limits in AI Studio, Google Antigravity, and Jules" ([Google AI plans, Google One](https://one.google.com/intl/en_us/about/google-ai-plans/)); the Ultra benefits help page says "Depending on your Ultra tier, Google Cloud credits are included each month." ([Use Google AI Ultra benefits](https://support.google.com/googleone/answer/16286513?hl=en)). Ultra pricing on Google's subscription page is "Starting at: $99.99/ month" with a higher "$199.99 / month" tier ([Google AI Pro and Ultra](https://gemini.google/subscriptions/)).

**Gemini app entitlements for image generation.** Nano Banana 2 is the default image model in the app for everyone; a paid plan adds 2K downloads and "Redo with Pro" ([Generate & edit images with Gemini Apps](https://support.google.com/gemini/answer/14286560?hl=en&co=GENIE.Platform%3DDesktop)):

> Nano Banana 2: This option is selected when you make an image request with the Gemini model set to Flash or Pro. It balances speed with higher image quality, more world knowledge, and reliable text rendering. It can accept multiple reference images.
> Nano Banana Pro: Available with a Google AI Plan, this option is available when you have the Gemini model set to Pro and want to redo an image when additional detail is needed.
> ...
> High output quality: Preview images at high resolution. Download images at at 2K resolution with a Google AI plan or at 1K without an AI plan.
> ...
> Important: If you reach your daily quota of Nano Banana 2 images, you can't redo any additional images with Nano Banana Pro.

**API list price.** From the pricing page ([Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)), the `gemini-3.1-flash-image` Standard tier is:

> Input price | Not available (Free Tier) | $0.50 (text/image)
> Output price | Not available (Free Tier) | $3 (text and thinking) $60.00 (images) Equivalent to $0.045 per 0.5K image*, $0.067 per 1K image*, $0.101 per 2K image*, and $0.151 per 4K image*.
> Grounding with Google Web and Image Search** | Not available*** | 5,000 free search requests per month (shared across all Gemini 3.x models), then $14 per 1,000 requests for text and image-based grounding.
> Used to improve our products | Yes | No

> * Image output is priced at $60 per 1,000,000 tokens. Output images at 0.5K (512px) consume 747 tokens and are equivalent to $0.045 per image. Output images at 1K (1024x1024px) consume 1120 tokens and are equivalent to $0.067 per image. Output images at 2K (2048x2048px) consume 1680 tokens and are equivalent to $0.101 per image. Output images at 4K (4096x4096px) consume 2520 tokens and are equivalent to $0.151 per image.

Batch tier: "$0.25 (text, image)" input; output "$1.50 (text and thinking) $30.00 (images) Equivalent to $0.022 per 0.5K image*, $0.034 per 1K image*, $0.050 per 2K image*, and $0.076 per 4K image*." The model page lists "Batch API: Supported; Flex inference: Not supported; Priority inference: Not supported" ([model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image)). "Free Tier: Not available" means there is no no-cost API quota for this model.

Arithmetic check (tokens x $60 / 1,000,000, Standard):

| image_size | Output tokens | Standard ($60/1M) | Batch ($30/1M) |
|---|---|---|---|
| 512 | 747 | $0.04482 | $0.02241 |
| 1K | 1120 | $0.06720 | $0.03360 |
| 2K | 1680 | $0.10080 | $0.05040 |
| 4K | 2520 | $0.15120 | $0.07560 |

Token counts are per image and do not vary by aspect ratio, so a 4:1 or 8:1 render at 4K costs the same $0.151 as a 1:1 4K render. Input images are billed as input tokens at $0.50 per 1M; the page does not state the token count of an input image for this model.

For comparison, Nano Banana Pro (`gemini-3-pro-image`) Standard output is "$120.00 (images) Equivalent to $0.134 per 1K/2K image** and $0.24 per 4K image**" (1120 tokens at 1K and 2K, 2000 at 4K), and legacy Nano Banana (`gemini-2.5-flash-image`) is "Image output is priced at $30 per 1,000,000 tokens. Output images up to 1024x1024px consume 1290 tokens and are equivalent to $0.039 per image." ([Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)).

**Practical consequence.** An Ultra subscription does not pay for API calls. Budget API spend separately, or set up a Cloud Billing project so the Developer Program credits that come with Ultra can offset it. A 6-place set of wide scenery layers at 4K (4:1) is roughly $0.15 per render on Standard, or $0.076 on Batch.

## 6. Watermarks

**Gemini app, visible watermark.** The Gemini Apps watermark help page ([Manage watermark settings in Gemini Apps](https://support.google.com/gemini/answer/17405358?hl=en&co=GENIE.Platform%3DDesktop)):

> You can manage whether visible watermarks appear on AI-generated content in Gemini Apps. This setting controls visible watermarks across all visual media you create with Gemini, including images, videos, and music.
> Important:
> If you are in India, South Korea, or Vietnam, you'll only see this setting if you have an AI Ultra subscription. Otherwise you'll automatically see visible watermarks applied to all visual media you create with Gemini Apps.
> If your access to Gemini Apps is through a work or school account, this setting is not available and you will continue to see the watermark.
> Turn visible watermarks on or off
> On your computer, go to gemini.google.com.
> At the bottom left, click Settings > Media Watermark.
> Turn the setting on or off.
> Tips:
> This setting only controls the visible watermark. It doesn't affect SynthID watermarks or Content Credentials for media you create with Gemini Apps.
> These settings apply only to Gemini Apps (web and mobile), not AI features in other Google products.
> About visible watermarks and Gemini Apps
> When the setting is turned on, Gemini Apps applies visible watermarks differently depending on the media you generate:
> Images: Visible watermarks will appear on any newly generated images.

So for an AI Ultra subscriber on a personal account, the visible watermark on images is a user setting that can be turned off, in every region; in India, South Korea, and Vietnam an Ultra subscription is the only way to get that setting at all. The page does not condition the toggle on a paid plan outside those three countries.

**Gemini app, invisible watermark.** Same page:

> SynthID: All AI-generated media created or edited with Gemini Apps includes an invisible SynthID watermark.
> Content Credentials (C2PA) provenance signals: Gemini Apps include Content Credentials (C2PA) metadata to provide information about the content's origin.

And from the SynthID verification page: "The digital watermark will usually still exist even if the image, video, or audio is re-scaled, re-colored, compressed or altered in other ways." and "if a SynthID watermark is detected, it means all or part of the image or video was created or edited by Google's AI models." ([Verify AI-generated images, videos, and audio](https://support.google.com/gemini/answer/16722517?hl=en&co=GENIE.Platform%3DDesktop)). Nothing on either page offers a way to disable SynthID or C2PA.

**API.** The image-generation guide states twice, in the model list and in Limitations: "All generated images include a SynthID watermark." ([Image generation guide](https://ai.google.dev/gemini-api/docs/image-generation)). No visible watermark is mentioned anywhere in the API guide, model page, model card, or pricing page, and there is no API parameter relating to watermarks in `ImageResponseFormat` ([Interactions API reference](https://ai.google.dev/api/interactions-api)). Google's launch post frames the policy as "coupling our state-of-the-art SynthID technology with interoperable C2PA Content Credentials" ([Nano Banana 2 announcement](https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/)).

**Practical consequence for game assets.** Every image, from the API or the app, carries an imperceptible SynthID mark that survives cropping, scaling, and recompression; that is a fixed property of the output and is not a visual defect. The only visible mark is the Gemini app's optional overlay, which an Ultra subscriber can switch off in Settings > Media Watermark. API output has no documented visible overlay, which makes it the cleaner path for assets that will be cropped and layered.

## Could not verify

The following were not stated on any primary Google page checked on 2026-09-05:

- Whether any output path yields PNG or an alpha channel. The API reference enumerates only `image/jpeg` for the output `mime_type`, and no page mentions transparency. The default output format when `mime_type` is omitted is not documented.
- Whether the Gemini app applies the visible watermark by default (setting on) for new accounts outside India, South Korea, and Vietnam. The help page documents the toggle but not its default state.
- Whether API output carries any visible watermark. The docs mention only SynthID; they do not explicitly say "no visible watermark".
- Whether the API accepts an explicit mask image or mask parameter. The schema has none; the model card's "Masked/Doodle based editing" limitation implies ink-marked inputs are interpreted, but no page documents the mechanism or its reliability beyond "partial instruction following".
- The exact string for the 512px size. The API reference lists the enum value as `512`; the guide writes "512px (05.K)". The guide's example code only shows "1K"/"2K".
- The reconciled character/object limits. Developer docs say 4 characters and 10 objects for `gemini-3.1-flash-image`; the launch blog says 5 characters and 14 objects.
- The Cloud-credit amount per Ultra tier. The Google One comparison page shows "$40 in monthly Google Cloud credits"; the Ultra help page says only "Depending on your Ultra tier".
- The token count billed for an input reference image on `gemini-3.1-flash-image` (the pricing page gives a per-image input equivalent only for Nano Banana Pro).
- The Gemini app's daily image quota ("your daily quota of Nano Banana 2 images") and whether the app exposes aspect-ratio or 4K options; the help page documents only 1K vs 2K downloads.
- Whether the Gemini app's Ultra tier uses a different resolution or model configuration than AI Pro for Nano Banana 2 beyond the shared "Google AI plan" entitlements above.
