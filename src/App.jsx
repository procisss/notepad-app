import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useLocalStorage } from "./hooks/useLocalStorage";
import Dashboard from "./components/Dashboard";
import TaskView from "./components/TaskView";
import Whiteboard from "./components/Whiteboard";

function App() {
  const [tasks, setTasks] = useLocalStorage("notepad-tasks", []);
  const [deletedTasks, setDeletedTasks] = useLocalStorage("notepad-deleted-tasks", []);
  
  // Navigation State: "dashboard", "task", "whiteboard"
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [activeDrawing, setActiveDrawing] = useState(null); // The drawing currently being edited

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const handleCreateTask = () => {
    const newTask = {
      id: uuidv4(),
      title: "Untitled Task",
      description: "",
      createdAt: new Date().toISOString(),
      notes: [],
      drawings: []
    };
    setTasks([newTask, ...tasks]);
    setSelectedTaskId(newTask.id);
    setCurrentView("task");
  };

  const handleDeleteTask = (taskToDelete) => {
    // Remove from active tasks
    setTasks(tasks.filter(t => t.id !== taskToDelete.id));
    // Add to deleted tasks (at the top)
    setDeletedTasks([taskToDelete, ...deletedTasks]);
    // If we were viewing it, go back to dashboard
    if (selectedTaskId === taskToDelete.id) {
      setSelectedTaskId(null);
      setCurrentView("dashboard");
    }
  };

  const handleRestoreTask = (taskToRestore) => {
    // Remove from deleted
    setDeletedTasks(deletedTasks.filter(t => t.id !== taskToRestore.id));
    // Add back to active
    setTasks([taskToRestore, ...tasks]);
  };

  const handlePermanentDelete = (id) => {
    setDeletedTasks(deletedTasks.filter(t => t.id !== id));
  };

  const handleUpdateTask = (updatedTask) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleOpenTask = (task) => {
    setSelectedTaskId(task.id);
    setCurrentView("task");
  };

  const handleOpenWhiteboard = (drawing = null) => {
    setActiveDrawing(drawing);
    setCurrentView("whiteboard");
  };

  const handleSaveDrawing = (newDrawing) => {
    if (!selectedTask) return;
    
    let updatedDrawings;
    if (activeDrawing) {
      // We are editing an existing drawing, replace it
      updatedDrawings = (selectedTask.drawings || []).map(d => 
        d.id === activeDrawing.id ? newDrawing : d
      );
    } else {
      // New drawing
      updatedDrawings = [newDrawing, ...(selectedTask.drawings || [])];
    }

    handleUpdateTask({
      ...selectedTask,
      drawings: updatedDrawings
    });
    
    // Cleanup and go back to task view
    setActiveDrawing(null);
    setCurrentView("task");
  };

  const handleExitWhiteboard = () => {
    setActiveDrawing(null);
    setCurrentView("task");
  };

  return (
    <>
      {currentView === "dashboard" && (
        <Dashboard 
          tasks={tasks} 
          setTasks={setTasks}
          deletedTasks={deletedTasks}
          onCreateTask={handleCreateTask}
          onOpenTask={handleOpenTask} 
          onDeleteTask={handleDeleteTask}
          onRestoreTask={handleRestoreTask}
          onPermanentDelete={handlePermanentDelete}
        />
      )}

      {currentView === "task" && selectedTask && (
        <TaskView 
          task={selectedTask}
          updateTask={handleUpdateTask}
          onBack={() => {
            setSelectedTaskId(null);
            setCurrentView("dashboard");
          }}
          onOpenWhiteboard={handleOpenWhiteboard}
        />
      )}

      {currentView === "whiteboard" && selectedTask && (
        <Whiteboard 
          initialDrawing={activeDrawing}
          onSave={handleSaveDrawing} 
          onExit={handleExitWhiteboard}
        />
      )}
    </>
  );
}

export default App;
