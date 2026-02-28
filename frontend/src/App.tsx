import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Meeting } from "./components/meeting/Meeting";
import { Dashboard } from "./components/Dashboard";
import { TaskTracker } from "./components/TaskTracker";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Persistent Navigation Bar */}
        <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm">
          <h1 className="text-xl font-bold text-blue-600">Agentic Meetings</h1>
          <div className="space-x-4">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              Live Meeting
            </Link>
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              Past Meetings
            </Link>
            <Link
              to="/tasks"
              className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              Tasks
            </Link>
          </div>
        </nav>

        {/* Page Routing */}
        <main>
          <Routes>
            <Route path="/" element={<Meeting />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<TaskTracker />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
