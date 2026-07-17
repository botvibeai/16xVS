# 16xVS Hierarchical Folding Architecture

This file describes the target multilevel `16xVS` architecture for folding local tokens into larger semantic units.

It is an architecture and protocol note, not proof that the current repo already implements the full hierarchy.

## Boundary

This doc mixes three layers on purpose, but it labels them explicitly:

- `target protocol architecture`: the intended sentence -> paragraph -> section -> chapter -> book fold
- `current directional prototype`: the macro and hierarchical packer experiments that already compress longer entries into fewer patches
- `not yet implemented`: the recursive token tree, parent-child traversal, and multilevel retrieval path

Read this file together with:

- [bsq-and-protocol-foundation.md](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\math\bsq-and-protocol-foundation.md)
- [status.md](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\status.md)

## Core Idea

The top-level `book token` should not be treated as a magical lossless replacement for the entire book.

The correct model is a hierarchy:

- local patches describe the smallest units
- larger units fold child units into a root code plus optional residual detail
- retrieval starts coarse and descends only where needed

In plain terms:

`book token -> chapter tokens -> section tokens -> paragraph tokens -> sentence or patch tokens`

The root token is a routing and identity handle. The lower layers preserve detail.

## Target Protocol Architecture

### Level 0: local patch or sentence token

Purpose:

- store immediate wording or visual structure
- support exact local retrieval
- preserve the finest recoverable unit

Expected contents:

- `level`: `patch`
- `code`: `256`-bit binary signature
- `span`: source offsets or local visual region
- `sourceRef`: pointer to original source block
- `metadata`: language, modality, normalization hints

### Level 1: paragraph token

Purpose:

- summarize a short cluster of child patches or sentence tokens
- retain key distinctions through residual detail

Expected contents:

- `level`: `paragraph`
- `rootCode`: main paragraph signature
- `childIds`: ordered references to local children
- `residualCodes`: optional detail-preserving codes
- `summaryStats`: token count, character count, language mix

Interpretation:

- one paragraph token should be the root for a paragraph-sized meaning unit
- the residual codes exist to prevent destructive over-folding

### Level 2: section token

Purpose:

- fold multiple paragraphs into one navigable topic unit
- preserve section-level structure

Expected contents:

- `level`: `section`
- `rootCode`
- `childIds`: paragraph token references
- `residualCodes`
- `topicHints`: optional labels derived from the encoder or retrieval system

Interpretation:

- section tokens are coarse enough for routing but still close enough to support useful narrowing

### Level 3: chapter token

Purpose:

- represent the main chapter identity
- support chapter-level search, clustering, and summarization

Expected contents:

- `level`: `chapter`
- `rootCode`
- `childIds`: section token references
- `residualCodes`
- `chapterIndex`
- `chapterStats`

Interpretation:

- chapter tokens are where long-form routing becomes cheap
- they should let the system find the right chapter before loading paragraph detail

### Level 4: book token

Purpose:

- represent the whole book or whole large document at the top level
- serve as the root index handle for coarse retrieval

Expected contents:

- `level`: `book`
- `rootCode`
- `childIds`: chapter token references
- `residualCodes`: optional global detail anchors
- `bookStats`
- `manifestRef`

Interpretation:

- the whole book can have one top token
- that top token is useful only because lower layers still exist beneath it

## Folding Rule

At each level, the system should not simply concatenate children forever. It should:

1. encode child units into continuous embeddings
2. aggregate them into a parent embedding
3. normalize the parent embedding
4. sign-quantize it into a binary parent code
5. keep residual codes where the parent would otherwise lose critical distinctions

In the target BSQ-style form:

- child embedding: `z_child`
- aggregated parent embedding: `z_parent`
- parent code: `sign(z_parent / ||z_parent||)`

This keeps the hierarchy compatible with exact Hamming retrieval while allowing multiscale folding.

## Data Model

The target persistent unit should look more like a token tree node than a flat patch record.

Suggested shape:

