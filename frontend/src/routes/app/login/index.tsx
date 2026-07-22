import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Sparkles, BookOpen } from 'lucide-react';
import { GlassPanel } from '../../../design/primitives';
import { useToast } from '../../../components/components';

const loginSchema = z.object({
  email: z.string().email('Provide a valid university email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginProps {
  onLoginSuccess: (role: 'student' | 'faculty') => void;
}

export const LoginPage: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'alex.mercer@university.edu',
      password: 'password123',
    },
  });

  const handleLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const resData = await response.json();
      localStorage.setItem('drishta_auth_token', resData.token);
      localStorage.setItem('drishta_student_id', resData.student_id);
      
      // Determine if logging in as faculty or student
      const role = data.email.includes('faculty') || data.email.includes('admin') ? 'faculty' : 'student';
      localStorage.setItem('drishta_role', role);

      toast('Authentication Successful', `Logged in as ${resData.name || data.email}`, 'guard');
      onLoginSuccess(role);
    } catch (err: any) {
      toast('Login Failed', err.message || 'Check your credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = (role: 'student' | 'faculty') => {
    localStorage.setItem('drishta_auth_token', 'demo-token');
    if (role === 'student') {
      localStorage.setItem('drishta_student_id', 'STU_HERO');
      localStorage.setItem('drishta_role', 'student');
      toast('Demo Student Access', 'Authorized as student (Aisha)', 'guard');
      onLoginSuccess('student');
    } else {
      localStorage.setItem('drishta_role', 'faculty');
      toast('Demo Faculty Access', 'Authorized as faculty administrator', 'guard');
      onLoginSuccess('faculty');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-decide/10 border border-decide/20 rounded-2xl text-decide glow-decide animate-pulse">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-text">Drishta</h1>
          <p className="text-sm text-text-dim max-w-sm mx-auto">
            Explainable Student-Mentorship System
          </p>
        </div>

        <GlassPanel depth="card" className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-text">Welcome back</h2>
            <p className="text-xs text-text-dim">
              Sign in with your university credentials to access the system
            </p>
          </div>

          <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-text-dim uppercase tracking-wider block" htmlFor="email">
                University Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-sm text-text focus:border-decide focus:outline-none transition-colors"
                placeholder="email@university.edu"
              />
              {errors.email && (
                <p className="text-xs text-risk-high">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text-dim uppercase tracking-wider block" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-sm text-text focus:border-decide focus:outline-none transition-colors"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-xs text-risk-high">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-decide hover:bg-decide/90 text-white rounded-md text-sm font-semibold transition-all cursor-pointer glow-decide flex items-center justify-center space-x-2"
            >
              {loading ? 'Validating credentials...' : 'Enter System'}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-line"></div>
            <span className="flex-shrink mx-4 text-[10px] text-text-dim uppercase tracking-widest font-semibold">
              Or Quick Enter
            </span>
            <div className="flex-grow border-t border-line"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => loginAsDemo('student')}
              className="py-2 px-3 border border-speak/20 hover:border-speak bg-speak/5 hover:bg-speak/10 text-speak rounded-md text-xs font-semibold transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Student Panel</span>
            </button>
            <button
              onClick={() => loginAsDemo('faculty')}
              className="py-2 px-3 border border-guard/20 hover:border-guard bg-guard/5 hover:bg-guard/10 text-guard rounded-md text-xs font-semibold transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Faculty Console</span>
            </button>
          </div>
        </GlassPanel>

        <div className="text-center text-[10px] text-text-dim flex justify-center space-x-4">
          <span>Indigo = Decision Core</span>
          <span>Amber = AI Voice</span>
          <span>Green = Governance</span>
        </div>
      </div>
    </div>
  );
};
