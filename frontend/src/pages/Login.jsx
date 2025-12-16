import React, { useState } from 'react';
import axios from "axios";
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react'; 

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      window.location.href = "/dashboard";
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Login</h2>
        
        <form className="space-y-4" onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="Email" 
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setPassword(e.target.value)}
            />
            
            {/* 3. Toggle icon and click handler */}
            <div 
              className="absolute right-3 top-2.5 cursor-pointer text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </div>
          </div>

          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-md transition duration-200">
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Not registered yet? <Link to="/signup" className="text-blue-500 hover:underline">Create an Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;