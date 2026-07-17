# 16xVS Failure and Unproven Log

This file preserves the most important negative findings so they do not disappear behind optimistic summaries.

## Failed / Unproven

### Historical heuristic candidate did not show semantic separation

Earlier phrase semantic benchmarks showed negative separation margins across most tested groups. That failure stays in the record because it proves the naive heuristic path was not enough.

Evidence:

- [phrase semantic ledger](docs\ledger\2026-04-10-phrase-semantic.md)

Current status:

- The `2026-04-20` BSQ-style prototype run now shows positive controlled semantic separation, but it is still directional rather than proven.
- The locked blind holdout failed semantic separation across all five unseen domains.
- [phrase BSQ-style run](docs\ledger\2026-04-20-phrase-semantic-bsq-style.md)
- [multilingual BSQ-style run](docs\ledger\2026-04-20-multilingual-bsq-style.md)
- [blind holdout failure](docs\ledger\2026-04-20-blind-holdout-bsq-style.md)

### Blind holdout failed semantic generalization

The locked blind holdout used unseen cooking, weather, music, gardening, and astronomy groups. Count compression held and collapse checks stayed clean, but every semantic group had a negative separation margin.

Evidence:

- [blind holdout failure](docs\ledger\2026-04-20-blind-holdout-bsq-style.md)

### 100-phrase stress run failed grouped category separation

The larger mixed-format stress corpus still preserved count compression and no-collapse behavior, but every grouped stress category stayed negative against the others.

Evidence:

- [stress 100 failure](docs\ledger\2026-04-23-stress-100-bsq-style.md)

### Same-meaning paraphrase holdout also failed

The cleaner paraphrase holdout removed the broad-category ambiguity and still failed across all six grouped intents, including in-domain launch, storage, retrieval, planning, and cost phrases.

Evidence:

- [paraphrase holdout failure](docs\ledger\2026-04-23-paraphrase-holdout-bsq-style.md)

### First learned encoder prototype did not clear the gates

The first learned additive feature encoder trained successfully and stayed stable under collapse checks, but it still failed the blind holdout and paraphrase holdout and also regressed the controlled phrase and controlled multilingual suites.

Evidence:

- [learned feature prototype suite](docs\ledger\2026-04-23-learned-feature-prototype-suite.md)

### Hybrid second prototype still missed the real gates

The second learned prototype blended the learned embedding with the heuristic prior. That recovered the controlled phrase suite and reduced the multilingual regression from the first learned model, but it still failed the controlled multilingual suite, blind holdout, paraphrase holdout, and stress suite.

Evidence:

- [learned hybrid prototype v2 suite](docs\ledger\2026-04-24-learned-hybrid-prototype-v2-suite.md)

### Expanded hybrid prototype still fails unseen-domain generalization

The third learned prototype widened the training coverage, restored the paraphrase holdout, and improved the blind holdout minimum margin. It still failed the blind unseen-domain gate, one controlled multilingual group, and the mixed-format stress suite.

Evidence:

- [learned hybrid prototype v3 suite](docs\ledger\2026-04-24-learned-hybrid-prototype-v3-suite.md)

### Base semantic path does not support one-token quote or passage claims

The base semantic `v3` path can compress very short quote lines, but normal quote-style lines still average more than two patches and paragraph-style lines average six and a half patches. That base representation does not support a one-token quote or one-token passage claim.

Evidence:

- [quote benchmark v3](docs\ledger\2026-04-25-quote-benchmark-v3.md)
- [quote paragraph benchmark v3](docs\ledger\2026-04-25-quote-paragraph-benchmark-v3.md)

### Macro packer variant does not solve the semantic wall

The storage-focused macro-packer variant collapses the tested quote and paragraph corpora to one patch per entry and improves raw-source storage on those corpora, but it still fails the blind unseen-domain holdout, the stress suite, and one multilingual group.

Evidence:

- [macro packer v1 suite](docs\ledger\2026-04-25-macro-packer-v1-suite.md)

### Training directly in macro mode still does not clear the blind holdout

The macro-trained model preserves the one-patch storage behavior and slightly improves multilingual and paraphrase margins, but it still fails the blind unseen-domain holdout and does not beat the derived macro variant on that gate.

Evidence:

- [macro trained v1 suite](docs\ledger\2026-04-25-macro-trained-v1-suite.md)

### Hierarchical storage gains still do not clear the semantic wall

