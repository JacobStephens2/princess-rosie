import type { CatalogCue, GenerateRequest } from "./model";

export interface PcmInspection {
  channels: 1 | 2;
  sampleRate: number;
  sampleCount: number;
  durationSeconds: number;
  peak: number;
}

export interface AudioQa {
  decodable: true;
  durationWithinTolerance: true;
  nonSilent: true;
  sampleRate: number;
  channels: 1 | 2;
  peakDbfs: number;
  peakCeilingDbfs: -6;
  loopSeamDelta: number | null;
}

export interface MasteredAudio {
  wav: Buffer;
  processing: string[];
  audioQa: AudioQa;
}

interface MasteringOptions {
  trimBoundarySilence?: boolean;
  recordDecodedQa?: boolean;
}

interface DecodedPcmWav {
  pcm: Buffer;
  channels: 1 | 2;
  sampleRate: number;
  sampleCount: number;
  peak: number;
}

export const MASTERING_CONTRACT = Object.freeze({
  sampleEncoding: "pcm16le",
  durationToleranceRatio: 0.02,
  silencePeakFloor: 0.001,
  trimBoundarySilence: true,
  nonLoopFadeInMs: 10,
  nonLoopFadeOutMs: 20,
  peakCeilingDbfs: -6,
  loopSeamMaxDelta: 0.05,
});

const PEAK_CEILING = 10 ** (MASTERING_CONTRACT.peakCeilingDbfs / 20);

export function inspectPcm(pcm: Buffer, request: GenerateRequest): PcmInspection {
  if (pcm.length === 0 || pcm.length % 2 !== 0) throw new Error("Invalid PCM payload");
  const sampleRate = request.format === "pcm_48000" ? 48_000 : 24_000;
  const expectedFrames = sampleRate * request.durationSeconds;
  const samples = pcm.length / 2;
  const channelEstimate = samples / expectedFrames;
  const channels = channelEstimate >= 0.5 && channelEstimate < 1.5
    ? 1
    : channelEstimate >= 1.5 && channelEstimate <= 2.5
      ? 2
      : undefined;
  if (!channels) throw new Error("PCM channel layout could not be established");
  const sampleCount = samples / channels;
  const durationSeconds = sampleCount / sampleRate;
  if (
    Math.abs(durationSeconds - request.durationSeconds) / request.durationSeconds >
      MASTERING_CONTRACT.durationToleranceRatio
  ) {
    throw new Error("PCM duration is outside the allowed tolerance");
  }
  let peak = 0;
  for (let offset = 0; offset < pcm.length; offset += 2) {
    peak = Math.max(peak, Math.abs(pcm.readInt16LE(offset)) / 32_768);
  }
  if (peak < MASTERING_CONTRACT.silencePeakFloor) throw new Error("PCM payload is silent");
  return { channels, sampleRate, sampleCount, durationSeconds, peak };
}

function wrapPcmWav(pcm: Buffer, channels: 1 | 2, sampleRate: number): Buffer {
  const wav = Buffer.alloc(44 + pcm.length);
  wav.write("RIFF", 0, "ascii");
  wav.writeUInt32LE(36 + pcm.length, 4);
  wav.write("WAVE", 8, "ascii");
  wav.write("fmt ", 12, "ascii");
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * channels * 2, 28);
  wav.writeUInt16LE(channels * 2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36, "ascii");
  wav.writeUInt32LE(pcm.length, 40);
  pcm.copy(wav, 44);
  return wav;
}

