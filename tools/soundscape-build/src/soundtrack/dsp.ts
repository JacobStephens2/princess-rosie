import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { stat, lstat, mkdir, rm } from "node:fs/promises";
import { dirname } from "node:path";

const execFileAsync = promisify(execFile);

export const FLIGHT_MASTER_TARGET_LUFS = -21.9;
export const PEAK_CEILING_DBFS = -6.0;

export interface MasteringOptions {
  targetLufs?: number;
  peakCeilingDb?: number;
  sampleRate?: number;
  bitrate?: string;
}

export async function masterAudioTrack(
  inputPath: string,
  outputPath: string,
  options: MasteringOptions = {},
): Promise<void> {
  const targetLufs = options.targetLufs ?? FLIGHT_MASTER_TARGET_LUFS;
  const peakCeilingDb = options.peakCeilingDb ?? PEAK_CEILING_DBFS;
  const sampleRate = options.sampleRate ?? 44100;
  const bitrate = options.bitrate ?? "128k";

  await mkdir(dirname(outputPath), { recursive: true });
  await rm(outputPath, { force: true });

  const filter = `loudnorm=I=${targetLufs}:TP=${peakCeilingDb}:LRA=7.0`;
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-af",
    filter,
    "-ar",
    String(sampleRate),
    "-ac",
    "2",
    "-b:a",
    bitrate,
    outputPath,
  ]);
}

export interface DspCheckOptions {
  targetLufs?: number;
  lufsTolerance?: number;
  peakCeilingDb?: number;
  requireStereo?: boolean;
  requireSampleRate?: number;
  checkLoopSeam?: boolean;
  rejectSymlinks?: boolean;
}

export interface DspVerificationResult {
  decoding: boolean;
  channels: number;
  channelLayout: string;
  sampleRate: number;
  duration: number;
  peakDb: number;
  truePeakDb: number;
  integratedLoudness: number;
  loudnessMatched: boolean;
  loopSeamClean: boolean;
  dcOffsetClean: boolean;
  clippingFree: boolean;
  passed: boolean;
  failureReasons: string[];
}

function createFailureResult(
  failureReasons: string[],
  partial: Partial<DspVerificationResult> = {},
): DspVerificationResult {
  return {
    decoding: partial.decoding ?? false,
    channels: partial.channels ?? 0,
    channelLayout: partial.channelLayout ?? "",
    sampleRate: partial.sampleRate ?? 0,
    duration: partial.duration ?? 0,
    peakDb: partial.peakDb ?? 0,
    truePeakDb: partial.truePeakDb ?? 0,
    integratedLoudness: partial.integratedLoudness ?? 0,
    loudnessMatched: false,
    loopSeamClean: false,
    dcOffsetClean: false,
    clippingFree: false,
    passed: false,
    failureReasons,
  };
}

