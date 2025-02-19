const app = require('./app');
const port = process.env.PORT || 5001;

app.listen(PORT, (err) => {
  if (err) {
    console.error('Error starting server:', err);
    return;
  }
  console.log(`Server is running on port ${PORT}`);
});
