
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Camera, Briefcase } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

const Signup: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
  };

  const handleNextStep = () => {
    if (role) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signUp(email, password, name, role);
      if (result.error) {
        setError(result.error);
      } else {
        // Redirect based on role
        if (role === UserRole.CREATOR) {
          navigate('/creator/onboarding');
        } else {
          navigate('/client/onboarding');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Role Selection UI
  if (step === 1) {
    return (
      <AuthLayout
        title="Join Ubuni Connect"
        subtitle="Choose how you want to use the platform"
        image="https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80"
      >
        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelect(UserRole.CREATOR)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-start space-x-4 ${
              role === UserRole.CREATOR
                ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-lg ${role === UserRole.CREATOR ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
              <Camera size={24} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold ${role === UserRole.CREATOR ? 'text-brand-900' : 'text-slate-900'}`}>I'm a Creator</h3>
              <p className="text-sm text-slate-500 mt-1">I want to find jobs, showcase my work, and get paid.</p>
            </div>
            {role === UserRole.CREATOR && <Check className="text-brand-500" />}
          </button>

          <button
            onClick={() => handleRoleSelect(UserRole.CLIENT)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-start space-x-4 ${
              role === UserRole.CLIENT
                ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-lg ${role === UserRole.CLIENT ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
              <Briefcase size={24} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold ${role === UserRole.CLIENT ? 'text-brand-900' : 'text-slate-900'}`}>I'm a Client</h3>
              <p className="text-sm text-slate-500 mt-1">I want to hire talent for my campaigns and projects.</p>
            </div>
            {role === UserRole.CLIENT && <Check className="text-brand-500" />}
          </button>
        </div>

        <div className="mt-8">
          <Button
            onClick={handleNextStep}
            disabled={!role}
            className="w-full"
          >
            Continue
          </Button>
          <p className="text-center text-sm text-slate-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500">
              Sign in
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  // Step 2: Account Details
  return (
    <AuthLayout
      title="Create your account"
      subtitle={`Signing up as a ${role?.toLowerCase()}`}
      image="https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-5">
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
          
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            minLength={6}
            required
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>
          
          <button 
            type="button" 
            onClick={() => setStep(1)}
            className="w-full mt-4 text-sm text-slate-500 hover:text-slate-800"
          >
            ← Back to role selection
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Signup;