import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const pluginDirectory = dirname(fileURLToPath(import.meta.url))
const promptPath = join(pluginDirectory, "ctf-toggle-prompt.md")

function statePath() {
  if (process.env.OPENCODE_CTF_TOGGLE_STATE) {
    return process.env.OPENCODE_CTF_TOGGLE_STATE
  }
  const dataRoot = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share")
  return join(dataRoot, "opencode-ctf-toggle", "state.json")
}

async function readState() {
  try {
    const parsed = JSON.parse(await readFile(statePath(), "utf8"))
    return {
      enabled: parsed.enabled === true,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    }
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) {
      return { enabled: false, updatedAt: null }
    }
    throw error
  }
}

async function writeState(enabled) {
  const target = statePath()
  const next = {
    enabled,
    updatedAt: new Date().toISOString(),
  }
  await mkdir(dirname(target), { recursive: true })
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, "utf8")
  try {
    await rename(temporary, target)
  } catch (error) {
    if (process.platform !== "win32" || error?.code !== "EEXIST") throw error
    await rm(target, { force: true })
    await rename(temporary, target)
  }
  return next
}

async function loadPrompt() {
  return readFile(promptPath, "utf8")
}

function addCommand(config, name, description) {
  config.command ??= {}
  config.command[name] ??= {
    description,
    template:
      "Apply the CTF mode command result attached to this message. Briefly confirm the resulting state. " +
      "CTF mode applies only to the user's declared challenge scope.",
  }
}

function resultPart(action, state) {
  const label = state.enabled ? "ON" : "OFF"
  const detail = action === "status" ? "Current state" : "New state"
  return {
    type: "text",
    text: `\n\n[ctf-toggle] ${detail}: ${label}. CTF guidance applies only to the user's declared challenge scope.`,
  }
}

export const CtfTogglePlugin = async () => ({
  async config(config) {
    addCommand(config, "ctf", "Toggle CTF mode on or off")
    addCommand(config, "ctf-on", "Enable CTF mode")
    addCommand(config, "ctf-off", "Disable CTF mode")
    addCommand(config, "ctf-status", "Show CTF mode status")
  },

  async "command.execute.before"(input, output) {
    if (!["ctf", "ctf-on", "ctf-off", "ctf-status"].includes(input.command)) return

    const current = await readState()
    let next = current
    if (input.command === "ctf") next = await writeState(!current.enabled)
    if (input.command === "ctf-on") next = await writeState(true)
    if (input.command === "ctf-off") next = await writeState(false)

    output.parts.push(resultPart(input.command === "ctf-status" ? "status" : "change", next))
  },

  async "experimental.chat.system.transform"(_input, output) {
    const state = await readState()
    if (!state.enabled) return
    output.system.push(await loadPrompt())
  },
})
