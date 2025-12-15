import express from "express";
import {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
  togglePin,
} from "../controllers/note.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createNote);
router.get("/", protect, getNotes);
router.put("/:id", protect, updateNote);
router.delete("/:id", protect, deleteNote);
router.patch("/pin/:id", protect, togglePin);

export default router;
