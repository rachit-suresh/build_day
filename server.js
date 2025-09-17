
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI is not defined in .env file.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB.")) 
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); 
  });

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

noteSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
noteSchema.set("toJSON", {
  virtuals: true,
});

const Note = mongoose.model("Note", noteSchema);

app.get("/api/notes", async (req, res) => {
  try {
    const { tag } = req.query;
    const filter = tag ? { tags: tag } : {};
    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res
      .status(500)
      .json({ message: "Could not fetch notes from the database." });
  }
});

app.post("/api/notes", async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required fields." });
    }

    const newNote = new Note({
      title: title,
      content: content,
      tags: tags,
    });

    await newNote.save();

    res.status(201).json(newNote);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ message: "Could not create the new note." });
  }
});

app.patch("/api/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;
    const updatedNote = await Note.findByIdAndUpdate(
      id,
      { title, content, tags },
      { new: true }
    );
    if (!updatedNote) {
      return res.status(404).json({ message: "Note not found with that ID." });
    }
    res.json(updatedNote);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ message: "Could not update the note." });
  }
});

app.delete("/api/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNote = await Note.findByIdAndDelete(id);
    if (!deletedNote) {
      return res.status(404).json({ message: "Note not found with that ID." });
    }
    res.json({ message: "Note deleted successfully." });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ message: "Could not delete the note." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running and listening on http://localhost:${PORT}`);
});
