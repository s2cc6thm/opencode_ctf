import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { createElement, insert, setProp } from "@opentui/solid"
import { createSignal } from "solid-js"

// ---------------------------------------------------------------------------
// Paths (must match index.js)
// ---------------------------------------------------------------------------

function statePath() {
  if (process.env.OPENCODE_CTF_TOGGLE_STATE) {
    return process.env.OPENCODE_CTF_TOGGLE_STATE
  }
  const dataRoot = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share")
  return join(dataRoot, "opencode-ctf-toggle", "state.json")
}

// The fallback must match index.js: when the host reports no directory, both
// processes have to derive the same workspace key, so use process.cwd() in both.
function canonicalWorkspace(directory) {
  const value = resolve(String(directory || process.cwd()))
  return process.platform === "win32" ? value.toLowerCase() : value
}

function workspaceKey(directory) {
  return createHash("sha256").update(canonicalWorkspace(directory)).digest("hex").slice(0, 32)
}

function legacyWorkspaceKey(directory) {
  const key = String(directory || process.cwd())
    .replace(/[\\/]+/g, "-")
    .replace(/^([a-zA-Z]):/, (_m, drive) => `-${drive.toLowerCase()}-`)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
  return key || "default-workspace"
}

function notesPath(directory) {
  return join(dirname(statePath()), "notes", `${workspaceKey(directory)}.json`)
}

function legacyNotesPath(directory) {
  return join(dirname(statePath()), "notes", `${legacyWorkspaceKey(directory)}.json`)
}

// ---------------------------------------------------------------------------
// Synchronous state reads (TUI runs on the Bun host; fs is available)
// ---------------------------------------------------------------------------

function readStateSync() {
  try {
    const parsed = JSON.parse(readFileSync(statePath(), "utf8"))
    return {
      enabled: parsed.enabled === true,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    }
  } catch {
    return { enabled: false, updatedAt: null }
  }
}

function emptyCounts() {
  return { assets: 0, findings: 0, ruledOut: 0, flags: 0 }
}

function countsFromNotes(notes) {
  return {
    assets: Array.isArray(notes.assets) ? notes.assets.length : 0,
    findings: Array.isArray(notes.findings) ? notes.findings.length : 0,
    ruledOut: Array.isArray(notes.ruledOut) ? notes.ruledOut.length : 0,
    flags: Array.isArray(notes.flags) ? notes.flags.length : 0,
  }
}

// A missing, unreadable, corrupt, or malformed notes file is skipped so the
// legacy location still gets a chance; only a well-formed ledger wins.
function readCountsSync(directory) {
  for (const target of [notesPath(directory), legacyNotesPath(directory)]) {
    let parsed
    try {
      parsed = JSON.parse(readFileSync(target, "utf8"))
    } catch {
      continue
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue
    return countsFromNotes(parsed)
  }
  return emptyCounts()
}

// ---------------------------------------------------------------------------
// OpenTUI element helpers (same pattern as shipped reference plugins)
// ---------------------------------------------------------------------------

function element(tag, props, children = []) {
  const node = createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) setProp(node, key, value)
  }
  for (const child of children) {
    if (child !== null && child !== undefined && child !== false) insert(node, child)
  }
  return node
}

const text = (props, children) => element("text", props, children)
const box = (props, children = []) => element("box", props, children)

// ---------------------------------------------------------------------------
// TUI plugin
// ---------------------------------------------------------------------------

const tui = async (api) => {
  const [snapshot, setSnapshot] = createSignal({ enabled: false, counts: null })

  const refresh = () => {
    const state = readStateSync()
    const directory = api.state?.path?.directory
    setSnapshot({
      enabled: state.enabled,
      counts: state.enabled && directory ? readCountsSync(directory) : null,
    })
  }

  refresh()
  const timer = setInterval(refresh, 1500)
  const unsubCommand = api.event?.on?.("command.executed", () => refresh())
  const unsubIdle = api.event?.on?.("session.idle", () => refresh())
  api.lifecycle?.onDispose?.(() => {
    clearInterval(timer)
    if (typeof unsubCommand === "function") unsubCommand()
    if (typeof unsubIdle === "function") unsubIdle()
  })

  const Badge = () => {
    const current = snapshot()
    const theme = api.theme.current

    if (!current.enabled) {
      return box(
        { paddingLeft: 1, paddingRight: 1 },
        [text({ fg: theme.textMuted }, ["CTF OFF"])],
      )
    }

    const segments = ["CTF ON"]
    const counts = current.counts
    if (counts) {
      if (counts.assets) segments.push(`A${counts.assets}`)
      if (counts.findings) segments.push(`V${counts.findings}`)
      if (counts.ruledOut) segments.push(`R${counts.ruledOut}`)
      if (counts.flags) segments.push(`F${counts.flags}`)
    }

    return box(
      { paddingLeft: 1, paddingRight: 1 },
      [text({ fg: theme.success ?? theme.primary }, [segments.join("  ")])],
    )
  }

  api.slots.register({
    order: 120,
    slots: {
      session_prompt_right(_ctx, _props) {
        return Badge()
      },
      home_prompt_right(_ctx, _props) {
        return Badge()
      },
    },
  })
}

const plugin = {
  id: "opencode.ctf-toggle.tui",
  tui,
}

export default plugin
