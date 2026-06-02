const net = require('net');

const checkPort = (port, host = 'localhost') => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve({ port, status: 'open', message: `端口 ${port} 正在监听` });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ port, status: 'timeout', message: `端口 ${port} 连接超时` });
    });
    
    socket.on('error', (err) => {
      socket.destroy();
      const status = err.code === 'ECONNREFUSED' ? 'closed' : 'error';
      resolve({ port, status, message: `端口 ${port} ${err.message}` });
    });
    
    socket.connect(port, host);
  });
};

(async () => {
  console.log('📋 端口状态检查\n');
  
  const ports = [3001, 5173];
  
  const results = await Promise.all(ports.map(port => checkPort(port)));
  
  results.forEach(result => {
    const statusIcon = result.status === 'open' ? '✅' : '❌';
    console.log(`${statusIcon} 端口 ${result.port}: ${result.message}`);
  });
  
  console.log('\n🔍 检查完成');
})();
