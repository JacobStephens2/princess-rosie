import { describe, expect, test } from "vitest";
import {
  buildEvaluationPrompt,
  parseEvaluationResponse,
  CandidateEvaluationReport,
} from "../src/soundtrack/evaluate";

describe("Blinded Candidate Evaluation Parsing Seam", () => {
  test("buildEvaluationPrompt constructs strict Fairytale Soundscape rubric", () => {
    const prompt = buildEvaluationPrompt(
      "Pastoral Lilt",
      "Gentle pastoral 6/8 lilt across Fairytale Sicily with soft acoustic woodwinds and strings",
      ["Candidate Alpha", "Candidate Bravo", "Candidate Charlie"],
    );

    expect(prompt).toContain("Pastoral Lilt");
    expect(prompt).toContain("Candidate Alpha");
    expect(prompt).toContain("Candidate Bravo");
    expect(prompt).toContain("Candidate Charlie");
    expect(prompt.toLowerCase()).toContain("semantic fit");
    expect(prompt.toLowerCase()).toContain("gentleness");
    expect(prompt.toLowerCase()).toContain("nonverbalness");
    expect(prompt.toLowerCase()).toContain("startle risk");
    expect(prompt.toLowerCase()).toContain("fatigue risk");
    expect(prompt).toContain("Final Ranking");
  });

  test("parseEvaluationResponse parses structured Gemini 3.8 Flash evaluation response", () => {
    const mockResponse = `
### Evaluation Results

#### Candidate Alpha
- Semantic fit: 9/10 - Beautiful pastoral woodwinds and gentle acoustic strings.
- Gentleness: 10/10 - Calm, soothing, ideal for a four-year-old child.
- Nonverbalness: 10/10 - Strictly nonverbal, no voices, no speech, no singing.
- Startle risk: Low - Very smooth dynamics, no sudden percussion hits.
- Fatigue risk: Low - Varied melodic motion that avoids repetitive ear fatigue.

#### Candidate Bravo
- Semantic fit: 7/10 - A bit too energetic, feels more like an adventure rush than a gentle lilt.
- Gentleness: 7/10 - Slightly loud percussion.
- Nonverbalness: 10/10 - Completely instrumental.
- Startle risk: Moderate - Quick snare transients.
- Fatigue risk: Moderate - Looping motif is repetitive.

#### Candidate Charlie
- Semantic fit: 8/10 - Nice acoustic arrangement.
- Gentleness: 8/10 - Gentle enough.
- Nonverbalness: 10/10 - Completely instrumental.
- Startle risk: Low - Calm.
- Fatigue risk: Low - Pleasant harmony.

### Final Ranking
Candidate Alpha > Candidate Charlie > Candidate Bravo

### Winner
Selected: Candidate Alpha
Reason: Candidate Alpha provides the most authentic fairytale pastoral lilt with superb gentleness and zero startle risk.
Uncertainty: None
`;

    const report: CandidateEvaluationReport = parseEvaluationResponse(mockResponse, [
      "Candidate Alpha",
      "Candidate Bravo",
      "Candidate Charlie",
    ]);

    expect(report.rankings).toEqual(["Candidate Alpha", "Candidate Charlie", "Candidate Bravo"]);
    expect(report.selectedCandidate).toBe("Candidate Alpha");
    expect(report.selectionReason).toContain("Candidate Alpha provides the most authentic");
    expect(report.hasUncertainty).toBe(false);

    expect(report.candidateScores["Candidate Alpha"]?.semanticFit).toBe(9);
    expect(report.candidateScores["Candidate Alpha"]?.gentleness).toBe(10);
    expect(report.candidateScores["Candidate Alpha"]?.nonverbalness).toBe(10);
    expect(report.candidateScores["Candidate Alpha"]?.verbalDetected).toBe(false);

    expect(report.candidateScores["Candidate Bravo"]?.semanticFit).toBe(7);
  });

  test("handles uncertainty or alternate formatting gracefully", () => {
    const mockResponse = `
Ranking: Candidate Charlie > Candidate Alpha > Candidate Bravo
Selected: Candidate Charlie
Reason: Best melodic clarity on small speakers.
Uncertainty: High - slight transient in candidate Alpha might startle sensitive toddlers.
`;
    const report = parseEvaluationResponse(mockResponse, [
      "Candidate Alpha",
      "Candidate Bravo",
      "Candidate Charlie",
    ]);
    expect(report.rankings[0]).toBe("Candidate Charlie");
    expect(report.selectedCandidate).toBe("Candidate Charlie");
    expect(report.hasUncertainty).toBe(true);
  });
});