export async function verifyAudioDsp(
  filePath: string,
  options: DspCheckOptions = {},
): Promise<DspVerificationResult> {
  const targetLufs = options.targetLufs ?? FLIGHT_MASTER_TARGET_LUFS;
  const lufsTolerance = options.lufsTolerance ?? 1.5;
  const peakCeilingDb = options.peakCeilingDb ?? PEAK_CEILING_DBFS;
  const requireStereo = options.requireStereo ?? true;
  const requireSampleRate = options.requireSampleRate ?? 44100;
  const checkLoopSeam = options.checkLoopSeam ?? true;
  const rejectSymlinks = options.rejectSymlinks ?? false;

  const failureReasons: string[] = [];

  try {
    const rawStat = await lstat(filePath);
    if (rejectSymlinks && rawStat.isSymbolicLink()) {
      return createFailureResult(["File is a symbolic link placeholder, not a distinct production asset"]);
    }
    const realStat = await stat(filePath);
    if (realStat.size < 1024) {
      return createFailureResult(["File is empty or too small (< 1KB placeholder)"]);
    }
  } catch (err: any) {
    return createFailureResult([`File stat error: ${err.message}`]);
  }

  // 1. ffprobe format & streams
  let probeData: any;
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      filePath,
    ]);
    probeData = JSON.parse(stdout);
  } catch (err: any) {
    return createFailureResult([`FFprobe failed to decode: ${err.message}`]);
  }

  const audioStream = probeData.streams?.find((s: any) => s.codec_type === "audio");
  if (!audioStream) {
    return createFailureResult(["No audio stream found in file"]);
  }

  const channels = Number(audioStream.channels || 0);
  const channelLayout = String(audioStream.channel_layout || "");
  const sampleRate = Number(audioStream.sample_rate || 0);
  const duration = Number(probeData.format?.duration || audioStream.duration || 0);

  if (requireStereo) {
    if (channels !== 2) {
      failureReasons.push(`Expected 2 channels, found ${channels}`);
    }
    if (channelLayout && !channelLayout.toLowerCase().includes("stereo")) {
      failureReasons.push(`Expected stereo channel layout, found "${channelLayout}"`);
    }
  }

  if (requireSampleRate && sampleRate !== requireSampleRate) {
    failureReasons.push(`Expected sample rate ${requireSampleRate} Hz, found ${sampleRate} Hz`);
  }

  if (duration <= 1.0) {
    failureReasons.push(`Unintended silence or truncated audio (duration: ${duration.toFixed(2)}s)`);
  }

  // 2. ffmpeg ebur128 and volumedetect
  let ffmpegOutput = "";
  try {
    const res = await execFileAsync("ffmpeg", [
      "-i",
      filePath,
      "-af",
      "volumedetect,ebur128=framelog=quiet:peak=true",
      "-f",
      "null",
      "-",
    ]);
    ffmpegOutput = res.stderr || res.stdout;
  } catch (err: any) {
    ffmpegOutput = err.stderr || err.stdout || "";
    if (!ffmpegOutput) {
      return createFailureResult([`FFmpeg analysis failed: ${err.message}`], {
        decoding: false,
        channels,
        channelLayout,
        sampleRate,
        duration,
      });
    }
  }

  // Parse peak volume
  const maxVolMatch = ffmpegOutput.match(/max_volume:\s*([-\d.]+)\s*dB/);
  const peakDb = maxVolMatch && maxVolMatch[1] ? parseFloat(maxVolMatch[1]) : 0;

  // Parse true peak
  const truePeakMatch = ffmpegOutput.match(/True peak:\s+Peak:\s*([-\d.]+)\s*dBFS/);
  const truePeakDb = truePeakMatch && truePeakMatch[1] ? parseFloat(truePeakMatch[1]) : peakDb;

  if (peakDb > peakCeilingDb) {
    failureReasons.push(`Peak volume ${peakDb.toFixed(2)} dBFS exceeds ceiling ${peakCeilingDb} dBFS`);
  }

  const clippingFree = peakDb < 0.0 && truePeakDb < 0.0;
  if (!clippingFree) {
    failureReasons.push(`Audio indicates clipping: peak ${peakDb.toFixed(2)} dBFS, true peak ${truePeakDb.toFixed(2)} dBFS`);
  }

  // Parse integrated loudness
  const lufsMatch = ffmpegOutput.match(/Integrated loudness:\s+I:\s+([-\d.]+)\s+LUFS/);
  const integratedLoudness = lufsMatch && lufsMatch[1] ? parseFloat(lufsMatch[1]) : -99;
  const lufsDiff = Math.abs(integratedLoudness - targetLufs);
  const loudnessMatched = lufsDiff <= lufsTolerance;
  if (!loudnessMatched) {
    failureReasons.push(
      `Integrated loudness ${integratedLoudness.toFixed(2)} LUFS differs from target ${targetLufs} LUFS by ${lufsDiff.toFixed(2)} LUFS (allowed: ±${lufsTolerance} LUFS)`,
    );
  }

  // 3. astats for DC offset
  let dcOffsetClean = true;
  try {
    const { stderr: astatsOutput } = await execFileAsync("ffmpeg", [
      "-i",
      filePath,
      "-af",
      "astats=metadata=1:reset=1",
      "-f",
      "null",
      "-",
    ]);
    const dcMatch = astatsOutput.match(/DC offset:\s*([-\d.]+)/);
    if (dcMatch && dcMatch[1]) {
      const dcOffset = Math.abs(parseFloat(dcMatch[1]));
      if (dcOffset > 0.01) {
        dcOffsetClean = false;
        failureReasons.push(`Excessive DC offset detected: ${dcOffset.toFixed(4)}`);
      }
    }
  } catch {
    // Non-fatal if astats detail parsing unavailable
  }

  // 4. Clean loop seam check (waveform boundary continuity)
  let loopSeamClean = true;
  if (checkLoopSeam && duration > 2) {
    try {
      // Decode the first and last 20ms of PCM to ensure smooth boundary without step discontinuity
      const { stdout: pcmStart } = await execFileAsync(
        "ffmpeg",
        ["-ss", "0", "-t", "0.02", "-i", filePath, "-f", "s16le", "-ac", "2", "-ar", "44100", "-"],
        { encoding: "buffer", maxBuffer: 1024 * 1024 },
      );
      const { stdout: pcmEnd } = await execFileAsync(
        "ffmpeg",
        [
          "-ss",
          String(Math.max(0, duration - 0.02)),
          "-t",
          "0.02",
          "-i",
          filePath,
          "-f",
          "s16le",
          "-ac",
          "2",
          "-ar",
          "44100",
          "-",
        ],
        { encoding: "buffer", maxBuffer: 1024 * 1024 },
      );

      if (pcmStart.length >= 4 && pcmEnd.length >= 4) {
        // Read first sample (channel 0) and last sample (channel 0)
        const firstSample = pcmStart.readInt16LE(0) / 32768;
        const lastSample = pcmEnd.readInt16LE(pcmEnd.length - 4) / 32768;
        const seamStep = Math.abs(firstSample - lastSample);
        // Step discontinuity > 0.15 indicates a sharp boundary click/pop
        if (seamStep > 0.15) {
          loopSeamClean = false;
          failureReasons.push(`Loop seam discontinuity: step jump ${seamStep.toFixed(3)} exceeds threshold 0.15`);
        }
      }
    } catch {
      // Non-fatal if raw PCM extraction unavailable
    }
  }

  const passed = failureReasons.length === 0;

  return {
    decoding: true,
    channels,
    channelLayout,
    sampleRate,
    duration,
    peakDb,
    truePeakDb,
    integratedLoudness,
    loudnessMatched,
    loopSeamClean,
    dcOffsetClean,
    clippingFree,
    passed,
    failureReasons,
  };
}
