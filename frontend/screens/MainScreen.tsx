import React, { useEffect, useState, JSX } from 'react';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
  DrawerNavigationProp,
} from '@react-navigation/drawer';
import HomeScreen from './HomeScreen';
import HistoryScreen from './HistoryScreen';
import SettingsScreen from './SettingsScreen';
import { Image, View, Text, Pressable, TouchableOpacity, ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, G } from "react-native-svg";
import { useNavigation, useRoute, NavigationProp, CommonActions, RouteProp } from '@react-navigation/native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

export type DrawerParamList = {
  Chat: undefined;
  History: undefined;
  Settings: undefined;
  Login: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

interface UserData {
  username: string | null;
  email: string | null;
  id: string | null;
}

interface DispatchableNavigation {
  dispatch: (action: ReturnType<typeof CommonActions.reset>) => void;
}

const handleLogout = async (navigation: DispatchableNavigation) => {
  await AsyncStorage.clear();
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    })
  );
};

interface BarTitleProps {
  title: string;
}

const BarTitle = ({ title }: BarTitleProps): JSX.Element => {
  const navigation = useNavigation<NavigationProp<any>>();
  return (
    <Animated.View
      style={{ 
        paddingRight: 16,
      }}
      entering={FadeInUp.duration(500)}
      key={navigation?.getState()?.index}
    />
  );
};

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  userData: UserData;
}

