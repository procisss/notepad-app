import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

// ─── Rich Text Editor Component ───
function RichTextEditor({ initialHTML, onSave, placeholder, autoFocus }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialHTML || "";
      if (autoFocus) {
        editorRef.current.focus();
        // Move cursor to end
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, []);

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const html = editorRef.current.innerHTML;
      if (html && html !== "<br>") {
        onSave(html);
      }
    }
  };

  return (
    <div className="rich-editor-wrapper">
      <div className="rich-editor-toolbar">
        <button
          type="button"
          className="fmt-btn"
          title="Bold (Ctrl+B)"
          onMouseDown={(e) => { e.preventDefault(); execCmd("bold"); }}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="fmt-btn fmt-highlight"
          title="Highlight"
          onMouseDown={(e) => { e.preventDefault(); execCmd("hiliteColor", "#eab308"); }}
        >
          H
        </button>
        <button
          type="button"
          className="fmt-btn"
          title="Italic (Ctrl+I)"
          onMouseDown={(e) => { e.preventDefault(); execCmd("italic"); }}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="fmt-btn"
          title="Underline (Ctrl+U)"
          onMouseDown={(e) => { e.preventDefault(); execCmd("underline"); }}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          className="fmt-btn"
          title="Remove Formatting"
          onMouseDown={(e) => { e.preventDefault(); execCmd("removeFormat"); }}
        >
          ✕
        </button>
      </div>
      <div
        ref={editorRef}
        className="rich-editor-content input-field"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder || "Type something..."}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

// ─── Rich Text Editor for Editing Existing Notes ───
function RichTextEditNote({ initialHTML, onSave }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialHTML || "";
      editorRef.current.focus();
      // Move cursor to end
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, []);

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const html = editorRef.current.innerHTML;
      onSave(html && html !== "<br>" ? html : null);
    }
  };

  const handleBlur = () => {
    const html = editorRef.current.innerHTML;
    onSave(html && html !== "<br>" ? html : null);
  };

  return (
    <div className="rich-editor-wrapper" onClick={(e) => e.stopPropagation()}>
      <div className="rich-editor-toolbar">
        <button
          type="button"
          className="fmt-btn"
          title="Bold"
          onMouseDown={(e) => { e.preventDefault(); execCmd("bold"); }}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="fmt-btn fmt-highlight"
          title="Highlight"
          onMouseDown={(e) => { e.preventDefault(); execCmd("hiliteColor", "#eab308"); }}
        >
          H
        </button>
        <button
          type="button"
          className="fmt-btn"
          title="Italic"
          onMouseDown={(e) => { e.preventDefault(); execCmd("italic"); }}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="fmt-btn"
          title="Underline"
          onMouseDown={(e) => { e.preventDefault(); execCmd("underline"); }}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          className="fmt-btn"
          title="Remove Formatting"
          onMouseDown={(e) => { e.preventDefault(); execCmd("removeFormat"); }}
        >
          ✕
        </button>
      </div>
      <div
        ref={editorRef}
        className="rich-editor-content inline-edit-input"
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        style={{ minHeight: "60px" }}
      />
    </div>
  );
}

