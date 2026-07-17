# 16xVS Current State

This page is the shortest truthful read of the project.

## Proven

- `POC harness`: isolated ingest, store, search, and repair path works in the standalone Cloudflare Worker.
- `Storage model`: `live`, `fallback`, and `vault` durability policy is implemented in the POC.
- `Benchmark harness`: JSON report generation works and compares `tiktoken`, the fixture path, and the experimental core candidate.
- `Baseline comparison`: `tiktoken` is wired as a repeatable baseline for current corpus tests.
- `BSQ-style prototype`: the experimental candidate now generates retrieval codes through a continuous embedding, unit normalization, and sign quantization path.
- `Evidence guardrails`: benchmark reports now include `evidenceAssessment` with count signal, semantic signal, and signature-collapse checks.
- `Phase-1 scaffold`: training-pair generation and a frozen evaluation-suite runner now exist for the learned-encoder spike.
- `Hybrid learned prototype`: a second learned encoder path now exists that blends the learned embedding with the heuristic experimental prior and runs through the same frozen suite.
- `Expanded hybrid learned prototype`: a third learned path now exists with broader training coverage, cross-group negatives, and prototype regularization.
- `Storage-focused macro variant`: a derived macro-packer variant now exists that collapses tested quote and paragraph entries to one patch each.
- `Vault snapshot flow`: the repo can now create a file-hashed snapshot of code, models, benchmarks, and docs for long-term preservation.
- `V19 proof package flow`: the repo can now build a dated lock package that reruns v19 evidence, writes full-head ranking metadata, records blind/stress gates, and preserves a sandbox boundary for upward experiments.
- `V23 four-head proof package flow`: the repo can now rerun the v22 four-head ranked specialist proof in one command with primary, blind/stress, and extra controlled-surface gates.
- `Founder proof package`: the repo now has a concise V23-centered review package that separates allowed claims, failures, reproduction commands, and the current route-gated repair thesis.

Primary evidence:

- [sample baseline refresh](docs\ledger\2026-04-20-sample-baseline-refresh.md)
- [Google 1000 refresh](docs\ledger\2026-04-20-google-1000-refresh.md)
- [phrase BSQ-style run](docs\ledger\2026-04-20-phrase-semantic-bsq-style.md)
- [training pairs artifact](data\training\embedding-training-pairs.json)
- [frozen eval suite summary](bench\eval-suite-latest\suite-summary.json)
- [vault snapshot ledger](docs\ledger\2026-04-25-vault-snapshot-hierarchical-final.md)
- [latest vault snapshot ledger](docs\ledger\2026-04-25-vault-snapshot-hierarchical-v2-final.md)
- [proof dossier](docs\proofs\current-proof-dossier.md)
- [v19 lock proof package](docs\proofs\v19-lock-proof-package.md)
- [v23 four-head proof package](docs\ledger\2026-05-16-v23-four-head-proof-package.md)
- [founder proof package](docs\proofs\founder-proof-package-2026-05-26\README.md)
- [fresh V23 founder proof lock](bench\proof-locks\2026-05-26-181831302z-v23-founder-proof-2026-05-26\README.md)

## Directional

