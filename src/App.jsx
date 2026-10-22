export default function App() {
  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">My Micro-SaaS</h1>
        <p className="text-slate-400 mb-6">Vite + React + Tailwind is running cleanly.</p>
        <button className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg transition-colors">
          Get Started
        </button>
      </div>
    </main>
  );
}