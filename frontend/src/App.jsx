import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuctionList from './components/AuctionList';
import UploadTest from './components/UploadTest';

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<AuctionList />} />
      {/* Add other routes here, e.g., for auction detail pages */}
      <Route path="/upload/" element={<UploadTest />} />
    </Routes>
  </Router>
);

export default App;