- `Experimental core candidate` can beat `tiktoken` on patch count in some English and multilingual corpora.
- Multilingual count signal currently favors the candidate over `tiktoken` on the controlled multilingual phrase set.
- The benchmark surface is now broad enough to test count, perturbation, and semantic-group behavior.
- The latest controlled phrase run has positive labeled semantic margins across `launch`, `storage`, `search`, `planning`, and `finance`.
- The latest controlled multilingual run has positive labeled semantic margins across `launch_multilingual`, `storage_multilingual`, and `search_multilingual`.
- The latest hybrid learned prototype restored the controlled phrase suite after the first learned prototype regressed it.
- The latest expanded hybrid learned prototype passed the phrase-unseen paraphrase holdout with all labeled group margins positive.
- The latest expanded hybrid learned prototype improved the blind holdout minimum margin from `-18.9167` to `-13.3333` without tripping collapse checks.
- The storage-focused macro-packer variant collapses the tested quote corpus and tested quote-paragraph corpus to `1` patch per entry.
- The storage-focused macro-packer variant improves raw-source storage on those tested corpora to `42.3539%` reduction while keeping controlled phrase and paraphrase holdouts positive.
- The storage-focused hierarchical-packer variant keeps the tested quote and quote-paragraph corpora at `1` patch per entry while reducing the new protocol-longform corpus from `9.5` patches per entry under the macro baseline to `3`.
- The storage-focused hierarchical-packer variant improves the current tested aggregate raw-source reduction across quotes, quote-paragraphs, and protocol-longform passages to `70.7911%`.
- The larger book-like storage pressure test pushes the hierarchical variant to `83.1534%` current tested aggregate raw-source reduction across quotes, quote-paragraphs, protocol-longform passages, and chapter-style entries.
- On the larger book-like corpus, the hierarchical variant reduces average patch count from `13.25` under the macro baseline to `3` while keeping collapse checks clean.
- The latest residual-selection `hierarchical-packer-v2` variant keeps that `83.1534%` tested aggregate raw-source reduction and reduces negative grouped-separation themes on the book-like corpus from `4` to `3`.
- A new multilingual long-form holdout passes cleanly under the current `hierarchical-packer-v2` baseline with a `23.5` minimum separation margin and no collapse signal.
- Adding the April 29 multilingual long-form and archive-pressure corpora lifts the current tested aggregate raw-source reduction to `84.6369%` and extends the current directional `1.25 GB` envelope to `8.1364 GB` of input.
- A governance-focused `v4` training round can clear the governance-only adversarial holdout with all labeled margins positive while keeping the same compact storage shape of `2.8333` patches per entry and `0.0297` patches per token.
- A mixed-objective `v5` round can recover the paraphrase holdout, improve the blind holdout and controlled multilingual margins relative to the governance-overfit `v4` round, and reduce the governance adversarial failure set to a single `legal_hold` group while keeping storage shape flat.
- A targeted `v6` round can fully clear both the governance adversarial holdout and the archive-pressure corpus while keeping the same compact storage shape of `2.8333` governance patches per entry and `3` archive-pressure patches per entry.
- A synthetic book-folding round now shows explicit inward count collapse on the current hierarchical storage baseline: the patch budget stays flat at `3` per entry while moving from `12` chapter-style entries to `6` synthetic book roots and then to `1` synthetic mega-book entry, with patches-per-token improving from `0.017` to `0.0085` to `0.0014`.
- A direct `v7` descendant of the original `v3` training line preserves that exact fold shape and improves the synthetic book-root minimum separation margin from `-3` to `-0.5`, with `economics_book_root` and `systems_book_root` positive and only `control_book_root` still slightly negative.
- A narrower `v8` control-bridge round is the first one to clear the full synthetic `book-root` grouping while also keeping the controlled multilingual suite and the paraphrase holdout positive. It preserves the same fold shape and turns the old `control_book_root` miss into a positive `17` margin.
- A direct `v9` merge round can restore the full governance adversarial holdout while also keeping the controlled multilingual suite and the paraphrase holdout positive, showing that the governance boundary and the multilingual-control bridge can coexist in one model.
- A constrained `v10` derivation reuses the `v9` merge weights with the explicit hierarchical fold constraint and restores the storage shape: `3` patches per entry at synthetic book-root, old booklike, synthetic mega-book, and archive-pressure scale. It also clears archive pressure while keeping controlled multilingual and paraphrase positive.
- The `v13` balanced-triad round shows that governance adversarial and archive pressure can both clear under the same fixed hierarchical fold shape, with governance minimum margin `3.5` and archive minimum margin `8`.
- A hardening audit now identifies the main current failure as a semantic-head conflict rather than a fold-shape failure. An oracle specialist-routing upper bound clears the known book-root/governance/archive target triad by routing book-root to `v8` and governance/archive to `v13`, while preserving the compact patch shape. This is not a production router, but it is the strongest next architectural clue.
- A first `v15` deterministic multi-head routing benchmark implements that clue as a test harness. With benchmark-supplied routes, it clears book-root, governance adversarial, and archive pressure together while preserving the fold shape and recording three-head signature overhead.
- A first `v16` lexical auto-router selects those same successful heads automatically on the known target triad. It clears book-root, governance adversarial, and archive pressure without supplied route labels.
- A `v17` confidence-routed auto-router keeps that known target triad passing while rejecting the known v16 over-route from split chapter-style `booklike` content into the `bookRoot` specialist. The rejected guardrail falls back to the `v10` default head.
- The same `v17` route preserves the synthetic mega-book fold: one `1831`-word entry with `2123` `cl100k_base` tokens remains at `3` patches, with selected-head binary/source ratio `0.0081` and three-head ratio `0.0242`.
- A `v18` mega-book semantic ladder shows that folded book-root records can remain closer to their own chapters than to outside chapters in a controlled multi-book ladder. The auto-selected `v8` head fails the generic collapse guard by a narrow margin, but the `v10` head clears the ladder with generic min margin `31`, ladder min margin `34`, average nearest signature distance `21`, and the same `2.9167` average patches per entry.
- A `v19` validated router keeps the book-root/governance/archive target triad intact while fixing the v18 head-selection mistake. It accepts `v8` for book-root, accepts `v13` for governance/archive, and falls back from `v8` to `v10` on the mega-book ladder where `v10` is safer.
- The v19 lock flow now records full-head ranking for every configured release head (`v8`, `v10`, and `v13`) while keeping the safer v19 candidate-plus-default selection rule.
- A v20 ranked-selector fortify pass preserves the v19 primary outcomes and improves the paraphrase holdout selected margin from `7.4` to `17.2` by selecting the best passing full-ranked head.
- A small controlled code-domain holdout passes under the v20 ranked selector with min margin `30.5`, no collapse, and `1` average patch per entry.
- A named checkpoint sweep confirms the unresolved booklike failure is least bad under `v3` (`-11.5`) and worse under the current v19/v20 default `v10` (`-18.5`).
- A v21 targeted booklike repair probe improves the old booklike minimum margin to `-2.5` while keeping the `3`-patch fold, but it regresses book-root, governance, and archive guardrails.
- A v22 governance-evidence booklike repair clears the old `booklike` corpus as a single head with min margin `7.5` and the same `3`-patch fold, but it still fails book-root and governance-adversarial as a universal baseline.
- A v22 four-head ranked probe adds that model as `booklikeRepair`; the selector preserves book-root (`v8`, margin `8`), governance (`v13`, margin `3.5`), archive (`v13`, margin `8`), mega-book ladder (`v10`, margin `31`), and selects v22 only for old `booklike` (margin `7.5`).
- A May 11 v22 four-head extra sweep keeps code-domain (`30.5`), paraphrase (`17.2`), multilingual-longform (`38.5`), phrase-semantic (`17`), multilingual-phrases (`2.8095`), and protocol-longform (`18.5`) positive under ranked selection.
- A May 16 v23 proof package reproduces the four-head specialist proof in one command. Primary gates pass together: book-root `8`, governance `3.5`, archive `8`, old booklike `7.5`, and mega-book ladder `31`.
- A May 16 v24 quote-repair probe improves the two quote-style target margins but does not clear them: quote improves from `-18.2` to `-12.8`, quote-paragraph improves from `-20.25` to `-10.3333`, and the best blend sweep remains negative at `-12` / `-9.5833`. The five-head ranked probe preserves the v23 primary lanes while rejecting quoteRepair because no quote head passes.
- A May 20 v25 hard-negative repair probe adds deterministic mining of nearest-outside failure pairs and a sixth ranked head. It preserves the v23 primary lanes, but it does not improve quote, quote-paragraph, or blind-holdout; only stress-100 improves from `-28.6444` to `-24.0667`, and it remains negative. Because v25 mines prior failed reports, those target surfaces are repair evidence, not independent blind proof.
- A May 25 v26 split hard-negative probe shows that separated repair pressure can improve the direct quote target from `-12.8` to `-10.8`, but it does not clear the target and it worsens quote-paragraph, blind, and stress as intended single heads. It also exposes route leakage: `stressSplitV26` is selected on governance-adversarial, so strict v23 primary lane preservation fails under unrestricted eight-head ranking.
- A June 12 v27 route-gated probe blocks that V26 leakage by applying lane ownership before ranked selection. It preserves the v23 primary lanes exactly, reproduces the unrestricted governance leak, blocks `stressSplitV26` from stealing governance, quarantines quote/blind/stress repair heads to owned target lanes, and adds a fold-lineage audit where patch -> chapter -> book -> mega parent margins remain positive.
- A June 17 v28 runtime-governance hardening probe adds the local control shell around V27: runtime lane contracts, deterministic Bloom-style lane classification, patch-local cold-path fallback, and STE temperature-decay simulation. The runtime proof records fallback only for the low-confidence patch, and the STE simulation reduces controlled drift from `2` to `0`.
- A June 18 v29 report gap audit maps the full `16xVS 6-13-2026.md` report into a proof-vs-claim matrix. It detects the report's architecture, BART, memory, scaling, fold, and cognitive-stack sections while keeping V28-covered items at `local-proof-only` and marking unimplemented runtime/model layers as deferred.
- The locked blind holdout still shows count compression and no signature collapse.
- Current semantic evidence is directional only because the embedding source is still heuristic and the corpus is small.

