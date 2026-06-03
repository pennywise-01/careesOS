import { Routes, Route } from 'react-router-dom';
import UserJourney from './screens/UserJourney';
import Dashboard from './screens/Dashboard';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<UserJourney />} />
      <Route path="/reviewer" element={<Dashboard />} />
    </Routes>
  );
}