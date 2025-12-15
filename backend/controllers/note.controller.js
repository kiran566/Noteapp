import Note from "../models/note.model.js";

const generateTags = (text) => {
  return [
    ...new Set(
      text
        .toLowerCase()
        .match(/\b[a-z]{4,}\b/g) || []
    ),
  ];
};
// creation----------------------------------------------
export const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "All fields required" });
    }

    const tags = generateTags(`${title} ${content}`);

    const note = await Note.create({
      title,
      content,
      tags,
      user: req.user.id,
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// toggle pin----------------------------------------------
export const togglePin = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    note.isPinned = !note.isPinned;
    await note.save();

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
// get notes----------------------------------------------

export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id })
      .sort({ isPinned: -1, createdAt: -1 });

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// update note----------------------------------------------
export const updateNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    const tags = generateTags(`${title} ${content}`);

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title, content, tags },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
// delete note----------------------------------------------
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