The hierarchical packer reduces long-form storage sharply on the new protocol-longform corpus and improves the current aggregate storage projection, but it does not change the frozen semantic gate picture in the meaningful places. The blind unseen-domain holdout, the stress suite, and one controlled multilingual group still fail. The `hierarchical-packer-v2` residual-selection refinement keeps the storage profile flat and slightly improves the larger book-like grouped detail, but it still does not clear the real gates.

Evidence:

- [hierarchical packer v1 suite](docs\ledger\2026-04-25-hierarchical-packer-v1-suite.md)
- [hierarchical packer v2 residual selection](docs\ledger\2026-04-25-hierarchical-packer-v2-residual-selection.md)

### The larger book-like corpus still breaks grouped separation

The chapter-style pressure test makes the storage signal stronger, but it also confirms that longer structured passages still blur together semantically under the current representation. The hierarchical line improves storage sharply and keeps collapse checks clean, yet the book-like corpus still posts negative grouped separation margins in multilingual equity, storage economics, and pricing operations. The `v2` residual-selection pass removes one negative theme compared with `v1`, but the minimum margin is still `-11.5`, so this remains a failure on grouped long-form separation.

Evidence:

- [booklike storage pressure test](docs\ledger\2026-04-25-booklike-storage-pressure.md)
- [hierarchical packer v2 residual selection](docs\ledger\2026-04-25-hierarchical-packer-v2-residual-selection.md)

### Archive-pressure longform still fails the retention-and-governance theme

The new archive-pressure corpus keeps the current storage-focused baseline at `3` patches per entry and clean collapse checks, but the `retention_governance_pressure` group still fails at `-12`. That means policy-heavy archive language remains a specific weak point even when archive catalog, replication, repair, and retrieval operations passages are non-negative.

Evidence:

- [archive pressure longform test](docs\ledger\2026-04-29-archive-pressure.md)

### Governance-only adversarial holdout confirms the semantic wall

The new governance-only adversarial holdout is the clearest negative signal yet for the current semantic gap. Under intentionally overlapping governance wording, the current `hierarchical-packer-v2` baseline still stays compact and avoids collapse, but it fails on legal hold (`-18`), deletion exception (`-6`), audit evidence (`-5.5`), and even retention policy (`-1`). The macro baseline does not solve this and is much worse on patch count. That means the current weakness is not just â€œlong textâ€ in general; it is precise separation of adjacent governance concepts.

Evidence:

- [governance adversarial holdout](docs\ledger\2026-04-29-governance-adversarial-holdout.md)

### Governance-focused specialization is not the new overall baseline

The `v4` governance-focused training round is useful because it turns the governance-only adversarial holdout positive without changing the compact hierarchical storage shape. But it does not improve the real overall gate picture. The frozen controlled multilingual suite regresses to three negative groups, the paraphrase holdout loses its all-positive state, the blind holdout gets worse, and the archive-pressure corpus still stays negative in two groups. That makes the round a successful specialization test and an unsuccessful general baseline replacement.

Evidence:

- [governance-focused v4 round](docs\ledger\2026-04-29-governance-trained-v4-round.md)

### Mixed-objective rebalancing still does not clear the real gates

The `v5` mixed-objective round is a better compromise than `v4`: it restores the paraphrase holdout, improves the blind holdout and multilingual margins relative to the governance-overfit round, and reduces the governance adversarial miss set to a single `legal_hold` group. It still does not become the new baseline. All three controlled multilingual groups remain negative, the blind holdout still fails across all five unseen groups, the stress suite gets worse, and the archive-pressure corpus spreads into three negative groups. That means the model can be rebalanced, but the main semantic wall still stands.

Evidence:

- [mixed-objective v5 round](docs\ledger\2026-05-05-mixed-objective-v5-round.md)

### The targeted v6 fix clears governance and archive pressure but regresses broader semantic balance

The `v6` round is the first one in the repo to fully clear both the governance adversarial holdout and the archive-pressure corpus at the same time while keeping storage shape flat. It still does not become the new baseline. Controlled multilingual becomes markedly worse, the paraphrase holdout fails again on `storage_resilience_paraphrase`, and the blind holdout and stress suite remain negative. That means the archive/governance wall is trainable, but the broader semantic balance is still unstable.

Evidence:

- [v6 legal-hold and archive round](docs\ledger\2026-05-05-v6-legalhold-archive-round.md)

### Newer specialist models do not improve synthetic book-root semantics

