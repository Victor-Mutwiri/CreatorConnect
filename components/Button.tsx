import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-500/30 focus:ring-brand-500 border border-transparent dark:bg-brand-600 dark:hover:bg-brand-500",
    secondary: "bg-secondary-900 text-white hover:bg-slate-800 focus:ring-slate-900 border border-transparent dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700",
    outline: "bg-transparent text-slate-700 border-2 border-slate-200 hover:border-brand-500 hover:text-brand-600 focus:ring-brand-500 dark:text-slate-300 dark:border-slate-700 dark:hover:border-brand-500 dark:hover:text-brand-400",
    ghost: "bg-transparent text-slate-600 hover:text-brand-600 hover:bg-brand-50 focus:ring-brand-500 dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-slate-800",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;