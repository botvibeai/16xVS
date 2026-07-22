# 16xVS Current Proof Dossier

This file contains only claims that are backed by repo artifacts and labeled by evidence strength.

## Proven

### Standalone 16xVS POC harness exists

The isolated Worker path can ingest, store, retrieve, and repair records without importing shared BotVibe systems.

Evidence:

- [README](README.md)
- [status](docs\status.md)

### Triple storage policy is implemented

The current POC enforces `live` plus at least one secondary tier and exposes repair behavior for degraded records.

Evidence:

- [README](README.md)
- [status](docs\status.md)

### Benchmark harness is real

The repo can generate benchmark artifacts that compare `tiktoken`, the fixture path, and the experimental core candidate.

Evidence:

- [sample baseline refresh](docs\ledger\2026-04-20-sample-baseline-refresh.md)
- [Google 1000 refresh](docs\ledger\2026-04-20-google-1000-refresh.md)

### Vault snapshot path exists

The repo can now create a file-hashed snapshot of the current code, models, benchmarks, and docs so the evidence set can be archived instead of only living in moving local files.

Evidence:

- [status](docs\status.md)
- [vault snapshot script](scripts\create-vault-snapshot.mjs)
- [vault snapshot ledger](docs\ledger\2026-04-25-vault-snapshot-hierarchical-final.md)
- [latest vault snapshot ledger](docs\ledger\2026-04-25-vault-snapshot-hierarchical-v2-final.md)

### Phase-1 learned-encoder scaffold exists

The repo now has a training-pair builder and a frozen evaluation-suite runner. This does not prove the learned encoder yet, but it proves the next implementation stage has a fixed training/evaluation frame.

Evidence:

- [embedding-training-spec.json](data\training\embedding-training-spec.json)
- [embedding-training-pairs.json](data\training\embedding-training-pairs.json)
- [frozen-eval-suite.json](data\eval\frozen-eval-suite.json)
- [suite-summary.json](bench\eval-suite-latest\suite-summary.json)

## Directional

### Experimental core candidate can beat `tiktoken` on count in some controlled corpora

This is supported by the sample benchmark, the 1000-word English subset, and the multilingual phrase set.

Evidence:

- [sample baseline refresh](docs\ledger\2026-04-20-sample-baseline-refresh.md)
- [Google 1000 refresh](docs\ledger\2026-04-20-google-1000-refresh.md)
- [multilingual BSQ-style run](docs\ledger\2026-04-20-multilingual-bsq-style.md)

### Multilingual count disparity can be benchmarked directly

The current harness can expose baseline count inflation under `tiktoken` versus the experimental core candidate on the controlled multilingual fixture set.

Evidence:

- [multilingual BSQ-style run](docs\ledger\2026-04-20-multilingual-bsq-style.md)

### Controlled semantic separation is now positive in the BSQ-style prototype

The current experimental core candidate shows positive labeled group separation on the controlled phrase fixture and the controlled multilingual fixture. This is directional only because the embedding source is heuristic and the fixture set is small.

The locked blind holdout failed semantic separation, so this claim must not be promoted beyond controlled-fixture evidence.

Evidence:

- [phrase BSQ-style run](docs\ledger\2026-04-20-phrase-semantic-bsq-style.md)
- [multilingual BSQ-style run](docs\ledger\2026-04-20-multilingual-bsq-style.md)
- [blind holdout failure](docs\ledger\2026-04-20-blind-holdout-bsq-style.md)

### The best local-only learned path now passes the phrase-unseen paraphrase holdout

The expanded hybrid `v3` prototype is the current best local-only learned result in the repo. It keeps controlled phrase separation positive and passes the paraphrase holdout with all labeled margins positive.

This remains directional rather than proven because the blind unseen-domain holdout still fails and one multilingual group remains negative.

Evidence:

- [learned hybrid prototype v3 suite](docs\ledger\2026-04-24-learned-hybrid-prototype-v3-suite.md)
- [hybrid v3 suite summary](bench\eval-suite-learned-hybrid-v3\suite-summary.json)

### A separate macro-packer variant now collapses tested quotes and paragraphs to one patch each

The storage-focused `macro-packer-v1` variant is the first repo variant that reduces the tested quote corpus and tested quote-paragraph corpus to one patch per entry. It also preserves positive controlled phrase and paraphrase-holdout separation.

