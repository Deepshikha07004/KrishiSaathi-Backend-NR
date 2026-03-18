import React, { useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  Image, 
  ImageBackground, 
  Animated, 
  Easing 
} from "react-native";
import Mycolors from "../utils/Mycolor";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";

const Splash = () => {
  const nav = useNavigation();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const loadingWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fadeAnimation = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
      easing: Easing.ease,
    });

  const loadingAnimation = Animated.timing(loadingWidth, {
    toValue: 1,
    duration: 5000,
    useNativeDriver: false,
    easing: Easing.linear,
  });

  fadeAnimation.start();
  loadingAnimation.start();

  const timer = setTimeout(() => {
    nav.replace("Language");
  }, 5000);

  return () => clearTimeout(timer);
}, [nav]);

  return (
    <ImageBackground
      source={require("../assets/bg.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      {/* Semi-transparent overlay covering the ENTIRE background */}
      <View style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(51, 165, 57, 0.6)'
      }} />
      
      {/* Main container with flexbox layout */}
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        
        {/* Centered content - takes all available space */}
        <View style={{ 
          flex: 1, 
          justifyContent: "center", 
          alignItems: "center" 
        }}>
          {/* Animated Logo with fade only */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              alignItems: "center",
            }}
          >
            <Image
              source={require("../assets/splash-icon.png")}
              style={{
                height: 350,
                width: 350,
                marginBottom: -20,
              }}
              resizeMode="contain"
            />
          </Animated.View>
          
          {/* Tagline with fade animation */}
          <Animated.View style={{ 
            alignItems: "center",
            opacity: fadeAnim,
          }}>
            <Text
              style={{
                color: Mycolors.white,
                fontSize: 18,
                textAlign: "center",
                letterSpacing: 1.5,
                marginTop: -75,
                marginBottom: 30,
                fontWeight: "500",
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
              }}
            >
              Smart Farming Starts Here
            </Text>
          </Animated.View>
        </View>

        {/* Loading Section - Fixed at bottom */}
        <View style={{ 
          alignItems: "center", 
          paddingBottom: 40, 
          width: "60%", 
          alignSelf: "center" 
        }}>
          {/* Loading Bar */}
          <View style={{
            height: 8,
            width: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            borderRadius: 2,
            overflow: "hidden",
            marginBottom: 15,
          }}>
            <Animated.View
              style={{
                height: "100%",
                width: loadingWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
                backgroundColor: Mycolors.white,
                borderRadius: 2,
              }}
            />
          </View>

          <Text style={{
            color: Mycolors.white,
            fontSize: 14,
            opacity: 0.9,
          }}>
            Loading your farming experience...
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
};

export default Splash;