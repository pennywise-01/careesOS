import { AppProvider } from './store/AppContext';
import AppRouter from './AppRouter';

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
