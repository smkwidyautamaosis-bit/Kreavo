import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ai, MODELS } from '../lib/gemini';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

type Status = 'todo' | 'progress' | 'done';

interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  category: string;
  createdAt: string;
}

export default function ProjectTracker() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState<Status | null>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', category: '' });
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Load projects real-time
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `users/${user.uid}/projects`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(items);
      setLoading(false);
    }, (error) => {
      console.error("Firestore loading error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const suggestTasks = async () => {
    if (!user) return;
    setIsSuggesting(true);
    try {
      const prompt = `Berikan 3 ide proyek kreatif baru untuk seorang konten kreator digital di Indonesia.
      Format dalam JSON array of objects dengan kunci: title, description, category.
      Setiap proyek harus unik dan relevan dengan tren saat ini (video short, podcast, design, newsletter).
      Gunakan Bahasa Indonesia.`;

      const result = await ai.models.generateContent({
        model: MODELS.flash,
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const suggestions = JSON.parse(result.text || '[]');
      
      for (const s of suggestions) {
        await addDoc(collection(db, `users/${user.uid}/projects`), {
          title: s.title,
          description: s.description,
          category: s.category || 'General',
          status: 'todo' as Status,
          createdAt: new Date().toISOString(),
          userId: user.uid
        });
      }
    } catch (error) {
      console.error("Gagal menyarankan tugas:", error);
      alert("Gagal menyimpan data. Periksa koneksi internet kamu.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const addTask = async (status: Status) => {
    if (!user || !newTask.title) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/projects`), {
        title: newTask.title,
        description: newTask.description,
        category: newTask.category || 'General',
        status,
        createdAt: new Date().toISOString(),
        userId: user.uid
      });
      setNewTask({ title: '', description: '', category: '' });
      setIsAdding(null);
    } catch (err) {
      console.error("Error adding task:", err);
      alert("Gagal menyimpan data. Periksa koneksi internet kamu.");
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/projects`, id));
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Gagal menghapus data. Periksa koneksi internet kamu.");
    }
  };

  const moveTask = async (id: string, newStatus: Status) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/projects`, id), {
        status: newStatus
      });
    } catch (err) {
      console.error("Error moving task:", err);
      alert("Gagal menyimpan data. Periksa koneksi internet kamu.");
    }
  };

  const columns: { id: Status, label: string, color: string }[] = [
    { id: 'todo', label: 'Tugas Baru', color: 'border-yellow-500/20 text-yellow-500' },
    { id: 'progress', label: 'Sedang Dikerjakan', color: 'border-brand-blue/20 text-brand-blue' },
    { id: 'done', label: 'Selesai', color: 'border-green-500/20 text-green-500' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-10 h-10 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Memuat proyek...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 md:space-y-4">
          <h2 className="text-3xl md:text-5xl font-[800] text-white tracking-tight title-accent">Projek Ku</h2>
          <p className="text-gray-500 text-base md:text-lg leading-relaxed">Pantau semua ide dan progres karyamu di sini.</p>
        </div>
        <button
          onClick={suggestTasks}
          disabled={isSuggesting}
          className="ghost-button border border-white/10 px-6 py-4 md:py-3 rounded-full hover:bg-brand-cyan/10 hover:border-brand-cyan/30 group w-full md:w-auto flex items-center justify-center"
        >
          {isSuggesting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin mr-3" />
          ) : (
            <Sparkles className="w-4 h-4 text-brand-cyan mr-3" />
          )}
          <span className="text-xs font-bold uppercase tracking-widest">{isSuggesting ? 'Sambil cari ide...' : 'Generate Projek'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
        {columns.map(column => (
          <div key={column.id} className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center space-x-3">
                <h3 className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest">{column.label}</h3>
                <span className="text-[10px] tabular-nums bg-white/5 text-gray-500 px-2 py-0.5 rounded-full border border-white/5">
                  {tasks.filter(t => t.status === column.id).length}
                </span>
              </div>
              <button 
                onClick={() => setIsAdding(column.id)}
                className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-brand-cyan/10 hover:text-brand-cyan rounded-lg text-gray-500 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 min-h-[100px] md:min-h-[400px]">
              {isAdding === column.id && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card-subtle p-4 space-y-4 bg-white/[0.02]"
                >
                  <input
                    autoFocus
                    placeholder="Judul..."
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold text-white placeholder-gray-600 focus:outline-none"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                  <input
                    placeholder="Kategori (misal: YouTube, Blog)..."
                    className="w-full bg-transparent border-none focus:ring-0 text-xs text-gray-400 focus:outline-none"
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  />
                  <textarea
                    placeholder="Deskripsi..."
                    className="w-full bg-transparent border-none focus:ring-0 text-xs text-gray-400 resize-none h-16 placeholder-gray-700 focus:outline-none"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsAdding(null)} className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300">Batal</button>
                    <button onClick={() => addTask(column.id)} className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-brand-cyan">Simpan</button>
                  </div>
                </motion.div>
              )}

              {tasks.filter(t => t.status === column.id).map((task) => (
                <motion.div
                  layout
                  key={task.id}
                  className="card-subtle p-4 group hover:border-white/20 transition-all cursor-default"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] uppercase tracking-widest font-black text-gray-500">
                      {task.category}
                    </span>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-200 mb-1 group-hover:text-white transition-colors">{task.title}</h4>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-4">{task.description}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-2">
                      {column.id !== 'todo' && (
                        <button onClick={() => moveTask(task.id, 'todo')} className="text-[9px] font-bold uppercase tracking-widest hover:text-white">Todo</button>
                      )}
                      {column.id !== 'progress' && (
                        <button onClick={() => moveTask(task.id, 'progress')} className="text-[9px] font-bold uppercase tracking-widest hover:text-white">Run</button>
                      )}
                      {column.id !== 'done' && (
                        <button onClick={() => moveTask(task.id, 'done')} className="text-[9px] font-bold uppercase tracking-widest hover:text-white">Fix</button>
                      )}
                    </div>
                    <Clock className="w-3 h-3 text-gray-600" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
