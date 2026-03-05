'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Mail, Lock, Check, User, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signup } = useAuth();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError('Please accept the terms and conditions');
      setIsLoading(false);
      return;
    }

    try {
      await signup(email, password, name);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setAcceptTerms(false);
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setError('');
      setSuccess(false);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAcceptTerms(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          >
            {/* Modal Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md mx-auto sm:mx-0 rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Scrollable Content Area */}
              <div className="max-h-[90vh] overflow-y-auto overscroll-contain">
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 z-10 text-white/70 hover:text-white transition-colors bg-black/20 rounded-full p-1"
                  disabled={isLoading}
                  aria-label="Close signup modal"
                >
                  <X size={24} />
                </button>

                <div className="p-6 sm:p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <img
                      src="/dblogo.jpg"
                      alt="AuraBank Logo"
                      className="w-16 h-16 mx-auto mb-4 object-contain"
                    />
                    <h2 className="text-2xl font-bold gradient-text mb-2">
                      Join AuraBank
                    </h2>
                    <p className="text-gray-400">Secure. Simple. Seamless.</p>
                  </div>

                  {/* Success State */}
                  <AnimatePresence>
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-center py-8"
                      >
                        <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Check size={32} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Account Created!
                        </h3>
                        <p className="text-gray-400">
                          Welcome to AuraBank. Redirecting...
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form */}
                  {!success && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Name Field */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" size={20} />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="form-input w-full pl-10 pr-4 py-3 text-white placeholder-gray-400 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="Enter your full name"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Email Field */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" size={20} />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input w-full pl-10 pr-4 py-3 text-white placeholder-gray-400 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            placeholder="Enter your email"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Password Field */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={20} />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input w-full pl-10 pr-12 py-3 text-white placeholder-gray-400 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Create a password"
                            required
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            disabled={isLoading}
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password Field */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" size={20} />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="form-input w-full pl-10 pr-12 py-3 text-white placeholder-gray-400 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Confirm your password"
                            required
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            disabled={isLoading}
                          >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      {/* Terms and Conditions */}
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="w-4 h-4 mt-1 text-cyan-400 bg-gray-800 border-gray-600 rounded focus:ring-cyan-400 focus:ring-2"
                          disabled={isLoading}
                        />
                        <label className="ml-2 text-sm text-gray-300">
                          I agree to the{' '}
                          <a
                            href="#"
                            className="text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a
                            href="#"
                            className="text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            Privacy Policy
                          </a>
                        </label>
                      </div>

                      {/* Error Message */}
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-400 text-sm text-center bg-red-900/20 rounded-lg p-3"
                        >
                          {error}
                        </motion.div>
                      )}

                      {/* Signup Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-cyan-500/20 transition-shadow"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Creating Account...</span>
                          </>
                        ) : (
                          <span>Create Account</span>
                        )}
                      </button>

                      {/* Divider */}
                      <div className="flex items-center my-6">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                        <span className="px-4 text-sm text-gray-400">Or sign up with</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                      </div>

                      {/* Social Signup */}
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          className="flex items-center justify-center space-x-2 bg-white text-gray-900 font-medium py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors shadow"
                          disabled={isLoading}
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          <span>Google</span>
                        </button>
                        <button
                          type="button"
                          className="flex items-center justify-center space-x-2 bg-black text-white font-medium py-3 px-4 rounded-xl hover:bg-gray-900 transition-colors shadow"
                          disabled={isLoading}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.749.097.118.112.221.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.017z" />
                          </svg>
                          <span>Apple</span>
                        </button>
                      </div>

                      {/* Login Link */}
                      <div className="text-center">
                        <span className="text-gray-400">Already have an account? </span>
                        <a
                          href="#"
                          className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                        >
                          Log In
                        </a>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}