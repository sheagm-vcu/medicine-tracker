# NativeWind (Tailwind CSS for React Native) Setup

## ✅ Installed and Configured

NativeWind has been installed and configured in your React Native app. You can now use Tailwind CSS classes in your React Native components!

## How to Use

### Basic Usage

Replace React Native's `style` prop with `className`:

**Before (React Native StyleSheet):**
```tsx
<View style={styles.container}>
  <Text style={styles.title}>Hello</Text>
</View>
```

**After (Tailwind):**
```tsx
<View className="flex-1 items-center justify-center bg-white">
  <Text className="text-2xl font-bold text-blue-600">Hello</Text>
</View>
```

### Common Tailwind Classes for React Native

#### Layout
- `flex-1` - flex: 1
- `flex-row` - flexDirection: 'row'
- `flex-col` - flexDirection: 'column'
- `items-center` - alignItems: 'center'
- `justify-center` - justifyContent: 'center'
- `justify-between` - justifyContent: 'space-between'

#### Spacing
- `p-4` - padding: 16
- `px-4` - paddingHorizontal: 16
- `py-4` - paddingVertical: 16
- `m-4` - margin: 16
- `mx-4` - marginHorizontal: 16
- `my-4` - marginVertical: 16

#### Sizing
- `w-full` - width: '100%'
- `h-full` - height: '100%'
- `w-64` - width: 256
- `h-64` - height: 256

#### Colors
- `bg-blue-500` - backgroundColor: '#3b82f6'
- `text-white` - color: 'white'
- `text-gray-800` - color: '#1f2937'
- `border-gray-300` - borderColor: '#d1d5db'

#### Typography
- `text-lg` - fontSize: 18
- `text-xl` - fontSize: 20
- `text-2xl` - fontSize: 24
- `font-bold` - fontWeight: 'bold'
- `font-semibold` - fontWeight: '600'

#### Borders & Rounded
- `rounded-lg` - borderRadius: 8
- `rounded-full` - borderRadius: 9999
- `border` - borderWidth: 1
- `border-2` - borderWidth: 2

## Examples

### Button
```tsx
<TouchableOpacity className="bg-blue-500 px-6 py-3 rounded-lg">
  <Text className="text-white font-semibold text-center">Sign In</Text>
</TouchableOpacity>
```

### Card
```tsx
<View className="bg-white rounded-lg shadow-md p-4 mb-4">
  <Text className="text-xl font-bold mb-2">Medication Name</Text>
  <Text className="text-gray-600">Instructions here</Text>
</View>
```

### Container
```tsx
<View className="flex-1 bg-gray-100">
  <ScrollView className="flex-1 px-4 py-6">
    {/* Content */}
  </ScrollView>
</View>
```

## Migration from StyleSheet

You can gradually migrate your existing styles:

1. **Keep both** - You can use `style` and `className` together:
   ```tsx
   <View style={styles.container} className="bg-white">
   ```

2. **Replace gradually** - Start with new components, migrate old ones over time

3. **Custom styles** - For complex styles, keep using StyleSheet when Tailwind isn't enough

## Important Notes

- NativeWind works with React Native components (`View`, `Text`, `TouchableOpacity`, etc.)
- Not all web Tailwind classes work - NativeWind is optimized for React Native
- Use `className` instead of `class` (TypeScript-friendly)
- You can still use `style` prop alongside `className` for dynamic styles

## Troubleshooting

### Classes not working?
1. Make sure you've imported `./global.css` in your entry file (App.tsx)
2. Restart Metro bundler: `npx react-native start --reset-cache`
3. Rebuild the app: `npx react-native run-android`

### TypeScript errors?
NativeWind should provide TypeScript types automatically. If you see errors, try restarting your IDE.

### Need more styles?
Check the [NativeWind documentation](https://www.nativewind.dev/) for the full list of supported classes.


