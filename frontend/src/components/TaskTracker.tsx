import { useEffect, useState } from "react";

export const TaskTracker = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/meetings/");
        const meetings = await response.json();

        // Extract and flatten all tasks from all meetings into a single array
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
      <div className="p-8 text-center text-gray-500">Loading tasks...</div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">
        Master Task Tracker
      </h2>

      {tasks.length === 0 ? (
        <p className="text-gray-500">No pending tasks across any meetings.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {task.owner}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-md ${task.deadline !== "None" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}
                >
                  {task.deadline !== "None"
                    ? `Due: ${task.deadline}`
                    : "No Deadline"}
                </span>
              </div>

              <h3 className="text-lg font-medium text-gray-800 mb-4 leading-tight">
                {task.title}
              </h3>

              <div className="mt-auto pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-400">Source:</span>{" "}
                  {task.meetingTitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
