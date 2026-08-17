"use client";

export default function AdminEntryActions({ isAdmin, onEdit, onDelete, deleteLabel = "this entry" }) {
  if (!isAdmin) return null;
  return (
    <span className="table-actions">
      <button type="button" className="btn-link" onClick={onEdit}>
        Edit
      </button>
      <button
        type="button"
        className="btn-danger-sm"
        onClick={() => {
          if (window.confirm(`Delete ${deleteLabel}? This cannot be undone.`)) onDelete();
        }}
      >
        Delete
      </button>
    </span>
  );
}
