require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const app = require('./app');
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('Error starting server:', err);
    return;
  }
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    PORT: process.env.PORT,
    VITE_API_URL: process.env.VITE_API_URL,
    VITE_FRONTEND_URL: process.env.VITE_FRONTEND_URL
  });
});
