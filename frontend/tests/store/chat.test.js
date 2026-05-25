import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useChatStore } from '@/store/chat'

describe('Chat Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with empty state', () => {
    const chatStore = useChatStore()
    
    expect(chatStore.currentRoomId).toBeNull()
    expect(chatStore.messageList).toEqual([])
    expect(chatStore.unreadMap).toEqual({})
    expect(chatStore.totalUnread).toBe(0)
  })

  it('should set current room correctly', () => {
    const chatStore = useChatStore()
    const roomId = 'room_123'
    
    chatStore.setCurrentRoom(roomId)
    
    expect(chatStore.currentRoomId).toBe(roomId)
  })

  it('should add message to message list', () => {
    const chatStore = useChatStore()
    const message = {
      id: 1,
      content: 'Hello',
      sender: 'user1'
    }
    
    chatStore.addMessage(message)
    
    expect(chatStore.messageList.length).toBe(1)
    expect(chatStore.messageList[0]).toEqual(message)
  })

  it('should set entire message list', () => {
    const chatStore = useChatStore()
    const messages = [
      { id: 1, content: 'Message 1' },
      { id: 2, content: 'Message 2' }
    ]
    
    chatStore.setMessageList(messages)
    
    expect(chatStore.messageList).toEqual(messages)
    expect(chatStore.messageList.length).toBe(2)
  })

  it('should update unread count for room', () => {
    const chatStore = useChatStore()
    
    chatStore.updateUnread('room_1', 5)
    chatStore.updateUnread('room_2', 3)
    
    expect(chatStore.unreadMap['room_1']).toBe(5)
    expect(chatStore.unreadMap['room_2']).toBe(3)
    expect(chatStore.totalUnread).toBe(8)
  })

  it('should calculate total unread correctly', () => {
    const chatStore = useChatStore()
    
    chatStore.updateUnread('room_1', 10)
    chatStore.updateUnread('room_2', 5)
    
    expect(chatStore.totalUnread).toBe(15)
  })

  it('should clear messages correctly', () => {
    const chatStore = useChatStore()
    const messages = [
      { id: 1, content: 'Message 1' },
      { id: 2, content: 'Message 2' }
    ]
    
    chatStore.setMessageList(messages)
    expect(chatStore.messageList.length).toBe(2)
    
    chatStore.clearMessages()
    
    expect(chatStore.messageList).toEqual([])
  })

  it('should handle multiple message additions', () => {
    const chatStore = useChatStore()
    
    chatStore.addMessage({ id: 1, content: 'First' })
    chatStore.addMessage({ id: 2, content: 'Second' })
    chatStore.addMessage({ id: 3, content: 'Third' })
    
    expect(chatStore.messageList.length).toBe(3)
    expect(chatStore.messageList[0].content).toBe('First')
    expect(chatStore.messageList[2].content).toBe('Third')
  })
})
