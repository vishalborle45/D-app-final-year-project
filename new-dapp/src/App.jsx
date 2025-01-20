import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { RecoilRoot, useRecoilValue } from 'recoil';
import Homepage from './pages/Homepage';
import AuthenticationPage from './pages/AuthenticationPage';
import Dashboard from './pages/Dashboard';
import UploadDocument from './pages/Dashboardcom/UploadDocument';
import ViewAllDocuments from './pages/Dashboardcom/ViewAllDocuments';
import ShareDocument from './pages/Dashboardcom/ShareDocument';
import { authState } from './store/authAtom';

// ProtectedRoute Component
const ProtectedRoute = ({ children }) => {
  const auth = useRecoilValue(authState); // Access authentication state

  if (!auth.isSignedIn) {
    // If the user is not signed in, redirect to Authentication page
    return <Navigate to="/" replace />;
  }

  return children; // Render protected content
};

// Create routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <Homepage />,
  },
  {
    path: '/Authenticate',
    element: <AuthenticationPage />,
  },
  {
    path: '/Dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
    children: [
      { path: 'upload', element: <UploadDocument /> },
      { path: 'view', element: <ViewAllDocuments /> },
      { path: 'share', element: <ShareDocument /> },
      { path: '*', element: <div>No section selected.</div> },
    ],
  },
  {
    path: '*',
    element: <div>404 Not Found</div>,
  },
]);

function App() {
  return (
    <RecoilRoot>
      <RouterProvider router={router} />
    </RecoilRoot>
  );
}

export default App;
