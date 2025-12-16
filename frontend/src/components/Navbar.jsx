import React from 'react';
import { Search } from 'lucide-react';

const Navbar = ({ userInfo, onLogout, onSearchChange }) => {
  return (
    <nav className="flex items-center justify-between px-6 py-2 bg-white shadow-sm border-b border-gray-100">
      {/* Title/Logo */}
      <h2 className="text-xl font-bold text-gray-800">Notes</h2>

      {/* Centered Search Bar */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search Notes"
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-gray-100 border border-transparent focus:border-blue-400 focus:bg-white px-4 py-1.5 rounded-md outline-none transition-all text-sm"
          />
          <Search className="absolute right-3 top-2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 cursor-pointer" />
        </div>
      </div>

      {/* User Profile & Logout */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200">
          {/* Extract initials, e.g., "Test User" -> "TU" */}
          {userInfo?.name ? userInfo.name.split(" ").map(n => n[0]).join("").toUpperCase() : "U"}
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-medium text-gray-900 leading-none">
            {userInfo?.name || "User Name"}
          </p>
          <button 
            onClick={onLogout}
            className="text-xs text-gray-500 hover:text-red-500 underline transition-colors text-left mt-1"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;