This remains directional only because the blind unseen-domain holdout still fails and the raw-source `99.99%` / `1.25 GB` claims are still not supported.

Evidence:

- [macro packer v1 suite](docs\ledger\2026-04-25-macro-packer-v1-suite.md)

### The current hierarchical storage baseline improves the tested long-form storage profile

The current `hierarchical-packer-v2` storage baseline keeps the tested quote and quote-paragraph corpora at one patch per entry while holding both the controlled protocol-longform corpus and the larger book-like corpus at `3` patches per entry. Across the currently tested quote, quote-paragraph, protocol-longform, and book-like corpora, it keeps aggregate raw-source reduction at `83.1534%`.

This remains directional only because the blind unseen-domain holdout, stress suite, and one multilingual group still fail, and the large `99.99%` / `1.25 GB` raw-source claims remain unsupported.

The `v2` residual-selection update is useful because it keeps the storage profile flat while reducing negative grouped themes on the larger book-like corpus from `4` to `3`. That is still not enough to turn the long-form semantic result into a pass.

Evidence:

- [hierarchical packer v1 suite](docs\ledger\2026-04-25-hierarchical-packer-v1-suite.md)
- [hierarchical packer v2 residual selection](docs\ledger\2026-04-25-hierarchical-packer-v2-residual-selection.md)

### The current hierarchical storage baseline now shows explicit synthetic book folding

The current `hierarchical-packer-v2` storage baseline now has a direct count-side folding result on synthetic book-scale entries. When the `12` chapter-style entries from the book-like corpus are folded into `6` synthetic book roots and then into `1` synthetic mega-book entry, the patch budget stays flat at `3` per entry while patches per token improve from `0.017` to `0.0085` to `0.0014`.

This remains directional only because the book-root semantic grouping is still slightly negative and the one-entry mega-book run cannot validate retrieval-space behavior or semantic retention by itself.

Evidence:

- [book folding round](docs\ledger\2026-05-06-book-folding-round.md)
- [book-root report](bench\2026-05-06-book-root-benchmark-v3-hierarchical-packer-v2.json)
- [mega-book report](bench\2026-05-06-mega-book-benchmark-v3-hierarchical-packer-v2.json)

### A targeted control-bridge round can clear synthetic book-root grouping while preserving multilingual and paraphrase gates

The `v8` control-bridge hierarchical candidate is the first repo round that turns the full synthetic `book-root` grouping positive while also keeping the controlled multilingual suite and the paraphrase holdout positive. It preserves the exact same fold shape of `3` patches per entry at chapter, synthetic book-root, and mega-book scale.

This remains directional only because the blind holdout and stress suite still fail, and because the same round regresses sharply on the governance adversarial holdout and the older chapter-style `booklike` corpus.

Evidence:

- [v8 control bridge round](docs\ledger\2026-05-07-v8-control-bridge-round.md)
- [book-root v8 report](bench\2026-05-06-book-root-benchmark-v8-control-bridge-hierarchical-packer-v2.json)
- [suite summary v8](bench\eval-suite-learned-hybrid-v8-control-bridge-hierarchical-packer-v2\suite-summary.json)

### A direct merge round can hold governance and bridge semantics in one model, but not the fold

The `v9` merge hierarchical candidate restores the full governance adversarial holdout to all-positive while keeping the controlled multilingual suite and the paraphrase holdout positive. That is the first repo result showing that the governance boundary and the multilingual-control bridge can coexist in one trained model.

This remains directional only because the same round destroys the long-form fold shape, misses `control_book_root`, still leaves the archive `retention_governance_pressure` group slightly negative, and still fails the blind holdout and stress suite.

Evidence:

- [v9 merge bridge governance round](docs\ledger\2026-05-07-v9-merge-bridge-governance-round.md)
- [governance adversarial v9 report](bench\2026-05-07-governance-adversarial-v9-merge-bridge-governance-hierarchical-packer-v2.json)
- [archive pressure v9 report](bench\2026-05-07-archive-pressure-v9-merge-bridge-governance-hierarchical-packer-v2.json)
- [suite summary v9](bench\eval-suite-learned-hybrid-v9-merge-bridge-governance-hierarchical-packer-v2\suite-summary.json)

### A constrained merge can hold the fold, archive pressure, multilingual, and paraphrase together

