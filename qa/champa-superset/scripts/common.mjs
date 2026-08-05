import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = resolve(scriptDirectory, "../../..");
function findWorkspaceRoot() {
  if (process.env.CHAMPA_WORKSPACE_ROOT) {
    return resolve(process.env.CHAMPA_WORKSPACE_ROOT);
  }

  // Worktrees can be located both beside and inside the repository. Find the
  // W0 artifact rather than assuming one fixed relative worktree depth.
  let candidate = repositoryRoot;
  for (let depth = 0; depth < 8; depth += 1) {
    if (existsSync(resolve(candidate, "CHAMPA_SUPERSET_FEATURE_MANIFEST.yaml"))) {
      return candidate;
    }
    const parent = resolve(candidate, "..");
    if (parent === candidate) break;
    candidate = parent;
  }
  return resolve(repositoryRoot, "..");
}

export const workspaceRoot = findWorkspaceRoot();
export const manifestPath = resolve(
  workspaceRoot,
  "CHAMPA_SUPERSET_FEATURE_MANIFEST.yaml"
);
export const artifactDirectory = resolve(
  repositoryRoot,
  "qa/champa-superset/artifacts"
);

export function ensureArtifacts() {
  mkdirSync(artifactDirectory, { recursive: true });
}

export function writeArtifact(name, value) {
  ensureArtifacts();
  const target = resolve(artifactDirectory, name);
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
  return target;
}

export function readManifest() {
  if (!existsSync(manifestPath)) {
    throw new Error(`W0 manifest not found: ${manifestPath}`);
  }

  // The release harness needs only the feature blocks; parsing that stable
  // subset keeps it dependency-free and makes it runnable in CI images that
  // do not ship Ruby or a YAML package. The raw block is retained so exact W0
  // evidence paths are never discarded by the index.
  const raw = readFileSync(manifestPath, "utf8");
  const featureStarts = [...raw.matchAll(/^  - id: (F\d{2})$/gm)];
  const features = featureStarts.map((match, index) => {
    const start = match.index;
    const end = featureStarts[index + 1]?.index ?? raw.length;
    const block = raw.slice(start, end);
    const value = (key, indent = "    ") => block.match(new RegExp(`^${indent}${key}: [\\\"']?(.+?)[\\\"']?$`, "m"))?.[1]?.trim();
    const inlineList = (key, indent = "      ") => {
      const text = value(key, indent);
      if (!text?.startsWith("[")) return [];
      return text.slice(1, -1).split(",").map((entry) => entry.trim().replace(/^[\\\"']|[\\\"']$/g, "")).filter(Boolean);
    };
    const list = (key) => {
      const inline = inlineList(key);
      if (inline.length) return inline;
      const matched = block.match(new RegExp(`^      ${key}:\\n((?:        - .+\\n)+)`, "m"));
      return matched?.[1].match(/^        - (.+)$/gm)?.map((entry) => entry.replace(/^        - /, "").replace(/^[\\\"']|[\\\"']$/g, "")) ?? [];
    };
    return {
      id: match[1],
      title: value("title") ?? "Untitled feature",
      owner_workstream: value("owner_workstream") ?? "unassigned",
      dependencies: inlineList("dependencies", "      "),
      seed_requirements: [],
      acceptance_criteria: [],
      evidence: { manifest_block: block },
      current_champa: { routes: list("routes"), components: list("components"), apis: list("apis"), entities: list("entities") },
    };
  });
  return { features };
}

export function timestamp() {
  return new Date().toISOString();
}

export function statusRow(status, message, extra = {}) {
  return { status, message, checked_at: timestamp(), ...extra };
}

export function readText(relativePath) {
  return readFileSync(resolve(repositoryRoot, relativePath), "utf8");
}
