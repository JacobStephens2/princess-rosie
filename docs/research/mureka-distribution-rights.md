# Mureka instrumental distribution rights

Checked 2026-09-15 against official API documents, the signed-in account billing page, repository history, and GitHub issues.

## Conclusion

Mureka's paid API permits commercial use and platform distribution of generated content. The API agreement assigns its rights in Output to the customer, to the extent permitted by law. These provisions support distributing the game's instrumentals publicly, including alongside the game in a public repository. This is an interpretation of the distribution permission; the documents do not specifically name GitHub. [API FAQ, Commercial Authorization](https://platform.mureka.ai/docs/en/faq.html#commercial-authorization); [API Service Agreement, §3.2](https://platform.mureka.ai/service_terms.pdf).

The relevant product is the API platform, whose billing is separate from consumer website membership. The signed-in [API billing page](https://platform.mureka.ai/billing), observed on the check date, showed a $10 paid recharge on 2026-08-22 at 12:22 UTC, $0 total bonus, $8.89 spent, and $1.11 remaining. This establishes paid API credit and use; it is not an invoice-to-generation match for every committed track. [API FAQ, Billing & Usage](https://platform.mureka.ai/docs/en/faq.html#billing-usage).

## Limits relevant to a public repository

The API Service Agreement is dated and effective December 3, 2025. Section 2(f) restricts use of the service or its outputs for machine-learning model training or development. Public availability therefore should not be described as an unrestricted license for every downstream use. If adding a code license, document the media's terms separately rather than promising unrestricted reuse of the soundtrack. This is a licensing recommendation based on the restriction, not a claim that a conflicting repository license already exists. [API Service Agreement, heading and §2(f)](https://platform.mureka.ai/service_terms.pdf).

## Project provider exception

The repository requires direct billing by a US-headquartered provider unless the project owner explicitly approves an exception. Mureka contracts through SKYWORK AI PTE. LTD.; its privacy policy lists a Singapore address. It should therefore be handled as an exception under this project policy. [AGENTS.md](../../AGENTS.md); [API Service Agreement, introduction](https://platform.mureka.ai/service_terms.pdf); [Mureka Privacy Policy, §9](https://www.mureka.ai/static/privacy-20250709.pdf).

An approved exception **is recorded** in the issue tracker:

- [Issue #164](https://github.com/JacobStephens2/princess-rosie/issues/164), created 2026-09-07, states under Media Generation and Evaluation that additional tracks use Mureka API under the approved project exception.
- [Issue #167](https://github.com/JacobStephens2/princess-rosie/issues/167), created 2026-09-07, explicitly calls it the approved ADR-0024 exception.

Both issues are attributed to the owner's GitHub account, but that attribution does not prove the text was personally written by the owner. The inspected issues record that approval existed; they do not contain the original explicit owner instruction granting it. [ADR-0024](../adr/0024-per-journey-soundtrack-rotation-with-celebration-finale.md) specifies soundtrack behavior but contains no provider-exception statement. The recorded human listening approval concerns sound quality and should not be substituted for provider-policy consent. [Media records](../media-prompts.md#soundtrack-catalog); [completion comment](https://github.com/JacobStephens2/princess-rosie/issues/164#issuecomment-5577421904).

## Asset provenance and chronology

[The media records](../media-prompts.md#soundtrack-catalog) identify all five production pieces as Mureka API `mureka-9` instrumentals. Git history establishes these commit dates, not exact API generation timestamps:

| Assets | Evidence |
| --- | --- |
| Birthday Flight (`birthday-flight.mp3`) | First added on 2026-08-22 in [e9c0b81](https://github.com/JacobStephens2/princess-rosie/commit/e9c0b81ce2b9b7e7dea56c9d04b0fa857dfd791f). |
| Pastoral Lilt, Playful Marimba and Celesta, Epic Soaring Flight, Birthday Castle Celebration Theme | Production MP3s committed on 2026-09-07 (America/New_York) in [d3cf1e3](https://github.com/JacobStephens2/princess-rosie/commit/d3cf1e3108c5c9851b454596534b5365c8f84380), merged through [PR #172](https://github.com/JacobStephens2/princess-rosie/pull/172). |

The repository's paid-provider rule was added on 2026-08-23, after the first Birthday Flight commit. This establishes the local policy chronology without assuming whether an equivalent instruction existed outside the repository earlier. [Policy commit 44ef1d6](https://github.com/JacobStephens2/princess-rosie/commit/44ef1d6fcadfd950b7798bd1d8382527ecb8b5ac).
