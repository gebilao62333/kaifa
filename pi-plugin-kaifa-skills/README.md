# kaifa 项目技能包（`kaifa.skills`）

把 kaifa（eu搭子）项目的工程约定做成 11 个可加载技能，供 PI-Desktop 智能体按需调用。

## 内容

| 技能 | 用途 |
|---|---|
| `kaifa-project-index` | 索引：环境口径、按改动面选择技能、跨技能硬约束 |
| `kaifa-backend-feature` | 后端加接口/服务/模型（routes → controllers → services → models + jest） |
| `kaifa-vue-page` | 用户端/管理端页面、路由、service、store（含 vitest 模板） |
| `kaifa-verify-change` | 改动验收：按改动面选最小充分验证集并给证据 |
| `kaifa-deploy-check` | 发布/部署自检：启动闸门、compose、nginx、健康检查、Sealos |
| `kaifa-doc-sync` | 文档真源同步（12 份文档地图 + 版本历史条目格式） |
| `kaifa-e2e-probe` | `.e2e-run/` 联调探针（HTTP 断言 + Playwright 截图 + 清理） |
| `kaifa-security-invariants` | 31 项已收口安全不变量回归清单 + 未收口 S-1 + 复核命令 |
| `kaifa-db-migration` | 迁移幂等范式、自动迁移接线缺口、备份先行、PII 列加宽顺序、存量对账 |
| `kaifa-money-path` | 资金链路幂等写入点、金币/元/分单位、提现 `is_check` 与多退风险 |
| `kaifa-call-chain` | TRTC/P2P/TURN 通道策略、通话单状态机与计费、清理器、探针与真机边界 |

每个技能都包含 `When to Use / Procedure（含可直接执行的 PowerShell 命令）/ Verification / Pitfalls`，并附一段「subagent 简报（路线 A）」——因为 subagent 不会自行加载技能，简报需整段内联到 `Task` 的 `task` 参数。

## 安装

- 开发态：本目录由 `PluginScaffold` 生成并已作为开发插件加载（保存即热重载）。
- 分发：用 `PluginPack` 打包为 `dist/kaifa.skills-1.0.0.piplug`，再由用户在 Settings → Plugins 安装。
  **不要**用 zip/7z 自己压，安装器只接受未压缩归档。

## 维护（技能真源）

技能的单一真源是用户级技能目录（在 Settings → Skills 里可见的那 11 个 `kaifa-*`），本目录 `skills/*.md` 是副本。
改完真源后，用 `skill_manage` 的 patch 更新真源，再把 11 个 `SKILL.md` 复制覆盖到本目录 `skills/`，随后重跑 `PluginCheck` 或直接 `PluginPack`（打包前会先校验）。
