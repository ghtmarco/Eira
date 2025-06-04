import React, { JSX } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  Linking, 
  SafeAreaView, 
  StatusBar,
  Alert,
  StatusBarStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from "react-native-svg";
import Animated, { FadeInDown } from 'react-native-reanimated';
import Constants from 'expo-constants';
import Toast from 'react-native-toast-message';
import { useTheme } from '../contexts/ThemeContext';

const PHONE_NUMBER: string = (Constants.expoConfig?.extra?.PHONE_NUMBER as string) || '';
const APP_VERSION = '1.0.0';

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
  showArrow = true,
}) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={{
        backgroundColor: theme.card,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.border,
      }}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: `${theme.primary}15`,
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
          color: theme.text,
          marginBottom: subtitle ? 2 : 0,
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{
            fontSize: 13,
            color: theme.textSecondary,
          }}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {rightElement || (showArrow && onPress && (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 18l6-6-6-6"
            stroke={theme.textSecondary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ))}
    </TouchableOpacity>
  );
};

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
  const { theme } = useTheme();
  
  return (
    <View style={{ marginBottom: 32 }}>
      <Text style={{
        fontSize: 13,
        fontWeight: '500',
        color: theme.textSecondary,
        marginLeft: 16,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        {title}
      </Text>
      <View style={{
        backgroundColor: theme.card,
        borderRadius: 12,
        marginHorizontal: 16,
        shadowColor: theme.shadow.color,
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
};

const SettingsScreen = (): JSX.Element => {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const toggleDarkMode = async (value: boolean) => {
    try {
      await toggleTheme();
      
      Toast.show({
        type: 'success',
        text1: 'Theme Updated',
        text2: `Switched to ${value ? 'dark' : 'light'} mode successfully!`,
        position: 'bottom',
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('Error saving theme preference:', error);
      Toast.show({
        type: 'error',
        text1: 'Theme Change Failed',
        text2: 'Could not save theme preference. Please try again.',
        position: 'bottom',
        visibilityTime: 3000,
      });
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
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar 
          barStyle={theme.statusBarStyle as StatusBarStyle | undefined} 
          backgroundColor={theme.card} 
        />
        <LinearGradient
          colors={theme.gradient}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingVertical: 20, paddingBottom: 40 }}
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
                        stroke={theme.primary}
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
                      trackColor={{ false: theme.border, true: theme.primary }}
                      thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
                      ios_backgroundColor={theme.border}
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
                        stroke={theme.primary}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                        stroke={theme.primary}
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
                        stroke={theme.primary}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M14 2v6h6"
                        stroke={theme.primary}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M16 13H8"
                        stroke={theme.primary}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M16 17H8"
                        stroke={theme.primary}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M10 9H8"
                        stroke={theme.primary}
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
                        stroke={theme.primary}
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
                        stroke={theme.primary}
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
    </View>
  );
};

export default SettingsScreen;
