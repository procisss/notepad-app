export default function TaskCard({ task, onDelete }) {
  return (
    <div className="task-card">
      <div className="card-header">
        <h3 className="card-title">{task.title}</h3>
        {task.date && (
          <div className="card-time">
            📅 {new Date(task.date).toLocaleDateString()} {task.time ? `🕒 ${task.time}` : ""}
          </div>
        )}
      </div>
      
      {task.type === "image" ? (
        <img src={task.content} alt={task.title} />
      ) : (
        <div className="card-body">{task.content}</div>
      )}

      <div className="card-actions">
        <button 
          className="btn-icon" 
          onClick={() => onDelete(task.id)}
          title="Delete Task"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
