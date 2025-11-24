import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { APP_NAME } from '../constants';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  image?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, image }) => {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <Link to="/" className="flex items-center space-x-2 mb-10 group w-fit">
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-600 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <Sparkles size={16} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              {APP_NAME}
            </span>
          </Link>
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>

      {/* Right Side - Image/Art */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-slate-900">
          <img
            className="h-full w-full object-cover opacity-60 mix-blend-overlay"
            src={image || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1951&q=80"}
            alt="Authentication background"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 p-16 text-white max-w-2xl">
            <blockquote className="space-y-4">
              <p className="text-2xl font-medium leading-relaxed">
                "Ubuni Connect transformed how I find work. I went from chasing invoices to building long-term partnerships with brands I love."
              </p>
              <footer className="flex items-center space-x-4">
                <img 
                  src="https://randomuser.me/api/portraits/women/44.jpg" 
                  alt="Sarah K."
                  className="w-12 h-12 rounded-full border-2 border-white/20"
                />
                <div>
                  <div className="font-bold">Sarah Kamau</div>
                  <div className="text-slate-400 text-sm">Content Creator, Nairobi</div>
                </div>
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
