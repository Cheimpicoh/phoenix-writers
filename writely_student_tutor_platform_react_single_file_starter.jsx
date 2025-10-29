/*
Writely - Single-file React starter (preview)

What this is:
- A single-file React app (default export) that demonstrates the full frontend structure you requested:
  1. Student login
  2. Tutor login
  3. Home
  4. Dashboard (role-based)
  5. Payment parts (Stripe placeholders)
  6. Login / Registration
  7. Tasks (students post tasks; tutors bid)
  8. Audio transcription UI (Web Speech API + upload placeholder)

Notes & next steps (read first):
- This file is intended as a preview / prototype. For a production app you should connect real backend services:
  * Authentication & DB: Firebase Auth + Firestore OR a Node/Express + PostgreSQL backend.
  * Payments: Stripe Checkout / Payment Intents (server-side createCheckoutSession).
  * Transcription: Use an API (OpenAI Whisper on server, AssemblyAI, or Google Speech-to-Text). For privacy and reliability, handle uploads and API keys server-side.
- Replace placeholder API endpoints ("/api/...") with real endpoints.
- This code uses Tailwind-style classes. If you don't have Tailwind, either install it or replace classes with your CSS.

How to run locally quickly (prototype):
1. Create a React app (Vite recommended):
   npm create vite@latest writely --template react
2. Install dependencies (react-router-dom, tailwind if you want):
   npm install react-router-dom
3. Put this file as src/App.jsx and update index.jsx to render <App />.
4. Start dev server: npm run dev

This preview uses localStorage as a mock DB so you can try flows without a backend.

-----------------------------------------------------------
Code begins below. It's a single-file React app using functional components.
-----------------------------------------------------------
*/

