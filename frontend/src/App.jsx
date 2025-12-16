import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Route */}
      <Route
        path="/dashboard"
        // element={
        //   <ProtectedRoute>
        //     <Dashboard />
        //   </ProtectedRoute>
        //
        element={<Dashboard />}
      />
    </Routes>
  );
}

export default App;
