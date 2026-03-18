import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import LanguageScreen from '../screens/LanguageScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import LocationScreen from '../screens/LocationScreen';
import SavedLocationScreen from '../screens/SavedLocationScreen';
import HomeScreen from '../screens/HomeScreen';

import WeatherScreen from '../screens/WeatherScreen';
import CropRecommendationScreen from '../screens/CropRecommendationScreen';
import CropAdvisoryScreen from '../screens/CropAdvisoryScreen';
import StorageScreen from '../screens/StorageScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {

  return (

    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F1F8E9' }
      }}
    >

      <Stack.Screen name="Splash" component={SplashScreen} />

      <Stack.Screen name="Language" component={LanguageScreen} />

      <Stack.Screen name="Login" component={LoginScreen} />

      <Stack.Screen name="Signup" component={SignupScreen} />

      <Stack.Screen name="Location" component={LocationScreen} />

      <Stack.Screen name="SavedLocations" component={SavedLocationScreen} />

      <Stack.Screen name="Home" component={HomeScreen} />

      <Stack.Screen
        name="Weather"
        component={WeatherScreen}
        options={{
          headerShown: true,
          title: "Weather",
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#fff'
        }}
      />

      <Stack.Screen
        name="CropRec"
        component={CropRecommendationScreen}
        options={{
          headerShown: true,
          title: "My Crop",
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#fff'
        }}
      />

      <Stack.Screen
        name="CropAdv"
        component={CropAdvisoryScreen}
        options={{
          headerShown: true,
          title: "Crop Advisory",
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#fff'
        }}
      />

      <Stack.Screen
        name="Storage"
        component={StorageScreen}
        options={{
          headerShown: true,
          title: "Storage",
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#fff'
        }}
      />

    </Stack.Navigator>

  );

};

export default AppNavigator;