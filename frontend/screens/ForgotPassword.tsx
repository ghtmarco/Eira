import { View, Text, Image, TextInput, TouchableOpacity, ImageSourcePropType, KeyboardAvoidingView, Platform } from 'react-native'
import React, { JSX, useEffect, useState } from 'react'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons'
import * as Yup from 'yup'
import { Formik, FormikHelpers } from 'formik'
import axios, { AxiosError } from 'axios'
import Toast from 'react-native-toast-message'
import Constants from 'expo-constants'
import { StatusBar } from 'expo-status-bar'
import { useTheme } from '../contexts/ThemeContext'

const SERVER_URL: string = (Constants.expoConfig?.extra?.SERVER_URL as string) || '';
const PAGE_URL: string = `${SERVER_URL}/users`;

interface ApiResponse {
    message: string;
    [key: string]: any;
}

export const changePassword = async (email: string, newPassword: string): Promise<ApiResponse> => {
    try {
        const response = await axios.post<ApiResponse>(`${PAGE_URL}/change-password`, { email, newPassword });
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        console.error("Error in changePassword:", axiosError.response?.data || axiosError.message);
        if (axiosError.response) {
            const { data } = axiosError.response;
            Toast.show({ type: "error", text1: "Action Failed", text2: data?.message || "An error occurred", position: 'bottom' });
            return { message: data?.message || "An error occurred" };
        } else {
            Toast.show({ type: "error", text1: "Action Failed", text2: "Something went wrong", position: 'bottom' });
            return { message: "Something went wrong" };
        }
    }
};

interface ForgotPasswordFormValues {
    email: string;
    password: string;
    confPassword: string;
}

const validationSchema = Yup.object().shape({
    email: Yup.string().required("Email is required.").email().label("Email"),
    password: Yup.string().required("Password is required.").min(4).label("Password"),
    confPassword: Yup.string().required("This field is required.").min(4).label("ConfPassword").oneOf([Yup.ref("password")], "Passwords must match"),
})

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
};


