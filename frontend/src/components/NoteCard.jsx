import React from "react";
import { MdOutlinePushPin, MdCreate, MdDelete } from "react-icons/md";

const NoteCard = ({
  title,
  content,
  tags = [],
  isPinned,
  date,
  onEdit,
  onDelete,
  onPinNote,
}) => {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between">
        <div>
          <h6 className="font-medium">{title}</h6>
          <p className="text-xs text-gray-500">
               {date ? new Date(date).toLocaleDateString() : ""}
          </p>
        </div>

        <MdOutlinePushPin
          onClick={onPinNote}
          className={`cursor-pointer ${
            isPinned ? "text-blue-500" : "text-gray-300"
          }`}
        />
      </div>

      <p className="text-sm mt-2 text-slate-600 break-words">
        {(content || "").length > 80 ? (content || "").slice(0, 80) + "..." : (content || "")}
      </p>

      <div className="flex justify-between items-end mt-3">
        <div className="text-xs text-gray-500 flex flex-wrap gap-1 max-w-[70%]">
          {(Array.isArray(tags) ? tags.slice(0, 5) : []).map((tag, i) => (
            <span key={i} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px]">#{tag}</span>
          ))}
          {Array.isArray(tags) && tags.length > 5 && (
            <span className="text-[11px] text-gray-400">+{tags.length - 5}</span>
          )}
        </div>

        <div className="flex gap-2">
          <MdCreate onClick={onEdit} className="cursor-pointer" />
          <MdDelete onClick={onDelete} className="cursor-pointer text-red-500" />
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
