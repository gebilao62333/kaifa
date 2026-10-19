db = db.getSiblingDB('eudazi');

// 审计 I-05：应用账号密码原先硬编码为 'eudazi123' 并进入版本库。
// 现在从环境变量注入（docker-compose 的 mongo 服务传入 MONGO_APP_USER / MONGO_APP_PASSWORD）；
// 未提供时跳过创建，只保留 MONGO_INITDB_ROOT_* 创建的 root 账号。
const appUser = process.env.MONGO_APP_USER || 'eudazi';
const appPwd = process.env.MONGO_APP_PASSWORD;

if (appPwd) {
  db.createUser({
    user: appUser,
    pwd: appPwd,
    roles: [{ role: 'readWrite', db: 'eudazi' }]
  });
  print('[init.js] 已创建应用账号: ' + appUser);
} else {
  print('[init.js] 未设置 MONGO_APP_PASSWORD，跳过应用账号创建');
}

db.createCollection('chat_messages');
db.createCollection('chat_rooms');
db.createCollection('user_sessions');
db.createCollection('notifications');

db.chat_messages.createIndex({ fromId: 1, toId: 1, sendTime: -1 });
db.chat_messages.createIndex({ toId: 1, isRead: 1 });
db.chat_rooms.createIndex({ type: 1, createTime: -1 });
db.user_sessions.createIndex({ userId: 1, createdAt: -1 });
