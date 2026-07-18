import crypto from "node:crypto";
import fs from "node:fs/promises";

const MAGIC = Buffer.from("16XVSVLT1", "ascii");
const VERSION = 1;
const TAG_BYTES = 16;
const DEFAULT_SCRYPT = Object.freeze({ N: 1 << 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });

function assertNonEmpty(value, label) {
  if (typeof value !== "string" || value.length < 16) {
    throw new Error(`${label} must be at least 16 characters.`);
  }
}
