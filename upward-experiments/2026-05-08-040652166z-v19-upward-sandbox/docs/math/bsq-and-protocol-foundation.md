# 16xVS Math and Protocol Foundation

This file separates target 16xVS protocol math from the currently implemented benchmark code.

For the target multilevel fold above those binary codes, see:

- [hierarchical-folding-architecture.md](C:\Users\BotVi\Downloads\BotVibe AI LLC\CODEX-AGENT\16xvs-poc\docs\math\hierarchical-folding-architecture.md)

## Target 16xVS Math

### Binary Spherical Quantization

The target visual tokenizer is based on Binary Spherical Quantization.

Given a continuous embedding vector:

`z in R^L`

The target binary code is formed by spherical normalization followed by sign quantization:

`z_hat = sign(z / ||z||)`

Intended properties:

- fixed binary output width
- bounded quantization behavior
- lookup-free discretization
- compatibility with exact Hamming retrieval

### Vocabulary Scaling

Target effective vocabulary:

`2^L`

This is protocol math, not current implementation proof.

### Similarity Metrics

Target binary retrieval uses:

- exact Hamming distance over binary codes
- optional `{0,1} -> {-1,1}` remapping for dot-product compatibility in vector systems

### Efficiency Index

Target protocol planning uses:

`Efficiency Index = Compression Factor / Compute Overhead Ratio`

This is currently a planning and theory metric. It has not been validated end-to-end by the current heuristic benchmark code.

### Ternary Alignment

The broader protocol thesis assumes compatibility with ternary or low-bit reasoning systems:

- weights in `{-1, 0, 1}`
- cheaper arithmetic than FP16/FP32 paths
- Hamming-friendly binary retrieval

This is strategic protocol alignment, not current POC evidence.

## Current Implementation Boundary

### POC Harness

Currently implemented:

- image ingest
- `16x16` grayscale reduction
- `256`-bit binary glyph generation for the image path
- exact Hamming search in the Worker
- `live / fallback / vault` storage policy
- repair route

### Experimental Core Candidate

Currently implemented for text benchmarking:

- heuristic patch packer
- simple patch-count benchmark
- BSQ-style prototype embedding generation
- spherical normalization to unit length
- sign quantization into a `256`-bit code
- semantic and perturbation evaluation harness

This is closer to BSQ mechanics, but it is still not full BSQ because the embedding source is a hand-built prototype rather than the target learned visual embedding pipeline.

### Not Yet Implemented

Not yet implemented in the benchmark candidate:

- learned or production-grade embedding generation `z in R^L`
- true BSQ code generation for text or visual patches driven by the intended encoder
- production-grade retrieval proof for target 16xVS math

## Documentation Rule

Any doc that mentions `16xVS` math must state whether it refers to:

- `target protocol math`
- `current POC harness`
- `experimental core candidate`

Do not use the benchmark candidate as proof of the target BSQ tokenizer.

