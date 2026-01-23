import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import {
  Dashboard,
  Characters,
  CreateCharacter,
  Gallery,
  DrawEditor,
  Settings,
  Login,
  RequireAuth,
} from './pages';
import { initStorage } from './services/storage';

function App() {
  // Initialize storage on app load
  useEffect(() => {
    initStorage();
  }, []);

  return (
    <BrowserRouter basename="/studio">
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout>
                <Dashboard />
              </Layout>
            </RequireAuth>
          }
        />

        <Route
          path="/characters"
          element={
            <RequireAuth>
              <Layout>
                <Characters />
              </Layout>
            </RequireAuth>
          }
        />

        <Route
          path="/characters/new"
          element={
            <RequireAuth>
              <Layout>
                <CreateCharacter />
              </Layout>
            </RequireAuth>
          }
        />

        <Route
          path="/characters/:id/edit"
          element={
            <RequireAuth>
              <Layout>
                <CreateCharacter />
              </Layout>
            </RequireAuth>
          }
        />

        <Route
          path="/gallery"
          element={
            <RequireAuth>
              <Layout>
                <Gallery />
              </Layout>
            </RequireAuth>
          }
        />

        <Route
          path="/gallery/:characterId"
          element={
            <RequireAuth>
              <Layout>
                <Gallery />
              </Layout>
            </RequireAuth>
          }
        />

        <Route
          path="/draw"
          element={
            <RequireAuth>
              <Layout>
                <DrawEditor />
              </Layout>
            </RequireAuth>
          }
        />

        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Layout>
                <Settings />
              </Layout>
            </RequireAuth>
          }
        />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
