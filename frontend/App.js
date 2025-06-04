import * as React from 'react'
import { View, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import MainScreen from './screens/MainScreen'
import ForgotPassword from './screens/ForgotPassword'
import Toast from 'react-native-toast-message'
import { useFonts } from 'expo-font'
import { ThemeProvider } from './contexts/ThemeContext'

const Stack = createNativeStackNavigator()

const toastConfig = {
  error: ({ text1, text2 }) => (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 10,
        borderLeftWidth: 5,
        borderLeftColor: '#0081E4',
        width: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginBottom: 12
      }}>
      <Text style={{ color: '#000000', fontWeight: 'bold', fontSize: 16 }}>
        {text1}
      </Text>
      <Text style={{ color: '#000000', fontSize: 14 }}>{text2}</Text>
    </View>
  ),
  success: ({ text1, text2 }) => (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 10,
        borderLeftWidth: 5,
        borderLeftColor: '#58EB34',
        width: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginBottom: 12
      }}>
      <Text style={{ color: '#000000', fontWeight: 'bold', fontSize: 16 }}>
        {text1}
      </Text>
      <Text style={{ color: '#000000', fontSize: 14 }}>{text2}</Text>
    </View>
  ),
};

export default function App() {
  const [fontsLoaded] = useFonts({
    'CustomFont-Regular': require('./assets/fonts/Alata-Regular.ttf'),
  });

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName='Login' screenOptions={{headerShown: false}}>
          <Stack.Screen name='Login' component={LoginScreen}/>
          <Stack.Screen name='Signup' component={SignupScreen}/>
          <Stack.Screen name='Main' component={MainScreen}/>
          <Stack.Screen name='ForgotPassword' component={ForgotPassword}/>
        </Stack.Navigator>
        <Toast config={toastConfig}/>
      </NavigationContainer>
    </ThemeProvider>
  )
}