/**
 * SSE 连接调试工具
 */

/**
 * 测试 SSE 连接是否可用
 * 在浏览器控制台运行: testSSEConnection(yourToken)
 */
export function testSSEConnection(token: string, baseUrl: string = 'http://localhost:3888'): void {
  console.group('🔍 SSE 连接诊断');
  
  const url = `${baseUrl}/api/v1/sse/notifications/events?token=${encodeURIComponent(token)}`;
  
  console.log('1️⃣ 连接信息:');
  console.log('   Base URL:', baseUrl);
  console.log('   完整 URL:', url);
  console.log('   Token (前20字符):', token.substring(0, 20) + '...');
  
  console.log('\n2️⃣ 创建 EventSource...');
  const testSource = new EventSource(url);
  
  console.log('   初始 readyState:', testSource.readyState);
  console.log('   URL:', testSource.url);
  console.log('   withCredentials:', testSource.withCredentials);
  
  // 设置事件监听
  testSource.onopen = () => {
    console.log('\n✅ 3️⃣ 连接成功!');
    console.log('   readyState:', testSource.readyState);
    console.log('   可以在浏览器 Network 面板查看实时事件流');
  };
  
  testSource.onerror = (error) => {
    console.error('\n❌ 3️⃣ 连接失败!');
    console.error('   readyState:', testSource.readyState);
    console.error('   Error:', error);
    
    if (testSource.readyState === EventSource.CONNECTING) {
      console.warn('   状态: CONNECTING - 连接正在建立中（或反复重试）');
      console.warn('   可能原因:');
      console.warn('   - Token 无效或已过期');
      console.warn('   - 后端 SSE 端点未启动');
      console.warn('   - CORS 配置问题');
      console.warn('   - 网络问题');
    } else if (testSource.readyState === EventSource.CLOSED) {
      console.error('   状态: CLOSED - 连接已关闭');
      console.error('   检查后端日志查看详细错误信息');
    }
  };
  
  testSource.onmessage = (event) => {
    console.log('\n📨 收到消息:', event.data);
  };
  
  testSource.addEventListener('connected', (event: any) => {
    console.log('\n🔗 连接建立事件:', event.data);
  });
  
  testSource.addEventListener('heartbeat', (event: any) => {
    console.log('\n💓 心跳:', event.data);
  });
  
  // 10 秒后检查状态
  setTimeout(() => {
    console.log('\n⏱️ 10秒后状态检查:');
    console.log('   readyState:', testSource.readyState);
    
    if (testSource.readyState === EventSource.CONNECTING) {
      console.warn('   ⚠️ 仍在 CONNECTING 状态，连接可能有问题');
      console.warn('   建议:');
      console.warn('   1. 检查浏览器 Network 面板是否有请求');
      console.warn('   2. 检查请求的状态码');
      console.warn('   3. 查看后端日志');
      console.warn('   4. 验证 token 是否有效');
    } else if (testSource.readyState === EventSource.OPEN) {
      console.log('   ✅ 连接正常');
    } else {
      console.error('   ❌ 连接已关闭');
    }
    
    console.log('\n要关闭测试连接，运行: testSource.close()');
    console.groupEnd();
  }, 10000);
  
  // 将 testSource 暴露到全局，方便手动关闭
  (window as any).testSource = testSource;
  console.log('\n💡 提示: testSource 已保存到 window.testSource');
  console.log('   手动关闭: window.testSource.close()');
  console.groupEnd();
}

/**
 * 快速检查 SSE 客户端状态
 */
export function checkSSEClientStatus(): void {
  const sseClient = (window as any).sseClient;
  
  if (!sseClient) {
    console.error('❌ SSE 客户端未初始化');
    console.log('   可能原因:');
    console.log('   1. 未登录');
    console.log('   2. SSE 客户端未挂载到 window');
    return;
  }
  
  const status = sseClient.getStatus();
  
  console.group('📊 SSE 客户端状态');
  console.log('连接状态:', status.connected ? '✅ 已连接' : '❌ 未连接');
  console.log('ReadyState:', status.readyState, getReadyStateText(status.readyState));
  console.log('重连次数:', status.reconnectAttempts);
  console.groupEnd();
}

function getReadyStateText(state: number | null): string {
  if (state === null) return '(无连接)';
  
  switch (state) {
    case EventSource.CONNECTING:
      return '(CONNECTING - 连接中)';
    case EventSource.OPEN:
      return '(OPEN - 已连接)';
    case EventSource.CLOSED:
      return '(CLOSED - 已关闭)';
    default:
      return `(Unknown - ${state})`;
  }
}

// 暴露到全局以便在控制台使用
if (typeof window !== 'undefined') {
  (window as any).testSSEConnection = testSSEConnection;
  (window as any).checkSSEClientStatus = checkSSEClientStatus;
}