// ─── Main TaskView Component ───
export default function TaskView({ task, updateTask, onBack, onOpenWhiteboard }) {
  // Inline editing state for Title and Desc
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState(task.description || "");

  // Inline editing state for individual notes
  const [editingNoteId, setEditingNoteId] = useState(null);

  // Drag and Drop state for notes
  const [draggedNoteId, setDraggedNoteId] = useState(null);
  const [dragOverNoteId, setDragOverNoteId] = useState(null);

  const titleInputRef = useRef(null);
  const descInputRef = useRef(null);

  // Force re-render key for the creation editor to reset after adding
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDesc && descInputRef.current) {
      descInputRef.current.focus();
    }
  }, [isEditingDesc]);

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (editTitle !== task.title) {
      updateTask({ ...task, title: editTitle || "Untitled Note" });
    }
  };

  const handleSaveDesc = () => {
    setIsEditingDesc(false);
    if (editDesc !== task.description) {
      updateTask({ ...task, description: editDesc });
    }
  };

  const handleAddNote = (html) => {
    if (!html || !html.trim()) return;
    const newNote = {
      id: uuidv4(),
      text: html,
      createdAt: new Date().toISOString()
    };
    updateTask({
      ...task,
      notes: [newNote, ...(task.notes || [])]
    });
    // Reset editor by changing key
    setEditorKey(prev => prev + 1);
  };

  const handleSaveEditedNote = (noteId, html) => {
    if (!html || !html.trim()) {
      handleDeleteNote(noteId);
    } else {
      updateTask({
        ...task,
        notes: (task.notes || []).map(n => 
          n.id === noteId ? { ...n, text: html } : n
        )
      });
    }
    setEditingNoteId(null);
  };

  const handleDeleteNote = (noteId) => {
    updateTask({
      ...task,
      notes: (task.notes || []).filter(n => n.id !== noteId)
    });
  };

  const handleDeleteDrawing = (e, drawingId) => {
    e.stopPropagation(); 
    updateTask({
      ...task,
      drawings: (task.drawings || []).filter(d => d.id !== drawingId)
    });
  };

  // Note Drag and Drop Logic
  const handleDragStart = (e, id) => {
    setDraggedNoteId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (id !== dragOverNoteId) {
      setDragOverNoteId(id);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverNoteId(null);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    setDragOverNoteId(null);
    
    if (draggedNoteId === targetId || !draggedNoteId) return;

    const notes = task.notes || [];
    const draggedIndex = notes.findIndex(n => n.id === draggedNoteId);
    const targetIndex = notes.findIndex(n => n.id === targetId);
    
    if (draggedIndex < 0 || targetIndex < 0) return;

    const newNotes = [...notes];
    const [draggedItem] = newNotes.splice(draggedIndex, 1);
    newNotes.splice(targetIndex, 0, draggedItem);
    
    updateTask({ ...task, notes: newNotes });
    setDraggedNoteId(null);
  };

  const handleDragEnd = () => {
    setDraggedNoteId(null);
    setDragOverNoteId(null);
  };

  return (
    <div className="full-page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button className="btn btn-secondary" onClick={onBack}>
            ← Back
          </button>
        </div>
        <button className="btn btn-primary" onClick={() => onOpenWhiteboard(null)}>
          🎨 Open Whiteboard
        </button>
      </div>

      <div className="page-content">
        <div className="task-view-container">
          
          {/* Header section */}
          <section style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: "600", color: "var(--text-secondary)" }}>Title:</span>
              {isEditingTitle ? (
                <input 
                  ref={titleInputRef}
                  type="text" 
                  className="inline-edit-input"
                  style={{ fontSize: "2rem", fontWeight: "600", marginBottom: "0.5rem", flex: 1 }}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle() }}
                />
              ) : (
                <h1 
                  className="inline-edit-text" 
                  style={{ fontSize: "2rem", marginBottom: "0.5rem", flex: 1 }}
                  onClick={() => setIsEditingTitle(true)}
                >
                  {task.title || "Untitled Note"}
                </h1>
              )}
            </div>

            {isEditingDesc ? (
              <textarea
                ref={descInputRef}
                className="inline-edit-input"
                style={{ color: "var(--text-secondary)", minHeight: "60px", resize: "vertical" }}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                onBlur={handleSaveDesc}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSaveDesc() }}
              />
            ) : (
              <div 
                className="inline-edit-text"
                style={{ color: "var(--text-secondary)", width: "100%", whiteSpace: "pre-wrap" }}
                onClick={() => setIsEditingDesc(true)}
              >
                {task.description || "Click here to add a description..."}
              </div>
            )}
          </section>

          {/* Notes Section */}
          <section>
            <h3 style={{ marginBottom: "1rem" }}>Sub-notes</h3>
            
            {/* Rich Text Creation Editor */}
            <div style={{ marginBottom: "1.5rem" }}>
              <RichTextEditor
                key={editorKey}
                initialHTML=""
                onSave={handleAddNote}
                placeholder="Write a sub-note... (Shift+Enter for new line, Enter to save)"
                autoFocus={false}
              />
            </div>

            <div className="notes-list">
              {(!task.notes || task.notes.length === 0) ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No sub-notes added yet.</p>
              ) : (
                task.notes.map(note => (
                  <div 
                    key={note.id} 
                    className={`note-item draggable ${editingNoteId === note.id ? 'editing' : ''} ${dragOverNoteId === note.id ? 'drag-over' : ''}`}
                    onClick={() => {
                      if (editingNoteId !== note.id) {
                        setEditingNoteId(note.id);
                      }
                    }}
                    draggable={editingNoteId !== note.id}
                    onDragStart={(e) => handleDragStart(e, note.id)}
                    onDragOver={(e) => handleDragOver(e, note.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, note.id)}
                    onDragEnd={handleDragEnd}
                  >
                    {editingNoteId !== note.id && (
                      <button 
                        className="btn-icon note-delete-btn danger" 
                        onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                        title="Delete Note"
                      >
                        🗑️
                      </button>
                    )}
                    
                    {editingNoteId === note.id ? (
                      <RichTextEditNote
                        initialHTML={note.text}
                        onSave={(html) => handleSaveEditedNote(note.id, html)}
                      />
                    ) : (
                      <div 
                        className="note-rendered-content"
                        dangerouslySetInnerHTML={{ __html: note.text }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Drawings Section */}
          <section>
            <h3 style={{ marginBottom: "1rem" }}>Whiteboard Drawings</h3>
            {(!task.drawings || task.drawings.length === 0) ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No drawings saved yet.</p>
            ) : (
              <div className="drawing-grid">
                {task.drawings.map(drawing => (
                  <div 
                    key={drawing.id} 
                    className="drawing-item interactive"
                    onClick={() => onOpenWhiteboard(drawing)}
                    title="Click to edit drawing"
                  >
                    <img src={drawing.dataURL} alt="Whiteboard Drawing" />
                    <div style={{ padding: "0.5rem", borderTop: "1px solid var(--border-color)", textAlign: "right" }}>
                      <button 
                        className="btn-icon danger" 
                        onClick={(e) => handleDeleteDrawing(e, drawing.id)}
                        title="Delete Drawing"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
