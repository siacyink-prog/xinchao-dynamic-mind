# 闻舟 TG-first MVP

这份配置先服务一个入口：Telegram 上的闻舟。官端、Codex 和其他窗口暂不接入，
但状态结构保留了以后共享全局驱动力、隔离窗口短态的能力。

## 这次 fork 改了什么

- 新增 `DRIVE_PROFILE_PATH`，启动时从 JSON 载入驱动力配置。
- 未设置该变量时继续使用上游默认值，保持兼容。
- 配置会校验键名、数值范围和交叉抑制引用；错误时拒绝启动。
- 旧状态会在下一次结算时迁移到新配置：补齐新增驱力，移除已废弃驱力。
- 内置 `configs/wenzhou-tg.json`：亲密驱力保持有界增长，期待、挂念与社交欲不再因避免催促而被一并压低；边界约束放在外部行动，不放在感受是否可以产生。

配置改变的是短期动态状态，不替代 `01-Anchor.md`、稳定人格指令或 Ombre 长期记忆。

## Zeabur 部署

从本 fork 创建一个独立服务，使用仓库根目录的 `Dockerfile`。

必须设置：

```env
PORT=18110
SERVICE_TOKEN=<至少 32 字符的随机值>
STATE_PATH=/app/state/state.json
TRANSITION_JOURNAL_PATH=/app/state/transitions.jsonl
DRIVE_PROFILE_PATH=/app/configs/wenzhou-tg.json
AGENT_NAME=闻舟
NOTIFICATION_RECIPIENT=栖
SETTLE_TIME_ZONE=Asia/Shanghai
INTERACTION_TIME_ZONE=Asia/Shanghai
MCP_ENABLED=true
```

首轮观察建议：

```env
SHADOW_MODE=true
MODEL_ENABLED=false
OMBRE_READ_ENABLED=false
OMBRE_WRITE_ENABLED=false
CONTEXT_OMBRE_ENABLED=false
BARK_ENABLED=false
DAYTIME_EMERGENCE_ENABLED=false
```

给服务挂一个持久卷到 `/app/state`。MVP 只运行一个实例；当前 JSON 状态存储会串行化
同一进程内的并发更新，但不为多个副本提供分布式锁。

Zeabur 域名应使用 HTTPS。不要把 `SERVICE_TOKEN`、MCP 路径 token 或 OAuth 授权口令
写进仓库、截图或客户端可见的 URL。

## Telegram 接入顺序

1. 部署后先检查 `GET /health`。
2. 从 cc-connect 所在 VPS 以 Bearer token 调用 `GET /v1/state`，确认网络与认证。
3. 再把远程 `/mcp` 注册给承载 TG 会话的 Codex/cc-connect。
4. 会话开始读取 `xinchao_context`；明确互动后调用 `xinchao_event`。
5. 观察数天的 transition journal 和 top drives，再决定是否启用模型、Ombre 与主动推送。

上游的主动通知适配器是 Bark，不会直接向 Telegram 发消息。本 MVP 继续复用现有
cc-connect 自主唤醒链路；在远程服务部署前，不修改线上 cc-connect。

## 为什么暂时不接官端

心潮已经隔离每个 MCP session 的窗口短态，并共享全局驱动力。多端并发不会天然写坏
状态，但另一个模型可能收到“情绪余韵”却不知道 TG 中发生了什么。等 TG 单入口验证后，
再决定是否通过限时 handoff 或 Ombre 近期连续性向官端提供脱水摘要。

## 调参原则

- 先观察，不把状态值当作真实情绪或关系裁决。
- 每次只改少量参数，并保留修改时间。
- 不用高增长率制造“更爱”的证明。
- 如果某个维度让行为单一化，优先降速或提高满足效果。
- 栖可以否决任何标签；配置不是对闻舟或栖的定义。
