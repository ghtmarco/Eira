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
import SupportScreen from './SupportScreen';
import { Image, View, Text, Pressable, TouchableOpacity, ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, G } from "react-native-svg";
import { useNavigation, useRoute, NavigationProp, CommonActions, RouteProp } from '@react-navigation/native'; // Ensure CommonActions is imported, useRoute
import Animated, { FadeInUp } from 'react-native-reanimated';

export type DrawerParamList = {
  Chat: undefined;
  History: undefined;
  Support: undefined;
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
      style={{ width: '100%', paddingBottom: 32 }}
      entering={FadeInUp.duration(500)}
      key={navigation?.getState()?.index}
    >
      <Text
        style={{
          position: 'absolute',
          left: 12,
          fontWeight: 'bold',
          fontSize: 30,
        }}
      >
        {title}
      </Text>
    </Animated.View>
  );
};

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  userData: UserData;
}

const CustomDrawerContent = (props: CustomDrawerContentProps): JSX.Element => {
  const { userData, navigation } = props;

  return (
    <DrawerContentScrollView {...props}>
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          paddingVertical: 20,
          borderBottomWidth: 1,
          borderColor: '#D1D5DB',
        }}
      >
        <Image
          source={require('../assets/images/Logo.png') as ImageSourcePropType}
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            marginBottom: 12,
          }}
        />
        <View>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
            {userData.username || 'User'}
          </Text>
          <Text style={{ color: '#6B7280' }}>{userData.email || 'No email'}</Text>
        </View>
      </View>

      <DrawerItemList {...props} />

      <View
        style={{
          marginTop: 20,
          height: 40,
          width: 100,
          borderRadius: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => handleLogout(props.navigation)}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Svg
            width="46"
            height="31"
            viewBox="0 0 46 31"
            fill="none"
          >
            <Path
              d="M23 19.3751L28.75 15.5001M28.75 15.5001L23 11.6251M28.75 15.5001H7.66663M17.25 9.36284V9.30033C17.25 7.85353 17.25 7.12959 17.6678 6.57699C18.0353 6.0909 18.6213 5.69599 19.3426 5.44831C20.1626 5.16675 21.2368 5.16675 23.3837 5.16675H32.2003C34.3472 5.16675 35.4191 5.16675 36.2391 5.44831C36.9604 5.69599 37.5484 6.0909 37.9159 6.57699C38.3333 7.12905 38.3333 7.85212 38.3333 9.29609V21.7047C38.3333 23.1487 38.3333 23.8707 37.9159 24.4228C37.5484 24.9088 36.9604 25.3045 36.2391 25.5521C35.4199 25.8334 34.3486 25.8334 32.2059 25.8334H23.3774C21.2347 25.8334 20.1618 25.8334 19.3426 25.5521C18.6213 25.3045 18.0353 24.9085 17.6678 24.4224C17.25 23.8698 17.25 23.1469 17.25 21.7001V21.6355"
              stroke="#007AFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={{ color: '#007AFF', marginLeft: 8 }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

interface CustomHamburgerProps {
  navigation: DrawerNavigationProp<DrawerParamList>;
}

const CustomHamburger = ({ navigation }: CustomHamburgerProps): JSX.Element => {
  return (
    <Animated.View key={navigation.getState().index} entering={FadeInUp.duration(500)}>
      <Pressable onPress={() => navigation.toggleDrawer()} style={{ padding: 16 }}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M19.5 19.7656H3.5" stroke="#000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M19.5 5.76562H3.5" stroke="#000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M19.5 12.7656H3.5" stroke="#000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
      </Pressable>
    </Animated.View>
  );
};

const MainScreen = (): JSX.Element => {
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
          backgroundColor: '#E3E3E3',
          elevation: 0,
          borderWidth: 0,
          height: 100,
        },
        headerLeftContainerStyle: {
          paddingLeft: 12,
        },
        headerTitleAlign: 'center',
        drawerActiveBackgroundColor: '#007AFF',
        drawerActiveTintColor: '#FFFFFF',
        drawerInactiveTintColor: '#000000',
        drawerLabelStyle: {
          fontSize: 18,
          paddingBottom: 6,
        },
        drawerItemStyle: {
          borderRadius: 16,
        },
        headerTitle: () => (
          <Animated.View
            entering={FadeInUp.duration(500)}
          >
            <Image
              source={require('../assets/images/Logo.png') as ImageSourcePropType}
              style={{ height: 60, width: 60 }}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('Chat', { newChatTrigger: Date.now() } as any);
                }}
                style={{ paddingHorizontal: 10 }}
              >
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 4V20M4 12H20"
                    stroke="#000000"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
          ),
          drawerIcon: ({ focused }: { focused: boolean; color: string; size: number }) => (
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><G><Path d="M3 20V4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V16C21 16.5523 20.5523 17 20 17H6L3 20Z" stroke={focused ? "#FFFFFF" : "#000000"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></G></Svg>
          )
        })}
      />
      <Drawer.Screen
        name="History"
        component={HistoryScreen}
        options={{
          headerRight: () => <BarTitle title="History" />,
          drawerIcon: ({ focused }: { focused: boolean; color: string; size: number }) => (
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Path d="M6 6H1V1M1.29102 14.3569C2.22284 15.7918 3.59014 16.8902 5.19218 17.4907C6.79422 18.0913 8.547 18.1624 10.1925 17.6937C11.8379 17.225 13.2893 16.2413 14.3344 14.8867C15.3795 13.5321 15.963 11.878 15.9989 10.1675C16.0347 8.45695 15.5211 6.78001 14.5337 5.38281C13.5462 3.98561 12.1366 2.942 10.5122 2.40479C8.88783 1.86757 7.13408 1.86499 5.5083 2.39795C3.88252 2.93091 2.47059 3.97095 1.47949 5.36556" stroke={focused ? "#FFFFFF" : "#000000"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
          )
        }}
      />
      <Drawer.Screen
        name="Support"
        component={SupportScreen}
        options={{
          headerRight: () => <BarTitle title="Support" />,
          drawerIcon: ({ focused }: { focused: boolean; color: string; size: number }) => (
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Path d="M5.733 2.043c1.217-1.21 3.221-.995 4.24.367l1.262 1.684c.83 1.108.756 2.656-.229 3.635l-.238.238a.65.65 0 0 0-.008.306c.063.408.404 1.272 1.832 2.692s2.298 1.76 2.712 1.824a.7.7 0 0 0 .315-.009l.408-.406c.876-.87 2.22-1.033 3.304-.444l1.91 1.04c1.637.888 2.05 3.112.71 4.445l-1.421 1.412c-.448.445-1.05.816-1.784.885-1.81.169-6.027-.047-10.46-4.454-4.137-4.114-4.931-7.702-5.032-9.47l.749-.042-.749.042c-.05-.894.372-1.65.91-2.184zm3.04 1.266c-.507-.677-1.451-.731-1.983-.202l-1.57 1.56c-.33.328-.488.69-.468 1.036.08 1.405.72 4.642 4.592 8.492 4.062 4.038 7.813 4.159 9.263 4.023.296-.027.59-.181.865-.454l1.42-1.413c.578-.574.451-1.62-.367-2.064l-1.91-1.039c-.528-.286-1.146-.192-1.53.19l-.455.453-.53-.532c.53.532.529.533.528.533l-.001.002-.003.003-.007.006-.015.014a1 1 0 0 1-.136.106c-.08.053-.186.112-.319.161-.27.101-.628.155-1.07.087-.867-.133-2.016-.724-3.543-2.242-1.526-1.518-2.122-2.66-2.256-3.526-.069-.442-.014-.8.088-1.07a1.5 1.5 0 0 1 .238-.42l.032-.035.014-.015.006-.006.003-.003.002-.002.53.53-.53-.531.288-.285c.428-.427.488-1.134.085-1.673z" stroke={focused ? "#FFFFFF" : "#000000"} fillRule="evenodd" clipRule="evenodd" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" /></Svg>
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default MainScreen;