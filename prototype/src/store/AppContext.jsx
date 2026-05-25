import { createContext, useContext, useReducer } from 'react';
import { personas, chapters } from '../data/personas';

const AppContext = createContext(null);

const initialState = {
  view: 'landing',
  subView: 'graph',
  currentPersona: null,
  userProfile: null,
  selectedPathNode: null,
  employerView: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_PERSONA': {
      const persona = personas.find(p => p.id === action.id);
      return { ...state, currentPersona: persona, userProfile: null, view: 'onboarding' };
    }
    case 'SELECT_CHAPTER': {
      const chapter = chapters.find(c => c.id === action.chapterId);
      return {
        ...state,
        currentPersona: {
          id: `chapter_${action.chapterId}`,
          name: '',
          age: 0,
          chapter: action.chapterId,
          chapterLabel: chapter?.label || action.chapterId,
          chapterDesc: chapter?.desc || '',
          currentRole: '',
          companySize: '',
          industry: '',
          city: '',
          yearsExperience: 0,
          skills: [],
          targetRole: '',
        },
        userProfile: null,
        view: 'onboarding',
      };
    }
    case 'SET_PROFILE': {
      const profile = action.profile;
      const updatedPersona = state.currentPersona
        ? {
            ...state.currentPersona,
            name: state.currentPersona.name || profile.currentRole || 'User',
            currentRole: profile.currentRole || state.currentPersona.currentRole,
            companySize: profile.companySize || state.currentPersona.companySize,
            industry: profile.industry || state.currentPersona.industry,
            city: profile.city || state.currentPersona.city,
            yearsExperience: profile.yearsExperience ?? state.currentPersona.yearsExperience,
            skills: profile.skills.length > 0 ? profile.skills : state.currentPersona.skills,
            targetRole: profile.targetRole || state.currentPersona.targetRole,
          }
        : { id: 'user', name: profile.currentRole || 'User', chapter: 'early_career', chapterLabel: 'Early Career', chapterDesc: '', currentRole: profile.currentRole || '', companySize: profile.companySize || '', industry: profile.industry || '', city: profile.city || 'KL', yearsExperience: profile.yearsExperience || 0, skills: profile.skills || [], targetRole: profile.targetRole || '' };
      return { ...state, currentPersona: updatedPersona, userProfile: action.profile, view: 'dashboard' };
    }
    case 'NAVIGATE':
      return { ...state, subView: action.view, selectedPathNode: action.node || state.selectedPathNode };
    case 'SELECT_PATH_NODE':
      return { ...state, selectedPathNode: action.node, subView: 'skills' };
    case 'TOGGLE_EMPLOYER':
      return { ...state, employerView: !state.employerView };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
