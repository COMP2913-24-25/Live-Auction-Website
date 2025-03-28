const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api'
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('Agent Solicitation :', req.method, req.path);
        if (req.body) {
          console.log('Request body:', req.body);
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('Agent Response:', proxyRes.statusCode);
      }
    })
  );
}; 