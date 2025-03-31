const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Kết nối đến MongoDB
mongoose.connect('mongodb+srv://turtlenink31:xlHty5zYD4iJ1RxQ@cluster0.oipyifv.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Định nghĩa schema cho ghi chú
const noteSchema = new mongoose.Schema({
    date: String,
    note: String,
    userId: String // Để phân biệt ghi chú của từng người dùng
});

const Note = mongoose.model('Note', noteSchema);

// API để lấy tất cả ghi chú của người dùng
app.get('/notes/:userId', async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.params.userId });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// API để tạo một ghi chú mới
app.post('/notes', async (req, res) => {
    const note = new Note({
        date: req.body.date,
        note: req.body.note,
        userId: req.body.userId
    });
    try {
        const newNote = await note.save();
        res.status(201).json(newNote);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// API để cập nhật ghi chú
app.put('/notes/:date', async (req, res) => {
    try {
        const updatedNote = await Note.findOneAndUpdate(
            { date: req.params.date, userId: req.body.userId },
            { note: req.body.note },
            { new: true }
        );
        if (!updatedNote) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.json(updatedNote);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// API để xóa ghi chú
app.delete('/notes/:date', async (req, res) => {
    try {
        const deletedNote = await Note.findOneAndDelete({ date: req.params.date, userId: req.body.userId });
        if (!deletedNote) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));