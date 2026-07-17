# EXP-2026-05-07-007 Hardening Audit

- `id`: `EXP-2026-05-07-007`
- `date`: `2026-05-07`
- `purpose`: Re-check the current 16xVS plan, results, adjacent research, and failure patterns before running more model-search rounds.
- `scope`: local evidence through v14, model-role audit, oracle specialist-routing upper bound, and external research context for token-free models, 1-bit LLMs, visual/pixel text models, and long-context inference hardware.

## Local Evidence Summary

- `v10` remains the best current single-head overall candidate.
- `v3` remains the storage baseline.
- `v6` remains the governance/archive specialist.
- `v8` remains the book-root/control-bridge specialist.
- `v13` is a useful governance/archive fold specialist, but not a baseline.
- `v14` is a negative probe and should not be promoted.

Model-role audit:

- [model role audit JSON](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-model-role-audit.json)

Key matrix:

| Candidate | Role | Fold Shape | Main Win | Main Failure |
| --- | --- | --- | --- | --- |
| `v3` | storage baseline | stable | flat `3`-patch long-form fold | governance/archive semantics fail |
| `v6` | governance/archive specialist | stable | governance and archive pass | broader suite regresses |
| `v8` | control-bridge specialist | stable | book-root passes with min margin `8` | governance breaks badly |
| `v10` | best single-head combined candidate | stable | fold + archive + multilingual/paraphrase balance | book-root control `-2.5`, audit evidence `-1` |
| `v13` | governance/archive fold specialist | stable | governance min `3.5`, archive min `8` | book-root economics/control fail |
| `v14` | failed reinforcement probe | stable | archive remains positive | book-root and governance worsen |

## Root Cause Pattern

The strongest current pattern is not storage failure. The fold shape is holding.

The failure pattern is semantic-head conflict:

- `v8` can clear book-root/control, but it smears nearby governance concepts.
- `v13` can clear governance/archive, but it cannot clear book-root economics/control.
- `v10` is the best single-head compromise, but still misses one book-root group and one governance group.
- Broad phrase injection does not solve the conflict. v11 and v14 both show that targeted additions can fix one local symptom while damaging neighboring boundaries.
- Scalar blend sweeps do not solve the conflict. v12 and v13 blend checks show the required groups do not become positive at one shared blend point.

Working hypothesis:

> The current prototype is trying to force storage shape, book-root semantics, governance semantics, archive semantics, and multilingual bridge behavior through one 256-bit semantic head. The evidence now favors a multi-head or routed-head architecture over another broad single-head retrain.

## Oracle Specialist-Routing Upper Bound

A non-production oracle routing audit was created:

- [oracle specialist routing audit](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\bench\2026-05-07-oracle-specialist-routing-audit.json)

It routes:

- `bookRoot` -> `v8-control-bridge`
- `governance` -> `v13-balanced-triad`
- `archive` -> `v13-balanced-triad`
- default single-head reference -> `v10-constrained-merge`

Result:

- `targetTriadPass`: `true`
- `bookRoot`: `3` patches/entry, min margin `8`
- `governance`: `2.8333` patches/entry, min margin `3.5`
- `archive`: `3` patches/entry, min margin `8`

Important boundary:

- This is not an implemented router.
- This is not proof of production generalization.
- It is an upper-bound test showing that the existing specialist heads already cover the known target triad if the system is allowed to select the right semantic head.

Storage implication:

- A three-head 256-bit signature would triple binary code bytes for the signature layer.
- On the three target corpora, that still remains below source size in the audit artifact:
  - `bookRoot.threeHeadBinaryVsSourceRatio`: `0.1451`
  - `governance.threeHeadBinaryVsSourceRatio`: `0.4933`
  - `archive.threeHeadBinaryVsSourceRatio`: `0.3596`
- This does not justify a broad storage claim, but it shows that multi-head signatures may be practical inside the current fold envelope.

## External Research Context

This prototype is not alone in questioning fixed tokenizers.

- `ByT5` argues for byte-level/token-free models and reports robustness benefits while documenting the compute tradeoff of longer byte sequences. Source: [ByT5 arXiv](https://arxiv.org/abs/2105.13626)
- `CANINE` operates directly on characters without explicit tokenization and uses downsampling to make character-level modeling efficient. Source: [CANINE arXiv](https://arxiv.org/abs/2103.06874)
- `Charformer` learns latent subword blocks end-to-end from characters through gradient-based subword tokenization. Source: [Charformer arXiv](https://arxiv.org/abs/2106.12672)
- `Pix2Struct` shows that rendered visual structure can be used as a pretraining signal by parsing screenshots into structured outputs. Source: [Pix2Struct arXiv](https://arxiv.org/abs/2210.03347)
- `BitNet b1.58` shows a ternary-weight LLM direction and explicitly points toward hardware optimized for 1-bit/low-bit LLMs. Source: [BitNet b1.58 arXiv](https://arxiv.org/abs/2402.17764)
- `bitnet.cpp` shows active work on efficient CPU kernels for ternary BitNet inference. Source: [bitnet.cpp arXiv](https://arxiv.org/abs/2410.16144)
- NVIDIA has publicly announced `Rubin CPX` for massive-context inference and described new Rubin-platform memory/context infrastructure. Sources: [NVIDIA Rubin CPX announcement](https://investor.nvidia.com/news/press-release-details/2025/NVIDIA-Unveils-Rubin-CPX-A-New-Class-of-GPU-Designed-for-Massive-Context-Inference/default.aspx), [NVIDIA Rubin technical blog](https://developer.nvidia.com/blog/inside-the-nvidia-rubin-platform-six-new-chips-one-ai-supercomputer/)

What this supports:

- The industry is actively working around tokenizer brittleness, byte/character length overhead, visual structure, low-bit inference, and long-context hardware.
- 16xVS fits that pressure pattern.

What this does not support:

- No public source proves a chip specifically designed to encode/decode `16xVS` 256-patch glyphs.
- No public source proves the current prototype can reach `99.99%` raw-source reduction.
- No public source proves the current prototype can reach `Library of Congress -> 1.25 GB`.

## Hardening Decisions

1. Stop broad phrase-injection retrains for now.
2. Stop scalar blend sweeps for now.
3. Preserve v10 as best single-head combined candidate.
4. Preserve v8 and v13 as specialist heads.
5. Treat multi-head/routed-head as the next serious design path.
6. Keep all extreme storage claims out of promoted language until broader projections prove them.

## Recommended Next Test

The next test should be small and architectural:

`v15`: deterministic multi-head prototype.

Minimum implementation:

- Keep the hierarchical packer fixed.
- Encode each entry with multiple existing heads:
  - `default`: v10
  - `bookRoot/control`: v8
  - `governance/archive`: v13
- Store/report per-head 256-bit signatures.
- Add a deterministic route policy for benchmark corpora first.
- Report:
  - per-head patch count
  - total binary bytes with 2-head and 3-head storage
  - semantic margin by selected head
  - failure if route is unknown

Strict claim boundary:

- This would test whether a multi-head architecture can harden the current prototype.
- It would not yet prove a production router.
- It would not yet prove broad generalization.

## Result Label

- `result_label`: `hardening`
- `claim_supported`: The current failure map favors a multi-head/routed-head solution over more single-head retraining.
- `claim_not_supported`: The current prototype still does not support extreme storage-collapse claims or production semantic superiority.
