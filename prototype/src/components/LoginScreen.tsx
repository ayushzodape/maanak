import React, { useState } from 'react';
import { AlertCircle, LoaderCircle, LockKeyhole } from 'lucide-react';
import { AuthenticatedUser } from '../services/scanApi';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<AuthenticatedUser>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onLogin(username, password);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
    <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5">
      <div><div className="flex items-center gap-2 text-slate-900"><LockKeyhole className="w-5 h-5 text-blue-700" /><h1 className="text-lg font-bold">Maanak screening access</h1></div><p className="text-xs text-slate-500 mt-2">Sign in to access scans, history, and screening reports.</p></div>
      <label className="block text-xs font-bold text-slate-800">Username<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none" /></label>
      <label className="block text-xs font-bold text-slate-800">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none" /></label>
      {error && <p className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>}
      <button type="submit" disabled={loading || !username.trim() || !password} className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold py-2.5 rounded text-xs">{loading && <LoaderCircle className="w-4 h-4 animate-spin" />}Sign in</button>
      <p className="text-[10px] text-slate-400">Session authorization is validated by the server. The role selector does not grant access.</p>
    </form>
  </main>;
};
