import { Routes, Route } from 'react-router-dom';
import Landing from './screens/Landing';
import UserJourney from './screens/UserJourney';
import NormalApplicantFlow from './screens/NormalApplicantFlow';
import Dashboard from './screens/Dashboard';
import NormalReviewerDashboard from './screens/NormalReviewerDashboard';
import NormalJobPost from './screens/NormalJobPost';
import PremiumJobPost from './screens/PremiumJobPost';
import PremiumAdvertiserHub from './screens/PremiumAdvertiserHub';

export default function AppRouter() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<Landing />} />

      {/* Applicant flows */}
      <Route path="/apply/premium" element={<UserJourney />} />
      <Route path="/apply/normal" element={<NormalApplicantFlow />} />

      {/* Reviewer dashboards */}
      <Route path="/reviewer/premium" element={<Dashboard />} />
      <Route path="/reviewer/normal" element={<NormalReviewerDashboard />} />

      {/* Premium advertiser hub */}
      <Route path="/advertiser/premium" element={<PremiumAdvertiserHub />} />

      {/* Job posting */}
      <Route path="/post/normal" element={<NormalJobPost />} />
      <Route path="/post/premium" element={<PremiumJobPost />} />

      {/* Legacy redirect — old /reviewer route kept working */}
      <Route path="/reviewer" element={<Dashboard />} />
    </Routes>
  );
}