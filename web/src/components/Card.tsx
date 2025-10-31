import { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  shadow?: boolean;
  style?: CSSProperties;
}

export function Card({ children, className = '', shadow = true, style }: CardProps) {
  const shadowClass = shadow ? 'shadow-lg' : '';
  return (
    <div className={`bg-white rounded-xl p-6 ${shadowClass} ${className}`} style={style}>
      {children}
    </div>
  );
}
