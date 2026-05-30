// Print the per-specialist MCP availability hint for cn_vnet.
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const STUB_ROOT = join(REPO, "node_modules", "@github", "copilot-sdk");
const STUB_OWNED = !existsSync(join(REPO, "node_modules", "@github"));
mkdirSync(STUB_ROOT, { recursive: true });
writeFileSync(join(STUB_ROOT, "package.json"), JSON.stringify({ name: "@github/copilot-sdk", version: "0.0.0", type: "module", exports: { "./extension": "./extension.mjs" } }));
writeFileSync(join(STUB_ROOT, "extension.mjs"), "export async function joinSession(opts) { globalThis.__NETWORK_DESK_TOOLS = opts.tools; return { log: async () => {} }; }");
try {
    await import(pathToFileURL(join(REPO, "extensions", "network-desk", "extension.mjs")).href);
    const tools = globalThis.__NETWORK_DESK_TOOLS || [];
    const cnRole = tools.find((t) => t.name === "cn_role");
    const out = await cnRole.handler({ specialist: "cn_vnet" });
    const text = typeof out === "string" ? out : (out?.textResultForLlm ?? JSON.stringify(out));
    // Print just the tail (last 40 lines) where the new block appears.
    const lines = text.split("\n");
    console.log(lines.slice(-50).join("\n"));
} finally {
    try { if (STUB_OWNED) rmSync(join(REPO, "node_modules"), { recursive: true, force: true }); else rmSync(STUB_ROOT, { recursive: true, force: true }); } catch {}
}