The `v10` constrained merge reuses the `v9` merge weights but restores the explicit hierarchical packing constraint. It brings the fold back to `3` patches per entry at synthetic book-root, old booklike, synthetic mega-book, and archive-pressure scale. It also clears archive pressure and keeps the controlled multilingual suite plus paraphrase holdout positive.

This remains directional only because `control_book_root` and `audit_evidence_adversarial` remain slightly negative, the older chapter-style `booklike` corpus still fails, and the blind holdout plus stress suite still fail.

Evidence:

- [v10 constrained merge round](docs\ledger\2026-05-07-v10-constrained-merge-round.md)
- [book-root v10 report](bench\2026-05-07-book-root-benchmark-v10-constrained-merge-hierarchical-packer-v2.json)
- [archive pressure v10 report](bench\2026-05-07-archive-pressure-v10-constrained-merge-hierarchical-packer-v2.json)
- [suite summary v10](bench\eval-suite-learned-hybrid-v10-constrained-merge-hierarchical-packer-v2\suite-summary.json)

### A governance/archive fold specialist can clear both target corpora, but not book-root

The `v13` balanced-triad candidate keeps the fixed hierarchical fold and clears both the governance adversarial corpus and archive-pressure corpus in the same round. Governance adversarial clears with a `3.5` minimum margin, and archive pressure clears with an `8` minimum margin.

This remains directional only because the same model still fails synthetic book-root economics/control grouping, and because the blind holdout and stress suite are not cleared by this round.

Evidence:

- [v13/v14 balanced triad round](docs\ledger\2026-05-07-v13-v14-balanced-triad-round.md)
- [v13 governance report](bench\2026-05-07-governance-adversarial-v13-balanced-triad-hierarchical-packer-v2.json)
- [v13 archive report](bench\2026-05-07-archive-pressure-v13-balanced-triad-hierarchical-packer-v2.json)

### A hardening audit now favors a multi-head/routed-head architecture

The hardening audit compared the current specialist rounds and found a consistent pattern: one semantic head cannot currently hold book-root/control, governance, archive, multilingual, and paraphrase behavior at the same time. An oracle specialist-routing upper bound clears the known book-root/governance/archive triad by routing book-root to `v8` and governance/archive to `v13`.

This remains an architectural clue, not production proof. The router is not implemented, and broad generalization is not proven.

Evidence:

- [hardening audit](docs\ledger\2026-05-07-hardening-audit.md)
- [model role audit JSON](bench\2026-05-07-model-role-audit.json)
- [oracle specialist routing audit](bench\2026-05-07-oracle-specialist-routing-audit.json)

### A deterministic v15 multi-head benchmark clears the known target triad with supplied routes

The `v15` multi-head benchmark is the first implemented routed-head harness. It routes book-root to `v8`, governance to `v13`, archive to `v13`, and unknown routes to `v10`. With those supplied route labels, book-root clears with min margin `8`, governance clears with min margin `3.5`, and archive clears with min margin `8`, while the fold stays at `3`, `2.8333`, and `3` patches per entry respectively.

This remains directional only because routing is supplied by the benchmark command, not inferred automatically. The default-route booklike guardrail still fails, and blind/stress generalization remains unresolved.

Evidence:

- [v15 multi-head routed round](docs\ledger\2026-05-07-v15-multihead-routed-round.md)
- [book-root v15 routed report](bench\2026-05-07-book-root-benchmark-v15-multihead-routed.json)
- [governance v15 routed report](bench\2026-05-07-governance-adversarial-v15-multihead-routed.json)
- [archive v15 routed report](bench\2026-05-07-archive-pressure-v15-multihead-routed.json)

### A lexical v16 auto-router clears the known target triad without supplied route labels

The `v16` auto-router scores each corpus for book-root, governance, and archive route evidence, then selects the matching specialist head. It automatically selects `v8` for book-root and `v13` for governance/archive. The known target triad clears with the same margins as the v15 supplied-route test: book-root `8`, governance `3.5`, and archive `8`.

This remains directional only because the router is lexical and brittle. It routes the old `booklike` corpus to `v8`, where that guardrail fails at `-23.5`.

Evidence:

- [v16 auto-routed round](docs\ledger\2026-05-07-v16-auto-routed-round.md)
- [book-root v16 auto-routed report](bench\2026-05-07-book-root-benchmark-v16-auto-routed.json)
- [governance v16 auto-routed report](bench\2026-05-07-governance-adversarial-v16-auto-routed.json)
- [archive v16 auto-routed report](bench\2026-05-07-archive-pressure-v16-auto-routed.json)

