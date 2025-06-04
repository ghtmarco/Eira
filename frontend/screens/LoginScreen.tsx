import { View, Text, Image, TextInput, TouchableOpacity, ImageSourcePropType } from 'react-native'
import { JSX, useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Ionicons from 'react-native-vector-icons/Ionicons'
import * as Yup from 'yup'
import { Formik, FormikHelpers } from 'formik'
import axios, { AxiosError } from "axios"
import Toast from 'react-native-toast-message'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

const SERVER_URL: string = (Constants.expoConfig?.extra?.SERVER_URL as string) || '';
const PAGE_URL: string = `${SERVER_URL}/users`;

interface LoginApiResponse {
    message?: string;
    token?: string;
    name?: string;
    id?: string;
}

export const loginUser = async (email: string, password: string): Promise<LoginApiResponse> => {
    try {
      const response = await axios.post<LoginApiResponse>(`${PAGE_URL}/login`, { email, password });
      return response.data;
    } catch (error) {
        const axiosError = error as AxiosError<LoginApiResponse>;
        if (axiosError.response) {
            const { status, data } = axiosError.response;
            if (status === 401) {
              if (data?.message === "User Does Not Exist") {
                  Toast.show({type: "error", text1: "Login Failed", text2: "User doesn\'t exist", position: 'bottom'});
              } else if (data?.message === "Incorrect Password") {
                  Toast.show({type: "error", text1: "Login Failed", text2: "Incorrect password", position: 'bottom'});
              }
            }
            return data || { message: "An unknown error occurred" };
        }
        Toast.show({type: "error", text1: "Login Failed", text2: "Network error or server unavailable", position: 'bottom'});
        return { message: "Network error or server unavailable" };
    }
};

interface LoginFormValues {
    email: string;
    password: string;
}

const validationSchema = Yup.object().shape({
    email: Yup.string().required("Email is required.").email().label("Email"),
    password: Yup.string().required("Password is required.").min(4).label("Password"),
});

interface ImageSize {
    width: number;
    height: number;
}

const getImageSize = (imageSource: ImageSourcePropType): ImageSize => {
    const { width, height } = Image.resolveAssetSource(imageSource);
    return { width, height };
};

type RootStackParamList = {
    Login: undefined;
    Main: undefined;
    ForgotPassword: undefined;
    Signup: undefined;
};

export default function LoginScreen(): JSX.Element {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    useEffect(() => {
        const checkLoginStatus = async () => {
            const token = await AsyncStorage.getItem('token');

            if (token) {
                navigation.replace("Main");
            }
        };

        checkLoginStatus();
    }, [navigation]);

    const [imageSizes, setImageSizes] = useState<{ logo: ImageSize }>({
        logo: { width: 0, height: 0 },
    });

    const [showPass, setShowPass] = useState<boolean>(true);

    const handleLogin = async (values: LoginFormValues, { setSubmitting }: FormikHelpers<LoginFormValues>) => {
        const { email, password } = values;
        const result = await loginUser(email, password);
    
        if (result.token && result.name && result.id) {
            await AsyncStorage.multiSet([
                ['username', result.name],
                ['email', email],
                ['id', result.id],
                ['token', result.token]
            ]);
    
            Toast.show({text1: "Login Successful", text2: `Welcome, ${result.name}`, type:"success", position: 'bottom'});
            navigation.replace("Main");
        }
    };

    useEffect(() => {
        const logoSource = require('../assets/images/Logo.png')

        setImageSizes({
            logo: getImageSize(logoSource),
        })
    }, [])

    function onEyePress() {
        setShowPass(!showPass)
    }

    return (
        <View style={{ backgroundColor: 'white', height: '100%', width: '100%' }}>
            <StatusBar style="light" />

            <View
                style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                width: '100%',
                position: 'absolute',
                marginTop: 80,
                }}
            >
                <Animated.Image
                entering={FadeInUp.delay(200).duration(1000).springify()}
                style={{ width: imageSizes.logo.width, height: imageSizes.logo.height }}
                source={require('../assets/images/Logo.png')}
                />
            </View>

            <View
                style={{
                height: '100%',
                width: '100%',
                justifyContent: 'flex-start',
                paddingTop: 240,
                paddingBottom: 40,
                marginTop: 48,
                }}
            >
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Animated.Text
                    entering={FadeInUp.duration(1000).springify()}
                    style={{
                    color: '#0081E4',
                    fontWeight: 'bold',
                    letterSpacing: 1,
                    fontSize: 48,
                    }}
                >
                    Login
                </Animated.Text>
                </View>

                <View
                style={{
                    flex: 1,
                    alignItems: 'center',
                    marginHorizontal: 16,
                    rowGap: 16,
                }}
                >
                <Formik
                    initialValues={{ email: '', password: '' }}
                    onSubmit={handleLogin}
                    validationSchema={validationSchema}
                >
                    {({
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    values,
                    errors,
                    touched,
                    }) => (
                    <View
                        style={{
                        padding: 20,
                        width: '100%',
                        rowGap: 12,
                        }}
                    >
                        <Animated.View
                        entering={FadeInDown.duration(1000).springify()}
                        style={{
                            backgroundColor: 'white',
                            flexDirection: 'row',
                            borderRadius: 16,
                            width: '100%',
                            borderWidth: 1,
                            height: '15%',
                        }}
                        >
                        <Ionicons
                            name="mail-outline"
                            size={30}
                            style={{ alignSelf: 'center', paddingLeft: 8 }}
                        />
                        <TextInput
                            style={{ paddingLeft: 12, width: '100%' }}
                            placeholder="Email"
                            placeholderTextColor="black"
                            onChangeText={handleChange('email')}
                            onBlur={handleBlur('email')}
                            value={values.email}
                            keyboardType="email-address"
                        />
                        </Animated.View>
                        {errors.email && touched.email && (
                        <Text style={{ color: 'red' }}>{errors.email}</Text>
                        )}

                        <Animated.View
                        entering={FadeInDown.delay(200).duration(1000).springify()}
                        style={{
                            backgroundColor: 'white',
                            flexDirection: 'row',
                            borderRadius: 16,
                            width: '100%',
                            borderWidth: 1,
                            justifyContent: 'space-between',
                            height: '15%',
                        }}
                        >
                        <View style={{ flexDirection: 'row', paddingLeft: 8 }}>
                            <Ionicons
                            name="key-outline"
                            size={30}
                            style={{ alignSelf: 'center' }}
                            />
                            <TextInput
                            style={{ paddingLeft: 12, width: '80%' }}
                            placeholder="Password"
                            placeholderTextColor="black"
                            onChangeText={handleChange('password')}
                            onBlur={handleBlur('password')}
                            value={values.password}
                            secureTextEntry={showPass}
                            />
                        </View>
                        <Ionicons
                            name={showPass ? 'eye-off' : 'eye'}
                            size={30}
                            onPress={onEyePress}
                            style={{ alignSelf: 'center', paddingRight: 20, width: '20%' }}
                            color={showPass ? 'black' : '#0081E4'}
                        />
                        </Animated.View>
                        {errors.password && touched.password && (
                        <Text style={{ color: 'red' }}>{errors.password}</Text>
                        )}

                        <Animated.View
                        entering={FadeInDown.delay(300).duration(1000).springify()}
                        style={{ width: '100%', alignItems: 'flex-end', marginBottom: 40 }}
                        >
                        <TouchableOpacity onPress={() => navigation.push('ForgotPassword')}>
                            <Text style={{ color: '#0081E4', fontWeight: 'bold' }}>
                            Forgot Password
                            </Text>
                        </TouchableOpacity>
                        </Animated.View>

                        <Animated.View
                        entering={FadeInDown.delay(400).duration(1000).springify()}
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            marginBottom: 40,
                        }}
                        >
                        <Text style={{ fontWeight: 'bold' }}>Do not have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.push('Signup')}>
                            <Text style={{ color: '#0081E4', fontWeight: 'bold' }}>
                            Register here!
                            </Text>
                        </TouchableOpacity>
                        </Animated.View>

                        <Animated.View
                        entering={FadeInDown.delay(600).duration(1000).springify()}
                        style={{ width: '50%', height: '16%', alignSelf: 'center' }}
                        >
                        <TouchableOpacity
                            style={{
                            width: '100%',
                            backgroundColor: '#0081E4',
                            padding: 12,
                            borderRadius: 16,
                            marginBottom: 12,
                            height: '100%',
                            justifyContent: 'center',
                            }}
                            onPress={() => handleSubmit()}
                        >
                            <Text
                            style={{
                                fontSize: 18,
                                fontWeight: 'bold',
                                color: 'white',
                                textAlign: 'center',
                            }}
                            >
                            Login
                            </Text>
                        </TouchableOpacity>
                        </Animated.View>
                    </View>
                    )}
                </Formik>
                </View>
            </View>
        </View>
  )
}