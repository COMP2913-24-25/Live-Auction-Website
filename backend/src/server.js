require('dotenv').config();



const app = require('./app');

let PORT = process.env.PORT || 5000;



const startServer = () => {

  const server = app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

  }).on('error', (e) => {

    if (e.code === 'EADDRINUSE') {

      console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`);

      PORT += 1;

      startServer();

    } else {

      console.error('Server error:', e);

    }

  });

};



startServer();


