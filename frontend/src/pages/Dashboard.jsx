import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/dashboard")
      .then((res) => setMessage(res.data.message))
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, []);

  return (
    <div className="h-screen flex justify-center items-center bg-green-100">
      <div className="bg-white p-6 rounded shadow text-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="mt-3">{message}</p>

        <button
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
