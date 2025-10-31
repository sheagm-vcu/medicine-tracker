import { View, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  shadow?: boolean;
  style?: ViewStyle;
}

export function Card({ children, className = '', shadow = true, style }: CardProps) {
  const shadowClass = shadow ? 'shadow-lg' : '';
  return (
    <View className={`bg-white rounded-xl p-6 ${shadowClass} ${className}`} style={style}>
      {children}
    </View>
  );
}

