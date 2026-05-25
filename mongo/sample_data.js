db = db.getSiblingDB('duoke');

// 聊天消息数据
db.chat_messages.insertMany([
  {
    _id: ObjectId(),
    room_id: 1,
    sender_id: 1,
    sender_type: 'user',
    content: '你好，在吗？',
    message_type: 'text',
    created_at: new Date(Date.now() - 3600000 * 24 * 2)
  },
  {
    _id: ObjectId(),
    room_id: 1,
    sender_id: 1,
    sender_type: 'virtual',
    content: '在的呢，有什么可以帮到您？',
    message_type: 'text',
    created_at: new Date(Date.now() - 3600000 * 24 * 2 + 60000)
  },
  {
    _id: ObjectId(),
    room_id: 1,
    sender_id: 1,
    sender_type: 'user',
    content: '想找你一起玩王者荣耀',
    message_type: 'text',
    created_at: new Date(Date.now() - 3600000 * 24 * 2 + 120000)
  },
  {
    _id: ObjectId(),
    room_id: 1,
    sender_id: 1,
    sender_type: 'virtual',
    content: '好的呀，什么时候开始呢？',
    message_type: 'text',
    created_at: new Date(Date.now() - 3600000 * 24 * 2 + 180000)
  },
  {
    _id: ObjectId(),
    room_id: 2,
    sender_id: 2,
    sender_type: 'user',
    content: '英雄联盟能带我上分吗？',
    message_type: 'text',
    created_at: new Date(Date.now() - 3600000 * 24)
  },
  {
    _id: ObjectId(),
    room_id: 2,
    sender_id: 2,
    sender_type: 'virtual',
    content: '没问题，我打野很稳的',
    message_type: 'text',
    created_at: new Date(Date.now() - 3600000 * 24 + 60000)
  }
]);

// 通知数据
db.notifications.insertMany([
  {
    _id: ObjectId(),
    user_id: 1,
    title: '新消息',
    content: '您有一条新的聊天消息',
    type: 'message',
    read: false,
    created_at: new Date(Date.now() - 3600000)
  },
  {
    _id: ObjectId(),
    user_id: 2,
    title: '预约成功',
    content: '您的预约已确认',
    type: 'system',
    read: true,
    created_at: new Date(Date.now() - 3600000 * 24)
  },
  {
    _id: ObjectId(),
    user_id: 3,
    title: '收到礼物',
    content: '您收到了一个皇冠礼物',
    type: 'gift',
    read: false,
    created_at: new Date(Date.now() - 7200000)
  }
]);

// 用户会话数据
db.user_sessions.insertMany([
  {
    _id: ObjectId(),
    user_id: 1,
    token: 'sample_token_1',
    device_type: 'mobile',
    device_info: 'iPhone 14',
    ip: '192.168.1.100',
    created_at: new Date(Date.now() - 3600000 * 24 * 30),
    expires_at: new Date(Date.now() + 3600000 * 24 * 30)
  },
  {
    _id: ObjectId(),
    user_id: 2,
    token: 'sample_token_2',
    device_type: 'android',
    device_info: 'Samsung Galaxy S22',
    ip: '192.168.1.101',
    created_at: new Date(Date.now() - 3600000 * 24 * 15),
    expires_at: new Date(Date.now() + 3600000 * 24 * 30)
  }
]);

print('MongoDB虚拟数据导入完成');