Primary evidence:

- [sample baseline refresh](docs\ledger\2026-04-20-sample-baseline-refresh.md)
- [Google 1000 refresh](docs\ledger\2026-04-20-google-1000-refresh.md)
- [phrase BSQ-style run](docs\ledger\2026-04-20-phrase-semantic-bsq-style.md)
- [multilingual BSQ-style run](docs\ledger\2026-04-20-multilingual-bsq-style.md)
- [blind holdout run](docs\ledger\2026-04-20-blind-holdout-bsq-style.md)
- [learned hybrid prototype v2 suite](docs\ledger\2026-04-24-learned-hybrid-prototype-v2-suite.md)
- [learned hybrid prototype v3 suite](docs\ledger\2026-04-24-learned-hybrid-prototype-v3-suite.md)
- [macro packer v1 suite](docs\ledger\2026-04-25-macro-packer-v1-suite.md)
- [hierarchical packer v1 suite](docs\ledger\2026-04-25-hierarchical-packer-v1-suite.md)
- [booklike storage pressure test](docs\ledger\2026-04-25-booklike-storage-pressure.md)
- [hierarchical packer v2 residual selection](docs\ledger\2026-04-25-hierarchical-packer-v2-residual-selection.md)
- [multilingual longform holdout](docs\ledger\2026-04-29-multilingual-longform-holdout.md)
- [archive pressure longform test](docs\ledger\2026-04-29-archive-pressure.md)
- [governance-focused v4 round](docs\ledger\2026-04-29-governance-trained-v4-round.md)
- [mixed-objective v5 round](docs\ledger\2026-05-05-mixed-objective-v5-round.md)
- [v6 legal-hold and archive round](docs\ledger\2026-05-05-v6-legalhold-archive-round.md)
- [v7 book-root round](docs\ledger\2026-05-06-v7-book-root-round.md)
- [v8 control bridge round](docs\ledger\2026-05-07-v8-control-bridge-round.md)
- [v9 merge bridge governance round](docs\ledger\2026-05-07-v9-merge-bridge-governance-round.md)
- [v10 constrained merge round](docs\ledger\2026-05-07-v10-constrained-merge-round.md)
- [v11/v12 targeted merge round](docs\ledger\2026-05-07-v11-v12-targeted-merge-round.md)
- [v13/v14 balanced triad round](docs\ledger\2026-05-07-v13-v14-balanced-triad-round.md)
- [hardening audit](docs\ledger\2026-05-07-hardening-audit.md)
- [v15 multi-head routed round](docs\ledger\2026-05-07-v15-multihead-routed-round.md)
- [v16 auto-routed round](docs\ledger\2026-05-07-v16-auto-routed-round.md)
- [v17 confidence-routed round](docs\ledger\2026-05-07-v17-confidence-routed-round.md)
- [v18 mega-book semantic ladder](docs\ledger\2026-05-07-v18-mega-book-semantic-ladder.md)
- [v19 validated routing round](docs\ledger\2026-05-07-v19-validated-routing-round.md)
- [v20 ranked selector fortify pass](docs\ledger\2026-05-08-v20-ranked-selector-fortify.md)
- [code-domain and booklike sweep](docs\ledger\2026-05-08-code-domain-and-booklike-sweep.md)
- [v21 booklike repair probe](docs\ledger\2026-05-08-v21-booklike-repair-probe.md)
- [v22 governance-evidence booklike repair](docs\ledger\2026-05-08-v22-governance-evidence-booklike.md)
- [v22 four-head extra sweep](docs\ledger\2026-05-11-v22-four-head-extra-sweep.md)
- [v23 four-head proof package](docs\ledger\2026-05-16-v23-four-head-proof-package.md)
- [v24 quote-repair probe](docs\ledger\2026-05-16-v24-quote-repair-probe.md)
- [v25 hard-negative repair probe](docs\ledger\2026-05-20-v25-hard-negative-repair-probe.md)
- [v26 split hard-negative repair probe](docs\ledger\2026-05-25-v26-split-hard-negative-repair-probe.md)
- [v27 route-gated fold-lineage probe](docs\ledger\2026-06-12-v27-route-gated-fold-lineage-probe.md)
- [v28 runtime-governance hardening](docs\ledger\2026-06-17-v28-runtime-governance-hardening.md)
- [v29 report gap audit](docs\ledger\2026-06-18-v29-report-gap-audit.md)

