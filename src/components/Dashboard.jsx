import { useState } from "react";

export default function Dashboard({ 
  tasks, 
  deletedTasks, 
  onCreateTask, 
  onOpenTask, 
  onDeleteTask,
  onRestoreTask,
  onPermanentDelete,
  setTasks
}) {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverTaskId, setDragOverTaskId] = useState(null);

  const handleDeleteTask = (e, task) => {
    e.stopPropagation(); 
    onDeleteTask(task);
  };

  const handleDragStart = (e, id) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (id !== dragOverTaskId) {
      setDragOverTaskId(id);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverTaskId(null);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    setDragOverTaskId(null);
    
    if (draggedTaskId === targetId) return;

    // Find indices
    const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = tasks.findIndex(t => t.id === targetId);
    
    if (draggedIndex < 0 || targetIndex < 0) return;

    // Reorder array
    const newTasks = [...tasks];
    const [draggedItem] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, draggedItem);
    
    setTasks(newTasks);
    setDraggedTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `notepad-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedTasks = JSON.parse(event.target.result);
        if (Array.isArray(importedTasks)) {
          const newTasks = [...tasks];
          importedTasks.forEach(importedTask => {
            const existingIndex = newTasks.findIndex(t => t.id === importedTask.id);
            if (existingIndex >= 0) {
              newTasks[existingIndex] = importedTask;
            } else {
              newTasks.push(importedTask);
            }
          });
          setTasks(newTasks);
          alert("Notes imported successfully!");
        } else {
          alert("Invalid file format. Expected an array of notes.");
        }
      } catch (err) {
        alert("Error reading the file. Make sure it is a valid JSON backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  return (
    <div className="full-page">
      <div className="page-header">
        <h2>🚀 My Dashboard</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn btn-secondary btn-sm-mobile" onClick={handleExport} title="Download notes as a file">
            📥 <span className="hide-mobile">Export</span>
          </button>
          <label className="btn btn-secondary btn-sm-mobile" title="Upload a notes file" style={{ margin: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            📤 <span className="hide-mobile">Import</span>
            <input 
              type="file" 
              accept=".json" 
              style={{ display: "none" }} 
              onChange={handleImport} 
            />
          </label>
          <button className="btn btn-primary btn-sm-mobile" onClick={onCreateTask}>
            + <span className="hide-mobile">Create Note</span><span className="show-mobile">Note</span>
          </button>
        </div>
      </div>
      <div className="page-content">

        <section style={{ marginBottom: "3rem" }}>
          <h3>Your Notes</h3>
          {tasks.length === 0 ? (
            <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>
              No notes found. Click "+ Create Note" to get started!
            </p>
          ) : (
            <div className="dashboard-grid">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  className={`task-card draggable ${dragOverTaskId === task.id ? 'drag-over' : ''}`}
                  onClick={() => onOpenTask(task)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragOver={(e) => handleDragOver(e, task.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, task.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="task-card-header">
                    <h3 style={{ margin: 0 }}>{task.title || "Untitled Note"}</h3>
                    <button 
                      className="btn-icon danger" 
                      onClick={(e) => handleDeleteTask(e, task)}
                      title="Move to Trash"
                    >
                      🗑️
                    </button>
                  </div>
                  {task.description && (
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      {task.description}
                    </p>
                  )}
                  
                  <div className="task-card-stats">
                    <span>📝 {task.notes?.length || 0} Sub-notes</span>
                    <span>🎨 {task.drawings?.length || 0} Drawings</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {deletedTasks && deletedTasks.length > 0 && (
          <section style={{ borderTop: "1px solid var(--border-color)", paddingTop: "2rem" }}>
            <h3 style={{ color: "var(--text-muted)" }}>🗑️ Recently Deleted Notes</h3>
            <div className="dashboard-grid">
              {deletedTasks.map(task => (
                <div 
                  key={task.id} 
                  className="task-card task-card-deleted" 
                >
                  <div className="task-card-header">
                    <h3 style={{ margin: 0, textDecoration: "line-through", color: "var(--text-muted)" }}>
                      {task.title || "Untitled Note"}
                    </h3>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      <button 
                        className="btn-icon success" 
                        onClick={() => onRestoreTask(task)}
                        title="Restore Note"
                      >
                        ↩️
                      </button>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => onPermanentDelete(task.id)}
                        title="Permanently Delete"
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                  {task.description && (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                      {task.description}
                    </p>
                  )}
                  <div className="task-card-stats" style={{ borderColor: "transparent", color: "var(--text-muted)" }}>
                    <span>📝 {task.notes?.length || 0} Sub-notes</span>
                    <span>🎨 {task.drawings?.length || 0} Drawings</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
