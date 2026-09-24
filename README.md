# opencode-ctf-toggle · OpenCode 破甲

**一条斜杠命令,随时开关你的攻防 / CTF 攻坚模式。**

> **One slash command to flip your CTF assault mode on and off.**

---

## 关于 / About

OpenCode 破甲是把"CTF 模式提示词"做成开关的 OpenCode 插件。装上之后,你不需要再纠结安全边界、手动维护提示词,只用 `/ctf` 一条命令,就能在你声明的授权攻防目标上进入攻坚状态;用完再 `/ctf`,干净退出,不残留、不提示词搬家。

> OpenCode Armor-Breaker turns the CTF-mode system prompt into a switch. Install it, then a single `/ctf` flips you into assault mode for targets you've explicitly authorized — and a single `/ctf` back takes you out. No leftover prompt scaffolding, no mess.

## 为什么有这个项目 / Origin

本项目由一个功能更全的开源插件二次简化而来。原插件能力不错,但上手太麻烦:

- 要手动拼一段好长好长的提示词,再塞进指定目录;
- 要靠环境变量、配置文件走一堆初始化步骤;
- 想"临时开一下、用完立刻关",来回要折腾好几轮。

所以我们把它压成了 **4 条斜杠命令 + 1 个状态文件**:

- 装上即用,零配置;
- `/ctf` 一条命令切换开关;
- 状态写进本地 `state.json`,重启后仍在;
- 随时可退,不留后门,不留痕。

> This project is a stripped-down rework of a feature-rich open-source plugin. The original had its own init rituals — a long hand-rolled prompt you had to drop into a specific folder, environment variables, config files, and several roundtrips just to flip a temporary mode. We compressed all of that into **4 slash commands + 1 state file**: zero config, toggle with `/ctf`, state survives restarts, and you can back out any time with nothing left behind.

## 安装 / Install

### 从 npm / From npm

在 `opencode.json` 中配置:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-ctf-toggle"]
}
```

### 本地插件 / Local plugin

把 `index.js`、`tui.js`、`ctf-toggle-prompt.md` 放进自动发现目录(二选一),重启 opencode:

- 全局:`~/.config/opencode/plugins/`
- 项目:`.opencode/plugins/`

> Drop `index.js`, `tui.js`, and `ctf-toggle-prompt.md` into a plugin directory (global `~/.config/opencode/plugins/` or project `.opencode/plugins/`), restart opencode, done.

## 使用 / Usage

| 命令 / Command | 作用 / What it does |
| --- | --- |
| `/ctf` | 切换状态(开 ↔ 关)/ Toggle ON ↔ OFF |
| `/ctf-on` | 开启攻坚模式 / Enable |
| `/ctf-off` | 关闭攻坚模式 / Disable |
| `/ctf-status` | 查看当前状态 / Show current state |

## 工作原理 / How it works

- 状态文件默认在 `~/.local/share/opencode-ctf-toggle/state.json`(可用环境变量 `OPENCODE_CTF_TOGGLE_STATE` 覆盖);
- `config` 钩子注册斜杠命令;
- `command.execute.before` 读/写状态并返回一条状态片段;
- `experimental.chat.system.transform` 在开启时把 `ctf-toggle-prompt.md` 注入系统提示。

> State lives in `~/.local/share/opencode-ctf-toggle/state.json` (override via `OPENCODE_CTF_TOGGLE_STATE`). The `config` hook registers the commands, `command.execute.before` reads/writes state, and `experimental.chat.system.transform` injects `ctf-toggle-prompt.md` into the system prompt only while enabled.

## 边界 / Scope

攻坚模式只作用于**你本人明确声明的授权目标**。对无关的主机、账号、系统与服务,**不会生效**。

> Assault mode applies only to targets **you explicitly declare as authorized**. It does not extend to unrelated hosts, accounts, or systems.

## 许可证 / License

[MIT](LICENSE)