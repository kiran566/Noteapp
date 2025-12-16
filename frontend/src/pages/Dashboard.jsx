import React, { useState } from "react";
// ... other imports
import Navbar from "../components/Navbar";
import EmptyCard from "../components/EmptyCard";
import empty from "../assets/empty.jpeg";
import nosearch from "../assets/nosearch.png";

const Dashboard = () => {
  const [allNotes, setAllNotes] = useState([]);
  const [isSearch, setIsSearch] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userInfo={{ name: "Test User 333" }} onSearchChange={(val) => setIsSearch(!!val)} />

      <div className="container mx-auto px-6 py-8">
        {allNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Map notes here */}
          </div>
        ) : (
          <EmptyCard 
            imgSrc={isSearch ? nosearch : empty} 
            message={isSearch 
              ? "Oops! No notes found matching your search." 
              : "Start creating your first note! Click the Add button to note down your thoughts, ideas and remainders. Let's get started!"
            } 
          />
        )}
      </div>

      {/* Floating Add Button */}
    </div>
  );
};
export default Dashboard;