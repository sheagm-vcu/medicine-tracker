import { ReactNode, CSSProperties } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Container({ children, className = '', style }: ContainerProps) {
  return (
    <div className={`px-4 ${className}`} style={style}>
      {children}
    </div>
  );
}