const CustomDrawerContent = (props: CustomDrawerContentProps): JSX.Element => {
  const { userData, navigation } = props;
  const { theme } = useTheme();

  return (
    <DrawerContentScrollView 
      {...props} 
      contentContainerStyle={{
        flex: 1,
        paddingTop: 0,
      }}
      style={{
        backgroundColor: theme.card,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingTop: 60,
          paddingBottom: 20,
          backgroundColor: 'transparent',
          marginBottom: 15,
        }}
      >
        <Image
          source={require('../assets/images/Logo.png') as ImageSourcePropType}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            marginRight: 14,
          }}
        />
        <View>
          <Text style={{ 
            fontSize: 17, 
            fontWeight: '600',
            color: theme.text,
            marginBottom: 4,
          }}>
            {userData.username || 'User'}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{userData.email || 'No email'}</Text>
        </View>
      </View>

      <View style={{ 
        paddingHorizontal: 8,
        paddingVertical: 8,
      }}>
        <DrawerItemList {...props} />
      </View>

      <View
        style={{
          marginTop: 'auto',
          padding: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => handleLogout(props.navigation)}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 12,
            borderRadius: 10,
          }}
        >
          <Svg
            width="22"
            height="22"
            viewBox="0 0 46 31"
            fill="none"
          >
            <Path
              d="M23 19.3751L28.75 15.5001M28.75 15.5001L23 11.6251M28.75 15.5001H7.66663M17.25 9.36284V9.30033C17.25 7.85353 17.25 7.12959 17.6678 6.57699C18.0353 6.0909 18.6213 5.69599 19.3426 5.44831C20.1626 5.16675 21.2368 5.16675 23.3837 5.16675H32.2003C34.3472 5.16675 35.4191 5.16675 36.2391 5.44831C36.9604 5.69599 37.5484 6.0909 37.9159 6.57699C38.3333 7.12905 38.3333 7.85212 38.3333 9.29609V21.7047C38.3333 23.1487 38.3333 23.8707 37.9159 24.4228C37.5484 24.9088 36.9604 25.3045 36.2391 25.5521C35.4199 25.8334 34.3486 25.8334 32.2059 25.8334H23.3774C21.2347 25.8334 20.1618 25.8334 19.3426 25.5521C18.6213 25.3045 18.0353 24.9085 17.6678 24.4224C17.25 23.8698 17.25 23.1469 17.25 21.7001V21.6355"
              stroke="#FF3B30"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={{ color: '#FF3B30', marginLeft: 8, fontWeight: '500', fontSize: 17 }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

interface CustomHamburgerProps {
  navigation: DrawerNavigationProp<DrawerParamList>;
}

const CustomHamburger = ({ navigation }: CustomHamburgerProps): JSX.Element => {
  const { theme } = useTheme();
  
  return (
    <Animated.View key={navigation.getState().index} entering={FadeInUp.duration(500)}>
      <Pressable 
        onPress={() => navigation.toggleDrawer()} 
        style={{ 
          padding: 12,
        }}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M3.5 6.5h17" stroke={theme.text} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M3.5 12h17" stroke={theme.text} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M3.5 17.5h17" stroke={theme.text} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>
    </Animated.View>
  );
};

const MainScreen = (): JSX.Element => {
  const { theme } = useTheme();
  const [userData, setUserData] = useState<UserData>({ username: null, email: null, id: null });

  const fetchUser = async (): Promise<void> => {
    const storedData = await AsyncStorage.multiGet(['username', 'email', 'id']);
    const userObject: Record<string, string | null> = {};
    storedData.forEach(([key, value]) => {
        userObject[key] = value;
    });
    setUserData({
        username: userObject.username || null,
        email: userObject.email || null,
        id: userObject.id || null
    });
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const renderDrawerContent = (props: DrawerContentComponentProps) => (
    <CustomDrawerContent {...props} userData={userData} />
  );

  return (
    <Drawer.Navigator
      drawerContent={renderDrawerContent}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.navbar,
          elevation: 0,
          shadowColor: 'transparent',
          height: 90,
        },
        headerLeftContainerStyle: {
          paddingLeft: 12,
        },
        headerTitleAlign: 'center',
        drawerActiveBackgroundColor: `${theme.primary}15`,
        drawerActiveTintColor: theme.primary,
        drawerInactiveTintColor: theme.text,
        drawerLabelStyle: {
          fontSize: 17,
          fontWeight: '400',
          marginLeft: -4,
        },
        drawerItemStyle: {
          borderRadius: 10,
          marginVertical: 4,
          marginHorizontal: 12,
          paddingVertical: 2,
        },
        headerTitle: () => (
          <Animated.View
            entering={FadeInUp.duration(500)}
          >
            <Image
              source={require('../assets/images/Logo.png') as ImageSourcePropType}
              style={{ 
                height: 45, 
                width: 45,
                borderRadius: 22.5,
              }}
            />
          </Animated.View>
        ),
      }}
    >
      <Drawer.Screen
        name="Chat"
        component={HomeScreen}
        options={({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => ({
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 16 }}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('Chat', { newChatTrigger: Date.now() } as any);
                }}
                style={{ 
                  padding: 8, 
                }}
              >
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 4V20M4 12H20"
                    stroke={theme.text}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
          ),
          headerLeft: ({ onPress }) => (
            <CustomHamburger navigation={navigation} />
          ),
          drawerIcon: ({ focused }: { focused: boolean; color: string; size: number }) => (
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <Path d="M3 20V4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V16C21 16.5523 20.5523 17 20 17H6L3 20Z" 
                stroke={focused ? theme.primary : theme.text} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" />
            </Svg>
          ),
        })}
      />
      <Drawer.Screen
        name="History"
        component={HistoryScreen}
        options={({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => ({
          headerRight: () => <BarTitle title="History" />,
          headerLeft: ({ onPress }) => (
            <CustomHamburger navigation={navigation} />
          ),
          drawerIcon: ({ focused }: { focused: boolean; color: string; size: number }) => (
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <Path 
                d="M6 6H1V1M1.29102 14.3569C2.22284 15.7918 3.59014 16.8902 5.19218 17.4907C6.79422 18.0913 8.547 18.1624 10.1925 17.6937C11.8379 17.225 13.2893 16.2413 14.3344 14.8867C15.3795 13.5321 15.963 11.878 15.9989 10.1675C16.0347 8.45695 15.5211 6.78001 14.5337 5.38281C13.5462 3.98561 12.1366 2.942 10.5122 2.40479C8.88783 1.86757 7.13408 1.86499 5.5083 2.39795C3.88252 2.93091 2.47059 3.97095 1.47949 5.36556" 
                stroke={focused ? theme.primary : theme.text} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" />
            </Svg>
          )
        })}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={({ navigation }: { navigation: DrawerNavigationProp<DrawerParamList> }) => ({
          headerRight: () => <BarTitle title="Settings" />,
          headerLeft: ({ onPress }) => (
            <CustomHamburger navigation={navigation} />
          ),
          drawerIcon: ({ focused }: { focused: boolean; color: string; size: number }) => (
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <Path 
                d="M9.405 1.05c-.413-1.4 2.177-1.4 1.764 0l-.2.68a1.18 1.18 0 001.781 1.348l.625-.382c1.325-.809 2.547.413 1.738 1.738l-.382.625a1.18 1.18 0 001.348 1.781l.68-.2c1.4-.413 1.4 2.177 0 1.764l-.68.2a1.18 1.18 0 00-1.348 1.781l.382.625c.809 1.325-.413 2.547-1.738 1.738l-.625-.382a1.18 1.18 0 00-1.781 1.348l.2.68c.413 1.4-2.177 1.4-1.764 0l.2-.68a1.18 1.18 0 00-1.781-1.348l-.625.382c-1.325.809-2.547-.413-1.738-1.738l.382-.625a1.18 1.18 0 00-1.348-1.781l-.68.2c-1.4.413-1.4-2.177 0-1.764l.68-.2a1.18 1.18 0 001.348-1.781l-.382-.625c-.809-1.325.413-2.547 1.738-1.738l.625.382a1.18 1.18 0 001.781-1.348l-.2-.68z"
                stroke={focused ? theme.primary : theme.text} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <Path 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                stroke={focused ? theme.primary : theme.text} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </Svg>
          ),
        })}
      />
    </Drawer.Navigator>
  );
};

export default MainScreen;