import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import LearningHub from './pages/LearningHub';
import SmartNotes from './pages/SmartNotes';
import InterviewPrep from './pages/InterviewPrep';
import AIMentor from './pages/AIMentor';
import ExpenseTracker from './pages/ExpenseTracker';
import Projects from './pages/Projects';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LessonView from './pages/LessonView';
import QuizView from './pages/QuizView';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="learning" element={<LearningHub />} />
          <Route path="learning/lesson/:lessonId" element={<LessonView />} />
          <Route path="learning/quiz/:dayNumber" element={<QuizView />} />
          <Route path="notes" element={<SmartNotes />} />
          <Route path="interview" element={<InterviewPrep />} />
          <Route path="ai-mentor" element={<AIMentor />} />
          <Route path="expenses" element={<ExpenseTracker />} />
          <Route path="projects" element={<Projects />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