import React, { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';

// ---------- Simple CSS reset for preview (if no Tailwind) ----------
const appStyle = {
  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  padding: '16px',
  background: '#f8fafc',
  minHeight: '100vh'
};
const cardStyle = { background: 'white', padding: '16px', borderRadius: 12, boxShadow: '0 6px 18px rgba(2,6,23,0.06)' };

// ---------- Mock DB helpers (localStorage) ----------
const DB_KEY = 'writely_db_v1';
function getDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const seed = { users: [], tasks: [], bids: [], payments: [] };
    localStorage.setItem(DB_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}
function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

// ---------- Auth Context ----------
const AuthContext = createContext();
function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('writely_current_user');
    return u ? JSON.parse(u) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem('writely_current_user', JSON.stringify(user));
    else localStorage.removeItem('writely_current_user');
  }, [user]);

  const register = ({ name, email, password, role }) => {
    const db = getDB();
    if (db.users.find(u => u.email === email)) throw new Error('Email already in use');
    const newUser = { id: 'u_' + Date.now(), name, email, password, role }; // NOTE: do not store plaintext passwords in production
    db.users.push(newUser);
    saveDB(db);
    setUser({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
    return newUser;
  };

  const login = ({ email, password }) => {
    const db = getDB();
    const found = db.users.find(u => u.email === email && u.password === password);
    if (!found) throw new Error('Invalid credentials');
    setUser({ id: found.id, name: found.name, email: found.email, role: found.role });
    return found;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------- Protected Route ----------
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ---------- App Layout ----------
function AppShell({ children }) {
  const { user, logout } = useAuth();
  return (
    <div style={appStyle}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Link to="/" style={{ textDecoration: 'none' }}><h1 style={{ margin: 0, color: '#0f172a' }}>Writely</h1></Link>
          <div style={{ fontSize: 12, color: '#475569' }}>Students & Tutors marketplace</div>
        </div>
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/">Home</Link>
          <Link to="/tasks">Tasks</Link>
          {user ? <Link to="/dashboard">Dashboard</Link> : null}
          {user ? (
            <>
              <span style={{ fontSize: 14 }}>Hi, {user.name}</span>
              <button onClick={logout} style={{ padding: '8px 12px', borderRadius: 8 }}>Logout</button>
            </>
          ) : (
            <Link to="/login">Login / Register</Link>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <footer style={{ marginTop: 32, color: '#94a3b8' }}>© {new Date().getFullYear()} Writely — prototype</footer>
    </div>
  );
}

// ---------- Pages ----------
function Home() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
      <section style={cardStyle}>
        <h2>Welcome to Writely</h2>
        <p>This is a marketplace where students post writing tasks and tutors bid to complete them. You can register as a <strong>Student</strong> or <strong>Tutor</strong>.</p>
        <ul>
          <li>Students: post tasks, choose tutors, pay securely.</li>
          <li>Tutors: browse tasks, submit bids, chat with students (future).</li>
          <li>Transcription: upload audio or use the browser mic for quick transcription (client-side demo).</li>
        </ul>
        <div style={{ marginTop: 12 }}>
          <Link to="/tasks"><button style={{ padding: '10px 14px', borderRadius: 8 }}>Browse Tasks</button></Link>
          <Link to="/login" style={{ marginLeft: 8 }}><button style={{ padding: '10px 14px', borderRadius: 8 }}>Login / Register</button></Link>
        </div>
      </section>

      <aside style={cardStyle}>
        <h3>Quick actions</h3>
        <ol>
          <li>Register as student/tutor</li>
          <li>Post your first task</li>
          <li>Tutors bid on tasks</li>
          <li>Student accepts bid and pays</li>
        </ol>
        <div style={{ marginTop: 12 }}>
          <TranscriptionCard />
        </div>
      </aside>
    </div>
  );
}

function LoginPage() {
  const { register, login } = useAuth();
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    try {
      if (mode === 'register') {
        await register(form);
      } else {
        await login({ email: form.email, password: form.password });
      }
      navigate('/dashboard');
    } catch (error) {
      setErr(error.message);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
      <section style={cardStyle}>
        <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
        {err && <div style={{ color: 'crimson' }}>{err}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {mode === 'register' && (
            <input placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          )}
          <input placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <input placeholder="Password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          {mode === 'register' && (
            <div>
              <label>
                <input type="radio" name="role" value="student" checked={form.role === 'student'} onChange={() => setForm(f => ({ ...f, role: 'student' }))} /> Student
              </label>
              <label style={{ marginLeft: 12 }}>
                <input type="radio" name="role" value="tutor" checked={form.role === 'tutor'} onChange={() => setForm(f => ({ ...f, role: 'tutor' }))} /> Tutor
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" style={{ padding: '10px 14px', borderRadius: 8 }}>{mode === 'login' ? 'Login' : 'Register'}</button>
            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ padding: '10px 14px', borderRadius: 8 }}>Switch to {mode === 'login' ? 'Register' : 'Login'}</button>
          </div>
        </form>
      </section>

      <aside style={cardStyle}>
        <h3>Why register?</h3>
        <p>Students get access to tutors and a managed payment flow. Tutors get access to tasks and bidding tools.</p>
      </aside>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
      <aside style={cardStyle}>
        <h3>{user.name}'s dashboard</h3>
        <div>Role: <strong>{user.role}</strong></div>
        <nav style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link to="/dashboard/profile">Profile</Link>
          {user.role === 'student' ? <Link to="/dashboard/my-tasks">My Tasks</Link> : <Link to="/dashboard/browse">Browse Tasks</Link>}
          <Link to="/dashboard/payments">Payments</Link>
        </nav>
      </aside>

      <section style={cardStyle}>
        <Routes>
          <Route path="" element={<div><h2>Overview</h2><p>Quick summary and notifications (prototype)</p></div>} />
          <Route path="profile" element={<Profile />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="browse" element={<BrowseTasksForTutors />} />
          <Route path="payments" element={<PaymentsPage />} />
        </Routes>
      </section>
    </div>
  );
}

function Profile() {
  const { user } = useAuth();
  return (
    <div>
      <h2>Profile</h2>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  );
}

// ---------- Tasks & Bids (core features) ----------
function TasksPage() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
      <section style={cardStyle}>
        <h2>All Tasks</h2>
        <TasksList />
      </section>
      <aside style={cardStyle}>
        <h3>Post a task (students)</h3>
        <PostTaskCard />
        <div style={{ marginTop: 12 }}>
          <TranscriptionCard small />
        </div>
      </aside>
    </div>
  );
}

function TasksList() {
  const [tasks, setTasks] = useState(() => getDB().tasks || []);
  useEffect(() => { setTasks(getDB().tasks || []); }, []);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {tasks.length === 0 && <div>No tasks yet — be the first to post one!</div>}
      {tasks.slice().reverse().map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

function TaskCard({ task }) {
  const { user } = useAuth();
  const [showBids, setShowBids] = useState(false);
  const db = getDB();
  const bids = db.bids.filter(b => b.taskId === task.id);

  return (
    <div style={{ border: '1px solid #e6eef6', padding: 12, borderRadius: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <strong>{task.title}</strong>
          <div style={{ fontSize: 12, color: '#64748b' }}>By {task.studentName} — due {task.dueDate}</div>
        </div>
        <div>
          <strong>{task.budget ? 'KSh ' + task.budget : 'Budget: TBD'}</strong>
        </div>
      </div>
      <p style={{ marginTop: 8 }}>{task.description}</p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => setShowBids(s => !s)} style={{ padding: '8px 10px', borderRadius: 8 }}>{showBids ? 'Hide' : 'View'} bids ({bids.length})</button>
        {user && user.role === 'tutor' && <BidForm task={task} />}
        {user && user.role === 'student' && user.id === task.studentId && <AcceptBidUI task={task} />}
      </div>

      {showBids && (
        <div style={{ marginTop: 12 }}>
          <h4>Bids</h4>
          {bids.length === 0 && <div>No bids yet</div>}
          {bids.map(b => (
            <div key={b.id} style={{ borderTop: '1px dashed #e6eef6', paddingTop: 8, marginTop: 8 }}>
              <div><strong>{b.tutorName}</strong> — KSh {b.amount}</div>
              <div style={{ fontSize: 13 }}>{b.message}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Created {new Date(b.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BidForm({ task }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  function submitBid() {
    if (!user) { alert('Please login as a tutor to bid'); return; }
    const db = getDB();
    const bid = { id: 'b_' + Date.now(), taskId: task.id, tutorId: user.id, tutorName: user.name, amount: Number(amount), message, createdAt: Date.now() };
    db.bids.push(bid); saveDB(db);
    alert('Bid submitted');
    setAmount(''); setMessage('');
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input placeholder="Amount (KSh)" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: 120 }} />
      <input placeholder="Short message" value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={submitBid} style={{ padding: '8px 10px', borderRadius: 8 }}>Bid</button>
    </div>
  );
}

function AcceptBidUI({ task }) {
  const [selected, setSelected] = useState(null);
  const db = getDB();
  const bids = db.bids.filter(b => b.taskId === task.id);

  function accept(bid) {
    // In production: create an escrow/payment session and notify tutor
    const db2 = getDB();
    const t = db2.tasks.find(t => t.id === task.id);
    t.acceptedBid = bid;
    db2.payments.push({ id: 'p_' + Date.now(), taskId: task.id, amount: bid.amount, studentPaid: false, createdAt: Date.now() });
    saveDB(db2);
    alert('Bid accepted. Payment pending (prototype).');
  }

  return (
    <div>
      <select onChange={e => setSelected(e.target.value)} defaultValue="">
        <option value="">Choose bid to accept</option>
        {bids.map(b => <option key={b.id} value={b.id}>{b.tutorName} — KSh {b.amount}</option>)}
      </select>
      <button onClick={() => {
        const b = bids.find(x => x.id === selected);
        if (!b) return alert('Select a bid first');
        accept(b);
      }} style={{ marginLeft: 8 }}>Accept</button>
    </div>
  );
}

function PostTaskCard() {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', budget: '' });

  function submit() {
    if (!user || user.role !== 'student') { alert('Please login as a student to post tasks'); return; }
    const db = getDB();
    const task = { id: 't_' + Date.now(), title: form.title, description: form.description, studentId: user.id, studentName: user.name, dueDate: form.dueDate, budget: form.budget };
    db.tasks.push(task); saveDB(db);
    alert('Task posted');
    setForm({ title: '', description: '', dueDate: '', budget: '' });
  }

  return (
    <div>
      <input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <input placeholder="Due date (YYYY-MM-DD)" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
      <input placeholder="Budget (KSh)" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
      <div style={{ marginTop: 8 }}>
        <button onClick={submit} style={{ padding: '8px 12px', borderRadius: 8 }}>Post Task</button>
      </div>
    </div>
  );
}

function MyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(() => getDB().tasks.filter(t => t.studentId === (user ? user.id : '')));
  useEffect(() => { setTasks(getDB().tasks.filter(t => t.studentId === user.id)); }, [user]);
  return (
    <div>
      <h2>My Tasks</h2>
      {tasks.length === 0 && <div>You have no tasks yet</div>}
      {tasks.map(t => <TaskCard key={t.id} task={t} />)}
    </div>
  );
}

function BrowseTasksForTutors() {
  const [tasks, setTasks] = useState(() => getDB().tasks || []);
  useEffect(() => { setTasks(getDB().tasks || []); }, []);
  return (
    <div>
      <h2>Browse Tasks</h2>
      <TasksList />
    </div>
  );
}

// ---------- Payments (Prototype) ----------
function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState(() => getDB().payments.filter(p => {
    const db = getDB();
    const t = db.tasks.find(x => x.id === p.taskId);
    if (!t) return false;
    return user.role === 'student' ? t.studentId === user.id : true;
  }));

  function pay(payment) {
    // In production: call server to create Stripe session and redirect
    const db = getDB();
    const p = db.payments.find(x => x.id === payment.id);
    p.studentPaid = true; p.paidAt = Date.now(); saveDB(db);
    setPayments(prev => prev.map(x => x.id === p.id ? p : x));
    alert('Marked as paid (prototype). In production, integrate Stripe Checkout or Payment Intents.');
  }

  return (
    <div>
      <h2>Payments</h2>
      {payments.length === 0 && <div>No pending payments</div>}
      {payments.map(p => {
        const db = getDB();
        const task = db.tasks.find(t => t.id === p.taskId) || {};
        return (
          <div key={p.id} style={{ border: '1px solid #e6eef6', padding: 12, borderRadius: 10, marginTop: 8 }}>
            <div>Task: <strong>{task.title}</strong></div>
            <div>Amount: KSh {p.amount}</div>
            <div>Status: {p.studentPaid ? `Paid ${new Date(p.paidAt).toLocaleString()}` : 'Pending'}</div>
            {!p.studentPaid && user.role === 'student' && <button onClick={() => pay(p)} style={{ marginTop: 8 }}>Pay (prototype)</button>}
          </div>
        );
      })}

      <div style={{ marginTop: 12 }}>
        <h3>Stripe integration notes</h3>
        <p>To integrate real payments:
          <ol>
            <li>Implement a server endpoint /api/create-checkout-session that uses your Stripe secret key to create a Checkout session.</li>
            <li>Redirect the student to the session.url returned by Stripe.</li>
            <li>Use webhooks to listen for successful payment and mark the task as paid.</li>
          </ol>
        </p>
      </div>
    </div>
  );
}

// ---------- Transcription UI (browser demo + upload) ----------
function TranscriptionCard({ small }) {
  return (
    <div style={{ padding: 12, borderRadius: 8, background: '#f1f5f9' }}>
      <h4 style={{ marginTop: 0 }}>Quick Transcription</h4>
      <p style={{ marginTop: 0, fontSize: 13 }}>Use your browser mic or upload an audio file. This demo uses the Web Speech API; for production, send audio to a server that calls a transcription provider.</p>
      <TranscriptionTool small={small} />
    </div>
  );
}

function TranscriptionTool({ small }) {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState('');
  const [fileResult, setFileResult] = useState('');
  const [status, setStatus] = useState('idle');

  // Browser speech recognition (not supported in all browsers)
  useEffect(() => {
    let recognition;
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-KE';
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setText(transcript);
    };
    recognition.onend = () => setListening(false);
    if (listening) recognition.start();
    return () => { try { recognition.stop(); } catch (e) {} };
  }, [listening]);

  function toggleMic() { setListening(s => !s); }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('uploading');
    // In production: upload to your server -> call provider (Whisper/AssemblyAI/etc.)
    // This demo will just show file name
    setTimeout(() => { setFileResult(`Received ${file.name} (${Math.round(file.size/1024)} KB). Send to server for real transcription.`); setStatus('done'); }, 800);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={toggleMic} style={{ padding: '8px 10px', borderRadius: 8 }}>{listening ? 'Stop mic' : 'Start mic'}</button>
        <input type="file" accept="audio/*" onChange={handleFile} />
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={small ? 4 : 8} placeholder="Transcription output will appear here" />
      {status !== 'idle' && <div style={{ fontSize: 13 }}>{fileResult || 'Working...'}</div>}
    </div>
  );
}

// ---------- Root App ----------
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/tasks" element={<TasksPage />} />

            <Route path="/dashboard/*" element={<RequireAuth><Dashboard /></RequireAuth>} />

            <Route path="*" element={<div style={cardStyle}><h2>Not found</h2><Link to="/">Return home</Link></div>} />
          </Routes>
        </AppShell>
      </AuthProvider>
    </Router>
  );
}

/*
------------------
Developer checklist & suggestions (do these next):
- Hook up real authentication (recommended: Firebase Auth) and replace the mock localStorage flows.
- Move data to Firestore or your backend DB. Implement proper query indexes for tasks & bids.
- Implement server endpoints for payments; use Stripe Checkout or Payment Intents server-side.
- Implement real transcription: accept file uploads on server, forward to Whisper/AssemblyAI/Google Speech-to-Text, return transcript.
- Add file storage for submitted student files (S3 / Firebase Storage) and secure access controls.
- Add messaging / chat between student and tutor, and a rating/review system.
- Add email notifications (SendGrid / Postmark) and real push notifications if desired.
- For production, remove plaintext passwords and use HTTPS, CSP, rate limiting, and audits.

If you want, I can:
- scaffold a Node/Express server with endpoints for Stripe & transcription,
- or provide a Firebase rules/config example,
- or convert this into a multi-file GitHub-ready repository with README and install scripts.

*/
