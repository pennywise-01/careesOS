import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import AppRouter from './AppRouter';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </BrowserRouter>
  );
}