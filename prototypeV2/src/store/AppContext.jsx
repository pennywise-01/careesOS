import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

const initialState = {
  view: 'dashboard',
  selectedCandidate: null,
  weights: { semantic: 0.40, skill_coverage: 0.25, verification: 0.20, context_fit: 0.15 },
};

function appReducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, view: action.view, selectedCandidate: action.candidate || null };
    case 'UPDATE_WEIGHTS':
      return { ...state, weights: action.weights };
    case 'SELECT_CANDIDATE':
      return { ...state, selectedCandidate: action.candidate };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}