import { registerFarmer, setAuthToken } from "../api/apiClient";
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

const SignupScreen = ({ navigation }) => {
  // FIX #1: Changed `selectedLanguage` → `lang` (correct name from AppContext)
  const { setUser, t, convertDigits, lang } = useContext(AppContext);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (num) => {
    const clean = num.replace(/\D/g, "");
    if (clean.length !== 10) return t.invalidPhone;
    if (!["6", "7", "8", "9"].includes(clean.charAt(0))) return t.invalidPhone;
    return "";
  };

  const handleSignup = async () => {
    Keyboard.dismiss();

    if (!fullName.trim()) return Alert.alert("Error", t.fullName);

    const err = validatePhone(phoneNumber);
    if (err) return Alert.alert("Error", err);

    setIsLoading(true);

    try {
      // FIX #2: Changed `selectedLanguage` → `lang`
      const response = await registerFarmer(fullName, phoneNumber, lang);

      console.log("REGISTER RESPONSE:", response);

      const userData = response.data;
      const token = response.token;

      // Save user in context
      setUser(userData);

      // Save user data locally
      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      // Save token
      if (token) {
        await AsyncStorage.setItem("token", token);
        setAuthToken(token);
      }

      // Mark logged in
      await AsyncStorage.setItem("isLoggedIn", "true");

      // Navigate to location screen
      navigation.replace("Location");

    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Error", error.message || "Failed to register user");
    } finally {
      setIsLoading(false);
    }
  };

  // TEMPORARY: Direct navigation without validation (for testing only)
  const handleTemporarySkip = () => {
    navigation.replace("Location");
  };

  // FIX #3: Changed `selectedLanguage` → `lang`
  const isBengali = lang === "bn";

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
          <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 30,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* LOGO */}
            <View style={{ alignItems: "center" }}>
              <Image
                source={require("../assets/main-icon.png")}
                style={{ height: 250, width: 250, resizeMode: "contain", marginBottom: -90 }}
              />
            </View>

            {/* MAIN GRADIENT CARD */}
            <View
              style={{
                marginHorizontal: 20,
                marginTop: 60,
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
                colors={[
                  "rgba(255,255,255,0.98)",
                  "rgba(226, 247, 183, 0.95)",
                  "rgba(200, 230, 150, 0.98)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 25 }}
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
                  {t.createAccount}
                </Text>

                <Text
                  style={{
                    fontSize: isBengali ? 13 : 14,
                    color: "#19630f",
                    textAlign: "center",
                    marginBottom: 25,
                    opacity: 0.8,
                  }}
                >
                  {t.signupDetails}
                </Text>

                {/* FULL NAME INPUT */}
                <View
                  style={{
                    borderWidth: 2,
                    borderColor: "#FFD700",
                    borderRadius: 20,
                    marginTop: -70,
                    marginBottom: 15,
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
                    <View
                      style={{
                        backgroundColor: "#4CAF20",
                        borderRadius: 30,
                        padding: 6,
                        marginRight: 10,
                      }}
                    >
                      <Ionicons name="person-outline" size={22} color="#fff" />
                    </View>
                    <TextInput
                      placeholder={t.fullName}
                      placeholderTextColor="#888"
                      value={fullName}
                      onChangeText={(v) => {
                        // Allow:
                        //   \p{L}  — any letter in any language (Bengali, Hindi, English, etc.)
                        //   \p{M}  — combining marks / matras (needed for Bengali & Devanagari)
                        //   \s     — spaces
                        //   \d     — digits (enforced after-letter rule below)
                        //
                        // Block: all special characters (!, @, #, $, %, etc.)
                        //
                        // Step 1 — strip anything that is not a letter, combining mark,
                        //          digit, or space
                        const stripped = v.replace(
                          /[^\p{L}\p{M}\d\s]/gu,
                          ''
                        );

                        // Step 2 — digits are only allowed after at least one letter
                        // has already appeared. Walk the string and drop any digit that
                        // appears before the first letter character.
                        let seenLetter = false;
                        const filtered = stripped
                          .split('')
                          .filter((ch) => {
                            if (/\p{L}/u.test(ch) || /\p{M}/u.test(ch)) {
                              seenLetter = true;
                              return true;
                            }
                            if (/\d/.test(ch)) {
                              return seenLetter; // only keep digit if a letter came first
                            }
                            return true; // spaces pass through
                          })
                          .join('');

                        setFullName(filtered);
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 16,
                        fontSize: 16,
                        color: "#333",
                      }}
                    />
                  </LinearGradient>
                </View>

                {/* PHONE INPUT */}
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
                    <View
                      style={{
                        backgroundColor: "#4CAF20",
                        borderRadius: 30,
                        padding: 6,
                        marginRight: 10,
                      }}
                    >
                      <Ionicons name="call-outline" size={22} color="#fff" />
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
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
                        onChangeText={(text) => {
                          const numeric = text.replace(/\D/g, "");
                          if (numeric.length <= 10) {
                            setPhoneNumber(numeric);
                            setPhoneError(validatePhone(numeric));
                          }
                        }}
                        maxLength={10}
                        style={{
                          flex: 1,
                          paddingVertical: 16,
                          fontSize: 16,
                          color: "#333",
                        }}
                      />
                    </View>
                  </LinearGradient>
                </View>

                {/* PHONE ERROR */}
                {phoneError ? (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#ff4444",
                      borderRadius: 12,
                      padding: 8,
                      marginBottom: 15,
                      backgroundColor: "rgba(255,68,68,0.1)",
                    }}
                  >
                    <Text
                      style={{
                        color: "#ff4444",
                        fontSize: 13,
                        textAlign: "center",
                      }}
                    >
                      <Ionicons name="alert-circle" size={16} /> {phoneError}
                    </Text>
                  </View>
                ) : null}

                {/* SIGNUP BUTTON */}
                <TouchableOpacity
                  onPress={handleSignup}
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
                    opacity: isLoading ? 0.7 : 1,
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
                          {t.signup}
                        </Text>
                        <View
                          style={{
                            backgroundColor: "rgba(255,255,255,0.2)",
                            borderRadius: 20,
                            padding: 4,
                          }}
                        >
                          <Ionicons name="arrow-forward" size={22} color="#fff" />
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* TEMPORARY SKIP BUTTON */}
                <TouchableOpacity
                  onPress={handleTemporarySkip}
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
                    backgroundColor: "#f0f0f0",
                  }}
                >
                  <LinearGradient
                    colors={["#e0e0e0", "#d0d0d0", "#c0c0c0"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 12,
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#333",
                        fontWeight: "600",
                        fontSize: 16,
                        marginRight: 8,
                      }}
                    >
                      TEMP: Skip to Location
                    </Text>
                    <Ionicons name="arrow-forward-circle" size={20} color="#666" />
                  </LinearGradient>
                </TouchableOpacity>

                {/* LOGIN LINK */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("Login")}
                  style={{
                    marginTop: 25,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: "#FFD700",
                    borderRadius: 40,
                    padding: 14,
                    backgroundColor: "rgba(255,255,255,0.5)",
                  }}
                >
                  <LinearGradient
                    colors={["transparent", "rgba(255,215,0,0.1)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Text
                      style={{
                        color: "#F57C00",
                        fontWeight: "700",
                        fontSize: isBengali ? 15 : 16,
                        textAlign: "center",
                      }}
                    >
                      {t.alreadyHaveAccount}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* CHANGE LANGUAGE BUTTON */}
            <View
              style={{
                alignItems: "center",
                paddingHorizontal: 30,
                marginTop: 30,
                marginBottom: 20,
              }}
            >
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
                <Text style={{ color: "#1b5e20", fontSize: 14, fontWeight: "600" }}>
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

export default SignupScreen;