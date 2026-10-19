// 服务端历史消息 → 聊天气泡数据的前端映射辅助。
//
// 撤回态的唯一真相来源是服务端 isRevoked 字段：如果只依赖发送时写下的本地内存状态，
// 刷新页面或重新进入会话后，已撤回消息会从历史消息接口原样复活。
export const REVOKED_PLACEHOLDER = '【消息已撤回】'

export const isRevokedMessage = (item) => !!(item && item.isRevoked)

// 覆盖原文并转成 system 气泡（与发送方撤回、对方收到 socket 通知后的渲染保持一致）
export const applyRevokedState = (message) => {
  if (!message) return message
  return {
    ...message,
    content: REVOKED_PLACEHOLDER,
    type: 'system',
    status: 'recalled'
  }
}

// 时间自动撤回：服务端在消息上写 expireAt（到期绝对时间戳，秒；0=不自动撤回）。
// 到期判定放在这里，便于「读接口兜底」与「本地展示倒计时」共用一个口径。
export const isChatMessageExpired = (expireAt, nowMs = Date.now()) => {
  const at = Number(expireAt) || 0
  return at > 0 && at * 1000 <= nowMs
}
