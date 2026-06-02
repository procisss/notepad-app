import { useState } from "react";
import TaskCard from "./TaskCard";

export default function NoteList({ tasks, onAdd, onDelete }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    
    onAdd({
      title: title || "Untitled Note",
      content,
      type: "text",
      date,
      time
    });
    
    setTitle("");
    setContent("");
    setDate("");
    setTime("");
  };

  return (
    <div className="sidebar-content">
      <form onSubmit={handleSubmit} className="task-card" style={{ animation: "none", marginBottom: "1rem" }}>
        <h3 className="card-title">Add Note / Reminder</h3>
        
        <div className="input-group">
          <input
            type="text"
            className="input-field"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className="input-group">
          <textarea
            className="input-field"
            placeholder="Write your note here..."
            rows="3"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="input-group" style={{ flexDirection: "row", gap: "0.5rem" }}>
          <input
            type="date"
            className="input-field"
            style={{ flex: 1 }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            type="time"
            className="input-field"
            style={{ flex: 1 }}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
          Add Task
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {tasks.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "2rem" }}>
            No tasks yet. Create one or draw on the whiteboard!
          </p>
        ) : (
          tasks.map(task => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
}
