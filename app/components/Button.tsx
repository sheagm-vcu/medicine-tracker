import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

export function Button({ 
  children, 
  onPress, 
  className = '', 
  disabled = false,
  loading = false,
  variant = 'primary',
  style
}: ButtonProps) {
  const baseClasses = 'justify-center items-center rounded-2xl p-4';
  
  const variantClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-slate-600',
    outline: 'bg-transparent border-2 border-blue-600',
  };

  const textVariantClasses = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-blue-600',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${disabled ? 'opacity-50' : ''}`}
      style={style}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? '#2563eb' : '#ffffff'} 
          size="small" 
        />
      ) : (
        <Text className={`text-base font-semibold ${textVariantClasses[variant]}`}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
