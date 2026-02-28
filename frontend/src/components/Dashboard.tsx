import { useEffect, useState } from "react";

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
    if (!window.confirm("Are you sure you want to delete this meeting?"))
      return;
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
    link.setAttribute("download", `Meeting_${meeting.id.substring(0, 8)}.csv`);
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
      setChatResponse("Failed to connect to the AI agent.");
    } finally {
      setIsSearching(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        Loading past meetings...
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Meeting History</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Meeting List */}
        <div className="lg:col-span-2 space-y-6">
          {meetings.length === 0 ? (
            <p className="text-gray-500">No meetings recorded yet.</p>
          ) : (
            meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative"
              >
                {/* Action Buttons */}
                <div className="absolute top-6 right-6 flex space-x-4">
                  <button
                    onClick={() => exportToCSV(meeting)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleDelete(meeting.id)}
                    className="text-sm text-red-500 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>

                <div className="flex flex-col mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 pr-40">
                    {meeting.title}
                  </h3>
                  <span className="text-sm text-gray-500 mt-1">
                    {new Date(meeting.created_at + "Z").toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 text-sm">
                  <strong>Summary: </strong>{" "}
                  {meeting.summary_json?.summary || "No summary available."}
                </div>
                <h4 className="font-semibold text-gray-700 mb-3">
                  Extracted Tasks:
                </h4>
                {meeting.summary_json?.tasks?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {meeting.summary_json.tasks.map(
                      (task: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm flex flex-col justify-between"
                        >
                          <span className="font-medium text-gray-800 mb-2">
                            {task.title}
                          </span>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span className="bg-gray-200 px-2 py-1 rounded-full">
                              {task.owner}
                            </span>
                            <span
                              className={
                                task.deadline !== "None"
                                  ? "text-red-500 font-medium"
                                  : ""
                              }
                            >
                              {task.deadline}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No tasks detected.
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right Column: Agentic Chat Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Ask the AI</h3>
            <p className="text-sm text-gray-500 mb-6">
              Ask questions about your past decisions, tasks, or meeting
              summaries.
            </p>

            <form onSubmit={handleChatSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., What is Rohit's deadline?"
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <button
                type="submit"
                disabled={isSearching}
                className="w-full bg-blue-600 text-white font-medium rounded-lg p-3 hover:bg-blue-700 disabled:bg-blue-300 transition"
              >
                {isSearching ? "Searching Records..." : "Ask"}
              </button>
            </form>

            {chatResponse && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                {chatResponse}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
