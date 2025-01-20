import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Dashboardcom/Sidebar'
import TopBar from './Dashboardcom/Topbar'

const Dashboard = () => {
  return (
    <div className="h-screen flex flex-col">
      {/* Top navigation bar */}
      <TopBar />

      {/* Main layout */}
      <div className="flex flex-grow">
        {/* Sidebar for navigation */}
        <Sidebar/>

        {/* Content area for nested routes */}
        <main className="flex-1 p-6 bg-gray-100 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
