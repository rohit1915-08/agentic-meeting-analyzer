import { useEffect, useState } from "react";
import {
  Database,
  Trash2,
  Download,
  Search,
  Calendar,
  MessageSquare,
  Terminal,
  Zap,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

export const Dashboard = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat States
  const [query, setQuery] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/meetings/");
        const data = await response.json();
        setMeetings(data);
      } catch (error) {
        console.error("Error fetching meetings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Archive permanent deletion of this record?")) return;
    try {
      await fetch(`http://localhost:8000/api/meetings/${id}`, {
        method: "DELETE",
      });
      setMeetings(meetings.filter((meeting) => meeting.id !== id));
    } catch (error) {
      console.error("Error deleting meeting:", error);
    }
  };

  const exportToCSV = (meeting: any) => {
    let csv = `Meeting Title,${meeting.title}\n`;
    csv += `Date,${new Date(meeting.created_at + "Z").toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}\n`;
    csv += `Summary,"${(meeting.summary_json?.summary || "").replace(/"/g, '""')}"\n\n`;
    csv += `Task,Owner,Deadline,Priority\n`;

    if (meeting.summary_json?.tasks?.length > 0) {
      meeting.summary_json.tasks.forEach((task: any) => {
        csv += `"${task.title.replace(/"/g, '""')}","${task.owner}","${task.deadline}","${task.priority || "Normal"}"\n`;
      });
    } else {
      csv += `No tasks detected.,,,\n`;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Telemetry_${meeting.id.substring(0, 8)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setChatResponse("");

    try {
      const res = await fetch("http://localhost:8000/api/meetings/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      const data = await res.json();
      setChatResponse(data.answer);
    } catch (error) {
      setChatResponse("Critical Error: Failed to connect to Neural Agent.");
    } finally {
      setIsSearching(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Zap className="text-red-600 animate-pulse" size={48} />
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.3em]">
            Accessing Archived Telemetry...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* DASHBOARD HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-5">
            <div className="h-10 w-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center rotate-45 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <Database size={20} className="-rotate-45 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">
                Intelligence{" "}
                <span className="text-zinc-500 font-light">Archive</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1.5">
                Centralized Session Repository
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* MEETING REPOSITORY (LEFT) */}
          <div className="lg:col-span-8 space-y-6">
            {meetings.length === 0 ? (
              <div className="p-20 border border-dashed border-zinc-800 flex flex-col items-center justify-center opacity-30">
                <Terminal size={48} className="mb-4" />
                <p className="uppercase text-xs tracking-widest italic">
                  No Records Found
                </p>
              </div>
            ) : (
              meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-sm relative group hover:border-zinc-700 transition-all shadow-xl overflow-hidden"
                >
                  {/* Decorative Side Tab */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-zinc-800 group-hover:bg-red-600 transition-colors" />

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-red-500 transition-colors">
                          {meeting.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                          <Calendar size={12} />
                          {new Date(meeting.created_at + "Z").toLocaleString(
                            [],
                            {
                              dateStyle: "medium",
                              timeStyle: "short",
                            },
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => exportToCSV(meeting)}
                          className="p-2 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all rounded-sm"
                          title="Export CSV"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(meeting.id)}
                          className="p-2 bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-sm"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-zinc-950/50 border-l-2 border-red-900/50 p-4 mb-6 rounded-r-sm">
                      <p className="text-sm text-zinc-400 leading-relaxed italic">
                        <span className="text-red-600 font-bold not-italic mr-2 font-mono">
                          »
                        </span>
                        {meeting.summary_json?.summary ||
                          "Summary data corrupted or unavailable."}
                      </p>
                    </div>

                    {/* TASKS GRID */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 mb-2">
                        <ChevronRight size={14} className="text-red-600" />
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                          Extracted Directives
                        </h4>
                      </div>

                      {meeting.summary_json?.tasks?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {meeting.summary_json.tasks.map(
                            (task: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-zinc-950 border border-zinc-800 p-3 flex flex-col justify-between hover:border-zinc-700 transition-colors group/task"
                              >
                                <div className="flex items-start gap-2">
                                  <CheckCircle2
                                    size={14}
                                    className="text-red-600 mt-0.5"
                                  />
                                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-tight line-clamp-2">
                                    {task.title}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-900">
                                  <span className="text-[9px] font-black bg-zinc-900 px-2 py-0.5 text-zinc-500 uppercase rounded-full group-hover/task:bg-red-900/20 group-hover/task:text-red-500">
                                    {task.owner}
                                  </span>
                                  <span
                                    className={`text-[9px] font-mono ${task.deadline !== "None" ? "text-red-500/80" : "text-zinc-600"}`}
                                  >
                                    {task.deadline}
                                  </span>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-700 uppercase italic">
                          No directives found in session.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* AGENTIC CHAT SIDEBAR (RIGHT) */}
          <div className="lg:col-span-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6 sticky top-8 shadow-2xl overflow-hidden">
              {/* Glow Accent */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/5 blur-[50px] pointer-events-none" />

              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="text-red-600" size={18} />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                  Neural Retrieval
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed mb-6 font-medium">
                Query the agent regarding cross-session decisions, established
                timelines, or directive owners.
              </p>

              <form onSubmit={handleChatSubmit} className="space-y-3">
                <div className="relative group">
                  <Search
                    className="absolute left-3 top-3.5 text-zinc-600 group-focus-within:text-red-600 transition-colors"
                    size={14}
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Query Rohit's deadlines..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-sm py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-red-600 transition-all font-mono"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-sm py-3 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all flex items-center justify-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <div className="h-3 w-3 border-2 border-zinc-100/30 border-t-zinc-100 rounded-full animate-spin" />
                      Scanning Files...
                    </>
                  ) : (
                    "Execute Query"
                  )}
                </button>
              </form>

              {chatResponse && (
                <div className="mt-6 p-4 bg-zinc-950 border border-zinc-800 rounded-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal size={12} className="text-red-600" />
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      Response Output
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap font-mono border-l border-zinc-800 pl-3">
                    {chatResponse}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