The synthetic book-folding round showed a useful count-side result under the `v3-hierarchical-packer-v2` storage baseline. Re-running that same book-root and mega-book shape against the newer `v5` and `v6` hierarchical models shows that both preserve the same `3`-patch fold but perform worse on synthetic book-root semantic grouping. That means the fold is carrying forward, but the newer specialist rounds are not the right baseline for book-scale semantic retention.

Evidence:

- [book folding round](docs\ledger\2026-05-06-book-folding-round.md)
- [book folding v5 v6 comparison](docs\ledger\2026-05-07-book-folding-v5-v6-comparison.md)

### Direct v7 book-root training is a near-miss, not a new baseline

The direct `v7` descendant of the original `v3` training line is useful because it improves the synthetic book-root minimum separation margin from `-3` to `-0.5` while preserving the exact `3`-patch fold at chapter, book-root, and mega-book scale. It still does not become the new baseline. The remaining miss is concentrated in `control_book_root`, the older chapter-style `booklike` corpus gets materially worse at `-18.5`, the paraphrase holdout drops from positive to `-0.4`, and the multilingual and blind gates also regress relative to `v3-hierarchical-packer-v2`. That means the book-root supervision is directionally right, but the current control-layer data still bleeds too much into the broader semantic surface.

Evidence:

- [v7 book-root round](docs\ledger\2026-05-06-v7-book-root-round.md)

### Direct v8 control-bridge training solves the bridge target but breaks governance boundaries

The `v8` control-bridge round is more than a near-miss: it clears the full synthetic `book-root` grouping, restores the controlled multilingual suite to all-positive, and restores the paraphrase holdout with a strong `storage_resilience_paraphrase` margin. It still does not become the overall baseline. The same round regresses sharply on the governance adversarial holdout, especially `legal_hold` at `-31`, and it also makes the older chapter-style `booklike` corpus worse at `-23.5`. That means the repo can now train the multilingual-governance bridge directly, but it does not yet know how to keep that bridge from smearing adjacent governance concepts or older chapter-style themes.

Evidence:

- [v8 control bridge round](docs\ledger\2026-05-07-v8-control-bridge-round.md)

### Direct v9 merge training restores governance by blowing up the fold

The `v9` merge round is the clearest proof yet that the current repo can hold the governance boundary and the multilingual-control bridge in one model at the same time. It still fails as a storage merge. Governance adversarial becomes all-positive again and the controlled multilingual plus paraphrase gates stay positive, but the long-form patch shape explodes: synthetic book-root rises from `3` to `26.5` patches per entry, the older chapter-style `booklike` corpus rises from `3` to `13.25`, and the synthetic mega-book rises from `3` to `159`. The round also still misses `control_book_root`, the archive `retention_governance_pressure` group, the older chapter-style booklike themes, the blind holdout, and the stress suite. Follow-up analysis showed that the `v9` storage collapse came from deriving the merge weights with entry-mode packing despite the hierarchical filename. The `v10` constrained merge is the fair fold-defended comparison.

Evidence:

- [v9 merge bridge governance round](docs\ledger\2026-05-07-v9-merge-bridge-governance-round.md)

### V10 constrained merge restores the fold but still misses two semantic targets

The `v10` constrained merge reuses the `v9` semantic-merge weights with the correct hierarchical packing constraint. It restores the book-fold shape to `3` patches per entry at synthetic book-root, old booklike, synthetic mega-book, and archive-pressure scale, and it clears archive pressure while keeping controlled multilingual and paraphrase positive. It still is not the new overall baseline. `control_book_root` remains negative at `-2.5`, `audit_evidence_adversarial` is slightly negative at `-1`, the older chapter-style `booklike` corpus still has three negative themes, and the blind holdout plus stress suite still fail.

Evidence:

- [v10 constrained merge round](docs\ledger\2026-05-07-v10-constrained-merge-round.md)

### V11 and V12 did not produce a safe replacement

The `v11` targeted bridge-audit round proves the requested targets are trainable, but it overfits. It fixes `control_book_root` and `audit_evidence_adversarial` while moving failures into economics, legal hold, archive retention, and multilingual. The `v12` blend sweep keeps the fold but cannot make book-root, governance, and archive all positive at one scalar blend point.

Evidence:

- [v11/v12 targeted merge round](docs\ledger\2026-05-07-v11-v12-targeted-merge-round.md)

### V13 clears governance/archive but still fails book-root

