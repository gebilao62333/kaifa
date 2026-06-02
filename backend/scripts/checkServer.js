const net = require('net');

const port = 3001;
const host = 'localhost';

const socket = new net.Socket();

socket.setTimeout(3000);

socket.on('connect', () => {
  console.log(`✅ 后端服务已启动，端口 ${port} 正在监听`);
  socket.destroy();
  process.exit(0);
});

socket.on('timeout', () => {
  console.log(`❌ 连接超时：端口 ${port} 未响应`);
  socket.destroy();
  process.exit(1);
});

socket.on('error', (err) => {
  console.log(`❌ 连接失败：${err.message}`);
  process.exit(1);
});

socket.connect(port, host);
