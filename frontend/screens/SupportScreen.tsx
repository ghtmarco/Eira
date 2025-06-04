import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { JSX } from 'react';
import Constants from 'expo-constants';

const PHONE_NUMBER: string = (Constants.expoConfig?.extra?.PHONE_NUMBER as string) || '';

export default function SupportScreen(): JSX.Element {
  const contactSupport = (): void => {
    if (!PHONE_NUMBER) {
      console.error("Phone number is not configured.");
      return;
    }
    let url = `https://wa.me/${PHONE_NUMBER}`;
    Linking.openURL(url).catch(err => console.error("An error occurred while trying to open WhatsApp", err));
  };

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#E3E3E3',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 20,
          marginBottom: 20,
        }}
      >
        Have any trouble using the app?
      </Text>
      <TouchableOpacity onPress={contactSupport}>
        <View
          style={{
            backgroundColor: '#0081E4',
            height: 48,
            width: 180,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 20,
            }}
          >
            Contact Us
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({})