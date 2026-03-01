import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { Meeting } from "./components/meeting/Meeting";
import { Dashboard } from "./components/Dashboard";
import { TaskTracker } from "./components/TaskTracker";
import {
  ShieldCheck,
  Activity,
  Database,
  CheckSquare,
  Fingerprint,
} from "lucide-react";

const NavLink = ({
  to,
  children,
  icon: Icon,
}: {
  to: string;
  children: React.ReactNode;
  icon: any;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-r border-zinc-800 ${
        isActive
          ? "text-white bg-zinc-900 shadow-[inset_0_-2px_0_0_#dc2626]"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
      }`}
    >
      <Icon size={14} className={isActive ? "text-red-600" : "text-zinc-600"} />
      {children}
    </Link>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#09090b] selection:bg-red-500/20">
        {/* CORPORATE NAVIGATION BAR */}
        <nav className="bg-[#0c0c0e] border-b border-zinc-800 flex justify-between items-stretch sticky top-0 z-50">
          <div className="flex items-center gap-4 px-8 py-4 border-r border-zinc-800">
            <div className="h-8 w-8 rounded-sm border-2 border-red-600 flex items-center justify-center">
              <Fingerprint size={18} className="text-red-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-white uppercase tracking-tighter">
                SENTINEL <span className="text-zinc-600 font-light">AI</span>
              </span>
              <span className="text-[7px] text-zinc-500 font-mono tracking-[0.4em]">
                CORPORATE INTELLIGENCE
              </span>
            </div>
          </div>

          <div className="flex flex-1">
            <NavLink to="/" icon={Activity}>
              Live Analysis
            </NavLink>
            <NavLink to="/dashboard" icon={Database}>
              Knowledge Base
            </NavLink>
            <NavLink to="/tasks" icon={CheckSquare}>
              Action Items
            </NavLink>
          </div>

          <div className="hidden lg:flex items-center px-8 gap-6 border-l border-zinc-800 text-[9px] font-mono">
            <div className="flex flex-col items-end">
              <span className="text-zinc-500 italic">SECURE GATEWAY</span>
            </div>
            <ShieldCheck size={20} className="text-zinc-700" />
          </div>
        </nav>
        {/* CONTENT AREA */}
        <main className="p-0">
          <Routes>
            <Route path="/" element={<Meeting />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<TaskTracker />} />
          </Routes>
        </main>
        SYSTEM STATUS FOOTER
        <footer className="fixed bottom-0 w-full bg-[#0c0c0e] border-t border-zinc-800 px-8 py-2 flex justify-between items-center z-50">
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
              <span className="text-[8px] font-mono text-zinc-500 uppercase">
                Neural Engine: Online
              </span>
            </div>
          </div>
          <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest italic">
            Developed by Team Spirit and soul
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