The `v13` balanced-triad round keeps the fold and clears governance adversarial plus archive pressure. It still fails synthetic book-root with `economics_book_root=-1.5` and `control_book_root=-3.5`. That makes it a specialist, not a baseline.

Evidence:

- [v13/v14 balanced triad round](docs\ledger\2026-05-07-v13-v14-balanced-triad-round.md)

### V14 worsens the target conflict

The `v14` book-root-balance probe adds more matched book-root support, but it makes the book-root minimum margin worse at `-8` and re-breaks governance through `legal_hold_adversarial=-2.5`. This confirms that broad phrase reinforcement is not a safe fix.

Evidence:

- [v13/v14 balanced triad round](docs\ledger\2026-05-07-v13-v14-balanced-triad-round.md)

### Oracle specialist routing is not production proof

The hardening audit shows that existing specialist heads can cover the known book-root/governance/archive target triad if an oracle picks the right model. That is useful architecture evidence, but it is not a real router, not broad generalization, and not a production claim.

Evidence:

- [hardening audit](docs\ledger\2026-05-07-hardening-audit.md)
- [oracle specialist routing audit](bench\2026-05-07-oracle-specialist-routing-audit.json)

### V15 routed heads still depend on supplied route labels

The `v15` multi-head benchmark implements the routed-head test harness and clears the known target triad when route labels are supplied. It is still not production proof. It does not infer the route automatically, the old `booklike` default-route guardrail still fails at `-18.5`, and selected-head frozen-suite runs still fail blind holdout and stress.

Evidence:

- [v15 multi-head routed round](docs\ledger\2026-05-07-v15-multihead-routed-round.md)
- [booklike default-route guardrail](bench\2026-05-07-booklike-benchmark-v15-multihead-default-route.json)

### V16 auto-routing still over-routes booklike content

The `v16` lexical auto-router clears the known target triad without supplied route labels, but it is still brittle. The old `booklike` guardrail is routed to the `v8` book-root head and fails at `-23.5`, worse than the v10 default route on that same corpus. The next router needs confidence guarding or automatic head validation before accepting the specialist route.

Evidence:

- [v16 auto-routed round](docs\ledger\2026-05-07-v16-auto-routed-round.md)
- [booklike v16 auto-routed guardrail](bench\2026-05-07-booklike-benchmark-v16-auto-routed.json)

### V17 routing safety improves, but booklike semantics are still unresolved

The `v17` confidence guard fixes the known v16 over-route by rejecting split chapter-style `booklike` content for the `bookRoot` specialist and falling back to `v10`. This is a routing-safety improvement, not a semantic fix. The same old `booklike` guardrail still fails grouped separation at `-18.5`, so the underlying booklike semantic boundary remains open.

Evidence:

- [v17 confidence-routed round](docs\ledger\2026-05-07-v17-confidence-routed-round.md)
- [booklike v17 confidence-routed guardrail](bench\2026-05-07-booklike-benchmark-v17-confidence-routed.json)

### V18 shows route validation is still missing

The `v18` mega-book semantic ladder shows a stronger fold-retention shape, but it also exposes a routing flaw. The current router sends the ladder to the `v8` book-root head; that run has positive ladder margins but trips the generic collapse guard because average nearest signature distance is `15.5`, below the `16` threshold. The `v10` comparison passes the same ladder without collapse. That means a production route selector needs candidate-head validation, not only lexical route scoring and shape guarding.

Evidence:

- [v18 mega-book semantic ladder](docs\ledger\2026-05-07-v18-mega-book-semantic-ladder.md)
- [v18 auto-routed report](bench\2026-05-07-mega-book-ladder-v18-confidence-routed.json)
- [v18 v10 head comparison](bench\2026-05-07-mega-book-ladder-v18-v10-head-comparison.json)

### V19 improves routing safety, but ranking is not yet production selection

The `v19` validated router fixes the specific v18 mistake by rejecting `v8` on the mega-book ladder and falling back to `v10`. The runner now evaluates all configured release heads and records a full-head ranking, but the active selection policy still uses the safer routed-candidate plus default-fallback rule. That means ranking exists for audit and hardening, not as production selection. The old `booklike` semantic failure remains negative at `-18.5`.

Evidence:

- [v19 validated routing round](docs\ledger\2026-05-07-v19-validated-routing-round.md)
- [v19 lock proof package](docs\proofs\v19-lock-proof-package.md)
- [booklike v19 validated guardrail](bench\2026-05-07-booklike-benchmark-v19-validated-routed.json)
- [mega-book ladder v19 validated route](bench\2026-05-07-mega-book-ladder-v19-validated-routed.json)

