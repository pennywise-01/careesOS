import { useApp } from './store/AppContext';
import Landing from './screens/Landing';
import Onboarding from './screens/Onboarding';
import Dashboard from './screens/Dashboard';
import EmployerDashboard from './screens/EmployerDashboard';

export default function AppRouter() {
  const { state, dispatch } = useApp();

  if (state.employerView) {
    return <EmployerDashboard />;
  }

  switch (state.view) {
    case 'landing':
      return <Landing />;
    case 'onboarding':
      return <Onboarding />;
    case 'dashboard':
      return <Dashboard />;
    default:
      return <Landing />;
  }
}
