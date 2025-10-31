import { View, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function Container({ children, className = '', style }: ContainerProps) {
  return (
    <View className={`px-4 ${className}`} style={style}>
      {children}
    </View>
  );
}