### V20 ranked selection improves one route miss but not the semantic wall

The `v20` ranked-selector pass is useful routing hardening: it preserves the v19 primary outcomes and improves paraphrase holdout selection by choosing `bookRoot` with margin `17.2` instead of the v19 selected `governance` margin `7.4`. It still is not a new baseline. The old `booklike` corpus remains negative at `-18.5`, blind holdout remains negative at `-15.5`, and stress-100 remains negative at `-28.6444`.

Evidence:

- [v20 ranked selector fortify pass](docs\ledger\2026-05-08-v20-ranked-selector-fortify.md)
- [v20 fortify summary](bench\fortify-2026-05-08-v20-ranked-selector\README.md)

### Booklike repair should start from v3-style geometry

A checkpoint sweep across `v3`, `v6`, `v8`, `v9`, `v10`, and `v13` confirms that none of the named checkpoints solve the old booklike corpus. The least-bad result is `v3` at `-11.5` with the fold still held at `3` patches per entry. The current default `v10` remains worse at `-18.5`, and `v8` is worst at `-23.5`. The main repair target is `multilingual_equity_booklike`.

Evidence:

- [code-domain and booklike sweep](docs\ledger\2026-05-08-code-domain-and-booklike-sweep.md)
- [booklike sweep summary](bench\fortify-2026-05-08-booklike-sweep\README.md)

### V21 improves booklike but breaks locked guardrails

The `v21` repair probe shows the old booklike failure is trainable. The minimum margin improves from `-18.5` under the current default `v10` to `-2.5`, and `multilingual_equity_booklike` flips positive at `20.5`. This is still a failure because `governance_evidence_booklike` remains negative at `-2.5`. It is also not a baseline because book-root, governance-adversarial, and archive-pressure regress sharply.

Evidence:

- [v21 booklike repair probe](docs\ledger\2026-05-08-v21-booklike-repair-probe.md)
- [v21 summary](bench\fortify-2026-05-08-v21-booklike-repair\README.md)

### V22 clears booklike only as a specialist

The `v22` governance-evidence booklike repair clears the old chapter-style `booklike` corpus with min margin `7.5` and keeps the `3`-patch fold. As a single model, it is not a baseline because synthetic book-root still fails at `-13.5` and governance-adversarial still fails at `-1.5`. As a fourth ranked specialist head, it is more useful: the selector keeps the existing locked heads for book-root, governance, archive, and mega-book ladder, and selects v22 only for old `booklike`. This is still not production proof because blind holdout remains `-15.5` and stress-100 remains `-28.6444`.

Evidence:

- [v22 governance-evidence booklike repair](docs\ledger\2026-05-08-v22-governance-evidence-booklike.md)
- [v22 single-head summary](bench\fortify-2026-05-08-v22-governance-evidence-booklike\README.md)
- [v22 four-head ranked summary](bench\fortify-2026-05-08-v22-four-head-ranked\README.md)

### V22 extra sweep still fails quote-style semantic grouping

The May 11 v22 four-head extra sweep keeps several additional controlled surfaces positive, including code-domain, paraphrase, multilingual-longform, phrase-semantic, multilingual-phrases, and protocol-longform. It still fails quote and quote-paragraph semantic grouping. Both quote suites compress to `1` patch per entry, but grouped semantic separation remains negative at `-18.2` for `quote` and `-20.25` for `quote-paragraph`.

Evidence:

- [v22 four-head extra sweep](docs\ledger\2026-05-11-v22-four-head-extra-sweep.md)
- [v22 extra sweep summary](bench\fortify-2026-05-11-v22-four-head-extra\README.md)

### V23 proof package is directional, not production proof

The May 16 `v23` four-head proof package reproduces the strongest current specialist result in one command. Primary gates pass together: book-root `8`, governance `3.5`, archive `8`, old booklike `7.5`, and mega-book ladder `31`. It is still not production proof. Blind holdout remains negative at `-15.5`, stress-100 remains negative at `-28.6444`, quote remains negative at `-18.2`, and quote-paragraph remains negative at `-20.25`.

Evidence:

- [v23 four-head proof package](docs\ledger\2026-05-16-v23-four-head-proof-package.md)
- [v23 package summary](bench\proof-locks\2026-05-16-213600482z-v23-four-head-ranked-2026-05-16\summary.json)

### V24 quote repair improves quote margins but still fails

