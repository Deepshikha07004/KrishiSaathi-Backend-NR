import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translations from "../translations/translations";

// ======================================
// CREATE CONTEXT
// ======================================
export const AppContext = createContext();

// ======================================
// APP PROVIDER
// ======================================
export const AppProvider = ({ children }) => {

  // ======================================
  // LANGUAGE STATE
  // ======================================
  const [lang, setLang] = useState("en");

  // ======================================
  // USER STATE
  // ======================================
  const [user, setUser] = useState(null);

  // ======================================
  // LOCATION STATE
  // ======================================
  const [location, setLocation] = useState(null);

  // ======================================
  // CHATBOT STATE
  // ======================================
  const [isChatVisible, setChatVisible] = useState(false);
  const [chatType, setChatType] = useState("General");
  const [pinnedMessage, setPinnedMessage] = useState(null);

  // ======================================
  // LOCATION MODE
  // ======================================
  const [isManualLocation, setIsManualLocation] = useState(false);

  // ======================================
  // CHAT UI SETTINGS
  // ======================================
  const [chatBackground, setChatBackground] = useState(null);

  // ======================================
  // WEATHER DATA
  // ======================================
  const [weatherData, setWeatherData] = useState(null);


  // ======================================
  // CLEAR CHAT CONTEXT WHEN FARM CHANGES
  // ======================================
  useEffect(() => {
    // When farmer switches farm, old crop details must not carry over
    setPinnedMessage(null);
    setChatType("General");
  }, [location]);

  // ======================================
  // LOAD USER FROM STORAGE (VERY IMPORTANT FIX)
  // ======================================
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userData");

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }

      } catch (error) {
        console.log("Failed to load stored user:", error);
      }
    };

    loadUser();
  }, []);


  // ======================================
  // DIGIT CONVERSION FOR LANGUAGES
  // ======================================
  const digitsMap = {
    hi: ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"],
    bn: ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"],
  };

  const convertDigits = (val) => {
    if (!val && val !== 0) return "";

    const str = val.toString();

    if (lang === "en" || !digitsMap[lang]) return str;

    return str
      .split("")
      .map((c) =>
        c >= "0" && c <= "9"
          ? digitsMap[lang][parseInt(c)]
          : c
      )
      .join("");
  };


  // ======================================
  // TRANSLATIONS
  // ======================================
  const t = translations[lang] || translations["en"] || {};


  // ======================================
  // CONTEXT PROVIDER
  // ======================================
  return (
    <AppContext.Provider
      value={{

        // LANGUAGE
        lang,
        setLang,
        t,

        // USER
        user,
        setUser,

        // LOCATION
        location,
        setLocation,

        // CHATBOT
        isChatVisible,
        setChatVisible,
        chatType,
        setChatType,
        pinnedMessage,
        setPinnedMessage,

        // LOCATION MODE
        isManualLocation,
        setIsManualLocation,

        // DIGIT CONVERSION
        convertDigits,

        // CHAT UI
        chatBackground,
        setChatBackground,

        // WEATHER
        weatherData,
        setWeatherData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};