## Failed / Unproven

- The older heuristic candidate failed semantic separation and remains preserved as a negative historical result.
- The locked blind holdout failed semantic separation across all five unseen groups.
- The latest hybrid learned prototype still failed the controlled multilingual suite, blind holdout, paraphrase holdout, and stress suite.
- The latest expanded hybrid learned prototype still failed the blind unseen-domain holdout, the mixed-format stress suite, and one controlled multilingual group.
- The base semantic `v3` path does not support one-token quote or one-token passage claims; only the separate storage-focused macro-packer variant does on the tested corpora.
- Current raw-source storage projection does not support `99.99%` storage reduction or `1.25 GB` corpus-collapse claims.
- The storage-focused macro-packer variant still fails the blind unseen-domain holdout, the mixed-format stress suite, and one controlled multilingual group.
- The storage-focused hierarchical-packer variant still fails the blind unseen-domain holdout, the mixed-format stress suite, and one controlled multilingual group.
- The larger book-like corpus still fails grouped semantic separation under both the macro and hierarchical storage variants.
- The latest residual-selection `hierarchical-packer-v2` refinement slightly reduces semantic bleed on the book-like corpus, but three grouped themes still fail and the frozen-suite semantic gates are unchanged.
- The new archive-pressure long-form corpus still fails grouped separation because the retention-and-governance pressure group remains negative at `-12`.
- A new governance-only adversarial holdout fails more sharply and isolates the main semantic wall to governance-heavy concepts, especially legal hold, deletion exception, audit evidence, and retention policy.
- The governance-focused `v4` candidate fixes the targeted governance-only adversarial holdout, but it regresses the broader frozen suite: the controlled multilingual gate falls back to three negative groups, the paraphrase holdout loses its all-positive state, the blind holdout worsens, and the archive-pressure corpus still stays negative.
- The mixed-objective `v5` candidate is still not a new baseline: it leaves all three controlled multilingual groups negative, still fails the blind holdout and stress suite, still fails archive-pressure with three negative groups, and still misses `legal_hold` on the governance adversarial holdout.
- The targeted `v6` candidate clears governance adversarial and archive-pressure, but it still is not the new baseline because controlled multilingual becomes sharply worse, the paraphrase holdout regresses back to a failure, and the blind holdout and stress suite still fail.
- The synthetic book-root fold remains only a count-side result. Its grouped semantic separation is still slightly negative at `-3`, and the one-entry mega-book run cannot validate semantic retention or retrieval-space behavior.
- The newer `v5` and `v6` specialist models preserve the same synthetic book-root and mega-book fold shape, but both perform worse than the `v3-hierarchical-packer-v2` storage baseline on synthetic book-root semantic grouping.
- The direct `v7` book-root round nearly clears the synthetic book-root grouping, but it still is not the new baseline: `control_book_root` remains slightly negative at `-0.5`, the older `booklike` chapter-style minimum margin worsens to `-18.5`, and the frozen paraphrase, multilingual, and blind gates regress relative to `v3-hierarchical-packer-v2`.
- The `v8` control-bridge round is a real specialization success on the intended bridge problem, but it still is not the new overall baseline: the governance adversarial holdout regresses sharply, especially `legal_hold` at `-31`, the older chapter-style `booklike` corpus worsens to `-23.5`, and the blind holdout and stress suite still fail.
- The `v9` merge round answers the semantic merge question but fails the storage one. Governance adversarial becomes all-positive again and the controlled multilingual and paraphrase gates stay positive, but the fold collapses from the earlier `3`-patch book-root and mega-book shape to `26.5` patches per synthetic book root and `159` for the synthetic mega-book. It also still misses `control_book_root`, the archive `retention_governance_pressure` group, the older chapter-style `booklike` corpus, the blind holdout, and the stress suite.
- The `v10` constrained merge is still not the new overall baseline. It restores the fold and clears archive pressure, but it still misses `control_book_root` at `-2.5`, misses `audit_evidence_adversarial` at `-1`, leaves the older chapter-style `booklike` corpus negative, and still fails the blind holdout and stress suite.
- The `v11` targeted bridge-audit round is not a baseline. It repairs the named `control_book_root` and `audit_evidence_adversarial` targets, but it breaks adjacent economics, legal-hold, archive-retention, and multilingual boundaries.
- The `v12` blend sweep is not a baseline. Lower heuristic blend clears book-root and governance but leaves archive retention negative or zero; higher heuristic blend helps archive only after book-root starts failing.
- The `v13` balanced-triad round is not a baseline. It passes governance and archive under the fold, but book-root economics and control remain negative.
- The `v14` book-root-balance probe is a negative result. It worsens book-root and re-breaks governance while preserving archive pressure.
- The oracle specialist-routing audit is not production proof. It is an upper-bound result only; a real router or multi-head design still has to be implemented and tested.
- The `v15` deterministic multi-head route is still not production proof. It uses benchmark-supplied route labels, still fails the old `booklike` corpus on the default route, and still does not clear blind holdout or stress-suite generalization.
- The `v16` lexical auto-router is still not production proof. It clears the known target triad, but it routes old `booklike` content to the `v8` book-root head and fails that guardrail at `-23.5`.
- The `v17` confidence-routed auto-router is still not production proof. It fixes the known v16 booklike over-route, but the old `booklike` corpus still fails semantic separation at `-18.5` after falling back to `v10`.
- The `v18` mega-book semantic ladder shows the current route selector is still not production proof. The auto-selected `v8` head has positive ladder margins but trips the generic collapse guard; `v10` is safer on this ladder.
- The `v19` validated router is still not production proof. It now records full-head ranking, but its active selection policy still uses the safer routed-candidate plus default-fallback rule, and the old `booklike` semantic failure remains at `-18.5`.
- The full-head ranking metadata is an audit surface, not yet the production selection policy.
- The v20 ranked selector is not a new locked baseline because `booklike`, `blind-holdout`, and `stress-100` remain negative.
- The code-domain fixture is small and controlled; it does not prove broad code-tokenizer superiority.
- The v21 booklike repair probe is not a baseline because it trades booklike improvement for major guardrail regressions.
- The v22 single-head repair is not a baseline because book-root and governance-adversarial still fail.
- The v22 four-head ranked probe is not production proof because blind holdout and stress-100 remain negative, and the four-head architecture adds stored-head overhead.
- The v23 four-head proof package is still not production proof because blind holdout remains `-15.5`, stress-100 remains `-28.6444`, and quote-style semantic grouping remains negative.
- The v24 quote-repair probe is not a baseline because quote and quote-paragraph remain negative under every tested blend; blind holdout remains negative and stress-100 remains negative.
- The v25 hard-negative repair probe is not a baseline. Quote worsens from the v24 quoteRepair margin `-12.8` to `-19`, quote-paragraph worsens from `-10.3333` to `-14.8333`, blind-holdout worsens as a single head from the v23 selected margin `-15.5` to `-17.4167`, and stress-100 improves to `-24.0667` but remains negative. Because v25 mines failed report confusion pairs, it is repair evidence, not independent blind proof.
- The v26 split hard-negative repair probe is not a baseline. Quote improves to `-10.8` but remains negative, quote-paragraph worsens to `-15`, blindSplit worsens to `-17.5`, stressSplit worsens to `-26.8111`, and strict v23 lane preservation fails because governance-adversarial selects `stressSplitV26` instead of `governance`.
- The v27 route-gated probe is not a semantic repair baseline. It prevents lane stealing and validates fold-lineage shape, but quote, blind-holdout, and stress-100 remain unsolved semantic targets.
- The v28 runtime-governance probe is not a production runtime. It adds local proof scaffolding for hard lane contracts, cold-path fallback, and STE stabilization, but it does not implement BART, Wasm SIMD, Durable Object sharding, QJL, Cloudmersive, or a Worker deployment.
- The v29 report gap audit is not implementation proof. It snapshots and classifies report claims, but it does not implement BART, TokenTax0, Wasm SIMD, Durable Object sharding, Matryoshka compaction, H-MHSA, QJL, reversibility, lossless unfolding, or production runtime behavior.
- The v30 commercial baseline proof is a controlled fixture result only. It can show `1` equivalent 16xVS token per `200-240` BPE entry with `100/100` source-group retrieval, but it does not prove broad tokenizer superiority, lossless unfolding, quote/blind/stress repair, or parity against third-party compressors without direct independent testing.
- The May 11 extra sweep confirms quote and quote-paragraph semantic grouping remain negative despite `1` patch per entry.
- Current controlled semantic results do not justify broad semantic superiority claims.
- Current candidate is not evidence of full Binary Spherical Quantization performance, even though it now follows a BSQ-style prototype path.
- Current text benchmark path does not prove broad superiority over regular tokenizers in real-world use.
- Strategic protocol claims, pricing claims, and long-range market claims are not implementation proof.

