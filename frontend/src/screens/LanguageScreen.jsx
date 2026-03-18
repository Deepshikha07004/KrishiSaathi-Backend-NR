import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useLanguage } from "../hooks/useLanguage";

const LanguageScreen = ({ navigation }) => {
  const scrollViewRef = useRef(null);
  const continueButtonRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // Animation values for sound waves
  const wave1Height = useRef(new Animated.Value(12)).current;
  const wave2Height = useRef(new Animated.Value(20)).current;
  const wave3Height = useRef(new Animated.Value(12)).current;

  const {
    selected: selectedLanguage,
    select: handleLanguageSelect,
    playFullSequence: replayVoice,
    languages,
    isSpeaking,
    isAnnouncementRunningRef,
  } = useLanguage();

  const selectedLangData = languages.find(
    (l) => l.code === selectedLanguage
  );

  // Wave animation
  useEffect(() => {
    let animation1, animation2, animation3;
    
    if (isSpeaking && !isMuted) {
      // Create breathing animations for waves
      const createWaveAnimation = (waveValue, minHeight, maxHeight) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(waveValue, {
              toValue: maxHeight,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(waveValue, {
              toValue: minHeight,
              duration: 200,
              useNativeDriver: false,
            }),
          ])
        );
      };

      // Start animations with different patterns
      animation1 = createWaveAnimation(wave1Height, 8, 16);
      animation2 = createWaveAnimation(wave2Height, 14, 26);
      animation3 = createWaveAnimation(wave3Height, 8, 16);
      
      // Add slight delay for wave2 to create ripple effect
      setTimeout(() => {
        animation1.start();
        animation2.start();
        animation3.start();
      }, 100);
    } else {
      // Reset waves to default heights
      wave1Height.setValue(12);
      wave2Height.setValue(20);
      wave3Height.setValue(12);
    }

    return () => {
      if (animation1) animation1.stop();
      if (animation2) animation2.stop();
      if (animation3) animation3.stop();
    };
  }, [isSpeaking, isMuted]);

  const toggleMute = async () => {
    try {
      if (!isMuted) {
        // Mute - stop any ongoing speech
        await Speech.stop();
        setIsMuted(true);
        if (isAnnouncementRunningRef) {
          isAnnouncementRunningRef.current = false;
        }
      } else {
        // Unmute - play the voice again
        setIsMuted(false);
        await replayVoice();
      }
    } catch (error) {
      console.log("Error toggling mute:", error);
    }
  };

  const stopSpeech = async () => {
    try {
      await Speech.stop();
      if (isAnnouncementRunningRef) {
        isAnnouncementRunningRef.current = false;
      }
    } catch (error) {
      console.log("Error stopping speech:", error);
    }
  };

  // Scroll to continue button
  const scrollToContinueButton = () => {
    if (selectedLanguage && scrollViewRef.current && continueButtonRef.current) {
        continueButtonRef.current.measureLayout(
          scrollViewRef.current,
          (x, y) => {
            scrollViewRef.current.scrollTo({
              y: y - 50,
              animated: true,
            });
          },  
          () => console.log("measureLayout failed")  
        );
    }
  };

  useEffect(() => {
    // Scroll when language is selected
    if (selectedLanguage) {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        scrollToContinueButton();
      }, 300);
    }
  }, [selectedLanguage]);

  return (
    <ImageBackground
      source={require("../assets/field.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(28, 32, 21, 0.5)",
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: 'transparent' }}
        >
          <View style={{ alignItems: "center", marginBottom: 30 }}>
            <Image
              source={require("../assets/icon2.png")}
              style={{ width: 250, height: 250 ,marginBottom:-60}}
              resizeMode="contain"
            />
            <Text
              style={{
                fontSize: 28,
                fontWeight: "900",
                color: "#d5e77c",
                marginTop: 15,
                textAlign: "center",
                letterSpacing: 1,
              }}
            >
              SELECT LANGUAGE
            </Text>
          </View>

         

          {/* LANGUAGE CARDS */}
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              onPress={() => {
                handleLanguageSelect(language.code);
              }}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 15,
                borderRadius: 16,
                overflow: "hidden",
                elevation: selectedLanguage === language.code ? 8 : 3,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
            >
              <LinearGradient
                colors={
                  selectedLanguage === language.code
                    ? ["#4CAF50", "#2E7D32", "#1B5E20"]
                    : ["#FFFFFF", "#F1F8E9", "#DCEDC8"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  flex: 1,
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: selectedLanguage === language.code ? "#FFD700" : "#328c09",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 15,
                    borderWidth: selectedLanguage === language.code ? 2 : 0,
                    borderColor: "#fff",
                    elevation: 3,
                  }}
                >
                  <Text style={{ 
                    color: selectedLanguage === language.code ? "#1B5E20" : "white", 
                    fontWeight: "bold",
                    fontSize: 18 
                  }}>
                    {language.key}
                  </Text>
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ 
                      fontSize: 20, 
                      fontWeight: "700", 
                      color: selectedLanguage === language.code ? "#fff" : "#1b5e20",
                      marginBottom: 4,
                    }}
                  >
                    {language.name}
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: selectedLanguage === language.code ? "rgba(255,255,255,0.9)" : "#666",
                  }}>
                    {language.voiceText}
                  </Text>
                </View>

                {selectedLanguage === language.code && (
                  <View style={{
                    backgroundColor: "#FFD700",
                    borderRadius: 20,
                    padding: 4,
                  }}>
                    <Ionicons name="checkmark" size={24} color="#1B5E20" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}

          {/* SELECTION CARD */}
          {selectedLanguage && (
            <View
              ref={continueButtonRef}
              style={{
                marginTop: 30,
                marginBottom: 20,
                borderRadius: 24,
                overflow: "hidden",
                elevation: 10,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
              collapsable={false}
            >
              <LinearGradient
                colors={["rgba(76, 175, 80, 0.95)", "rgba(46, 125, 50, 0.95)", "rgba(27, 94, 32, 0.95)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: 25,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 20,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    padding: 15,
                    borderRadius: 15,
                  }}
                >
                  <View style={{
                    backgroundColor: "#FFD700",
                    borderRadius: 25,
                    padding: 5,
                  }}>
                    <Ionicons name="checkmark-circle" size={30} color="#1B5E20" />
                  </View>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#fff",
                      marginLeft: 15,
                      flex: 1,
                    }}
                  >
                    {selectedLangData?.selectedMessage}

                  </Text>
                </View>
                
                {/* CONTINUE BUTTON */}
                <TouchableOpacity
                  onPress={async () => {
                    await stopSpeech();
                    navigation.replace("Login");
                  }}
                  activeOpacity={0.8}
                  style={{
                    borderRadius: 50,
                    overflow: "hidden",
                    elevation: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                  }}
                >
                  <LinearGradient
                    colors={["#FF9800", "#F57C00", "#E65100"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 18,
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 18,
                        fontWeight: "bold",
                        marginRight: 10,
                        letterSpacing: 0.5,
                      }}
                    >
                      {selectedLangData?.continueButtonText}
                      
                    </Text>
                    <Ionicons name="arrow-forward-circle" size={24} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </ScrollView>

        {/* FIXED BOTTOM-LEFT MUTE/UNMUTE BUTTON WITH WAVE BARS ON RIGHT */}
        <View style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          zIndex: 1000,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          {/* Circular Mute/Unmute Button */}
          <TouchableOpacity
            onPress={toggleMute}
            activeOpacity={0.7}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: isMuted ? '#D32F2F' : '#2E7D32',
              borderWidth: 2,
              borderColor: '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
            }}
          >
            <Ionicons 
              name={isMuted ? "volume-mute" : "volume-high"} 
              size={28} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          
          {/* Sound Wave Bars - shown only when speaking and not muted */}
          {isSpeaking && !isMuted && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: 12,
              gap: 2,
            }}>
              <Animated.View style={{
                width: 4,
                height: wave1Height,
                borderRadius: 2,
                backgroundColor: '#2E7D32',
              }} />
              <Animated.View style={{
                width: 4,
                height: wave2Height,
                borderRadius: 2,
                backgroundColor: '#2E7D32',
              }} />
              <Animated.View style={{
                width: 4,
                height: wave3Height,
                borderRadius: 2,
                backgroundColor: '#2E7D32',
              }} />
            </View>
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default LanguageScreen;                 
                      

