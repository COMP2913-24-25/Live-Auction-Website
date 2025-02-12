import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuctionList from './components/AuctionList';

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<AuctionList />} />
      {/* Add other routes here, e.g., for auction detail pages */}
    </Routes>
  </Router>
);

export default App;