function decodePcmWav(wav: Buffer): DecodedPcmWav {
  if (
    wav.length <= 44 ||
    wav.subarray(0, 4).toString("ascii") !== "RIFF" ||
    wav.subarray(8, 12).toString("ascii") !== "WAVE" ||
    wav.subarray(12, 16).toString("ascii") !== "fmt " ||
    wav.readUInt16LE(20) !== 1 ||
    wav.readUInt16LE(34) !== 16 ||
    wav.subarray(36, 40).toString("ascii") !== "data" ||
    wav.readUInt32LE(40) !== wav.length - 44
  ) {
    throw new Error("WAV artifact is not decodable PCM16 audio");
  }
  const channelValue = wav.readUInt16LE(22);
  if (channelValue !== 1 && channelValue !== 2) {
    throw new Error("WAV artifact has an invalid channel count");
  }
  const sampleRate = wav.readUInt32LE(24);
  if (sampleRate !== 24_000 && sampleRate !== 48_000) {
    throw new Error("WAV artifact has an invalid sample rate");
  }
  const pcm = wav.subarray(44);
  if (pcm.length % (channelValue * 2) !== 0) {
    throw new Error("WAV artifact has a truncated PCM frame");
  }
  let peak = 0;
  for (let offset = 0; offset < pcm.length; offset += 2) {
    peak = Math.max(peak, Math.abs(pcm.readInt16LE(offset)) / 32_768);
  }
  if (peak < MASTERING_CONTRACT.silencePeakFloor) throw new Error("WAV artifact is silent");
  return {
    pcm,
    channels: channelValue,
    sampleRate,
    sampleCount: pcm.length / (channelValue * 2),
    peak,
  };
}

export function validateMasterWav(wav: Buffer, cue: CatalogCue): AudioQa {
  const decoded = decodePcmWav(wav);
  const expectedChannels = cue.channelPolicy === "focused-mono" ? 1 : 2;
  if (decoded.channels !== expectedChannels) {
    throw new Error(`Approved ${cue.id} master violates its channel policy`);
  }
  const durationSeconds = decoded.sampleCount / decoded.sampleRate;
  if (
    Math.abs(durationSeconds - cue.durationSeconds) / cue.durationSeconds >
      MASTERING_CONTRACT.durationToleranceRatio
  ) {
    throw new Error("PCM duration is outside the allowed tolerance");
  }
  if (decoded.peak > PEAK_CEILING + 1 / 32_768) {
    throw new Error("PCM peak exceeds the mastering ceiling");
  }
  let loopSeamDelta: number | null = null;
  if (cue.looping) {
    loopSeamDelta = 0;
    for (let channel = 0; channel < decoded.channels; channel += 1) {
      const first = decoded.pcm.readInt16LE(channel * 2);
      const last = decoded.pcm.readInt16LE(
        ((decoded.sampleCount - 1) * decoded.channels + channel) * 2,
      );
      loopSeamDelta = Math.max(loopSeamDelta, Math.abs(first - last) / 32_768);
    }
    if (loopSeamDelta > MASTERING_CONTRACT.loopSeamMaxDelta) {
      throw new Error("PCM loop seam exceeds the allowed threshold");
    }
  }
  return {
    decodable: true,
    durationWithinTolerance: true,
    nonSilent: true,
    sampleRate: decoded.sampleRate,
    channels: decoded.channels,
    peakDbfs: Number((20 * Math.log10(decoded.peak)).toFixed(3)),
    peakCeilingDbfs: MASTERING_CONTRACT.peakCeilingDbfs,
    loopSeamDelta,
  };
}

