# opencode-ctf-toggle

在 OpenCode 中用斜杠命令一键开启/关闭 CTF 模式提示词。

## 简介

这个插件为 OpenCode 注册 4 个斜杠命令,通过磁盘上的一个状态文件(`state.json`)记录是否处于 CTF 模式。开启后,它会把一段"CTF 模式"系统提示注入本轮对话;关闭后不注入。状态持久化,重启后仍然生效。

## 安装

### 从 npm

在 `opencode.json` 中配置:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-ctf-toggle"]
}
```

### 本地插件

把仓库里的 `index.js`、`tui.js`、`ctf-toggle-prompt.md` 放到自动发现目录(二选一),然后重启 opencode:

- 全局:`~/.config/opencode/plugins/`
- 项目:`.opencode/plugins/`

## 使用

| 命令 | 作用 |
| --- | --- |
| `/ctf` | 切换状态(开 ↔ 关) |
| `/ctf-on` | 开启 CTF 模式 |
| `/ctf-off` | 关闭 CTF 模式 |
| `/ctf-status` | 查看当前状态 |

## 工作原理

- 状态文件默认写在 `~/.local/share/opencode-ctf-toggle/state.json`(Linux/macOS)或对应 DATA 目录(可通过环境变量 `OPENCODE_CTF_TOGGLE_STATE` 覆盖)。
- `config` 钩子注册斜杠命令;
- `command.execute.before` 钩子读取/写入状态并回复状态片段;
- `experimental.chat.system.transform` 钩子在开启时注入 `ctf-toggle-prompt.md` 的内容到系统提示。

## 许可证

[MIT](LICENSE)