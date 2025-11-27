
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldAlert, Terminal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn(email, password);
      
      if (result.error) {
        setError("Access Denied");
      } else if (result.user) {
        if (result.user.role === UserRole.ADMIN) {
          // Success - Redirect to secret dashboard
          navigate('/portal/8f030ac9-93da-41cc-af88-d9342cd54e5d');
        } else {
          // Not an admin - KICK THEM OUT
          await signOut();
          setError("Unauthorized Access detected. This incident has been logged.");
        }
      }
    } catch (e) {
      setError("System Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono">
      <div className="w-full max-w-md p-8 border border-gray-800 bg-gray-900 rounded-lg shadow-2xl relative overflow-hidden">
        {/* Scanline Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent pointer-events-none animate-scan"></div>
        
        <div className="flex items-center gap-2 mb-8 text-green-500">
          <Terminal size={24} />
          <h1 className="text-lg tracking-widest uppercase font-bold">System Access</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Identifier</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-gray-700 text-green-500 p-3 focus:outline-none focus:border-green-500 transition-colors"
              placeholder="usr://admin"
              autoComplete="off"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Key</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-gray-700 text-green-500 p-3 focus:outline-none focus:border-green-500 transition-colors"
                placeholder="••••••••••••"
              />
              <Lock size={14} className="absolute right-3 top-4 text-gray-600" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-900/10 p-3 border border-red-900/50">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-green-900/20 border border-green-800 text-green-500 py-3 uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all duration-300 font-bold"
          >
            {isLoading ? 'Authenticating...' : 'Initialize Session'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-600 uppercase">
            Restricted Area • Level 5 Clearance Required
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
