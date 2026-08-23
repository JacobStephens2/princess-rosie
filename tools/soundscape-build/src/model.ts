export interface CatalogCue {
  id: string;
  event: string;
  match: Record<string, string>;
  category: string;
  priority: number;
  requirement: "required" | "optional";
  durationSeconds: number;
  looping: boolean;
  channelPolicy: "focused-mono" | "warm-stereo" | "warm-stereo-loop";
  masteringIntent: string;
  selectionStatus: "unapproved" | "approved";
  authoring: {
    prompt: string;
    model: "eleven_text_to_sound_v2";
    promptInfluence: number;
    sourceFormats: ["pcm_48000", "pcm_24000"];
    candidateCount: number;
  };
  sourceMaster: string;
  runtimeMapping: string;
  fallbackRole: string;
}

export interface GenerateRequest {
  text: string;
  model: "eleven_text_to_sound_v2";
  durationSeconds: number;
  promptInfluence: number;
  loop: boolean;
  format: "pcm_48000" | "pcm_24000";
}

export function createGenerateRequest(
  cue: CatalogCue,
  format: GenerateRequest["format"],
): GenerateRequest {
  return {
    text: cue.authoring.prompt,
    model: cue.authoring.model,
    durationSeconds: cue.durationSeconds,
    promptInfluence: cue.authoring.promptInfluence,
    loop: cue.looping,
    format,
  };
}
