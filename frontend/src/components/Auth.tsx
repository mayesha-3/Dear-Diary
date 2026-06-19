import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(userCredential.user, {
            displayName: name.trim()
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      let friendlyMessage = err.message;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password should be at least 6 characters long.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'repeating-linear-gradient(to bottom, #f7f3e9, #f7f3e9 28px, #e3dac9 29px)',
        fontFamily: 'var(--sans)'
      }}
    >
      {/* Diary Card Container */}
      <div 
        className="relative w-full max-w-md bg-[#fffdf8] rounded-xl shadow-2xl overflow-hidden border-2 border-[#d9cbb3] p-8 md:p-10 transform transition-all duration-300"
        style={{
          boxShadow: '0 20px 40px rgba(74, 60, 42, 0.15), inset 0 0 10px rgba(0, 0, 0, 0.03)'
        }}
      >
        {/* Leather-like spine simulation on the left */}
        <div className="absolute top-0 left-0 w-3 h-full bg-gradient-to-r from-[#8a5d3b] to-[#b3855c] opacity-80 border-r border-[#4a2e1b]" />

        {/* Vintage ribbon sticker */}
        <div className="absolute -top-3 right-6 bg-[#c97b63] text-white text-xs font-semibold py-1.5 px-4 rotate-3 shadow-md uppercase tracking-wider">
          {isLogin ? 'Welcome Back' : 'Join Us'}
        </div>

        {/* Title */}
        <div className="text-center mb-8 mt-4">
          <h1 
            className="text-4xl md:text-5xl text-[#2b1d0e] mb-2 font-normal"
            style={{ fontFamily: 'var(--heading)' }}
          >
            Dear Diary
          </h1>
          <p className="text-sm text-[#8c7355] italic">
            {isLogin 
              ? 'Open the pages of your memories...' 
              : 'Start your personal story today...'
            }
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div 
            className="mb-6 p-3 bg-[#fdf2f2] border border-red-200 text-red-700 text-sm rounded-lg text-center"
            style={{ fontFamily: 'var(--sans)' }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8c7355] mb-1">
                Your Nickname
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mayesha"
                className="w-full px-3 py-2 bg-transparent border-b-2 border-[#d9cbb3] focus:border-[#c97b63] outline-none text-[#4a3c2a] transition duration-200"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8c7355] mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full px-3 py-2 bg-transparent border-b-2 border-[#d9cbb3] focus:border-[#c97b63] outline-none text-[#4a3c2a] transition duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8c7355] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-transparent border-b-2 border-[#d9cbb3] focus:border-[#c97b63] outline-none text-[#4a3c2a] transition duration-200"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#c97b63] text-white font-bold rounded-lg shadow-md hover:bg-[#b26952] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none mt-4 text-lg"
            style={{ fontFamily: 'var(--sans)' }}
          >
            {loading ? 'Opening...' : isLogin ? 'Open Diary ✎' : 'Create Diary ✎'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-8 pt-6 border-t border-dashed border-[#e3dac9]">
          <p className="text-sm text-[#8c7355]">
            {isLogin ? "Don't have a diary account?" : "Already have a diary?"}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="mt-2 text-[#c97b63] font-bold hover:underline"
          >
            {isLogin ? 'Sign Up for Free' : 'Sign In'}
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-[#e3dac9] rounded-full mix-blend-multiply filter blur-xl opacity-70 pointer-events-none" />
        <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-[#c97b63] rounded-full mix-blend-multiply filter blur-xl opacity-30 pointer-events-none" />
      </div>
    </div>
  );
}
