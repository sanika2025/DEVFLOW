import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import LearningHub from './pages/LearningHub';
import SmartNotes from './pages/SmartNotes';
import InterviewPrep from './pages/InterviewPrep';
import AIMentor from './pages/AIMentor';
import ExpenseTracker from './pages/ExpenseTracker';
import Projects from './pages/Projects';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="learning" element={<LearningHub />} />
        <Route path="notes" element={<SmartNotes />} />
        <Route path="interview" element={<InterviewPrep />} />
        <Route path="ai-mentor" element={<AIMentor />} />
        <Route path="expenses" element={<ExpenseTracker />} />
        <Route path="projects" element={<Projects />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  );
}

export default App;
