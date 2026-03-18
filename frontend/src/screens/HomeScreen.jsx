import { testBackend } from "../api/apiClient";
import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Modal,
  Pressable,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import { AppContext } from "../context/AppContext";
import FloatingChatbot from "../components/FloatingChatbot";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HomeScreen = ({ navigation }) => {
  const {
    t,
    user,
    setUser,
    setChatVisible,
    setChatType,
    lang,
    setLang,
    convertDigits,
    location,
  } = useContext(AppContext);

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [languageDropdownVisible, setLanguageDropdownVisible] = useState(false);
  const [locationDropdownVisible, setLocationDropdownVisible] = useState(false);

  useEffect(() => {
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor("transparent");
    StatusBar.setBarStyle("light-content");
  }, []);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await testBackend();
        console.log("Backend response:", response);
      } catch (error) {
        console.log("Backend connection failed:", error);
      }
    };
    checkBackend();
  }, []);

  const toggleChat = (type = "General") => {
    setChatType(type);
    setChatVisible(true);
  };

  const logout = async () => {
    setProfileModalVisible(false);
    setUser(null);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("userData");
    navigation.replace("Login");
  };

  const changeLanguage = (languageCode) => {
    setLang(languageCode);
    setLanguageDropdownVisible(false);
  };

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    return t.guest;
  };

  const myCropLabel = lang === "hi" ? "मेरी फसल" : lang === "bn" ? "আমার ফসল" : "My Crop";
  const myCropDesc  = lang === "hi" ? "सलाह और बुवाई में मदद" : lang === "bn" ? "পরামর্শ ও বপন সহায়তা" : "Advice & planting help";
  const storageDesc = lang === "hi" ? "फसल भंडारण" : lang === "bn" ? "ফসল স্টোরেজ" : "Crop Storage";

  const cardStyle = {
    width: "100%",
    borderRadius: 25,
    overflow: "hidden",
    elevation: 10,
    marginBottom: 18,
    borderWidth: 2.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#799844" }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ImageBackground
        source={require("../assets/homebg.jpg")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(29, 69, 7, 0.5)",
          }}
        />

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Profile Bar */}
          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 25 }}>
            <TouchableOpacity
              onPress={() => setProfileModalVisible(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(196, 246, 153, 0.25)",
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 30,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.3)",
                elevation: 4,
              }}
            >
              {location && (
                <View style={{
                  backgroundColor: "#FF9800",
                  borderRadius: 15,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  marginRight: 8,
                }}>
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>
                    {location?.name}
                  </Text>
                </View>
              )}
              <Text style={{ marginLeft: location ? 0 : 10, marginRight: 10, fontSize: 20, fontWeight: "600", color: "#0d3706" }}>
                {t.hello}, {getUserDisplayName()}
              </Text>
              <Ionicons name="menu" size={24} color="#0d3706" />
            </TouchableOpacity>
          </View>

          {/* Card 1: Weather Update */}
          <TouchableOpacity onPress={() => navigation.navigate("Weather")} activeOpacity={0.9} style={{ ...cardStyle, height: 180 }}>
            <ImageBackground source={require("../assets/weather.jpg")} style={{ flex: 1 }}>
              <LinearGradient
                colors={["rgba(0,0,0,0.3)", "rgba(6,39,68,0.3)"]}
                style={{ flex: 1, padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                <View style={{ flex: 1, alignItems: "center" }}>
                  <MaterialCommunityIcons name="weather-partly-cloudy" size={70} color="#fff" />
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 10 }}>
                    {t.weatherUpdate}
                  </Text>
                  <Text style={{ color: "#E8F5E9", fontSize: 14, opacity: 0.9 }}>{t.forecast}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>

          {/* Card 2: My Crop (full width, merged) */}
          <TouchableOpacity onPress={() => navigation.navigate("CropRec")} activeOpacity={0.9} style={{ ...cardStyle, height: 180 }}>
            <ImageBackground source={require("../assets/crop.jpg")} style={{ flex: 1 }}>
              <LinearGradient
                colors={["rgba(0,0,0,0.35)", "rgba(27,94,32,0.85)"]}
                style={{ flex: 1, padding: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 14, marginRight: 18 }}>
                    <MaterialCommunityIcons name="sprout" size={40} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>
                      {myCropLabel}
                    </Text>
                    <Text style={{ color: "#E8F5E9", fontSize: 13, opacity: 0.9 }}>{myCropDesc}</Text>
                    <View style={{ flexDirection: "row", marginTop: 10, gap: 8 }}>
                      <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ color: "#fff", fontSize: 11 }}>
                          {lang === "hi" ? "🌱 क्या बोएं?" : lang === "bn" ? "🌱 কী বুনব?" : "🌱 What to plant?"}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ color: "#fff", fontSize: 11 }}>
                          {lang === "hi" ? "💬 फसल सलाह" : lang === "bn" ? "💬 পরামর্শ" : "💬 Crop advice"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>

          {/* Card 3: Storage */}
          <TouchableOpacity onPress={() => navigation.navigate("Storage")} activeOpacity={0.9} style={{ ...cardStyle, height: 160 }}>
            <ImageBackground source={require("../assets/warehouse.jpg")} style={{ flex: 1 }} blurRadius={1}>
              <LinearGradient
                colors={["rgba(0,0,0,0.6)", "rgba(81,92,3,0.2)"]}
                style={{ flex: 1, flexDirection: "row", padding: 24, alignItems: "center" }}
              >
                <FontAwesome5 name="warehouse" size={40} color="#fff" />
                <View style={{ marginLeft: 20, flex: 1 }}>
                  <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>{t.storage}</Text>
                  <Text style={{ color: "#f0f0f0", fontSize: 14 }}>{storageDesc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </ScrollView>

        {/* Profile Modal */}
        <Modal visible={profileModalVisible} transparent={true} animationType="fade" onRequestClose={() => setProfileModalVisible(false)}>
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(4,35,6,0.5)", justifyContent: "center", alignItems: "center" }}
            onPress={() => { setProfileModalVisible(false); setLanguageDropdownVisible(false); setLocationDropdownVisible(false); }}
          >
            <View style={{ backgroundColor: "#fff", width: "85%", borderRadius: 20, padding: 25, elevation: 20 }}>
              <Text style={{ fontSize: 22, fontWeight: "bold", textAlign: "center", color: "#2E7D32", marginBottom: 20 }}>
                {t.hello}, {getUserDisplayName()}
              </Text>

              <View style={{ borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10 }}>

                {/* Farm row */}
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, position: "relative", zIndex: 2000 }}>
                  <Ionicons name="location" size={24} color="#2E7D32" />
                  <View style={{ marginLeft: 15, flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "bold" }}>{t.currentFarm || "Current Farm"}:</Text>
                    <Text style={{ color: "#666", fontWeight: "500" }}>{location?.name || t.noFarmSelected || "No farm selected"}</Text>
                    {location?.address && <Text style={{ color: "#999", fontSize: 12 }} numberOfLines={1}>{location.address}</Text>}
                  </View>
                  <TouchableOpacity
                    onPress={() => { setLocationDropdownVisible(!locationDropdownVisible); setLanguageDropdownVisible(false); }}
                    style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f0f0f0", padding: 8, borderRadius: 10, minWidth: 100, justifyContent: "space-between" }}
                  >
                    <Text style={{ marginRight: 5, fontSize: 16, color: "#333" }}>{t.change || "Change"}</Text>
                    <Ionicons name={locationDropdownVisible ? "chevron-up" : "chevron-down"} size={18} color="#2E7D32" />
                  </TouchableOpacity>
                </View>

                {locationDropdownVisible && (
                  <View style={{ position: "absolute", right: 25, top: 90, backgroundColor: "#fff", borderRadius: 12, elevation: 8, borderWidth: 1, borderColor: "#ddd", zIndex: 2500, width: 150, overflow: "hidden" }}>
                    <TouchableOpacity
                      onPress={() => { setLocationDropdownVisible(false); setProfileModalVisible(false); navigation.navigate("SavedLocations"); }}
                      style={{ paddingVertical: 15, paddingHorizontal: 15, alignItems: "center", backgroundColor: "#f9f9f9" }}
                    >
                      <Text style={{ fontSize: 13, color: "#2E7D32", fontWeight: "600", textAlign: "center" }}>
                        {t.manageFarms || "Manage Farms"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Phone row */}
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}>
                  <Ionicons name="call" size={24} color="#2E7D32" />
                  <View style={{ marginLeft: 15, flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "bold" }}>{t.phoneNumber}:</Text>
                    <Text style={{ color: "#666" }}>{user?.phoneNumber ? convertDigits(user.phoneNumber) : t.notProvided}</Text>
                  </View>
                </View>

                {/* Language row */}
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, position: "relative", zIndex: 1000 }}>
                  <Ionicons name="language" size={24} color="#2E7D32" />
                  <View style={{ marginLeft: 15, flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "bold" }}>{t.changeLang}:</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => { setLanguageDropdownVisible(!languageDropdownVisible); setLocationDropdownVisible(false); }}
                    style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f0f0f0", padding: 8, borderRadius: 10, minWidth: 100, justifyContent: "space-between" }}
                  >
                    <Text style={{ marginRight: 5, fontSize: 16 }}>
                      {lang === "en" ? "English" : lang === "hi" ? "हिंदी" : "বাংলা"}
                    </Text>
                    <Ionicons name={languageDropdownVisible ? "chevron-up" : "chevron-down"} size={18} color="#2E7D32" />
                  </TouchableOpacity>
                </View>

                {languageDropdownVisible && (
                  <View style={{ position: "absolute", right: 25, top: 170, backgroundColor: "#fff", borderRadius: 12, elevation: 8, borderWidth: 1, borderColor: "#ddd", zIndex: 1500, width: 120, overflow: "hidden" }}>
                    {[{ code: "en", label: "English" }, { code: "hi", label: "हिंदी" }, { code: "bn", label: "বাংলা" }].map(({ code, label }, i) => (
                      <TouchableOpacity
                        key={code}
                        onPress={() => changeLanguage(code)}
                        style={{ paddingVertical: 15, paddingHorizontal: 15, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: "#f0f0f0", backgroundColor: lang === code ? "#e8f5e9" : "#fff" }}
                      >
                        <Text style={{ fontSize: 16, color: lang === code ? "#2E7D32" : "#333", fontWeight: lang === code ? "bold" : "normal", textAlign: "center" }}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Logout */}
                <TouchableOpacity
                  onPress={logout}
                  style={{ flexDirection: "row", alignItems: "center", paddingVertical: 15, marginTop: 10, borderTopWidth: 1, borderTopColor: "#eee" }}
                >
                  <Ionicons name="log-out" size={24} color="#D32F2F" />
                  <Text style={{ marginLeft: 15, color: "#D32F2F", fontSize: 16, fontWeight: "bold" }}>{t.logout}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* Floating Chatbot Button */}
        <TouchableOpacity
          style={{
            position: "absolute", bottom: 25, right: 30,
            backgroundColor: "#2E7D32", width: 65, height: 65,
            borderRadius: 32.5, justifyContent: "center", alignItems: "center",
            elevation: 10, zIndex: 999, borderWidth: 1, borderColor: "#ffffff",
          }}
          onPress={() => toggleChat("General")}
        >
          <Ionicons name="chatbubbles" size={35} color="#fff" />
        </TouchableOpacity>

        <FloatingChatbot />
      </ImageBackground>
    </View>
  );
};

export default HomeScreen;