# Approve Mureka as a non-US provider exception

The project rule allows paid model services only when billed directly by a US-headquartered provider unless the owner approves an exception. The five production soundtrack pieces were generated through the Mureka API (`mureka-9`), which contracts through SKYWORK AI PTE. LTD. of Singapore. The first piece, Birthday Flight, was committed on 2026-08-22, one day before the rule entered the repository on 2026-08-23. The owner approved Mureka as an exception, and the approval is referenced in issues #164 and #167 dated 2026-09-07, which cite ADR-0024; that ADR specifies soundtrack behaviour and never held the exception, so this ADR now does. The exception is limited to the soundtrack. Contributed media must come from US-headquartered providers, so the exception does not extend to pull requests.

## Consequences

- The Mureka tracks need provenance records like the ElevenLabs effects carry, recorded from the paid API top-up evidence and marked owner-attested, plus the research note at `docs/research/mureka-distribution-rights.md`.
- Under the Mureka API agreement the owner owns the output and paid API calls carry distribution rights, but the output may not be used for machine-learning training. ADR-0026 keeps the media view-only for this reason among others.
