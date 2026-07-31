import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Google provider
  const provider = new GoogleAuthProvider();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        if (name.trim()) {
          await updateProfile(userCredential.user, {
            displayName: name.trim(),
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      let friendlyMessage = err.message;
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        friendlyMessage = "Invalid email or password. Please try again.";
      } else if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "An account with this email already exists.";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "Password should be at least 6 characters long.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google Sign-In handler
  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Google signed in:", user);
    } catch (err: any) {
      console.error(err);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #07111f 0%, #0d1830 45%, #111c32 100%)",
        fontFamily: "var(--sans)",
      }}>
      <div className="relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-[var(--border)] p-8 md:p-10" style={{ background: 'rgba(17, 28, 50, 0.96)' }}>
        {/* Title */}
        <div className="text-center mb-8 mt-4">
          <h1
            className="text-4xl md:text-5xl mb-2 font-normal"
            style={{ fontFamily: "var(--heading)", color: "var(--text-h)" }}>
            Dear Diary
          </h1>
          <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>
            {isLogin
              ? "Open the pages of your memories..."
              : "Start your personal story today..."}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 bg-[#fdf2f2] border border-red-200 text-red-700 text-sm rounded-lg text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                Your Nickname
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mayesha"
                className="w-full px-3 py-2 border-b-2 outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
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
              className="w-full px-3 py-2 border-b-2 border-[#d9cbb3] focus:border-[#c97b63] outline-none"
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
              className="w-full px-3 py-2 border-b-2 border-[#d9cbb3] focus:border-[#c97b63] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-bold rounded-lg mt-4"
            style={{ background: "var(--accent-strong)", color: "#f9fbff" }}>
            {loading
              ? "Opening..."
              : isLogin
                ? "Open Diary ✎"
                : "Create Diary ✎"}
          </button>
        </form>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 font-bold rounded-lg shadow-md mt-4"
          style={{ background: "var(--accent)", color: "#f9fbff" }}>
          {loading ? "Connecting..." : "Sign in with Google"}
        </button>

        {/* Toggle Mode */}
        <div className="text-center mt-8 pt-6 border-t border-dashed" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {isLogin ? "Don't have a diary account?" : "Already have a diary?"}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="mt-2 font-bold hover:underline"
            style={{ color: "var(--accent-2)" }}>
            {isLogin ? "Sign Up for Free" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