### A v17 confidence guard fixes the known booklike over-route

The `v17` auto-router keeps the v16 lexical route score, then applies a corpus-shape confidence guard before accepting the `bookRoot` specialist. Folded book-root entries pass the guard and still route to `v8`; split chapter-style `booklike` entries are rejected and fall back to the `v10` default head. The known target triad remains positive with book-root `8`, governance `3.5`, and archive `8`.

This remains directional only because the guard is shape-based, not learned validation. It fixes the known routing mistake, but the old `booklike` corpus still fails semantic separation at `-18.5` under the default head.

Evidence:

- [v17 confidence-routed round](docs\ledger\2026-05-07-v17-confidence-routed-round.md)
- [book-root v17 confidence-routed report](bench\2026-05-07-book-root-benchmark-v17-confidence-routed.json)
- [governance v17 confidence-routed report](bench\2026-05-07-governance-adversarial-v17-confidence-routed.json)
- [archive v17 confidence-routed report](bench\2026-05-07-archive-pressure-v17-confidence-routed.json)
- [booklike v17 confidence-routed guardrail](bench\2026-05-07-booklike-benchmark-v17-confidence-routed.json)

### The v17 router preserves the synthetic mega-book fold

The v17 router also accepts the one-entry synthetic mega-book corpus as a folded `bookRoot` candidate. That report has `1831` words, `2123` `cl100k_base` tokens, and `3` experimental patches. Selected-head binary/source ratio is `0.0081`; recording all three heads would be `0.0242`.

This is storage-shape evidence only. The one-entry mega-book corpus cannot prove semantic grouping or retrieval quality because there are no grouped pairs to separate.

Evidence:

- [mega-book v17 confidence-routed fold report](bench\2026-05-07-mega-book-benchmark-v17-confidence-routed.json)

### The v18 semantic ladder proves a stronger fold-retention shape under the right head

The v18 mega-book semantic ladder creates three synthetic books, each with one folded book-root and three chapter entries. It measures whether each folded root stays closer to its own chapters than to outside chapters. The auto-routed `v8` run has all ladder margins positive but fails the generic collapse guard narrowly. The `v10` comparison clears both checks: generic min semantic margin `31`, ladder min margin `34`, average nearest signature distance `21`, and average patch count `2.9167`.

This is the strongest current synthetic evidence for the "book folds inward but still points back to its chapters" shape. It remains directional because the ladder is generated and the current router does not yet choose the safer head automatically.

Evidence:

- [v18 mega-book semantic ladder](docs\ledger\2026-05-07-v18-mega-book-semantic-ladder.md)
- [v18 auto-routed report](bench\2026-05-07-mega-book-ladder-v18-confidence-routed.json)
- [v18 v10 head comparison](bench\2026-05-07-mega-book-ladder-v18-v10-head-comparison.json)

### The v19 validated router fixes the v18 head-selection failure

The v19 validated router runs the routed candidate head and the default fallback head, then rejects any head that trips semantic or collapse guardrails. It keeps the target triad intact: `v8` for book-root, `v13` for governance, and `v13` for archive. On the v18 mega-book ladder, it rejects `v8` and selects `v10`, which passes without collapse.

This is still directional because the active selection policy keeps the safer routed-candidate plus default-fallback rule. The runner now records full-head ranking metadata for all configured release heads, but that ranking is an audit surface rather than the production selector.

Evidence:

- [v19 validated routing round](docs\ledger\2026-05-07-v19-validated-routing-round.md)
- [v19 lock proof package](docs\proofs\v19-lock-proof-package.md)
- [v19 checkpoint manifest](data\release\v19-lock-checkpoints.json)
- [book-root v19 validated route](bench\2026-05-07-book-root-benchmark-v19-validated-routed.json)
- [governance v19 validated route](bench\2026-05-07-governance-adversarial-v19-validated-routed.json)
- [archive v19 validated route](bench\2026-05-07-archive-pressure-v19-validated-routed.json)
- [mega-book ladder v19 validated route](bench\2026-05-07-mega-book-ladder-v19-validated-routed.json)

### The v19 proof package is the first locked release evidence bundle

