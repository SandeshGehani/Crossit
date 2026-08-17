import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UndoProvider } from './contexts/UndoContext';

import Layout from './components/Layout';
import PinLockScreen from './components/PinLockScreen';

// Pages
import DashboardPage from './pages/DashboardPage';
import AddExpensePage from './pages/AddExpensePage';
import AddIOUPage from './pages/AddIOUPage';
import PeoplePage from './pages/PeoplePage';
import PersonDetailPage from './pages/PersonDetailPage';
import SettleUpPage from './pages/SettleUpPage';
import AgingDebtsPage from './pages/AgingDebtsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

import { useRecurringEngine } from './hooks/useRecurringEngine';

// Auth wrapper to switch between lock screen and app
function AppContent() {
  const { isUnlocked } = useAuth();
  
  // Start the recurring engine when the app is unlocked
  useRecurringEngine();

  if (!isUnlocked) {
    return <PinLockScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/add-expense" element={<AddExpensePage />} />
          <Route path="/add-iou" element={<AddIOUPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/person/:id" element={<PersonDetailPage />} />
          <Route path="/settle/:id" element={<SettleUpPage />} />
          <Route path="/aging" element={<AgingDebtsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <UndoProvider>
        <AppContent />
      </UndoProvider>
    </AuthProvider>
  );
}

export default App;
