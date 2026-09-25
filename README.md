# opencode-ctf-toggle · OpenCode 破甲

**一条斜杠命令开关授权 CTF 模式，并用工作区账本持续记录资产、漏洞、排除路径和 Flag。**

> **Toggle authorized CTF mode with one slash command, then keep assets, findings, ruled-out paths, and flags in a workspace-scoped ledger.**

---

## v1.1.0

- `/ctf`、`/ctf-on`、`/ctf-off`、`/ctf-status` 控制 CTF 模式；
- `ctf_note` 工具记录资产、已验证漏洞、Flag 与已排除假设；
- `ctf_notes` 工具读取完整账本或紧凑上下文；
- 开启 CTF 模式时，从工具输出中自动捕获疑似 Flag；
- 每个工作区独立保存账本，并支持 Markdown 导出与显式重置；
- TUI 状态栏显示 `CTF ON/OFF` 以及资产、漏洞、排除项和 Flag 数量。

> Toggle CTF mode with four commands, record engagement state through two tools, automatically capture likely flags while enabled, and monitor compact ledger counts in the TUI.

## 安装 / Install

### 从源码安装 / From source

```bash
git clone https://github.com/s2cc6thm/opencode_ctf.git
cd opencode_ctf
npm install --omit=dev
```

在 `opencode.json` 中加载插件：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["file:///absolute/path/to/opencode_ctf"]
}
```

需要 TUI 状态徽标时，在 `tui.json` 中加载同一路径：

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["file:///absolute/path/to/opencode_ctf"]
}
```

Windows 路径示例：`file:///C:/path/to/opencode_ctf`。安装依赖并保存配置后重启 OpenCode。

> Install dependencies in the clone, load the package from an absolute `file:///` URL in both configs, then restart OpenCode. Use the same path in `tui.json` to enable the status badge.

## 命令 / Commands

| 命令 / Command | 作用 / What it does |
| --- | --- |
| `/ctf` | 切换状态 / Toggle ON ↔ OFF |
| `/ctf-on` | 开启 CTF 模式 / Enable |
| `/ctf-off` | 关闭 CTF 模式 / Disable |
| `/ctf-status` | 查看当前状态 / Show current state |
| `/ctf-notes` | 查看当前工作区账本 / Show the workspace ledger |
| `/ctf-notes-export` | 将账本导出为 Markdown / Export a Markdown report |
| `/ctf-notes-reset confirm` | 清空当前工作区账本 / Clear the workspace ledger |

## 工具 / Tools

### `ctf_note`

记录以下任一类型：

- `asset`：目标、端点、凭据、服务或版本；
- `finding`：已验证漏洞、严重级别、状态与复现证据；
- `ruled_out`：已测试并排除的攻击路径及决定性证据；
- `flag`：手动确认的 Flag。

相同资产、大小写完全一致的 Flag，以及标题与证据都相同的 finding 会合并；不同证据不会被覆盖。

> Duplicate assets and case-sensitive identical flags are merged. Findings merge only when both title and evidence match, so distinct evidence is preserved.

### `ctf_notes`

- `full`：返回人类可读的完整账本；
- `ledger`：返回供模型使用的紧凑账本。

> Returns either the full human-readable ledger or the compact model context.

## 数据与隐私 / Data and privacy

- 开关状态默认保存在 `~/.local/share/opencode-ctf-toggle/state.json`；
- 每个工作区的账本默认保存在同一数据目录的 `notes/` 下，文件名使用规范化工作区路径的哈希；
- 可用 `OPENCODE_CTF_TOGGLE_STATE` 覆盖状态文件位置；
- `/ctf-notes-export` 会在当前项目目录生成 `ctf-notes-<timestamp>.md`；
- 自动 Flag 捕获与账本内容可能包含目标地址、凭据、漏洞证据或 Flag，分享前应人工检查。

运行时状态、账本和导出报告不会作为插件源码发布。本仓库的 `.gitignore` 默认排除 `state.json`、`notes/`、`ctf-notes-*.md`、环境文件和常见私钥文件。

> Runtime state, ledgers, and exported reports are not source files and are excluded by the repository `.gitignore`. Ledger entries may contain sensitive challenge data, so review exports before sharing them.

## 工作原理 / How it works

- `config` 钩子注册七个斜杠命令；
- `tool` 钩子提供 `ctf_note` 与 `ctf_notes`；
- `command.execute.before` 处理开关、查看、导出与重置；
- `tool.execute.after` 在 CTF 模式开启时自动提取工具输出中的疑似 Flag；
- `experimental.chat.system.transform` 注入 CTF 指南与账本计数摘要，模型通过 `ctf_notes` 按需读取不可信账本内容；
- TUI 插件定时读取状态，并在提示区域显示徽标和计数。

> The server plugin registers commands and tools, persists workspace state, captures likely flags, and injects only ledger counts into system context. The model reads untrusted ledger details through `ctf_notes`; the TUI plugin renders the current status.

## 边界 / Scope

CTF 模式只适用于用户明确声明为授权的挑战目标。它不会把任意公网主机、账号或生产系统自动视为授权目标，也不会绕过模型安全要求与 OpenCode 工具权限检查。

> CTF mode applies only to targets the user explicitly declares as authorized. It does not automatically authorize public hosts, accounts, or production systems, and it does not bypass model safety requirements or OpenCode permission checks.

## 开发 / Development

```bash
npm install
npm run check
npm run pack:dry-run
```

## 许可证 / License

[MIT](LICENSE)
