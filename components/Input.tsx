import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <input
        className={`w-full px-4 py-2 bg-white dark:bg-slate-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 dark:text-white ${
          error 
            ? 'border-red-300 dark:border-red-700 focus:ring-red-500 text-red-900 placeholder-red-300' 
            : 'border-slate-300 dark:border-slate-700 focus:ring-brand-500 focus:border-brand-500 text-slate-900 dark:focus:ring-offset-slate-900'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400 animate-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;