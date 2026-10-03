import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/chatService', () => ({
  default: {
    getChatList: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    revokeMessage: vi.fn(),
    markAsRead: vi.fn()
  }
}))

vi.mock('@/services/socketService', () => ({
  default: {
    on: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn()
  }
}))

import { useChatStore } from '@/store/chat'
import chatService from '@/services/chatService'
import socketService from '@/services/socketService'

const ok = (data) => ({ code: 200, data })

const handlerFor = (event) => {
  const call = socketService.on.mock.calls.find((c) => c[0] === event)
  return call ? call[1] : null
}

describe('Chat Store - actions', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    // 错误分支会由被测代码打印 console.error，这里静音以保持测试输出可读
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    localStorage.clear()
    setActivePinia(createPinia())
    store = useChatStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ---------- getters ----------

  it('getTotalUnread 汇总聊天与通知未读', () => {
    store.totalUnread = 3
    store.noticeUnread = 2
    expect(store.getTotalUnread).toBe(5)
    store.totalUnread = null
    store.noticeUnread = undefined
    expect(store.getTotalUnread).toBe(0)
  })

  it('getChatUnread 对非法值返回 0', () => {
    store.unreadMap = { 7: 4, 8: 0, 9: 'abc' }
    expect(store.getChatUnread(7)).toBe(4)
    expect(store.getChatUnread(8)).toBe(0)
    expect(store.getChatUnread(9)).toBe(0)
    expect(store.getChatUnread(999)).toBe(0)
  })

  // ---------- 列表 ----------

  it('fetchChatList 首页覆盖列表', async () => {
    chatService.getChatList.mockResolvedValue(ok({ list: [{ id: 1 }] }))
    const r = await store.fetchChatList(1, 20)
    expect(r.success).toBe(true)
    expect(store.chatList).toEqual([{ id: 1 }])
    expect(store.loading).toBe(false)
  })

  it('fetchChatList 非首页追加列表', async () => {
    store.chatList = [{ id: 1 }]
    chatService.getChatList.mockResolvedValue(ok([{ id: 2 }]))
    const r = await store.fetchChatList(2, 20)
    expect(r.success).toBe(true)
    expect(store.chatList).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('fetchChatList 业务失败返回失败结构', async () => {
    chatService.getChatList.mockResolvedValue({ code: 500, message: '服务器错误' })
    const r = await store.fetchChatList(1, 20)
    expect(r).toEqual({ success: false, message: '服务器错误' })
  })

  it('fetchChatList 抛异常时兜底并复位 loading', async () => {
    chatService.getChatList.mockRejectedValue(new Error('boom'))
    const r = await store.fetchChatList(1, 20)
    expect(r.success).toBe(false)
    expect(r.message).toBe('boom')
    expect(store.loading).toBe(false)
  })

  // ---------- 消息 ----------

  it('fetchMessages 首页覆盖并推算 hasMore', async () => {
    chatService.getMessages.mockResolvedValue(ok({ list: [{ a: 1 }, { a: 2 }] }))
    const r = await store.fetchMessages(5, 1, 2)
    expect(r.success).toBe(true)
    expect(store.messageList).toHaveLength(2)
    expect(store.hasMoreMessages).toBe(true)
    expect(store.currentPage).toBe(1)
  })

  it('fetchMessages 非首页前插历史消息', async () => {
    store.messageList = [{ a: 9 }]
    chatService.getMessages.mockResolvedValue(ok({ list: [{ a: 1 }] }))
    await store.fetchMessages(5, 2, 20)
    expect(store.messageList).toEqual([{ a: 1 }, { a: 9 }])
    expect(store.hasMoreMessages).toBe(false)
  })

  it('fetchMessages 失败返回失败结构', async () => {
    chatService.getMessages.mockResolvedValue({ code: 500 })
    const r = await store.fetchMessages(5, 1, 20)
    expect(r.success).toBe(false)
    expect(store.messageLoading).toBe(false)
  })

  it('fetchMessages 抛异常时兜底', async () => {
    chatService.getMessages.mockRejectedValue(new Error('net'))
    const r = await store.fetchMessages(5, 1, 20)
    expect(r.message).toBe('net')
  })

  it('sendMessage 成功后写入本地消息列表', async () => {
    store.currentChatUser = { userId: 11 }
    chatService.sendMessage.mockResolvedValue(ok({ messageId: 100 }))
    const r = await store.sendMessage(22, '你好', 0, '', 0)
    expect(r.success).toBe(true)
    expect(store.messageList).toHaveLength(1)
    expect(store.messageList[0].messageId).toBe(100)
    expect(store.messageList[0].toUserId).toBe(22)
    expect(store.messageList[0].fromUserId).toBe(11)
  })

  it('sendMessage 失败返回失败结构', async () => {
    chatService.sendMessage.mockResolvedValue({ code: 500, message: '发送失败' })
    const r = await store.sendMessage(22, 'hi')
    expect(r).toEqual({ success: false, message: '发送失败' })
  })

  it('sendMessage 抛异常时兜底', async () => {
    chatService.sendMessage.mockRejectedValue(new Error('x'))
    const r = await store.sendMessage(22, 'hi')
    expect(r.message).toBe('x')
  })

  it('revokeMessage 命中本地消息时改写内容', async () => {
    store.messageList = [{ messageId: 1, content: 'hi', type: 0 }]
    chatService.revokeMessage.mockResolvedValue(ok({}))
    const r = await store.revokeMessage(1)
    expect(r.success).toBe(true)
    expect(store.messageList[0].content).toBe('[消息已撤回]')
    expect(store.messageList[0].type).toBe(7)
  })

  it('revokeMessage 未命中本地消息也返回成功', async () => {
    chatService.revokeMessage.mockResolvedValue(ok({}))
    const r = await store.revokeMessage(404)
    expect(r.success).toBe(true)
  })

  it('revokeMessage 失败与异常分支', async () => {
    chatService.revokeMessage.mockResolvedValue({ code: 500 })
    expect((await store.revokeMessage(1)).success).toBe(false)
    chatService.revokeMessage.mockRejectedValue(new Error('e'))
    expect((await store.revokeMessage(1)).message).toBe('e')
  })

  it('markAsRead 成功时清零未读并通知 socket', async () => {
    store.unreadMap = { 3: 5 }
    chatService.markAsRead.mockResolvedValue(ok({}))
    const r = await store.markAsRead(3)
    expect(r.success).toBe(true)
    expect(store.unreadMap[3]).toBe(0)
    expect(socketService.emit).toHaveBeenCalledWith('message:read', { fromUserId: 3 })
  })

  it('markAsRead 失败与异常分支', async () => {
    chatService.markAsRead.mockResolvedValue({ code: 500, message: 'no' })
    expect((await store.markAsRead(3)).success).toBe(false)
    chatService.markAsRead.mockRejectedValue(new Error('e'))
    expect((await store.markAsRead(3)).message).toBe('e')
  })

  // ---------- socket 事件 ----------

  it('setupSocketListeners 注册三个事件', () => {
    store.setupSocketListeners()
    expect(socketService.on).toHaveBeenCalledWith('private_message', expect.any(Function))
    expect(socketService.on).toHaveBeenCalledWith('message:read', expect.any(Function))
    expect(socketService.on).toHaveBeenCalledWith('message_revoked', expect.any(Function))
  })

  it('private_message：来自当前会话时入库并标记已读', async () => {
    store.setupSocketListeners()
    store.setCurrentChat({ userId: 5 })
    chatService.markAsRead.mockResolvedValue(ok({}))
    handlerFor('private_message')({ fromId: 5, messageId: 1, content: 'hi' })
    expect(store.messageList).toHaveLength(1)
    expect(chatService.markAsRead).toHaveBeenCalledWith(5)
  })

  it('private_message：来自其他用户时累加未读并更新会话摘要', () => {
    store.setupSocketListeners()
    store.chatList = [{ targetUserId: 9, unreadCount: 1, lastMessage: '' }]
    handlerFor('private_message')({ fromId: 9, content: 'hi', sendTime: 1000 })
    expect(store.unreadMap[9]).toBe(1)
    expect(store.chatList[0].unreadCount).toBe(2)
    expect(store.chatList[0].lastMessage).toBe('hi')
    expect(store.chatList[0].lastMessageTime).toBe(1000000)
  })

  it('private_message：fromId 缺失时直接返回', () => {
    store.setupSocketListeners()
    handlerFor('private_message')({ content: 'x' })
    expect(store.messageList).toHaveLength(0)
    expect(store.totalUnread).toBe(0)
  })

  it('private_message：兼容 fromUserId 字段且会话不存在时不报错', () => {
    store.setupSocketListeners()
    handlerFor('private_message')({ fromUserId: 77, content: 'y' })
    expect(store.unreadMap[77]).toBe(1)
  })

  it('message:read 将我方消息标记为已读', () => {
    store.setupSocketListeners()
    store.messageList = [{ toUserId: 3, status: 'sent' }, { toUserId: 4, status: 'sent' }]
    handlerFor('message:read')({ fromUserId: 3 })
    expect(store.messageList[0].status).toBe('read')
    expect(store.messageList[1].status).toBe('sent')
  })

  it('message_revoked 改写对应消息', () => {
    store.setupSocketListeners()
    store.messageList = [{ messageId: 8, content: 'a', type: 0 }]
    handlerFor('message_revoked')({ messageId: 8 })
    expect(store.messageList[0].content).toBe('[消息已撤回]')
    expect(store.messageList[0].type).toBe(7)
  })

  it('message_revoked 未命中时不报错', () => {
    store.setupSocketListeners()
    handlerFor('message_revoked')({ messageId: 999 })
    expect(store.messageList).toHaveLength(0)
  })

  // ---------- 状态操作 ----------

  it('setCurrentChat 重置消息与分页', () => {
    store.messageList = [{ a: 1 }]
    store.setCurrentChat({ userId: 1, roomId: 'r1' })
    expect(store.currentChatUser).toEqual({ userId: 1, roomId: 'r1' })
    expect(store.currentRoomId).toBe('r1')
    expect(store.messageList).toEqual([])
    expect(store.hasMoreMessages).toBe(true)
  })

  it('addMessage 依据 messageId/id 去重', () => {
    store.addMessage({ messageId: 1, content: 'a' })
    store.addMessage({ messageId: 1, content: 'b' })
    expect(store.messageList).toHaveLength(1)
    store.addMessage({ id: 2, content: 'c' })
    store.addMessage({ id: 2, content: 'd' })
    expect(store.messageList).toHaveLength(2)
  })

  it('addMessages 与各类未读设置', () => {
    store.addMessages([{ id: 1 }, { id: 2 }])
    expect(store.messageList).toHaveLength(2)
    store.setChatUnread('7')
    expect(store.totalUnread).toBe(7)
    store.setNoticeUnread(4)
    expect(store.noticeUnread).toBe(4)
    store.clearAllUnread()
    expect(store.totalUnread).toBe(0)
    expect(store.noticeUnread).toBe(0)
    expect(store.unreadMap).toEqual({})
  })

  it('updateUnread 忽略非法计数', () => {
    store.updateUnread(1, 'abc')
    expect(store.unreadMap[1]).toBe(0)
    expect(store.totalUnread).toBe(0)
  })

  it('clearCurrentChat 清空会话与消息', () => {
    store.setCurrentChat({ userId: 1 })
    store.messageList = [{ a: 1 }]
    store.clearCurrentChat()
    expect(store.currentChatUser).toBeNull()
    expect(store.currentRoomId).toBeNull()
    expect(store.messageList).toEqual([])
  })

  // ---------- socket 连接 ----------

  it('initSocketConnection 有 token 时连接并监听', () => {
    localStorage.setItem('token', 'abc')
    store.initSocketConnection()
    expect(socketService.connect).toHaveBeenCalled()
    expect(store.socketConnected).toBe(true)
    expect(socketService.on).toHaveBeenCalled()
  })

  it('initSocketConnection 无 token 时不连接', () => {
    store.initSocketConnection()
    expect(socketService.connect).not.toHaveBeenCalled()
    expect(store.socketConnected).toBe(false)
  })

  it('disconnectSocket 断开并复位标记', () => {
    store.socketConnected = true
    store.disconnectSocket()
    expect(socketService.disconnect).toHaveBeenCalled()
    expect(store.socketConnected).toBe(false)
  })
})
