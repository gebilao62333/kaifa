db = db.getSiblingDB('duoke');

db.createUser({
    user: 'duoke',
    pwd: 'duoke123',
    roles: [{ role: 'readWrite', db: 'duoke' }]
});

db.createCollection('chat_messages');
db.createCollection('chat_rooms');
db.createCollection('user_sessions');
db.createCollection('notifications');

db.chat_messages.createIndex({ fromId: 1, toId: 1, sendTime: -1 });
db.chat_messages.createIndex({ toId: 1, isRead: 1 });
db.chat_rooms.createIndex({ type: 1, createTime: -1 });
db.user_sessions.createIndex({ userId: 1, createdAt: -1 });
