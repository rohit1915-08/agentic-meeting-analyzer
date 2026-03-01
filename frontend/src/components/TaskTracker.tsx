import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  User,
  Clock,
  Link2,
  AlertCircle,
  Layers,
  Terminal,
  Filter,
} from "lucide-react";

export const TaskTracker = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/meetings/");
        const meetings = await response.json();

        let allTasks: any[] = [];
        meetings.forEach((meeting: any) => {
          if (meeting.summary_json?.tasks) {
            meeting.summary_json.tasks.forEach((task: any) => {
              allTasks.push({
                ...task,
                meetingTitle: meeting.title,
                meetingId: meeting.id,
                meetingDate: meeting.created_at,
              });
            });
          }
        });

        setTasks(allTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Layers className="text-red-600 animate-pulse" size={40} />
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em]">
            Aggregating Directives...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER SECTION */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-5">
            <div className="h-10 w-10 bg-red-600 flex items-center justify-center rotate-45 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
              <ClipboardCheck size={20} className="-rotate-45 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">
                Directive{" "}
                <span className="text-zinc-500 font-light tracking-normal text-xl">
                  Oversight
                </span>
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                  Cross-Session Task Matrix
                </p>
                <div className="h-1 w-1 rounded-full bg-zinc-700" />
                <span className="text-[10px] text-red-600 font-mono font-black uppercase">
                  {tasks.length} Total Units
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TASK GRID */}
        {tasks.length === 0 ? (
          <div className="h-96 border border-dashed border-zinc-800 rounded-sm flex flex-col items-center justify-center opacity-20">
            <Terminal size={48} className="mb-4" />
            <p className="uppercase text-xs tracking-[0.3em]">
              No Active Directives In Cache
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tasks.map((task, idx) => (
              <div
                key={idx}
                className="bg-zinc-900 border border-zinc-800 rounded-sm p-6 relative group hover:border-red-900/50 transition-all duration-300 shadow-xl overflow-hidden"
              >
                {/* Visual Metadata Overlay */}
                <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                  <span className="font-mono text-4xl font-black italic">
                    #{idx + 1}
                  </span>
                </div>

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-sm">
                    <User size={12} className="text-red-600" />
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter">
                      {task.owner}
                    </span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-sm border ${
                      task.deadline !== "None"
                        ? "bg-red-950/20 border-red-900/50 text-red-500"
                        : "bg-zinc-950 border-zinc-800 text-zinc-600"
                    }`}
                  >
                    <Clock size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">
                      {task.deadline !== "None" ? task.deadline : "TBD"}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white uppercase tracking-tight mb-8 leading-snug min-h-12 group-hover:text-red-500 transition-colors">
                  {task.title}
                </h3>

                <div className="space-y-4">
                  {/* Source Metadata */}
                  <div className="pt-4 border-t border-zinc-800 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Link2 size={12} className="text-zinc-700" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
                        Origin Point
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-medium italic border-l-2 border-zinc-800 pl-3">
                      {task.meetingTitle}
                    </p>
                  </div>

                  {/* Date Indicator */}
                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-600">
                    <span className="uppercase">Logged_AT:</span>
                    <span>
                      {new Date(task.meetingDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-red-600 w-1/3 group-hover:w-full transition-all duration-700 ease-in-out opacity-30 group-hover:opacity-100" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