The May 16 `v24` quote-repair probe improves the two known quote-style targets, but it does not clear either target. Quote improves from the v23 selected margin `-18.2` to `-12.8` under quoteRepair, and quote-paragraph improves from `-20.25` to `-10.3333`. The best blend sweep still remains negative at `-12` for quote and `-9.5833` for quote-paragraph. The five-head ranked probe preserves the v23 primary lanes, but quoteRepair is rejected because it does not pass the acceptance gate.

Evidence:

- [v24 quote-repair probe](docs\ledger\2026-05-16-v24-quote-repair-probe.md)
- [v24 single-head summary](bench\fortify-2026-05-16-v24-quote-repair\README.md)
- [v24 five-head ranked summary](bench\fortify-2026-05-16-v24-five-head-ranked\README.md)
- [v24 blend sweep summary](bench\fortify-2026-05-16-v24-quote-blend-sweep\README.md)

### V25 hard-negative repair is a negative/mixed probe

The May 20 `v25` hard-negative repair probe adds deterministic mining of nearest-outside confusion pairs from the failed quote, quote-paragraph, blind-holdout, and stress-100 reports. It preserves the v23 primary ranked lanes, but it does not become a baseline. As a single head, quote worsens from the v24 quoteRepair margin `-12.8` to `-19`, quote-paragraph worsens from `-10.3333` to `-14.8333`, and blind-holdout worsens from the v23 selected margin `-15.5` to `-17.4167`. Stress-100 improves to `-24.0667`, but it remains negative. Because v25 mines failed report confusion pairs, these target surfaces are no longer independent blind proof.

Evidence:

- [v25 hard-negative repair probe](docs\ledger\2026-05-20-v25-hard-negative-repair-probe.md)
- [v25 probe summary](bench\fortify-2026-05-20-v25-hard-negative-repair\README.md)
- [v25 summary json](bench\fortify-2026-05-20-v25-hard-negative-repair\summary.json)

### V26 split repair improves quote slightly but leaks routes

The May 25 `v26` split hard-negative probe separates repair pressure into quote, blind, and stress heads. That helps the direct quote target from `-12.8` to `-10.8`, but the target remains negative. Quote-paragraph worsens to `-15`, blindSplit worsens to `-17.5`, and stressSplit worsens to `-26.8111`. The unrestricted eight-head ranked run also breaks strict v23 primary lane preservation: governance-adversarial selects `stressSplitV26` with margin `4.5` instead of the expected `governance` head with margin `3.5`. This is not a semantic crash, but it is a route-governance failure.

Evidence:

- [v26 split hard-negative repair probe](docs\ledger\2026-05-25-v26-split-hard-negative-repair-probe.md)
- [v26 probe summary](bench\fortify-2026-05-25-v26-split-hard-negative-repair\README.md)
- [v26 summary json](bench\fortify-2026-05-25-v26-split-hard-negative-repair\summary.json)

### Current path does not support raw-source 99.99% storage-reduction claims

The current raw-source storage projection on quote-style and paragraph-style corpora expands bytes rather than collapsing them. The `99.99%` figure is not supported as a raw-text compression claim in this repo.

Evidence:

- [storage projection v3](docs\ledger\2026-04-25-storage-projection-v3.md)

### Current benchmark candidate is not target BSQ

The benchmark candidate now uses a BSQ-style prototype path, but its embeddings are still heuristic and not the target learned visual embeddings required for real BSQ proof.

Evidence:

- [math boundary](docs\math\bsq-and-protocol-foundation.md)

### Current system does not prove broad tokenizer superiority

Current wins are narrow, controlled, and corpus-specific. They do not justify a general claim that `16xVS` is already beating regular tokenizers in real-world workloads.

Evidence:

- [status](docs\status.md)
- [sample baseline refresh](docs\ledger\2026-04-20-sample-baseline-refresh.md)
- [Google 1000 refresh](docs\ledger\2026-04-20-google-1000-refresh.md)

### Strategic protocol claims are not product proof

Efficiency-index projections, 20-year margin claims, pricing formulas, and market inevitability arguments are still strategy material. They are not current implementation proof.

Evidence:

- [math boundary](docs\math\bsq-and-protocol-foundation.md)

## Directional but still weak

### Perturbation evidence is thin

Some close edits stayed compact, but current perturbation coverage is too narrow to support strong stability claims.

Evidence:

- [perturbation refresh](docs\ledger\2026-04-20-perturbation-refresh.md)
