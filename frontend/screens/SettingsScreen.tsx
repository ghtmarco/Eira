import React, { useState, useEffect, JSX } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  Linking, 
  SafeAreaView, 
  StatusBar,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from "react-native-svg";
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const PHONE_NUMBER: string = (Constants.expoConfig?.extra?.PHONE_NUMBER as string) || '';
const APP_VERSION = '1.0.0';

// Theme colors - iOS inspired
const THEME = {
  primary: '#007AFF',
  secondary: '#FF3B30',
  tertiary: '#34C759',
  background: '#F7F7F7',
  card: '#FFFFFF',
  text: '#111111',
  textSecondary: '#8E8E93',
  placeholder: '#C7C7CC',
  border: '#E1E1E1',
  shadow: {
    color: '#000000',
    opacity: 0.08,
  }
};

interface SettingsItemProps {
  icon: JSX.Element;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: JSX.Element;
  showArrow?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  rightElement, 
  showArrow = true 
}) => (
  <TouchableOpacity
    style={{
      backgroundColor: THEME.card,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: THEME.border,
    }}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={!onPress}
  >
    <View style={{
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: `${THEME.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    }}>
      {icon}
    </View>
    
    <View style={{ flex: 1 }}>
      <Text style={{
        fontSize: 16,
        fontWeight: '500',
        color: THEME.text,
        marginBottom: subtitle ? 2 : 0,
      }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{
          fontSize: 13,
          color: THEME.textSecondary,
        }}>
          {subtitle}
        </Text>
      )}
    </View>
    
    {rightElement || (showArrow && onPress && (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9 18l6-6-6-6"
          stroke={THEME.textSecondary}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ))}
  </TouchableOpacity>
);

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <View style={{ marginBottom: 32 }}>
    <Text style={{
      fontSize: 13,
      fontWeight: '500',
      color: THEME.textSecondary,
      marginLeft: 16,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }}>
      {title}
    </Text>
    <View style={{
      backgroundColor: THEME.card,
      borderRadius: 12,
      marginHorizontal: 16,
      shadowColor: THEME.shadow.color,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
      overflow: 'hidden',
    }}>
      {children}
    </View>
  </View>
);

const SettingsScreen = (): JSX.Element => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('isDarkMode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleDarkMode = async (value: boolean) => {
    try {
      setIsDarkMode(value);
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(value));
      
      // Show alert since we don't have full dark mode implementation yet
      Alert.alert(
        'Theme Setting Saved',
        'Dark mode preference has been saved. Full dark mode implementation coming soon!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const contactSupport = () => {
    if (!PHONE_NUMBER) {
      Alert.alert(
        'Contact Support',
        'Support contact is not configured. Please contact us through the app store or our website.',
        [{ text: 'OK' }]
      );
      return;
    }
    const url = `https://wa.me/${PHONE_NUMBER}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Error',
        'Could not open WhatsApp. Please make sure you have WhatsApp installed.',
        [{ text: 'OK' }]
      );
    });
  };

  const openTermsOfUse = () => {
    Alert.alert(
      'Terms of Use',
      'By using this application, you agree to our terms of service. This includes proper usage of the AI companion features and respecting community guidelines.',
      [{ text: 'OK' }]
    );
  };

  const openPrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Your privacy is important to us. We collect minimal data necessary for app functionality and never share personal information with third parties. All conversations are encrypted and stored securely.',
      [{ text: 'OK' }]
    );
  };

  const showVersionInfo = () => {
    Alert.alert(
      'App Version',
      `Eira Mental Health Companion\nVersion ${APP_VERSION}\n\nBuilt with ❤️ for your well-being`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.card} />
      <LinearGradient
        colors={['#F8F8F8', '#F4F6F8', '#F7F7F7']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400).springify()}>
            {/* Appearance Section */}
            <SettingsSection title="Appearance">
              <SettingsItem
                icon={
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                      stroke={THEME.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                }
                title="Dark Mode"
                subtitle="Switch between light and dark theme"
                rightElement={
                  <Switch
                    value={isDarkMode}
                    onValueChange={toggleDarkMode}
                    trackColor={{ false: THEME.border, true: THEME.primary }}
                    thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
                    ios_backgroundColor={THEME.border}
                  />
                }
                showArrow={false}
              />
            </SettingsSection>

            {/* Support Section */}
            <SettingsSection title="Support">
              <SettingsItem
                icon={
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                      stroke={THEME.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                      stroke={THEME.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                }
                title="Contact Support"
                subtitle="Get help from our support team"
                onPress={contactSupport}
              />
            </SettingsSection>

            {/* Legal Section */}
            <SettingsSection title="Legal">
              <SettingsItem
                icon={
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      stroke={THEME.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M14 2v6h6"
                      stroke={THEME.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M16 13H8"
                      stroke={THEME.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M16 17H8"
                      stroke={THEME.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M10 9H8"
                      stroke={THEME.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                }
                title="Terms of Use"
                subtitle="Read our terms and conditions"
                onPress={openTermsOfUse}
              />
              <SettingsItem
                icon={
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                      stroke={THEME.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                }
                title="Privacy Policy"
                subtitle="Learn how we protect your data"
                onPress={openPrivacyPolicy}
              />
            </SettingsSection>

            {/* About Section */}
            <SettingsSection title="About">
              <SettingsItem
                icon={
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                      stroke={THEME.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                }
                title="App Version"
                subtitle={`Version ${APP_VERSION}`}
                onPress={showVersionInfo}
              />
            </SettingsSection>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default SettingsScreen;
