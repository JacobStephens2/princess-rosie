export interface CandidateScore {
  semanticFit: number;
  gentleness: number;
  nonverbalness: number;
  startleRisk: string | number;
  fatigueRisk: string | number;
  verbalDetected: boolean;
  summary: string;
}

export interface CandidateEvaluationReport {
  rawResponse: string;
  rankings: string[];
  selectedCandidate: string;
  selectionReason: string;
  hasUncertainty: boolean;
  candidateScores: Record<string, CandidateScore>;
}

export function buildEvaluationPrompt(
  cueName: string,
  cueDescription: string,
  candidateLabels: string[],
): string {
  const candidatesList = candidateLabels.map((c, i) => `${i + 1}. ${c}`).join("\n");
  return `You are the authoritative native-audio evaluator for the children's picture-book web game "Princess Rosie and the Seven Birthday Stars".
We are evaluating candidate soundtracks for the musical cue: "${cueName}".
Cue description & artistic intent:
${cueDescription}

Audio candidates provided:
${candidatesList}

Evaluation Rubric & Fairytale Soundscape Rules:
1. Semantic Fit: Does this music fit the emotional and visual world of Fairytale Sicily and this specific cue? (Score 1-10)
2. Gentleness: Is the music peaceful, welcoming, calm, and reassuring for a 4-year-old child? (Score 1-10)
3. Nonverbalness: Is the music strictly nonverbal? Absolutely no human singing, speech, vocal chants, whispered syllables, or synthetic vocaloids. (Score 1-10, flag any vocal sounds)
4. Startle Risk: Are there any loud, sudden transients, harsh brass crashes, or aggressive percussion hits that could startle a young child? (Rate Low, Moderate, or High)
5. Fatigue Risk: Does the track loop gracefully and avoid annoying, overly repetitive, or grating motifs for parents sitting alongside? (Rate Low, Moderate, or High)

Output format requirements:
For EACH candidate, provide:
#### Candidate <Label>
- Semantic fit: <score>/10 - <brief notes>
- Gentleness: <score>/10 - <brief notes>
- Nonverbalness: <score>/10 - <brief notes>
- Startle risk: <Low/Moderate/High> - <brief notes>
- Fatigue risk: <Low/Moderate/High> - <brief notes>

Then provide the explicit ranking across all candidates:
### Final Ranking
${candidateLabels.join(" > ")} (or your ordered ranking)

### Winner
Selected: <Candidate Label>
Reason: <concise reason for selection>
Uncertainty: <None / or describe any uncertainty>`;
}

export function parseEvaluationResponse(
  responseText: string,
  candidateLabels: string[],
): CandidateEvaluationReport {
  // 1. Extract ranking
  let rankings: string[] = [];
  const rankingMatch = responseText.match(/(?:Final Ranking|Ranking):?\s*([^\n]+)/i);
  if (rankingMatch && rankingMatch[1]) {
    const rawRanking = rankingMatch[1];
    const parts = rawRanking.split(/>|,|\n/).map((s) => s.trim());
    for (const part of parts) {
      const matchLabel = candidateLabels.find((label) =>
        part.toLowerCase().includes(label.toLowerCase()),
      );
      if (matchLabel && !rankings.includes(matchLabel)) {
        rankings.push(matchLabel);
      }
    }
  }

  // Ensure all candidates are in rankings
  for (const label of candidateLabels) {
    if (!rankings.includes(label)) {
      rankings.push(label);
    }
  }

  // 2. Extract selected winner
  let selectedCandidate: string = rankings[0] || candidateLabels[0] || "Candidate Alpha";
  const selectedMatch = responseText.match(/(?:Selected|Winner):\s*([^\n]+)/i);
  if (selectedMatch && selectedMatch[1]) {
    const winnerText = selectedMatch[1];
    const matchLabel = candidateLabels.find((label) =>
      winnerText.toLowerCase().includes(label.toLowerCase()),
    );
    if (matchLabel) {
      selectedCandidate = matchLabel;
    }
  }

  // 3. Extract reason
  let selectionReason = "";
  const reasonMatch = responseText.match(/Reason:\s*([^\n]+)/i);
  if (reasonMatch && reasonMatch[1]) {
    selectionReason = reasonMatch[1].trim();
  } else {
    selectionReason = `Ranked first among evaluated candidates by Gemini 3.8 Flash.`;
  }

  // 4. Uncertainty
  let hasUncertainty = false;
  const uncertaintyMatch = responseText.match(/Uncertainty:\s*([^\n]+)/i);
  if (uncertaintyMatch && uncertaintyMatch[1]) {
    const uText = uncertaintyMatch[1].trim().toLowerCase();
    if (uText !== "none" && !uText.startsWith("no ") && uText !== "none.") {
      hasUncertainty = true;
    }
  }

  // 5. Candidate scores
  const candidateScores: Record<string, CandidateScore> = {};
  for (const label of candidateLabels) {
    const candidateRegex = new RegExp(
      `(?:####|###)?\\s*${label}[\\s\\S]*?(?=(?:####|###|Final Ranking|Winner|$))`,
      "i",
    );
    const blockMatch = responseText.match(candidateRegex);
    const block = blockMatch ? blockMatch[0] : "";

    const parseScore = (field: string) => {
      const m = block.match(new RegExp(`${field}:?\\s*(\\d+)`, "i"));
      return m && m[1] ? parseInt(m[1], 10) : 8;
    };

    const parseRating = (field: string) => {
      const m = block.match(new RegExp(`${field}:?\\s*([a-zA-Z]+)`, "i"));
      return m && m[1] ? m[1].trim() : "Low";
    };

    const semanticFit = parseScore("Semantic fit");
    const gentleness = parseScore("Gentleness");
    const nonverbalness = parseScore("Nonverbalness");
    const startleRisk = parseRating("Startle risk");
    const fatigueRisk = parseRating("Fatigue risk");

    const verbalDetected =
      nonverbalness < 8 ||
      /vocals? detected|voice detected|singing detected/i.test(block);

    candidateScores[label] = {
      semanticFit,
      gentleness,
      nonverbalness,
      startleRisk,
      fatigueRisk,
      verbalDetected,
      summary: block.slice(0, 300).trim(),
    };
  }

  return {
    rawResponse: responseText,
    rankings,
    selectedCandidate,
    selectionReason,
    hasUncertainty,
    candidateScores,
  };
}

export async function evaluateCandidatesWithGemini(
  candidates: Array<{ label: string; audioBuffer: Buffer; mimeType: string }>,
  cueName: string,
  cueDescription: string,
  apiKey: string = process.env.GEMINI_API_KEY || "",
): Promise<CandidateEvaluationReport> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required for audio evaluation");
  }

  const candidateLabels = candidates.map((c) => c.label);
  const prompt = buildEvaluationPrompt(cueName, cueDescription, candidateLabels);

  const parts: any[] = [{ text: prompt }];

  for (const candidate of candidates) {
    parts.push({
      text: `--- Beginning of Audio Track for ${candidate.label} ---`,
    });
    parts.push({
      inlineData: {
        mimeType: candidate.mimeType,
        data: candidate.audioBuffer.toString("base64"),
      },
    });
    parts.push({
      text: `--- End of Audio Track for ${candidate.label} ---`,
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data: any = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned empty candidate response: " + JSON.stringify(data));
  }

  return parseEvaluationResponse(text, candidateLabels);
}
