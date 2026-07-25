import React, { useState } from 'react';
import { MessageSquare, ShieldCheck, Heart, User, Send, Plus, Filter } from 'lucide-react';

const CATEGORIES = [
  'All Topics',
  'Cardiovascular & Heart Health',
  'Diabetes & Metabolic Health',
  'Nutrition & Diet Guidance',
  'Mental Wellness & Sleep',
  'General Preventive Care'
];

export default function CommunityForum() {
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [posts, setPosts] = useState([
    {
      id: 'post-1',
      author: 'Dr. Ananya Sharma',
      role: 'Verified Doctor',
      isVerifiedDoctor: true,
      category: 'Cardiovascular & Heart Health',
      title: 'Understanding Early Symptoms of Hypertensive Crisis',
      content: 'If you experience sudden severe headaches accompanied by blurred vision or chest discomfort, monitor blood pressure immediately and seek emergency medical guidance.',
      likes: 24,
      comments: [
        { id: 'c1', author: 'Rahul M.', content: 'Thank you Doctor, this clarification is very helpful.', timestamp: '2 hours ago' }
      ],
      createdAt: '1 day ago'
    },
    {
      id: 'post-2',
      author: 'Vikram R.',
      role: 'Patient',
      isVerifiedDoctor: false,
      category: 'Diabetes & Metabolic Health',
      title: 'Tips for Managing Fasting Sugar Levels Naturally',
      content: 'What daily habits or evening meal timings have helped you stabilize morning blood sugar levels?',
      likes: 15,
      comments: [
        { id: 'c2', author: 'Dr. Rajesh Kumar', isVerifiedDoctor: true, content: 'Aim for dinner 3 hours prior to sleep and incorporate a 15-minute light post-dinner walk.', timestamp: '3 hours ago' }
      ],
      createdAt: '2 days ago'
    }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General Preventive Care');
  const [newContent, setNewContent] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commentInput, setCommentInput] = useState({});

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const postObj = {
      id: `post-${Date.now()}`,
      author: user.name || 'Anonymous User',
      role: user.isDoctor ? 'Verified Doctor' : 'Patient',
      isVerifiedDoctor: !!user.isDoctor,
      category: newCategory,
      title: newTitle,
      content: newContent,
      likes: 0,
      comments: [],
      createdAt: 'Just now'
    };

    setPosts([postObj, ...posts]);
    setNewTitle('');
    setNewContent('');
    setShowCreateModal(false);
  };

  const handleAddComment = (postId) => {
    const text = commentInput[postId];
    if (!text || !text.trim()) return;

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: `c-${Date.now()}`,
              author: user.name || 'User',
              isVerifiedDoctor: !!user.isDoctor,
              content: text,
              timestamp: 'Just now'
            }
          ]
        };
      }
      return p;
    }));

    setCommentInput({ ...commentInput, [postId]: '' });
  };

  const filteredPosts = selectedCategory === 'All Topics' 
    ? posts 
    : posts.filter(p => p.category === selectedCategory);

  return (
    <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-medical-500" />
            <h1 className="text-xl font-extrabold text-white">Community Health Forum</h1>
          </div>
          <p className="text-xs text-slate-400">Public medical discussion board connecting patients with verified doctors.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-medical-600 hover:bg-medical-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Discussion Topic</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="h-4 w-4 text-slate-500 shrink-0" />
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap border ${
              selectedCategory === cat
                ? 'bg-medical-600 text-white border-medical-500 shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map(post => (
          <div key={post.id} className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="bg-slate-800 p-2 rounded-xl text-slate-300">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-white">{post.author}</span>
                    {post.isVerifiedDoctor && (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Verified Doctor</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">{post.createdAt}</span>
                </div>
              </div>

              <span className="text-[10px] font-semibold text-slate-400 bg-slate-955 px-2.5 py-1 rounded-lg border border-slate-850">
                {post.category}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-100 tracking-wide">{post.title}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{post.content}</p>
            </div>

            {/* Comments List */}
            <div className="border-t border-slate-850 pt-3 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Replies & Answers ({post.comments.length})</span>
              
              {post.comments.map(c => (
                <div key={c.id} className="bg-slate-955/60 p-3 rounded-xl border border-slate-850 space-y-1 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-200">{c.author}</span>
                    {c.isVerifiedDoctor && (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        Doctor
                      </span>
                    )}
                    <span className="text-[9px] text-slate-500">· {c.timestamp}</span>
                  </div>
                  <p className="text-slate-300">{c.content}</p>
                </div>
              ))}

              {/* Add Comment Input */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={commentInput[post.id] || ''}
                  onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                  placeholder="Write a response..."
                  className="flex-1 bg-slate-955 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-medical-500"
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  className="bg-medical-600 hover:bg-medical-500 text-white rounded-xl p-2 text-xs font-bold transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Topic Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreatePost} className="glass-panel border border-slate-800 max-w-lg w-full rounded-3xl p-6 space-y-4 shadow-2xl bg-slate-900">
            <h3 className="text-base font-bold text-white tracking-wide">Start a Health Discussion</h3>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 block">Topic Title:</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Best dietary guidelines for managing cholesterol?"
                className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-medical-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 block">Category:</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              >
                {CATEGORIES.filter(c => c !== 'All Topics').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 block">Discussion Content:</label>
              <textarea
                rows={4}
                required
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Provide details or symptoms for medical guidance..."
                className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-medical-500 resize-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="bg-slate-955 border border-slate-800 text-slate-400 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-medical-600 hover:bg-medical-500 text-white px-5 py-2 rounded-xl text-xs font-bold"
              >
                Publish Topic
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
