import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, Wand2, Paperclip, Eraser, Image as ImageIcon, Trash2, Plus, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { ai, MODELS } from '../lib/gemini';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // base64 data URI
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: any;
  messages: Message[];
}

export default function CreativeAssistant() {
  const { user } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Halo! Aku Kreavo. Ada yang bisa aku bantu buat ide konten kamu hari ini? Aku bisa bantu cari ide, bikin naskah, sampai planning konten kamu.' }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Auto-scroll chat window
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load chat sessions real-time from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `users/${user.uid}/chats`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
      setSessions(items);
    });

    return () => unsubscribe();
  }, [user]);

  // Load selected session messages
  const loadChatSession = (session: ChatSession) => {
    setActiveChatId(session.id);
    setMessages(session.messages);
    if (isMobile) setShowHistory(false);
  };

  // Start fresh conversation
  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([
      { role: 'assistant', content: 'Halo! Aku Kreavo. Ada yang bisa aku bantu buat ide konten kamu hari ini? Aku bisa bantu cari ide, bikin naskah, sampai planning konten kamu.' }
    ]);
    setSelectedImage(null);
    if (isMobile) setShowHistory(false);
  };

  // Delete session
  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/chats`, id));
      if (activeChatId === id) {
        startNewChat();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle image attachment
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading || !user) return;

    const userMessageContent = input.trim();
    const imagePayload = selectedImage;
    
    const newMsg: Message = { 
      role: 'user', 
      content: userMessageContent || "Menganalisis gambar ini..."
    };
    if (imagePayload) {
      newMsg.image = imagePayload;
    }

    const updatedMessages = [...messages, newMsg];
    
    setInput('');
    setSelectedImage(null);
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Build contents array for multimodal Gemini API call
      const contents = updatedMessages.map(msg => {
        const parts: any[] = [{ text: msg.content }];
        if (msg.image) {
          const match = msg.image.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            });
          }
        }
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts
        };
      });

      const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents,
        config: {
          systemInstruction: "Anda adalah Kreavo, asisten kreatif profesional untuk konten kreator di Indonesia. Gunakan bahasa Indonesia yang santai, gaul (sekali-kali), dan sangat ramah. Bantu mereka dalam brainstorming ide, pembuatan caption (TikTok, Instagram, YouTube), scripting video, dan perencanaan kampanye digital. Berikan saran yang praktis dan inspiratif. Jika dikirimkan gambar, analisis gambar tersebut dengan detail, berikan saran kreatif yang luar biasa terkait visualisasi, branding, peningkatan kualitas, atau ide konten pendukung yang bisa dibuat berdasarkan isi gambar tersebut.",
        }
      });

      const assistantReply: Message = { 
        role: 'assistant', 
        content: response.text || "Maaf, saya mengalami kendala teknis." 
      };

      const finalMessages = [...updatedMessages, assistantReply];
      setMessages(finalMessages);
      // Cleanly serialize only simple text fields for Firestore to prevent size limits and entity nesting issues
      const serializedMessages = finalMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      // Save to Firestore
      if (activeChatId) {
        await updateDoc(doc(db, `users/${user.uid}/chats`, activeChatId), {
          messages: serializedMessages
        });
      } else {
        const titleText = userMessageContent.slice(0, 30) || "Visual Analysis";
        const newDocRef = await addDoc(collection(db, `users/${user.uid}/chats`), {
          title: titleText,
          createdAt: new Date().toISOString(),
          messages: serializedMessages,
          userId: user.uid
        });
        setActiveChatId(newDocRef.id);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Minta maaf, sepertinya koneksi saya sedang terganggu. Coba lagi nanti ya." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] gap-6 relative overflow-hidden -mx-4 px-4 md:mx-0 md:px-0">
      
      {/* Sidebar History Panel - Left Side */}
      <div className={cn(
        "flex-col w-[260px] border-r border-white/5 bg-bg-surface/50 rounded-3xl p-4 space-y-4 shrink-0 transition-all duration-300 backdrop-blur-xl absolute md:relative z-20 h-full",
        isMobile ? (showHistory ? "left-0 flex" : "-left-[280px] hidden") : "flex"
      )}>
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Riwayat Chat</h3>
          <button 
            onClick={startNewChat}
            className="p-1.5 hover:bg-brand-cyan/10 hover:text-brand-cyan rounded-lg text-gray-500 transition-all flex items-center space-x-1"
            title="Chat Baru"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button 
          onClick={startNewChat}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-white/5 hover:bg-brand-cyan/10 border border-white/5 hover:border-brand-cyan/20 rounded-xl text-xs font-bold uppercase tracking-widest text-white hover:text-brand-cyan transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Chat Baru</span>
        </button>

        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide pr-1">
          {sessions.map(s => (
            <div 
              key={s.id}
              onClick={() => loadChatSession(s)}
              className={cn(
                "group flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all text-left",
                activeChatId === s.id 
                  ? "bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan" 
                  : "bg-transparent border-transparent hover:bg-white/[0.02] text-gray-400 hover:text-white"
              )}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold truncate leading-none">{s.title}...</span>
              </div>
              <button 
                onClick={(e) => handleDeleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-8 h-8 text-gray-800 mx-auto mb-2" />
              <p className="text-[10px] text-gray-600 font-medium italic">Belum ada riwayat chat</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Interface - Right Side */}
      <div className="flex-1 flex flex-col h-full bg-bg-dark rounded-3xl border border-white/5 overflow-hidden">
        
        {/* Chat Header Area */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center space-x-4">
            {isMobile && (
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight">Tanya Kreavo</h2>
              <p className="text-[10px] md:text-xs text-gray-500">Asisten kreatif AI personal kamu</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setMessages([messages[0]])}
              className="p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all"
              title="Bersihkan Chat"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Messages Log */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 scrollbar-hide"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                layout
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex flex-col w-full animate-in fade-in slide-in-from-bottom-2",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="mb-2">
                    <img src="https://i.ibb.co.com/8n8rgmZ9/Kreavo.png" alt="Kreavo" className="w-[20px] md:w-[24px] h-[20px] md:h-[24px] object-contain" />
                  </div>
                )}
                <div className={cn(
                  "flex max-w-[85%] md:max-w-[75%] space-x-3",
                  msg.role === 'user' ? "flex-row-reverse space-x-reverse" : "flex-row"
                )}>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border bg-white text-black border-white mt-1 shadow-md">
                      <User className="w-3 h-3" />
                    </div>
                  )}
                  <div className={cn(
                    "text-xs md:text-sm leading-relaxed",
                    msg.role === 'user' ? "text-white pt-1 bg-white/5 px-4 py-3 rounded-2xl" : "text-gray-300 pt-1"
                  )}>
                    {msg.image && (
                      <div className="mb-3">
                        <img 
                          src={msg.image} 
                          alt="Attachment" 
                          className="rounded-xl max-w-full md:max-w-[280px] h-auto object-cover border border-white/10 shadow-lg" 
                        />
                      </div>
                    )}
                    <div className="prose prose-invert prose-xs md:prose-sm max-w-none prose-p:leading-relaxed">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col space-y-3"
            >
              <div className="animate-pulse">
                <img src="https://i.ibb.co.com/8n8rgmZ9/Kreavo.png" alt="Thinking..." className="w-[20px] md:w-[24px] h-[20px] md:h-[24px] object-contain opacity-40" />
              </div>
              <div className="flex space-x-1 pl-1">
                <span className="w-1 h-1 bg-white/20 rounded-full animate-bounce" />
                <span className="w-1 h-1 bg-white/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1 h-1 bg-white/20 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Selected Image Preview Area */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="px-4 md:px-6 pt-3 pb-1 border-t border-white/5 bg-white/[0.01]"
            >
              <div className="relative inline-block">
                <img 
                  src={selectedImage} 
                  alt="Selected attachment preview" 
                  className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl border border-white/10 shadow-lg" 
                />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-md transition-all active:scale-90"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Text / Submit Box */}
        <div className="p-4 md:p-6 border-t border-white/5 bg-bg-dark">
          <div className="input-glow flex items-center px-4">
            
            {/* Image Attachment Button */}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-brand-cyan transition-colors"
              title="Upload Foto"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <input
              placeholder={selectedImage ? "Tulis deskripsi atau pertanyaan tentang foto ini..." : "Tulis pertanyaan..."}
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-gray-600 py-4 text-xs md:text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />

            <button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className={cn(
                "p-2 rounded-xl transition-all duration-300 active:scale-90",
                (!input.trim() && !selectedImage) || isLoading
                  ? "text-gray-700"
                  : "text-brand-cyan hover:bg-brand-cyan/10"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
