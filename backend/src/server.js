require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const app = require('./app');
const PORT = process.env.PORT || 5000; // Changed from 5000 to 5001

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