export function masterCatalogAudio(
  pcm: Buffer,
  inspection: PcmInspection,
  cue: CatalogCue,
  options: MasteringOptions = {},
): MasteredAudio {
  const trimBoundarySilence = options.trimBoundarySilence ?? MASTERING_CONTRACT.trimBoundarySilence;
  const recordDecodedQa = options.recordDecodedQa ?? true;
  let firstFrame = 0;
  let finalFrame = inspection.sampleCount;
  if (!cue.looping && trimBoundarySilence) {
    const frameIsBoundarySilence = (frame: number) => {
      for (let channel = 0; channel < inspection.channels; channel += 1) {
        if (Math.abs(pcm.readInt16LE((frame * inspection.channels + channel) * 2)) > 1) {
          return false;
        }
      }
      return true;
    };
    while (firstFrame < finalFrame - 1 && frameIsBoundarySilence(firstFrame)) firstFrame += 1;
    while (finalFrame > firstFrame + 1 && frameIsBoundarySilence(finalFrame - 1)) finalFrame -= 1;
  }

  const outputChannels: 1 | 2 = cue.channelPolicy === "focused-mono" ? 1 : 2;
  const frameCount = finalFrame - firstFrame;
  const masteredPcm = Buffer.alloc(frameCount * outputChannels * 2);
  for (let outputFrame = 0; outputFrame < frameCount; outputFrame += 1) {
    const inputFrame = firstFrame + outputFrame;
    const inputOffset = inputFrame * inspection.channels * 2;
    const left = pcm.readInt16LE(inputOffset);
    const right = inspection.channels === 2 ? pcm.readInt16LE(inputOffset + 2) : left;
    if (outputChannels === 1) {
      masteredPcm.writeInt16LE(Math.round((left + right) / 2), outputFrame * 2);
    } else {
      masteredPcm.writeInt16LE(left, outputFrame * 4);
      masteredPcm.writeInt16LE(right, outputFrame * 4 + 2);
    }
  }

  let convertedPeak = 0;
  for (let offset = 0; offset < masteredPcm.length; offset += 2) {
    convertedPeak = Math.max(convertedPeak, Math.abs(masteredPcm.readInt16LE(offset)) / 32_768);
  }
  const scale = convertedPeak > PEAK_CEILING ? PEAK_CEILING / convertedPeak : 1;
  const fadeInFrames = cue.looping
    ? 0
    : Math.min(
      Math.round(inspection.sampleRate * MASTERING_CONTRACT.nonLoopFadeInMs / 1_000),
      frameCount,
    );
  const fadeOutFrames = cue.looping
    ? 0
    : Math.min(
      Math.round(inspection.sampleRate * MASTERING_CONTRACT.nonLoopFadeOutMs / 1_000),
      frameCount,
    );
  for (let frame = 0; frame < frameCount; frame += 1) {
    const fadeIn = fadeInFrames === 0 ? 1 : Math.min(1, frame / fadeInFrames);
    const remaining = frameCount - 1 - frame;
    const fadeOut = fadeOutFrames === 0 ? 1 : Math.min(1, remaining / fadeOutFrames);
    for (let channel = 0; channel < outputChannels; channel += 1) {
      const offset = (frame * outputChannels + channel) * 2;
      const sample = Math.round(masteredPcm.readInt16LE(offset) * scale * fadeIn * fadeOut);
      masteredPcm.writeInt16LE(Math.max(-32_768, Math.min(32_767, sample)), offset);
    }
  }

  const wav = wrapPcmWav(masteredPcm, outputChannels, inspection.sampleRate);
  const audioQa = validateMasterWav(wav, cue);
  return {
    wav,
    processing: [
      "inspect-pcm-s16le",
      ...(!cue.looping && trimBoundarySilence ? ["trim-boundary-silence"] : []),
      ...(outputChannels === 1 && inspection.channels === 2
        ? ["downmix-stereo-to-mono"]
        : outputChannels === 2 && inspection.channels === 1
          ? ["duplicate-mono-to-stereo"]
          : outputChannels === 2
            ? ["preserve-stereo"]
            : ["preserve-mono"]),
      ...(!cue.looping ? ["fade-in-10ms", "fade-out-20ms"] : []),
      "peak-ceiling--6dbfs",
      ...(cue.looping ? ["loop-seam-qa"] : []),
      "wav-wrap-pcm16le",
      ...(recordDecodedQa ? ["decode-wav-qa"] : []),
    ],
    audioQa,
  };
}

export function masterMonoWav(
  pcm: Buffer,
  inspection: PcmInspection,
  cue: CatalogCue,
): Pick<MasteredAudio, "wav" | "processing"> {
  const { wav, processing } = masterCatalogAudio(pcm, inspection, cue, {
    trimBoundarySilence: false,
    recordDecodedQa: false,
  });
  return { wav, processing };
}
