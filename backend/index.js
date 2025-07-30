const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const USERNAME = 'sabarna';
const PASSWORD = 'Jvyjo03IPrGrTDkJ';
const DATABASE_NAME = 'todolist';
const CONNECTION_URI = `mongodb+srv://${USERNAME}:${PASSWORD}@todolist.adtufvc.mongodb.net/${DATABASE_NAME}?retryWrites=true&w=majority&appName=todolist`;

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


const taskSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'completed', 'deleted'], default: 'pending' },
  dueDate: Date,
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  completedAt: Date
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);


const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);


app.get('/tasks', asyncHandler(async (req, res) => {
  const tasks = await Task.find({ status: { $ne: 'deleted' } }).sort({ createdAt: -1 });
  res.json(tasks);
}));


app.get('/tasks/deleted', asyncHandler(async (req, res) => {
  const tasks = await Task.find({ status: 'deleted' }).sort({ updatedAt: -1 });
  res.json(tasks);
}));


app.post('/tasks', asyncHandler(async (req, res) => {
  const { text, dueDate, priority } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Task text is required' });
  }
  const task = new Task({ text, dueDate, priority });
  await task.save();
  res.status(201).json(task);
}));


app.patch('/tasks/:id/complete', asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, {
    status: 'completed',
    completedAt: new Date()
  }, { new: true });
  if (!task) return res.status(404).send('Not found');
  res.json(task);
}));


app.patch('/tasks/:id/pending', asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, {
    status: 'pending',
    completedAt: null
  }, { new: true });
  if (!task) return res.status(404).send('Not found');
  res.json(task);
}));


app.patch('/tasks/:id/delete', asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, {
    status: 'deleted'
  }, { new: true });
  if (!task) return res.status(404).send('Not found');
  res.json(task);
}));


app.delete('/tasks/:id', asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).send('Not found');
  res.status(204).send();
}));


app.put('/tasks/:id', asyncHandler(async (req, res) => {
  const { text, dueDate, priority } = req.body;
  const task = await Task.findByIdAndUpdate(req.params.id, {
    text, dueDate, priority
  }, { new: true, runValidators: true });
  if (!task) return res.status(404).send('Not found');
  res.json(task);
}));


app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});


mongoose.connect(CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
  });
