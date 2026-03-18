import { loginFarmer, setAuthToken } from "../api/apiClient";
import React, { useState, useContext } from "react";
import {
  Text,
  ScrollView,
  StatusBar,
  Image,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppContext } from "../context/AppContext";

const LoginScreen = ({ navigation }) => {
  const { setUser, t, convertDigits, lang } = useContext(AppContext);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validatePhoneNumber = (number) => {
    const cleanedNumber = number.replace(/\D/g, "");
    if (cleanedNumber.length !== 10)
      return t.invalidPhone || "Phone number must be 10 digits";
    if (!["6", "7", "8", "9"].includes(cleanedNumber.charAt(0)))
      return t.invalidPhone || "Invalid phone number";
    return "";
  };

  const handlePhoneChange = (text) => {
    const numericText = text.replace(/\D/g, "");
    if (numericText.length <= 10) {
      setPhoneNumber(numericText);
      if (numericText.length === 10) {
        setPhoneError(validatePhoneNumber(numericText));
      } else if (numericText.length > 0) {
        setPhoneError(t.invalidPhone || "Phone number must be 10 digits");
      } else {
        setPhoneError("");
      }
    }
  };

  //================
  // handling login
  //=================
  const handleLogin = async () => {

    Keyboard.dismiss();

    const error = validatePhoneNumber(phoneNumber);

    if (error) {
      Alert.alert("Invalid Phone", error);
      return;
    }

    setIsLoading(true);
    
    try {
      
      const response = await loginFarmer(phoneNumber);
      
      console.log("LOGIN RESPONSE:", response);

      const userData = {
        id: response.data.id,
        name: response.data.name,
        phoneNumber: response.data.phoneNumber,
        token: response.token,
        language: lang
      };

      setUser(userData);

      // STORE TOKEN
      const token = response.token;

      if (token) {
        await AsyncStorage.setItem("token", token);
        setAuthToken(token);
      }

      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      navigation.replace("SavedLocations");

    } catch (error) {

      console.error("Login error:", error);

      Alert.alert(
        "Login Failed",
        error.message || "Unable to connect to server"
      ); 
      
      
    } finally {

      setIsLoading(false);
    }
  };

  // Determine if current language is Bengali for font adjustments
  const isBengali = lang === 'bn';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground
        source={require("../assets/ricebg.jpg")}
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
            backgroundColor: "rgba(77, 77, 4, 0.3)",
          }}
        />

        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="transparent"
            translucent
          />

          <ScrollView
            contentContainerStyle={{ 
              flexGrow: 1,
              paddingBottom: 30 
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <Image
                source={require("../assets/main-icon.png")}
                style={{ height: 250, width: 250, resizeMode: "contain", marginBottom: -80 }}
              />
            </View>

            {/* MAIN GRADIENT CARD */}
            <View
              style={{
                marginHorizontal: 20,
                marginTop: 40,
                borderRadius: 24,
                overflow: "hidden",
                elevation: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                borderWidth: 2,
                borderColor: "rgba(255,215,0,0.3)",
              }}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.98)", "rgba(226, 247, 183, 0.95)", "rgba(200, 230, 150, 0.98)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: 25,
                }}
              >
                {/* Title */}
                <Text
                  style={{
                    color: "#1b5e20",
                    fontSize: isBengali ? 24 : 28,
                    fontWeight: "900",
                    textAlign: "center",
                    marginBottom: 5,
                  }}
                >
                  {t.loginTitle}
                </Text>
                <Text
                  style={{
                    fontSize: 25,
                    color: "#19630f",
                    textAlign: "center",
                    marginTop: -30,
                    marginBottom: 25,
                    opacity: 0.8,
                  }}
                >
                  {t.welcome}
                </Text>

                {/* PHONE INPUT CARD */}
                <View
                  style={{
                    borderWidth: 2,
                    borderColor: phoneError ? "#ff4444" : "#FFD700",
                    borderRadius: 20,
                    marginBottom: phoneError ? 5 : 15,
                    overflow: "hidden",
                    backgroundColor: "#fff",
                    elevation: 3,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                  }}
                >
                  <LinearGradient
                    colors={["rgba(255,255,255,0.9)", "rgba(240,255,240,0.9)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 15,
                    }}
                  >
                    <View style={{
                      backgroundColor: "#4CAF20",
                      borderRadius: 30,
                      padding: 6,
                      marginRight: 10,
                    }}>
                      <Ionicons
                        name="call-outline"
                        size={22}
                        color="#fff"
                      />
                    </View>
                    <View style={{ 
                      flexDirection: "row", 
                      alignItems: "center",
                      flex: 1,
                    }}>
                      <Text
                        style={{
                          marginRight: 8,
                          color: "#1b5e20",
                          fontWeight: "700",
                          fontSize: 16,
                          backgroundColor: "#E8F5E9",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}
                      >
                        {convertDigits("+91")}
                      </Text>
                      <TextInput
                        placeholder={t.phoneNumber}
                        placeholderTextColor="#888"
                        keyboardType="number-pad"
                        value={phoneNumber}
                        onChangeText={handlePhoneChange}
                        maxLength={10}
                        style={{ flex: 1, paddingVertical: 16, fontSize: 16, color: phoneError ? "#ff4444" : "#333" }}
                      />
                    </View>
                    {phoneNumber.length > 0 && (
                      <Text
                        style={{
                          marginLeft: 5,
                          color: phoneError ? "#ff4444" : "#4caf50",
                          fontWeight: "bold",
                          fontSize: 14,
                        }}
                      >
                        {convertDigits(phoneNumber.length)}/{convertDigits(10)}
                      </Text>
                    )}
                  </LinearGradient>
                </View>
                
                {phoneError ? (
                  <View style={{
                    borderWidth: 1,
                    borderColor: "#ff4444",
                    borderRadius: 12,
                    padding: 8,
                    marginBottom: 15,
                    backgroundColor: "rgba(255,68,68,0.1)",
                  }}>

                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                     <Ionicons name="alert-circle" size={16} color="#ff4444" />
                     <Text style={{ color: "#ff4444", marginLeft: 5 }}>
                        {phoneError}
                     </Text>
                    </View>           
                    
                
                  </View>
                ) : phoneNumber.length === 10 ? (
                  <View style={{
                    borderWidth: 1,
                    borderColor: "#4caf50",
                    borderRadius: 12,
                    padding: 8,
                    marginBottom: 15,
                    backgroundColor: "rgba(76,175,80,0.1)",
                  }}>
                    <Text style={{ color: "#4caf50", fontSize: 13, textAlign: "center" }}>
                      <Ionicons name="checkmark-circle" size={16} /> Valid phone number ✓
                    </Text>
                  </View>
                ) : null}

                {/* LOGIN BUTTON */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                  style={{
                    marginTop: 20,
                    borderRadius: 50,
                    overflow: "hidden",
                    elevation: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                    borderWidth: 2,
                    borderColor: "#FFD700",
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
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: 18,
                            marginRight: 10,
                            letterSpacing: 0.5,
                          }}
                        >
                          {t.login}
                        </Text>
                        <View style={{
                          backgroundColor: "rgba(255,255,255,0.2)",
                          borderRadius: 20,
                          padding: 4,
                        }}>
                          <Ionicons name="arrow-forward" size={22} color="#fff" />
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* SIGNUP LINK - CORRECTED TEXT FORMATTING */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("Signup")}
                  activeOpacity={0.8}
                  style={{
                    marginTop: 15,
                    borderRadius: 50,
                    overflow: "hidden",
                    elevation: 4,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                    borderWidth: 2,
                    borderColor: "#FFD700",
                  }}
                >
                  <LinearGradient
                    colors={["#4CAF50", "#45a049", "#388E3C"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 14,
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: 16,
                        marginRight: 8,
                        letterSpacing: 0.5,
                      }}
                    >
                      {t.noAccount} {t.signup}
                    </Text>
                    <View style={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: 20,
                      padding: 4,
                    }}>
                      <Ionicons name="person-add" size={20} color="#fff" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* CHANGE LANGUAGE BUTTON */}
            <View style={{ alignItems: "center", paddingHorizontal: 30, marginTop: 30, marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Language")}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "rgba(0, 150, 0, 0.3)",
                  elevation: 3,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="language"
                  size={18}
                  color="#1b5e20"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{ color: "#1b5e20", fontSize: 14, fontWeight: "600" }}
                >
                  {t.changeLang}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;