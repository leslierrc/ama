import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      onLogin();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(msg.includes('Invalid login') ? 'Correo o contraseña incorrectos.' : msg);
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    backgroundColor: '#f8f4e4',
    border: '1px solid #bfc9c3',
    color: '#1c1c13',
    borderRadius: '0.75rem',
    padding: '12px 16px',
    width: '100%',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: '#fdf9e9' }}>
      {/* Back */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm transition-colors"
        style={{ color: '#404944' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#003527')}
        onMouseLeave={e => (e.currentTarget.style.color = '#404944')}
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Volver al inicio
      </button>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl p-8 flex flex-col gap-6"
        style={{ backgroundColor: 'white', boxShadow: '0 10px 40px -10px rgba(0,53,39,0.12)', border: '1px solid #e6e3d3' }}>

        {/* Logo */}
        <div className="text-center">
          <div className="font-display text-4xl font-bold tracking-tighter mb-2"
            style={{ color: '#022C22', fontFamily: 'Playfair Display, Georgia, serif' }}>
            AMA
          </div>
          <h1 className="text-xl font-semibold" style={{ color: '#003527', fontFamily: 'Playfair Display, Georgia, serif' }}>
            Panel Administrador
          </h1>
          <p className="text-sm mt-1" style={{ color: '#404944' }}>Acceso restringido</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#404944' }}>
              Correo electrónico
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@amastore.cu" style={inp} autoComplete="email"
              onFocus={e => (e.currentTarget.style.borderColor = '#003527')}
              onBlur={e => (e.currentTarget.style.borderColor = '#bfc9c3')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#404944' }}>
              Contraseña
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" style={inp} autoComplete="current-password"
              onFocus={e => (e.currentTarget.style.borderColor = '#003527')}
              onBlur={e => (e.currentTarget.style.borderColor = '#bfc9c3')} />
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'rgba(186,26,26,0.08)', color: '#ba1a1a', border: '1px solid rgba(186,26,26,0.2)' }}>
              ⚠️ {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-semibold uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            style={{ backgroundColor: '#003527', color: 'white' }}>
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verificando…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">lock_open</span>
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-center" style={{ color: '#707974' }}>
          Solo personal autorizado de AMA Store
        </p>
      </div>
    </div>
  );
};
