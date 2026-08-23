# Audio Evaluation

Follow this process whenever a task generates, selects, or reviews audio assets for the repository. This is the authoritative operating policy; the [audio-model research report](../research/audio-evaluation-models.md) preserves the supporting evidence and alternatives considered.

## Native-audio evaluator

Use the paid Gemini API with Gemini 3.7 Flash as the primary evaluator. Submit the actual audio through a native audio-input request; a transcript, spectrogram, or set of waveform measurements is not an equivalent substitute.

If Gemini 3.7 Flash is unavailable or cannot receive the audio, use Muse Spark 1.2 at `xhigh` reasoning effort through the ordinary paid Meta Model API, after proving with a smoke test that the request delivers the actual audio. Muse Code is not an audio-attachment path, and the Contributor tier does not qualify because project inputs and outputs must not be exchanged for model training.

If neither approved evaluator can receive the audio, stop and ask the project owner. Do not silently substitute another model.

## Acceptance gates

Every selected production candidate must pass both of these gates:

1. **Waveform checks**: verify decoding, format, duration, sample rate, channel layout, unintended silence, DC offset, loudness, peak and true-peak headroom, clipping indicators, and any applicable loop-boundary and stereo-correlation requirements.
2. **Perceptual evaluation**: ask the native-audio evaluator to assess semantic fit, nonverbalness, gentleness, startle risk, timbral clarity, fatigue risk, unwanted voice or music, audible artifacts, distinctness from related cues, ranking, and uncertainty. Use blinded candidate identifiers when comparing alternatives.

Require a human MacBook-speaker and headphone listening pass for final candidates and whenever the evaluator reports uncertainty. Waveform checks decide mechanical requirements; the native-audio evaluator supplies semantic and perceptual evidence; the human listening pass retains final authority over translation and feel.

## Evaluation record

Record each production selection in `docs/media-prompts.md` with:

- the service and exact model or version, including reasoning effort;
- the blinded candidate ranking;
- material failure flags and uncertainty;
- the selected candidate and concise reason; and
- whether the required human listening pass is complete.

Keep credentials, raw API payloads, and full API transcripts out of the repository.
