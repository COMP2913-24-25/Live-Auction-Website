require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const app = require('./app');
const PORT = process.env.PORT || 5001;

app.listen(PORT, (err) => {
  if (err) {
    console.error('Error starting server:', err);
    return;
  }
  console.log(`Server running on port ${PORT}`);
});