```json
{
  "id": "chapter-004",
  "level": "chapter",
  "rootCode": "binary-256",
  "residualCodes": ["binary-256", "binary-256"],
  "parentId": "book-001",
  "childIds": ["section-004-01", "section-004-02"],
  "span": {
    "sourceStart": 18240,
    "sourceEnd": 26110
  },
  "stats": {
    "childCount": 2,
    "wordCount": 1380,
    "charCount": 7824
  },
  "metadata": {
    "language": "en",
    "modality": "text",
    "version": "target-protocol"
  }
}
```

Important properties:

- fixed-width binary root code at every level
- explicit parent-child graph
- optional residual codes for detail preservation
- explicit span metadata so the system can map back to source

## Storage Format

The target storage format should separate:

- `token tree metadata`
- `binary codes`
- `source references`
- `residual detail`

One practical layout:

### Tree manifest

Stores:

- node ids
- levels
- parent-child relationships
- spans
- minimal stats

### Binary code store

Stores:

- root codes
- residual codes
- exact retrieval signatures

### Source map store

Stores:

- offsets into original text or image assets
- references needed for reconstruction or verification

### Archive tiers

The existing `live / fallback / vault` durability policy can still apply to this hierarchy.

That means the protocol hierarchy and the storage durability model are compatible:

- `live`: operational token tree
- `fallback`: recovery copy
- `vault`: long-term archive copy

## Retrieval Flow

The intended retrieval path is coarse-to-fine.

### Step 1: coarse route

Search root codes at the highest useful level:

- book level for large corpus routing
- chapter level for large-document routing

### Step 2: descend to children

For the top matches:

- load child ids
- search child root codes
- continue descending only in promising branches

### Step 3: exact rerank

At the chosen level:

- run exact Hamming distance over the candidate root codes
- optionally include residual codes for sharper discrimination

### Step 4: source recovery

When detail is needed:

- load paragraph or patch nodes
- resolve source spans
- retrieve original text or image material

This is the key reason hierarchical folding is useful:

- top levels reduce search cost
- lower levels preserve detail
- residual codes stop the hierarchy from flattening everything into noise

## How This Relates To The Current Repo

### Current directional prototype

The repo already contains directional pieces of this design:

- macro packer experiments
- hierarchical packer experiments
- residual selection
- long-form storage pressure tests
- governance and archive-pressure specialization tests

These prove that longer entries can be folded into fewer patches while preserving some retrieval behavior.

They do not yet prove the full target hierarchy.

### Not yet implemented

The repo does not yet implement:

- explicit paragraph -> section -> chapter -> book nodes
- recursive parent-child token manifests
- multilevel descend-and-rerank retrieval
- full learned parent aggregation at every hierarchy level
- a faithful end-to-end visual encoder that produces the intended `z in R^L` before quantization

## Why This Matters

Without hierarchy, the system is forced into a bad tradeoff:

- keep many local tokens and pay high search/storage cost
- or collapse too aggressively and lose distinctions

The hierarchy is the intended answer:

- root code for routing
- residual codes for protection against over-collapse
- lower-level nodes for detail

That is how a book can have one top token without pretending one token literally replaces the whole book.

## Practical Interpretation For Current Claims

What can be said now:

- the repo has directional evidence that hierarchical folding helps long-form storage shape
- the repo does not yet implement the full recursive token tree
- the repo does not yet prove that a full book can be faithfully represented by only one flat token

The safe claim is:

`16xVS is moving toward a hierarchical token tree where a book-level root can sit above chapter, section, paragraph, and local patch tokens.`

That is architecture direction, not present-tense proof.

## Next Implementation Implications

If this architecture becomes the next build target, the next concrete steps are:

1. add explicit node levels to the benchmark pipeline
2. emit parent-child manifests for long-form corpora
3. separate root codes from residual codes in stored artifacts
4. add descend-and-rerank retrieval tests
5. measure compression and semantic retention at each hierarchy level

That would convert the current storage-focused experiments into a real multiscale `16xVS` token tree.
