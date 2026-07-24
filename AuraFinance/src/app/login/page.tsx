'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { writeUnifiedAuthSession } from '../../../../shared/unified-auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [signupStep, setSignupStep] = useState<'options' | 'personal' | 'business'>('options');
  const [personalSignupStep, setPersonalSignupStep] = useState<1 | 2 | 3>(1);
  const [businessSignupStep, setBusinessSignupStep] = useState<1 | 2 | 3>(1);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    fullName: '',
    signupEmail: '',
    phone: '',
    dateOfBirth: '',
    ghanaCardNumber: '',
    ghanaCardExpiry: '',
    residentialAddress: '',
    newPassword: '',
    confirmPassword: '',
    transactionPin: '',
    twoFactorMethod: 'sms',
    securityQuestion: 'first-school',
    securityAnswer: '',
    acceptedTerms: false,
    employmentStatus: 'employed',
    monthlyIncomeRange: '',
    investmentGoal: '',
    riskTolerance: 'moderate',
    preferredProducts: '',
  });
  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    registrationNumber: '',
    tinNumber: '',
    industry: '',
    businessAddress: '',
    monthlyRevenueRange: '',
    expectedMonthlyVolume: '',
    authorizedRepName: '',
    authorizedRepRole: '',
    authorizedRepGhanaCardNumber: '',
    repPhone: '',
    newPassword: '',
    confirmPassword: '',
    transactionPin: '',
    twoFactorMethod: 'sms',
    securityQuestion: 'first-school',
    securityAnswer: '',
    acceptedTerms: false,
    payrollSize: '',
    settlementPreference: '',
    financingNeeds: '',
  });
  const router = useRouter();

  const openSignupModal = () => {
    setIsSignupModalOpen(true);
    setSignupStep('options');
    setPersonalSignupStep(1);
    setBusinessSignupStep(1);
    setSignupError('');
    setSignupSuccess('');
  };

  const closeSignupModal = () => {
    setIsSignupModalOpen(false);
    setSignupStep('options');
    setPersonalSignupStep(1);
    setBusinessSignupStep(1);
    setSignupError('');
    setSignupSuccess('');
  };

  const handlePersonalInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setPersonalForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBusinessInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setBusinessForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validatePersonalStep = (step: 1 | 2 | 3) => {
    const ghanaCardPattern = /^GHA-\d{9}-\d$/i;
    if (step === 1) {
      if (
        !personalForm.fullName.trim() ||
        !personalForm.signupEmail.trim() ||
        !personalForm.phone.trim() ||
        !personalForm.dateOfBirth ||
        !personalForm.ghanaCardExpiry ||
        !personalForm.residentialAddress.trim()
      ) {
        setSignupError('Complete all required identity details before continuing.');
        return false;
      }

      if (!ghanaCardPattern.test(personalForm.ghanaCardNumber.trim())) {
        setSignupError('Enter a valid Ghana Card number (example: GHA-123456789-1).');
        return false;
      }

      return true;
    }

    if (step === 2) {
      if (personalForm.newPassword.length < 8) {
        setSignupError('Password must be at least 8 characters.');
        return false;
      }

      if (personalForm.newPassword !== personalForm.confirmPassword) {
        setSignupError('Passwords do not match.');
        return false;
      }

      if (!/^\d{4}$/.test(personalForm.transactionPin)) {
        setSignupError('Transaction PIN must be exactly 4 digits.');
        return false;
      }

      if (!personalForm.securityAnswer.trim()) {
        setSignupError('Please provide a security answer.');
        return false;
      }

      if (!personalForm.acceptedTerms) {
        setSignupError('Please accept the terms and privacy policy to continue.');
        return false;
      }

      return true;
    }

    return true;
  };

  const goToNextPersonalStep = () => {
    setSignupError('');
    setSignupSuccess('');

    if (!validatePersonalStep(personalSignupStep)) return;

    if (personalSignupStep < 3) {
      setPersonalSignupStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const validateBusinessStep = (step: 1 | 2 | 3) => {
    const ghanaCardPattern = /^GHA-\d{9}-\d$/i;

    if (step === 1) {
      if (
        !businessForm.businessName.trim() ||
        !businessForm.businessEmail.trim() ||
        !businessForm.businessPhone.trim() ||
        !businessForm.registrationNumber.trim() ||
        !businessForm.tinNumber.trim() ||
        !businessForm.industry.trim() ||
        !businessForm.businessAddress.trim() ||
        !businessForm.authorizedRepName.trim() ||
        !businessForm.authorizedRepRole.trim() ||
        !businessForm.repPhone.trim()
      ) {
        setSignupError('Complete all required business identity details before continuing.');
        return false;
      }

      if (!ghanaCardPattern.test(businessForm.authorizedRepGhanaCardNumber.trim())) {
        setSignupError('Enter a valid representative Ghana Card number (example: GHA-123456789-1).');
        return false;
      }

      return true;
    }

    if (step === 2) {
      if (businessForm.newPassword.length < 8) {
        setSignupError('Password must be at least 8 characters.');
        return false;
      }

      if (businessForm.newPassword !== businessForm.confirmPassword) {
        setSignupError('Passwords do not match.');
        return false;
      }

      if (!/^\d{4}$/.test(businessForm.transactionPin)) {
        setSignupError('Transaction PIN must be exactly 4 digits.');
        return false;
      }

      if (!businessForm.securityAnswer.trim()) {
        setSignupError('Please provide a security answer.');
        return false;
      }

      if (!businessForm.acceptedTerms) {
        setSignupError('Please accept the terms and privacy policy to continue.');
        return false;
      }

      return true;
    }

    return true;
  };

  const goToNextBusinessStep = () => {
    setSignupError('');
    setSignupSuccess('');

    if (!validateBusinessStep(businessSignupStep)) return;

    if (businessSignupStep < 3) {
      setBusinessSignupStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const handlePersonalSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');

    if (!validatePersonalStep(1) || !validatePersonalStep(2)) {
      return;
    }

    try {
      setIsSubmittingSignup(true);
      const response = await fetch('/api/signup/personal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personalForm),
      });

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
        user?: {
          id: string;
          email: string;
          name: string;
          accountType?: 'personal' | 'business';
        };
      };

      if (!response.ok || !data.success) {
        setSignupError(data.message || 'Could not submit signup details. Please try again.');
        return;
      }

      if (data.user) {
        // Auto-login immediately after account creation
        const loginResult = await signIn('credentials', {
          email: data.user.email,
          password: personalForm.newPassword,
          redirect: false,
        });
        if (!loginResult?.error) {
          writeUnifiedAuthSession({
            userId: data.user.id,
            email: data.user.email,
            name: data.user.name,
            sourceApp: 'AuraFinance',
          });
          router.push('/dashboard');
          return;
        }
      }

      setSignupSuccess('Account created! You can now sign in with your credentials.');
    } catch {
      setSignupError('Network error while submitting signup. Please try again.');
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  const handleBusinessSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');

    if (!validateBusinessStep(1) || !validateBusinessStep(2)) {
      return;
    }

    try {
      setIsSubmittingSignup(true);
      const response = await fetch('/api/signup/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessForm),
      });

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
        user?: {
          id: string;
          email: string;
          name: string;
          accountType?: 'personal' | 'business';
        };
      };

      if (!response.ok || !data.success) {
        setSignupError(data.message || 'Could not submit business signup details. Please try again.');
        return;
      }

      if (data.user) {
        // Auto-login immediately after account creation
        const loginResult = await signIn('credentials', {
          email: data.user.email,
          password: businessForm.newPassword,
          redirect: false,
        });
        if (!loginResult?.error) {
          writeUnifiedAuthSession({
            userId: data.user.id,
            email: data.user.email,
            name: data.user.name,
            sourceApp: 'AuraFinance',
          });
          router.push('/dashboard');
          return;
        }
      }

      setSignupSuccess('Business account created! You can now sign in with your credentials.');
    } catch {
      setSignupError('Network error while submitting business signup. Please try again.');
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid credentials');
    } else {
      const sessionResponse = await fetch('/api/auth/session');
      const currentSession = (await sessionResponse.json()) as {
        user?: { id?: string; email?: string | null; name?: string | null };
      };

      writeUnifiedAuthSession({
        userId: String(currentSession.user?.id || '1'),
        email: currentSession.user?.email || email,
        name: currentSession.user?.name || 'User',
        sourceApp: 'AuraFinance',
      });
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-2/5 relative flex-col bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />

        {/* Top logo */}
        <div className="relative z-10 p-10">
          <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity w-fit">
            <div className="w-16 h-16 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center overflow-hidden bg-white">
              <Image src="/images/suite.jpeg" alt="Aura Finance" width={64} height={64} className="object-contain" priority />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Aura Finance</span>
          </Link>
        </div>

        {/* Centre content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10">
          <p className="text-blue-300 text-sm font-semibold uppercase tracking-widest mb-4">Your unified financial suite</p>
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-6">
            Bank. Invest.<br />Send. All in one.
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm mb-10">
            Manage your accounts, grow your portfolio, and send money instantly — all from a single dashboard.
          </p>

          {/* App tiles */}
          <div className="grid grid-cols-2 gap-4 max-w-xs">
            {[
              { src: '/images/bank.jpg', name: 'AuraBank', desc: 'Accounts & payments', color: 'from-pink-500/20 to-cyan-500/20' },
              { src: '/images/vest.jpeg', name: 'AuraVest', desc: 'Stocks & crypto', color: 'from-red-500/20 to-slate-500/20' },
              { src: '/images/wallet.jpg', name: 'AuraWallet', desc: 'Send & receive', color: 'from-emerald-500/20 to-green-500/20' },
              { src: '/images/ai.jpg', name: 'AuraAI', desc: 'Smart insights', color: 'from-purple-500/20 to-blue-500/20' },
            ].map((app) => (
              <div key={app.name} className={`flex items-center gap-3 bg-gradient-to-br ${app.color} border border-white/10 rounded-2xl p-3 backdrop-blur-sm`}>
                <div className="w-9 h-9 rounded-xl bg-white shadow overflow-hidden flex-shrink-0">
                  <Image src={app.src} alt={app.name} width={36} height={36} className="object-cover w-full h-full" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold leading-tight">{app.name}</p>
                  <p className="text-slate-400 text-[10px]">{app.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 p-10 border-t border-white/10 flex gap-8">
          {[['4', 'Apps'], ['1', 'Login'], ['Live', 'Sync']].map(([val, label]) => (
            <div key={label}>
              <p className="text-white font-extrabold text-xl">{val}</p>
              <p className="text-slate-400 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-950 px-6 py-12">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden flex items-center gap-3 mb-10 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
            <Image src="/images/suite.jpeg" alt="Aura Finance" width={40} height={40} className="object-contain" priority />
          </div>
          <span className="font-bold text-xl text-slate-800 dark:text-white">Aura Finance</span>
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
                <span className="flex-shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 text-white font-semibold shadow-lg shadow-blue-500/20 transition-all">
              Sign In
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-slate-950 px-3 text-slate-400">Don&apos;t have an account?</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 font-medium"
            onClick={openSignupModal}
          >
            Create Account
          </Button>
        </div>
      </div>

      {isSignupModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Choose signup option"
          onClick={closeSignupModal}
        >
          <div
            className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {signupStep === 'options'
                    ? 'Create your Aura Finance account'
                    : signupStep === 'personal'
                      ? 'Personal account signup'
                      : 'Business account signup'}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {signupStep === 'options'
                    ? 'Pick how you want to get started.'
                    : signupStep === 'personal'
                      ? 'Fill in your identity and security details to continue.'
                      : 'Complete your company onboarding and security setup.'}
                </p>
              </div>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
                onClick={closeSignupModal}
                aria-label="Close signup options"
              >
                ✕
              </button>
            </div>

            {signupStep === 'options' ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="font-semibold text-gray-900">Personal Account</p>
                  <p className="text-sm text-gray-600 mt-1">Banking, wallet, and investing for individuals.</p>
                  <Button
                    className="mt-3 w-full"
                    onClick={() => {
                      setSignupStep('personal');
                      setPersonalSignupStep(1);
                      setSignupError('');
                      setSignupSuccess('');
                    }}
                  >
                    Start Personal Signup
                  </Button>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="font-semibold text-gray-900">Business Account</p>
                  <p className="text-sm text-gray-600 mt-1">Team controls, expense cards, and automation for companies.</p>
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => {
                      setSignupStep('business');
                      setBusinessSignupStep(1);
                      setSignupError('');
                      setSignupSuccess('');
                    }}
                  >
                    Start Business Signup
                  </Button>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="font-semibold text-gray-900">Talk to an Advisor</p>
                  <p className="text-sm text-gray-600 mt-1">Get guided onboarding based on your financial goals.</p>
                  <Button asChild variant="outline" className="mt-3 w-full">
                    <Link href="/contact" onClick={closeSignupModal}>
                      Book Onboarding Call
                    </Link>
                  </Button>
                </div>
              </div>
            ) : signupStep === 'personal' ? (
              <form className="mt-5 space-y-4" onSubmit={handlePersonalSignupSubmit}>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <span className={`px-2 py-1 rounded-full ${personalSignupStep === 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
                    1. Identity (Required)
                  </span>
                  <span className={`px-2 py-1 rounded-full ${personalSignupStep === 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
                    2. Security (Required)
                  </span>
                  <span className={`px-2 py-1 rounded-full ${personalSignupStep === 3 ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                    3. Finance Profile (Optional)
                  </span>
                </div>

                {personalSignupStep === 1 && (
                  <>
                    <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                      <p className="font-semibold text-gray-900">Identity & KYC (Required now)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            name="fullName"
                            value={personalForm.fullName}
                            onChange={handlePersonalInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="signupEmail">Email Address</Label>
                          <Input
                            id="signupEmail"
                            name="signupEmail"
                            type="email"
                            value={personalForm.signupEmail}
                            onChange={handlePersonalInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            placeholder="+233..."
                            value={personalForm.phone}
                            onChange={handlePersonalInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Input
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            value={personalForm.dateOfBirth}
                            onChange={handlePersonalInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                      <p className="font-semibold text-gray-900">Ghana Card Verification (Required now)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ghanaCardNumber">Ghana Card Number</Label>
                          <Input
                            id="ghanaCardNumber"
                            name="ghanaCardNumber"
                            placeholder="GHA-123456789-1"
                            value={personalForm.ghanaCardNumber}
                            onChange={handlePersonalInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="ghanaCardExpiry">Card Expiry Date</Label>
                          <Input
                            id="ghanaCardExpiry"
                            name="ghanaCardExpiry"
                            type="date"
                            value={personalForm.ghanaCardExpiry}
                            onChange={handlePersonalInputChange}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="residentialAddress">Residential Address</Label>
                        <Input
                          id="residentialAddress"
                          name="residentialAddress"
                          value={personalForm.residentialAddress}
                          onChange={handlePersonalInputChange}
                        />
                      </div>
                    </div>
                  </>
                )}

                {personalSignupStep === 2 && (
                  <>
                    <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                      <p className="font-semibold text-gray-900">Security Setup (Required now)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="newPassword">Password</Label>
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={personalForm.newPassword}
                            onChange={handlePersonalInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={personalForm.confirmPassword}
                            onChange={handlePersonalInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="transactionPin">4-digit Transaction PIN</Label>
                          <Input
                            id="transactionPin"
                            name="transactionPin"
                            type="password"
                            maxLength={4}
                            value={personalForm.transactionPin}
                            onChange={handlePersonalInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="twoFactorMethod">2FA Method</Label>
                          <select
                            id="twoFactorMethod"
                            name="twoFactorMethod"
                            value={personalForm.twoFactorMethod}
                            onChange={handlePersonalInputChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="sms">SMS OTP</option>
                            <option value="email">Email OTP</option>
                            <option value="authenticator">Authenticator App</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="securityQuestion">Security Question</Label>
                          <select
                            id="securityQuestion"
                            name="securityQuestion"
                            value={personalForm.securityQuestion}
                            onChange={handlePersonalInputChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="first-school">What was your first school?</option>
                            <option value="mother-maiden">What is your mother&apos;s maiden name?</option>
                            <option value="first-pet">What was your first pet&apos;s name?</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="securityAnswer">Security Answer</Label>
                          <Input
                            id="securityAnswer"
                            name="securityAnswer"
                            value={personalForm.securityAnswer}
                            onChange={handlePersonalInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name="acceptedTerms"
                        checked={personalForm.acceptedTerms}
                        onChange={handlePersonalInputChange}
                        className="h-4 w-4"
                      />
                      I confirm my details are correct and accept Aura Finance terms and privacy policy.
                    </label>
                  </>
                )}

                {personalSignupStep === 3 && (
                  <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                    <p className="font-semibold text-gray-900">Financial Profile (Optional later)</p>
                    <p className="text-sm text-gray-600">
                      This helps personalize banking, investing, and wallet recommendations.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employmentStatus">Employment Status</Label>
                        <select
                          id="employmentStatus"
                          name="employmentStatus"
                          value={personalForm.employmentStatus}
                          onChange={handlePersonalInputChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="employed">Employed</option>
                          <option value="self-employed">Self-employed</option>
                          <option value="student">Student</option>
                          <option value="unemployed">Unemployed</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="monthlyIncomeRange">Monthly Income Range</Label>
                        <Input
                          id="monthlyIncomeRange"
                          name="monthlyIncomeRange"
                          placeholder="e.g. GHS 5,000 - 10,000"
                          value={personalForm.monthlyIncomeRange}
                          onChange={handlePersonalInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="investmentGoal">Primary Investment Goal</Label>
                        <Input
                          id="investmentGoal"
                          name="investmentGoal"
                          placeholder="Retirement, education, home..."
                          value={personalForm.investmentGoal}
                          onChange={handlePersonalInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                        <select
                          id="riskTolerance"
                          name="riskTolerance"
                          value={personalForm.riskTolerance}
                          onChange={handlePersonalInputChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="moderate">Moderate</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="preferredProducts">Preferred Products</Label>
                      <Input
                        id="preferredProducts"
                        name="preferredProducts"
                        placeholder="AuraBank, AuraVest, AuraWallet"
                        value={personalForm.preferredProducts}
                        onChange={handlePersonalInputChange}
                      />
                    </div>
                  </div>
                )}

                {signupError && <p className="text-sm text-red-600">{signupError}</p>}
                {signupSuccess && <p className="text-sm text-green-600">{signupSuccess}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (personalSignupStep === 1) {
                        setSignupStep('options');
                        setPersonalSignupStep(1);
                      } else {
                        setPersonalSignupStep((prev) => (prev - 1) as 1 | 2 | 3);
                      }
                      setSignupError('');
                      setSignupSuccess('');
                    }}
                  >
                    Back
                  </Button>
                  {personalSignupStep < 3 ? (
                    <Button type="button" onClick={goToNextPersonalStep}>
                      Continue
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmittingSignup}>
                      {isSubmittingSignup ? 'Submitting...' : 'Submit Personal Signup'}
                    </Button>
                  )}
                  {personalSignupStep === 3 && (
                    <Button type="submit" variant="outline" disabled={isSubmittingSignup}>
                      {isSubmittingSignup ? 'Submitting...' : 'Skip Optional & Submit'}
                    </Button>
                  )}
                </div>
              </form>
            ) : (
              <form className="mt-5 space-y-4" onSubmit={handleBusinessSignupSubmit}>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <span className={`px-2 py-1 rounded-full ${businessSignupStep === 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
                    1. Business Identity (Required)
                  </span>
                  <span className={`px-2 py-1 rounded-full ${businessSignupStep === 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
                    2. Security (Required)
                  </span>
                  <span className={`px-2 py-1 rounded-full ${businessSignupStep === 3 ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                    3. Operations (Optional)
                  </span>
                </div>

                {businessSignupStep === 1 && (
                  <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                    <p className="font-semibold text-gray-900">Business Identity & KYC (Required now)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input id="businessName" name="businessName" value={businessForm.businessName} onChange={handleBusinessInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="businessEmail">Business Email</Label>
                        <Input id="businessEmail" name="businessEmail" type="email" value={businessForm.businessEmail} onChange={handleBusinessInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="businessPhone">Business Phone</Label>
                        <Input id="businessPhone" name="businessPhone" value={businessForm.businessPhone} onChange={handleBusinessInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Input id="industry" name="industry" value={businessForm.industry} onChange={handleBusinessInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="registrationNumber">Registration Number</Label>
                        <Input id="registrationNumber" name="registrationNumber" value={businessForm.registrationNumber} onChange={handleBusinessInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="tinNumber">TIN Number</Label>
                        <Input id="tinNumber" name="tinNumber" value={businessForm.tinNumber} onChange={handleBusinessInputChange} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="businessAddress">Business Address</Label>
                      <Input id="businessAddress" name="businessAddress" value={businessForm.businessAddress} onChange={handleBusinessInputChange} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="authorizedRepName">Authorized Rep Name</Label>
                        <Input id="authorizedRepName" name="authorizedRepName" value={businessForm.authorizedRepName} onChange={handleBusinessInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="authorizedRepRole">Rep Role</Label>
                        <Input id="authorizedRepRole" name="authorizedRepRole" value={businessForm.authorizedRepRole} onChange={handleBusinessInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="repPhone">Rep Phone</Label>
                        <Input id="repPhone" name="repPhone" value={businessForm.repPhone} onChange={handleBusinessInputChange} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="authorizedRepGhanaCardNumber">Rep Ghana Card Number</Label>
                      <Input
                        id="authorizedRepGhanaCardNumber"
                        name="authorizedRepGhanaCardNumber"
                        placeholder="GHA-123456789-1"
                        value={businessForm.authorizedRepGhanaCardNumber}
                        onChange={handleBusinessInputChange}
                      />
                    </div>
                  </div>
                )}

                {businessSignupStep === 2 && (
                  <>
                    <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                      <p className="font-semibold text-gray-900">Security Setup (Required now)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="businessNewPassword">Password</Label>
                          <Input
                            id="businessNewPassword"
                            name="newPassword"
                            type="password"
                            value={businessForm.newPassword}
                            onChange={handleBusinessInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="businessConfirmPassword">Confirm Password</Label>
                          <Input
                            id="businessConfirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={businessForm.confirmPassword}
                            onChange={handleBusinessInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="businessTransactionPin">4-digit Transaction PIN</Label>
                          <Input
                            id="businessTransactionPin"
                            name="transactionPin"
                            type="password"
                            maxLength={4}
                            value={businessForm.transactionPin}
                            onChange={handleBusinessInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="businessTwoFactorMethod">2FA Method</Label>
                          <select
                            id="businessTwoFactorMethod"
                            name="twoFactorMethod"
                            value={businessForm.twoFactorMethod}
                            onChange={handleBusinessInputChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="sms">SMS OTP</option>
                            <option value="email">Email OTP</option>
                            <option value="authenticator">Authenticator App</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="businessSecurityQuestion">Security Question</Label>
                          <select
                            id="businessSecurityQuestion"
                            name="securityQuestion"
                            value={businessForm.securityQuestion}
                            onChange={handleBusinessInputChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="first-school">What was your first school?</option>
                            <option value="mother-maiden">What is your mother&apos;s maiden name?</option>
                            <option value="first-pet">What was your first pet&apos;s name?</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="businessSecurityAnswer">Security Answer</Label>
                          <Input
                            id="businessSecurityAnswer"
                            name="securityAnswer"
                            value={businessForm.securityAnswer}
                            onChange={handleBusinessInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name="acceptedTerms"
                        checked={businessForm.acceptedTerms}
                        onChange={handleBusinessInputChange}
                        className="h-4 w-4"
                      />
                      I confirm this business information is accurate and accept Aura Finance terms and privacy policy.
                    </label>
                  </>
                )}

                {businessSignupStep === 3 && (
                  <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                    <p className="font-semibold text-gray-900">Business Operations (Optional later)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="monthlyRevenueRange">Monthly Revenue Range</Label>
                        <Input
                          id="monthlyRevenueRange"
                          name="monthlyRevenueRange"
                          placeholder="e.g. GHS 50,000 - 100,000"
                          value={businessForm.monthlyRevenueRange}
                          onChange={handleBusinessInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="expectedMonthlyVolume">Expected Monthly Transaction Volume</Label>
                        <Input
                          id="expectedMonthlyVolume"
                          name="expectedMonthlyVolume"
                          placeholder="e.g. 500 transactions"
                          value={businessForm.expectedMonthlyVolume}
                          onChange={handleBusinessInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="payrollSize">Payroll Size</Label>
                        <Input
                          id="payrollSize"
                          name="payrollSize"
                          placeholder="e.g. 20 employees"
                          value={businessForm.payrollSize}
                          onChange={handleBusinessInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="settlementPreference">Settlement Preference</Label>
                        <Input
                          id="settlementPreference"
                          name="settlementPreference"
                          placeholder="Daily, weekly, monthly"
                          value={businessForm.settlementPreference}
                          onChange={handleBusinessInputChange}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="financingNeeds">Financing Needs</Label>
                      <Input
                        id="financingNeeds"
                        name="financingNeeds"
                        placeholder="Working capital, invoice finance, expansion"
                        value={businessForm.financingNeeds}
                        onChange={handleBusinessInputChange}
                      />
                    </div>
                  </div>
                )}

                {signupError && <p className="text-sm text-red-600">{signupError}</p>}
                {signupSuccess && <p className="text-sm text-green-600">{signupSuccess}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (businessSignupStep === 1) {
                        setSignupStep('options');
                        setBusinessSignupStep(1);
                      } else {
                        setBusinessSignupStep((prev) => (prev - 1) as 1 | 2 | 3);
                      }
                      setSignupError('');
                      setSignupSuccess('');
                    }}
                  >
                    Back
                  </Button>
                  {businessSignupStep < 3 ? (
                    <Button type="button" onClick={goToNextBusinessStep}>
                      Continue
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmittingSignup}>
                      {isSubmittingSignup ? 'Submitting...' : 'Submit Business Signup'}
                    </Button>
                  )}
                  {businessSignupStep === 3 && (
                    <Button type="submit" variant="outline" disabled={isSubmittingSignup}>
                      {isSubmittingSignup ? 'Submitting...' : 'Skip Optional & Submit'}
                    </Button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
