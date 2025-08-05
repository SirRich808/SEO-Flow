import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CommandFlowIcon, LockClosedIcon } from './icons/Icons';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const trimmedEmail = email.trim();

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email: trimmedEmail, password });
      if (error) {
        setError(error.message);
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        // This case handles when a user exists but is unconfirmed.
        setError("User with this email already exists. Please check your email for a confirmation link.");
      }
      else {
        setMessage('Registration successful! Please check your email for a confirmation link.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      if (error) {
        setError(error.message);
      }
      // On successful login, the onAuthStateChange listener in App.tsx will handle the redirect.
    }
    setLoading(false);
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setMessage(null);
    // Clear fields when toggling for better UX
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
            <CommandFlowIcon />
            <h1 className="text-4xl font-bold text-white ml-2 mt-4">SEO-Flow</h1>
            <p className="text-gray-400 mt-2">{isSignUp ? 'Create a New Account' : 'The AI-Native Command Center'}</p>
        </div>
        
        <div className="bg-navy-800 border border-navy-700 rounded-lg shadow-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                        Email Address
                    </label>
                    <div className="mt-1">
                        <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-navy-900 border-2 border-navy-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-command-blue transition-all"
                        placeholder="you@agency.com"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                        Password
                    </label>
                    <div className="mt-1">
                        <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete={isSignUp ? "new-password" : "current-password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-navy-900 border-2 border-navy-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-command-blue transition-all"
                        placeholder="••••••••"
                        />
                    </div>
                </div>
                
                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                {message && <p className="text-sm text-green-400 text-center">{message}</p>}

                <div>
                    <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="w-full flex justify-center items-center bg-command-blue hover:bg-command-blue-dark text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <LockClosedIcon className="-ml-1 mr-2 h-5 w-5" />
                        {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
                    </button>
                </div>
            </form>
             <p className="mt-6 text-center text-sm text-gray-500">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button 
                  onClick={toggleAuthMode} 
                  className="font-medium text-command-blue hover:text-command-blue-dark focus:outline-none focus:underline transition"
                  type="button"
                >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;