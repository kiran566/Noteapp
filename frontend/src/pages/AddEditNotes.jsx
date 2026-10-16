import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import API, { getErrorMessage } from "../Services/api";

const AddEditNotes = ({ type, noteData, onClose, fetchNotes }) => {
  const [title, setTitle] = useState(noteData?.title || "");
  const [content, setContent] = useState(noteData?.content || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!content.trim()) {
      setError("Please enter the content.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      if (type === "edit") {
        const noteId = noteData?.id || noteData?._id;
        if (!noteId) {
          setError("Note ID is missing.");
          return;
        }
        await API.put(`/api/notes/${noteId}`, { title: title.trim(), content: content.trim() });
      } else {
        await API.post("/api/notes/", { title: title.trim(), content: content.trim() });
      }
      fetchNotes();
      onClose();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to save note."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <MdClose onClick={onClose} className="absolute right-2 top-2 cursor-pointer text-xl text-gray-500 hover:text-black" />

      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {type === "edit" ? "Edit Note" : "Add Note"}
      </h3>

      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <input
        className="w-full text-xl font-medium outline-none mb-4 border-b pb-2 text-slate-800"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        rows="8"
        className="w-full bg-gray-50 border p-3 rounded text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500"
        placeholder="Write your note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full mt-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-2 rounded transition"
      >
        {loading ? "SAVING..." : type === "edit" ? "UPDATE NOTE" : "ADD NOTE"}
      </button>
    </div>
  );
};

export default AddEditNotes;
