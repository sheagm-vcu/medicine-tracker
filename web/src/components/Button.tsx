import { ReactNode, CSSProperties } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: CSSProperties;
}

export function Button({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  loading = false,
  variant = 'primary',
  style
}: ButtonProps) {
  const baseClasses = 'flex justify-center items-center rounded-2xl p-4 cursor-pointer transition-opacity';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white',
    secondary: 'bg-slate-600 text-white',
    outline: 'bg-transparent border-2 border-blue-600 text-blue-600',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
      style={style}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <span className="text-base font-semibold">
          {children}
        </span>
      )}
    </button>
  );
}