The proof-package command reruns the v19 primary cases, records full-head ranking, writes a dated lock folder, and keeps blind/stress gates visible as production-generalization gates. This creates a stable shipping artifact without promoting the claims beyond the evidence.

This remains a proof package rather than a production system. A production lock still requires blind/stress semantic generalization to pass.

Evidence:

- [v19 lock proof package](docs\proofs\v19-lock-proof-package.md)
- [proof package script](scripts\build-proof-package.mjs)
- [proof gates](core\proof-gates.mjs)

### A larger book-like corpus strengthens the storage-side signal

The larger chapter-style corpus keeps the same structural pattern: the hierarchical line holds average patch count to `3` per entry while the macro baseline needs `13.25`. Across the currently tested quote, quote-paragraph, protocol-longform, and booklike corpora, the hierarchical line improves aggregate raw-source reduction to `83.1534%`.

This is still directional rather than proven because grouped semantic separation on the book-like corpus remains negative in multiple themes, and the large raw-source collapse claims remain unsupported.

Evidence:

- [booklike storage pressure test](docs\ledger\2026-04-25-booklike-storage-pressure.md)
- [hierarchical packer v2 residual selection](docs\ledger\2026-04-25-hierarchical-packer-v2-residual-selection.md)

### A new multilingual long-form holdout passes under the current hierarchical baseline

The new April 29 multilingual long-form holdout keeps the current `hierarchical-packer-v2` baseline at `3` patches per entry and shows positive grouped separation across launch, storage, and search themes with a `23.5` minimum margin.

This is directional rather than proven because the older frozen multilingual suite still has one failing group, and the broader blind and stress gates remain unresolved.

Evidence:

- [multilingual longform holdout](docs\ledger\2026-04-29-multilingual-longform-holdout.md)

### The expanded long-form evidence set strengthens the storage envelope again

Adding the April 29 multilingual long-form and archive-pressure corpora lifts the current tested aggregate raw-source reduction to `84.6369%` and extends the current directional `1.25 GB` input envelope to `8.1364 GB`.

This remains directional rather than proven because the new archive-pressure corpus still fails one grouped semantic theme, and the large raw-source collapse claims remain unsupported.

Evidence:

- [archive pressure longform test](docs\ledger\2026-04-29-archive-pressure.md)

### A governance-focused training round can clear the targeted governance adversarial holdout

The new `v4` governance-focused hierarchical candidate clears the April 29 governance-only adversarial holdout with all labeled margins positive, including legal hold, retention policy, audit evidence, deletion exception, access review, and compliance attestation. It keeps the same compact storage shape as the current hierarchical baseline on that corpus.

This remains directional only because the same round regresses the broader frozen suite and therefore does not become the new overall baseline.

Evidence:

- [governance-focused v4 round](docs\ledger\2026-04-29-governance-trained-v4-round.md)

### A mixed-objective round can preserve more of the broad suite while keeping most governance gains

The new `v5` mixed-objective hierarchical candidate is a more balanced specialization attempt than `v4`. It restores the paraphrase holdout to an all-positive state, improves the blind holdout and controlled multilingual minima relative to `v4`, and keeps five of the six governance adversarial groups non-negative with only `legal_hold` still negative.

This remains directional only because the controlled multilingual suite still fails, the blind holdout still fails, the stress suite still fails, and the archive-pressure corpus regresses to three negative groups.

Evidence:

- [mixed-objective v5 round](docs\ledger\2026-05-05-mixed-objective-v5-round.md)

### A targeted v6 round can fully clear governance adversarial and archive-pressure together

The `v6` legal-hold and archive-focused hierarchical candidate is the first one in the repo to turn both the governance adversarial holdout and the archive-pressure corpus fully positive in the same round while keeping the same compact storage shape on those corpora.

This remains directional only because the same round regresses controlled multilingual, loses the paraphrase holdout, and still fails the blind holdout and stress suite.

Evidence:

- [v6 legal-hold and archive round](docs\ledger\2026-05-05-v6-legalhold-archive-round.md)

## Not in this dossier

The following claims are intentionally excluded because they are not yet proven:

- target BSQ implementation claims
- broad semantic superiority claims
- â€œbeats regular tokenizersâ€ as a general statement
- strategic market dominance, pricing, or 20-year financial claims

Those remain documented in math notes, the status page, and the failure log until evidence changes.
