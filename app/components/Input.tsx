import { TextInput, Text, View, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export function Input({ label, error, helperText, className = '', ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-semibold mb-2 text-slate-700">
          {label}
        </Text>
      )}
      <TextInput
        className={`w-full border rounded-xl px-4 py-3 bg-white text-slate-900 ${
          error 
            ? 'border-red-500' 
            : 'border-slate-300'
        } ${className}`}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && (
        <Text className="text-xs text-red-600 mt-1">
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text className="text-xs text-slate-500 mt-1">
          {helperText}
        </Text>
      )}
    </View>
  );
}


