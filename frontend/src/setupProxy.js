const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 创建代理配置，将/api开头的请求转发到后端服务器
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      // 在请求和响应之前添加日志
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] Request: ${req.method} ${req.url}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy] Response: ${proxyRes.statusCode} ${req.url}`);
      },
      // 处理连接错误
      onError: (err, req, res) => {
        console.error('[Proxy] Error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: 'Unable to connect to API server' }));
      }
    })
  );
}; 