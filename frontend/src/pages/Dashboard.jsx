import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import NoteCard from "../components/NoteCard";
import AddEditNotes from "./AddEditNotes";
import Modal from "react-modal";
import { MdAdd } from "react-icons/md";
import EmptyCard from "../components/EmptyCard";
import empty from "../assets/empty.jpeg";
import nosearch from "../assets/nosearch.png";
import API from "../Services/api"; 
import ChatWidget from "../components/ChatWidget"; 

Modal.setAppElement("#root");

const Dashboard = () => {
  const navigate = useNavigate();
  const [allNotes, setAllNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearch, setIsSearch] = useState(false);
  const [userInfo, setUserInfo] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: "add",
    data: null,
  });

  const fetchNotes = async () => {
    try {
      const res = await API.get("/api/notes/");
      const notesList = Array.isArray(res.data) ? res.data : (res.data?.notes || []);
      setAllNotes(notesList);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const [userRes, notesRes] = await Promise.allSettled([
          API.get("/api/auth/dashboard"),
          API.get("/api/notes/"),
        ]);

        if (!isMounted) return;

        if (userRes.status === "fulfilled" && userRes.value?.data) {
          const u = userRes.value.data;
          setUserInfo((prev) => ({
            ...prev,
            name: u.message ? u.message.replace("Welcome, ", "").replace("!", "") : prev?.name,
            userId: u.userId,
          }));
        }

        if (notesRes.status === "fulfilled" && notesRes.value?.data) {
          const list = Array.isArray(notesRes.value.data)
            ? notesRes.value.data
            : (notesRes.value.data?.notes || []);
          setAllNotes(list);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateIsPinned = async (id) => {
    if (!id) return;
    try {
      await API.patch(`/api/notes/pin/${id}`);
      fetchNotes();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteNote = async (id) => {
    if (!id) return;
    try {
      await API.delete(`/api/notes/${id}`);
      fetchNotes(); 
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (noteDetails) => {
    setOpenAddEditModal({ isShown: true, data: noteDetails, type: "edit" });
  };

  const filteredNotes = allNotes.filter((note) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (note?.title || "").toLowerCase().includes(q);
    const contentMatch = (note?.content || "").toLowerCase().includes(q);
    const tagMatch = Array.isArray(note?.tags) && note.tags.some((tag) => (tag || "").toLowerCase().includes(q));
    return titleMatch || contentMatch || tagMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userInfo={userInfo || { name: "User" }}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setIsSearch(!!val);
        }}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }}
      />

      <div className="container mx-auto px-6 py-8">
        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            {[...filteredNotes]
              .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
              .map((item) => {
                const noteId = item.id || item._id;
                return (
                  <NoteCard
                    key={noteId}
                    title={item.title}
                    date={item.createdAt}
                    content={item.content}
                    tags={item.tags || []}
                    isPinned={item.isPinned}
                    onEdit={() => handleEdit(item)}
                    onDelete={() => deleteNote(noteId)}
                    onPinNote={() => updateIsPinned(noteId)}
                  />
                );
              })}
          </div>
        ) : (
          <EmptyCard
            imgSrc={isSearch ? nosearch : empty}
            message={
              isSearch
                ? "Oops! No notes found matching your search."
                : "Start creating your first note! Click the 'Add' button to note down your thoughts and ideas."
            }
          />
        )}
      </div>

      {/* Floating Add Note Button */}
      <button
        className="w-16 h-16 flex items-center justify-center rounded-2xl bg-blue-500 hover:bg-blue-600 fixed right-10 bottom-10 shadow-lg transition-all z-40"
        onClick={() =>
          setOpenAddEditModal({ isShown: true, type: "add", data: null })
        }
        title="Add Note"
      >
        <MdAdd className="text-[32px] text-white" />
      </button>

      {/* Floating AI Notes Assistant Chatbot */}
      <ChatWidget onNoteSaved={fetchNotes} />

      <Modal
        isOpen={openAddEditModal.isShown}
        onRequestClose={() =>
          setOpenAddEditModal({ isShown: false, type: "add", data: null })
        }
        style={{ overlay: { backgroundColor: "rgba(0,0,0,0.2)" } }}
        className="w-[90%] md:w-[40%] max-h-3/4 bg-white rounded-md mx-auto mt-14 p-5 shadow-2xl overflow-scroll"
      >
        {openAddEditModal.isShown && (
          <AddEditNotes
            key={openAddEditModal.data?.id || openAddEditModal.data?._id || openAddEditModal.type}
            type={openAddEditModal.type}
            noteData={openAddEditModal.data}
            onClose={() =>
              setOpenAddEditModal({ isShown: false, type: "add", data: null })
            }
            fetchNotes={fetchNotes}
          />
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
