import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export function Input({ label, error, helperText, className = '', ...props }: InputProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold mb-2 text-slate-700">
          {label}
        </label>
      )}
      <input
        className={`w-full border rounded-xl px-4 py-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error 
            ? 'border-red-500' 
            : 'border-slate-300'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-slate-500 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
}
