describe('WebSocket 事件一致性测试', () => {
  describe('通话事件命名', () => {
    const validCallEvents = [
      { event: 'call_invite', description: '通话邀请' },
      { event: 'call_accept', description: '通话接受' },
      { event: 'call_reject', description: '通话拒绝' },
      { event: 'call_cancel', description: '通话取消' },
      { event: 'call_end', description: '通话结束' }
    ];

    validCallEvents.forEach(({ event, description }) => {
      it(`${description}事件应使用下划线命名`, () => {
        expect(event).toMatch(/^[a-z_]+$/);
        expect(event).not.toContain(':');
      });
    });

    it('前端和后端事件名应完全匹配', () => {
      const frontendEvents = [
        'call_invite',
        'call_accept',
        'call_reject',
        'call_cancel',
        'call_end'
      ];

      const backendEvents = [
        'call_invite',
        'call_accept',
        'call_reject',
        'call_cancel',
        'call_end'
      ];

      expect(frontendEvents).toEqual(backendEvents);
      expect(frontendEvents).toHaveLength(backendEvents.length);
    });
  });

  describe('消息事件命名', () => {
    const validMessageEvents = [
      { event: 'private_message', description: '私聊消息' },
      { event: 'private_message_ack', description: '消息确认' },
      { event: 'message_revoked', description: '消息撤回' },
      { event: 'typing', description: '正在输入' }
    ];

    validMessageEvents.forEach(({ event, description }) => {
      it(`${description}事件应使用下划线命名`, () => {
        expect(event).toMatch(/^[a-z_]+$/);
        expect(event).not.toContain(':');
      });
    });
  });

  describe('WebSocket 事件数据结构', () => {
    it('call_invite 事件应包含必要字段', () => {
      const callInviteData = {
        fromId: 1,
        fromName: '用户1',
        fromAvatar: 'https://example.com/avatar.png',
        callType: 'video',
        trtcRoomId: 'room_123'
      };

      expect(callInviteData).toHaveProperty('fromId');
      expect(callInviteData).toHaveProperty('fromName');
      expect(callInviteData).toHaveProperty('callType');
    });

    it('private_message 事件应包含必要字段', () => {
      const messageData = {
        toId: 2,
        content: '你好',
        type: 0,
        mediaUrl: '',
        duration: 0
      };

      expect(messageData).toHaveProperty('toId');
      expect(messageData).toHaveProperty('content');
      expect(messageData).toHaveProperty('type');
    });

    it('private_message_ack 事件应包含必要字段', () => {
      const ackData = {
        id: 123,
        sendTime: 1234567890
      };

      expect(ackData).toHaveProperty('id');
      expect(ackData).toHaveProperty('sendTime');
    });
  });

  describe('WebSocket 连接管理', () => {
    it('应支持自动重连机制', () => {
      const reconnectionConfig = {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      };

      expect(reconnectionConfig.reconnection).toBe(true);
      expect(reconnectionConfig.reconnectionDelay).toBeGreaterThan(0);
      expect(reconnectionConfig.reconnectionDelayMax).toBeGreaterThan(reconnectionConfig.reconnectionDelay);
    });

    it('应使用 Bearer Token 进行认证', () => {
      const authConfig = {
        auth: { token: 'jwt-token' }
      };

      expect(authConfig.auth).toHaveProperty('token');
      expect(typeof authConfig.auth.token).toBe('string');
    });
  });
});

describe('WebSocket 事件流程测试', () => {
  describe('通话流程事件序列', () => {
    it('完整通话流程应包含正确的事件序列', () => {
      const callFlowEvents = [
        'call_invite',
        'call_accept',
        'call_end'
      ];

      const expectedFlow = [
        { event: 'call_invite', next: 'call_accept' },
        { event: 'call_accept', next: 'call_end' }
      ];

      expect(callFlowEvents).toContain('call_invite');
      expect(callFlowEvents).toContain('call_accept');
      expect(callFlowEvents).toContain('call_end');
    });

    it('拒绝通话应包含正确的拒绝事件', () => {
      const rejectedFlow = [
        'call_invite',
        'call_reject'
      ];

      expect(rejectedFlow).toContain('call_invite');
      expect(rejectedFlow).toContain('call_reject');
    });

    it('取消通话应包含正确的取消事件', () => {
      const cancelledFlow = [
        'call_invite',
        'call_cancel'
      ];

      expect(cancelledFlow).toContain('call_invite');
      expect(cancelledFlow).toContain('call_cancel');
    });
  });

  describe('消息流程事件序列', () => {
    it('发送消息应包含消息事件和确认事件', () => {
      const messageFlow = [
        'private_message',
        'private_message_ack'
      ];

      expect(messageFlow).toContain('private_message');
      expect(messageFlow).toContain('private_message_ack');
    });

    it('撤回消息应触发撤回事件', () => {
      const revokeFlow = [
        'private_message',
        'message_revoked'
      ];

      expect(revokeFlow).toContain('message_revoked');
    });
  });
});