Primary evidence:

- [phrase semantic failure](docs\ledger\2026-04-10-phrase-semantic.md)
- [blind holdout failure](docs\ledger\2026-04-20-blind-holdout-bsq-style.md)
- [learned hybrid prototype v2 suite](docs\ledger\2026-04-24-learned-hybrid-prototype-v2-suite.md)
- [learned hybrid prototype v3 suite](docs\ledger\2026-04-24-learned-hybrid-prototype-v3-suite.md)
- [quote benchmark v3](docs\ledger\2026-04-25-quote-benchmark-v3.md)
- [quote paragraph benchmark v3](docs\ledger\2026-04-25-quote-paragraph-benchmark-v3.md)
- [storage projection v3](docs\ledger\2026-04-25-storage-projection-v3.md)
- [macro packer v1 suite](docs\ledger\2026-04-25-macro-packer-v1-suite.md)
- [hierarchical packer v1 suite](docs\ledger\2026-04-25-hierarchical-packer-v1-suite.md)
- [booklike storage pressure test](docs\ledger\2026-04-25-booklike-storage-pressure.md)
- [hierarchical packer v2 residual selection](docs\ledger\2026-04-25-hierarchical-packer-v2-residual-selection.md)
- [archive pressure longform test](docs\ledger\2026-04-29-archive-pressure.md)
- [governance adversarial holdout](docs\ledger\2026-04-29-governance-adversarial-holdout.md)
- [governance-focused v4 round](docs\ledger\2026-04-29-governance-trained-v4-round.md)
- [mixed-objective v5 round](docs\ledger\2026-05-05-mixed-objective-v5-round.md)
- [v6 legal-hold and archive round](docs\ledger\2026-05-05-v6-legalhold-archive-round.md)
- [v7 book-root round](docs\ledger\2026-05-06-v7-book-root-round.md)
- [v8 control bridge round](docs\ledger\2026-05-07-v8-control-bridge-round.md)
- [v9 merge bridge governance round](docs\ledger\2026-05-07-v9-merge-bridge-governance-round.md)
- [v10 constrained merge round](docs\ledger\2026-05-07-v10-constrained-merge-round.md)
- [v11/v12 targeted merge round](docs\ledger\2026-05-07-v11-v12-targeted-merge-round.md)
- [v13/v14 balanced triad round](docs\ledger\2026-05-07-v13-v14-balanced-triad-round.md)
- [hardening audit](docs\ledger\2026-05-07-hardening-audit.md)
- [v15 multi-head routed round](docs\ledger\2026-05-07-v15-multihead-routed-round.md)
- [v16 auto-routed round](docs\ledger\2026-05-07-v16-auto-routed-round.md)
- [v17 confidence-routed round](docs\ledger\2026-05-07-v17-confidence-routed-round.md)
- [v18 mega-book semantic ladder](docs\ledger\2026-05-07-v18-mega-book-semantic-ladder.md)
- [v19 validated routing round](docs\ledger\2026-05-07-v19-validated-routing-round.md)
- [v30 commercial token-reduction baseline](docs\ledger\2026-07-17-v30-commercial-token-reduction-baseline.md)
- [perturbation limits](docs\ledger\2026-04-10-perturbation.md)
- [failure log](docs\failures\current-failures.md)

## Boundary

- `POC harness` claims apply only to the current Worker and storage loop.
- `Experimental core candidate` claims apply only to the heuristic packer and signature benchmark.
- `Target 16xVS math` is documented in [math notes](docs\math\bsq-and-protocol-foundation.md) and [hierarchical architecture notes](docs\math\hierarchical-folding-architecture.md), and is not yet implemented as the production tokenizer.
