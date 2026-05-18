const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://127.0.0.1:8080',
      changeOrigin: true,
      secure: false,
      onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      },
      headers: {
        'Origin': 'http://127.0.0.1:8080' // 서버를 속이기 위해 Origin 헤더를 서버 주소로 일치시킴
      }
    })
  );
};