export default function ForgotPassword(): JSX.Element {
    const { theme } = useTheme();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const [imageSizes, setImageSizes] = useState<{ logo: ImageSize }>({
        logo: { width: 0, height: 0 },
    });

    const [showPass, setShowPass] = useState<boolean>(true);
    const [showConfPass, setShowConfPass] = useState<boolean>(true);

    const handleAction = async (values: ForgotPasswordFormValues, { setSubmitting }: FormikHelpers<ForgotPasswordFormValues>) => {
        try {
            const response = await changePassword(values.email, values.password);
            console.log("Change Password Response:", response)
    
            if (response?.message === "Password updated successfully") {
                Toast.show({text1: "Action Successful", text2: "Password updated successfully", type:"success", position: 'bottom'})
                navigation.navigate("Login")
            } else {
                Toast.show({text1: "Action Failed", text2: response?.message || "An error occurred", type:"error", position: 'bottom'})
            }
        } catch (error) {
            console.error("Action error:", error)
        }
        setSubmitting(false)
    }     

    useEffect(() => {
        const logoSource = require('../assets/images/Logo.png')

        setImageSizes({
            logo: getImageSize(logoSource),
        })
    }, [])

    function onEyePress() {
        setShowPass(!showPass)
    }
    
    function onEyePress2() {
        setShowConfPass(!showConfPass)
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.background }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
            <View style={{ backgroundColor: theme.background, height: '100%', width: '100%' }}>
                <StatusBar style={theme.statusBarStyle} />
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 80 }}>
                <Animated.Image
                entering={FadeInUp.delay(200).duration(1000).springify()}
                style={{ width: imageSizes.logo.width, height: imageSizes.logo.height }}
                source={require('../assets/images/Logo.png')}
                />
            </View>

            <View style={{ height: '100%', width: '100%', flex: 1, justifyContent: 'flex-start', paddingBottom: 10 }}>
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <Animated.Text
                        entering={FadeInUp.duration(1000).springify()}
                        style={{ color: theme.primary, fontWeight: 'bold', letterSpacing: 1, fontSize: 40 }}
                    >
                        Forgot Password
                    </Animated.Text>
                </View>

                <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 16, rowGap: 16 }}>
                <Formik
                    initialValues={{ email: '', password: '', confPassword: '' }}
                    onSubmit={handleAction}
                    validationSchema={validationSchema}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                    <View style={{ padding: 20, width: '100%', rowGap: 12 }}>
                        <Animated.View
                        entering={FadeInDown.duration(1000).springify()}
                        style={{ 
                            backgroundColor: theme.card, 
                            flexDirection: 'row', 
                            borderRadius: 16, 
                            width: '100%', 
                            borderWidth: 1, 
                            borderColor: theme.border, 
                            height: '14%' 
                        }}
                        >
                        <Ionicons 
                            name="mail-outline" 
                            size={30} 
                            color={theme.textSecondary}
                            style={{ alignSelf: 'center', paddingLeft: 8 }}
                        />
                        <TextInput
                            style={{ paddingLeft: 12, width: '100%', color: theme.text }}
                            placeholder="Email"
                            placeholderTextColor={theme.placeholder}
                            onChangeText={handleChange('email')}
                            onBlur={handleBlur('email')}
                            value={values.email}
                            keyboardType='email-address'
                        />
                        </Animated.View>
                        {errors.email && touched.email && <Text style={{ color: theme.secondary }}>{errors.email}</Text>}

                        <Animated.View
                        entering={FadeInDown.delay(200).duration(1000).springify()}
                        style={{ 
                            backgroundColor: theme.card, 
                            flexDirection: 'row', 
                            borderRadius: 16, 
                            width: '100%', 
                            borderWidth: 1, 
                            borderColor: theme.border, 
                            justifyContent: 'space-between', 
                            height: '14%' 
                        }}
                        >
                        <View style={{ flexDirection: 'row', paddingLeft: 8 }}>
                            <Ionicons 
                                name="key-outline" 
                                size={30} 
                                color={theme.textSecondary}
                                style={{ alignSelf: 'center' }}
                            />
                            <TextInput
                            style={{ paddingLeft: 12, width: '80%', color: theme.text }}
                            placeholder="New Password"
                            placeholderTextColor={theme.placeholder}
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
                            color={showPass ? theme.textSecondary : theme.primary}
                        />
                        </Animated.View>
                        {errors.password && touched.password && <Text style={{ color: theme.secondary }}>{errors.password}</Text>}

                        <Animated.View
                        entering={FadeInDown.delay(400).duration(1000).springify()}
                        style={{ 
                            backgroundColor: theme.card, 
                            flexDirection: 'row', 
                            borderRadius: 16, 
                            width: '100%', 
                            borderWidth: 1, 
                            borderColor: theme.border, 
                            justifyContent: 'space-between', 
                            height: '14%' 
                        }}
                        >
                        <View style={{ flexDirection: 'row', paddingLeft: 8 }}>
                            <Ionicons 
                                name="key-outline" 
                                size={30} 
                                color={theme.textSecondary}
                                style={{ alignSelf: 'center' }}
                            />
                            <TextInput
                            style={{ paddingLeft: 12, width: '80%', color: theme.text }}
                            placeholder="Confirm New Password"
                            placeholderTextColor={theme.placeholder}
                            onChangeText={handleChange('confPassword')}
                            onBlur={handleBlur('confPassword')}
                            value={values.confPassword}
                            secureTextEntry={showConfPass}
                            />
                        </View>
                        <Ionicons
                            name={showConfPass ? 'eye-off' : 'eye'}
                            size={30}
                            onPress={onEyePress2}
                            style={{ alignSelf: 'center', paddingRight: 20, width: '20%' }}
                            color={showConfPass ? theme.textSecondary : theme.primary}
                        />
                        </Animated.View>
                        {errors.confPassword && touched.confPassword && <Text style={{ color: theme.secondary }}>{errors.confPassword}</Text>}

                        <Animated.View
                        entering={FadeInDown.delay(600).duration(1000).springify()}
                        style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 20 }}
                        >
                            <Text style={{ fontWeight: 'bold', color: theme.text }}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.push('Login')}>
                                <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Login here!</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View
                        entering={FadeInDown.delay(800).duration(1000).springify()}
                        style={{ width: '50%', height: '15%', alignSelf: 'center' }}
                        >
                            <TouchableOpacity
                                style={{ 
                                    width: '100%', 
                                    backgroundColor: theme.primary, 
                                    padding: 12, 
                                    borderRadius: 16, 
                                    marginBottom: 12, 
                                    height: '100%', 
                                    justifyContent: 'center' 
                                }}
                                onPress={() => handleSubmit()}
                            >
                                <Text style={{ 
                                    fontSize: 18, 
                                    fontWeight: 'bold', 
                                    color: 'white', 
                                    textAlign: 'center' 
                                }}>
                                    Confirm
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                    )}
                </Formik>
                </View>
            </View>
        </View>
        </KeyboardAvoidingView>
    )
}
