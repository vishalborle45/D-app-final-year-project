import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  // Classes for active/inactive navigation links
  const navLinkClasses = ({ isActive }) =>
    isActive
      ? "text-blue-600 font-semibold bg-blue-100 p-2 rounded"
      : "text-gray-700 hover:text-blue-500 hover:bg-gray-200 p-2 rounded";

  return (
    <aside className="w-1/4 bg-gray-100 h-screen p-4 shadow-md">
      <nav>
        <ul className="space-y-4">
          <li>
            <NavLink to="/Dashboard/upload" className={navLinkClasses}>
              Upload Document
            </NavLink>
          </li>
          <li>
            <NavLink to="/Dashboard/view" className={navLinkClasses}>
              View All Documents
            </NavLink>
          </li>
          <li>
            <NavLink to="/Dashboard/share" className={navLinkClasses}>
              Share Document
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
