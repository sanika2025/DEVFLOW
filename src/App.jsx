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

import Login from './pages/Login';
import Signup from './pages/Signup';
import LessonView from './pages/LessonView';
import QuizView from './pages/QuizView';
import SystemDesignSandbox from './pages/SystemDesignSandbox';
import Planner from './pages/Planner';
import Workout from './pages/Workout';

import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

// Simple Life Pages
import SimpleDashboard from './pages/simple/SimpleDashboard';
import SimpleMoney from './pages/simple/SimpleMoney';
import SimpleShifts from './pages/simple/SimpleShifts';
import SimpleHomeVisits from './pages/simple/SimpleHomeVisits';
import SimpleRoutine from './pages/simple/SimpleRoutine';
import SimpleTasks from './pages/simple/SimpleTasks';

function App() {
  const { initialize, profile } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const isSimpleLife = profile?.user_mode === 'simple_life';
  const defaultDashboard = isSimpleLife ? '/simple-dashboard' : '/dashboard';

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to={defaultDashboard} replace />} />
          
          {/* Full Mode Routes */}
          <Route path="dashboard" element={isSimpleLife ? <Navigate to="/simple-dashboard" replace /> : <Dashboard />} />
          <Route path="learning" element={<LearningHub />} />
          <Route path="learning/lesson/:lessonId" element={<LessonView />} />
          <Route path="learning/quiz/:dayNumber" element={<QuizView />} />
          <Route path="notes" element={<SmartNotes />} />
          <Route path="interview" element={<InterviewPrep />} />
          <Route path="ai-mentor" element={<AIMentor />} />
          <Route path="expenses" element={<ExpenseTracker />} />
          <Route path="projects" element={<Projects />} />

          <Route path="sandbox" element={<SystemDesignSandbox />} />
          <Route path="planner" element={<Planner />} />
          <Route path="workout" element={<Workout />} />

          
          {/* Simple Life Routes */}
          <Route path="simple-dashboard" element={<SimpleDashboard />} />
          <Route path="simple-money" element={<SimpleMoney />} />
          <Route path="simple-shifts" element={<SimpleShifts />} />
          <Route path="simple-home-visits" element={<SimpleHomeVisits />} />
          <Route path="simple-routine" element={<SimpleRoutine />} />
          <Route path="simple-tasks" element={<SimpleTasks />} />

          {/* Shared Routes */}
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
