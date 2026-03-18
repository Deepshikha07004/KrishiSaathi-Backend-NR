import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import { AppContext } from "../context/AppContext";

const WeatherScreen = ({ navigation }) => {
  const { t, location, convertDigits, lang, user } = useContext(AppContext);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Backend API URL - Replace with your actual backend URL
  const API_BASE_URL = "https://your-backend-api.com/api";

  // Fetch weather data from backend API
  const fetchWeatherData = async (lat, lon, language) => {
    try {
      const response = await fetch(`${API_BASE_URL}/weather`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          language: language,
          userId: user?.id || null,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Weather API error:", error);
      throw error;
    }
  };

  const getWeatherData = async () => {
    if (!location?.latitude || !location?.longitude) {
      setError(t.locationError || "Location not available");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await fetchWeatherData(
        location.latitude,
        location.longitude,
        lang,
      );
      setWeatherData(data);
    } catch (err) {
      console.error("Weather fetch error:", err);
      setError(t.weatherError || "Failed to load weather data");
      setWeatherData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getWeatherData();
  }, [location, lang]);

  const onRefresh = () => {
    setRefreshing(true);
    getWeatherData();
  };

  const handleLocationPress = () => {
    navigation.navigate("Location");
  };

  // Get weather icon based on condition
  const getWeatherIcon = (condition, size = 70) => {
    const iconMap = {
      Clear: "weather-sunny",
      Sunny: "weather-sunny",
      Clouds: "weather-cloudy",
      "Partly cloudy": "weather-partly-cloudy",
      Rain: "weather-rainy",
      Drizzle: "weather-rainy",
      Thunderstorm: "weather-lightning",
      Snow: "weather-snowy",
      Mist: "weather-fog",
      Fog: "weather-fog",
      Haze: "weather-hazy",
    };
    return iconMap[condition] || "weather-cloudy";
  };

  if (loading && !refreshing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 10, color: "#2E7D32" }}>
          {t.loading || "Fetching weather..."}
        </Text>
      </View>
    );
  }

  const current = weatherData?.current || null;
  const forecast = weatherData?.forecast || [];
  const today = new Date().toLocaleDateString(
    lang === "bn" ? "bn-BD" : lang === "hi" ? "hi-IN" : "en-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );

  return (
    <ImageBackground
      source={require("../assets/weather.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      {/* Background overlay - only addition */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)", // Dark overlay for better visibility
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2E7D32"]}
            tintColor="#2E7D32"
          />
        }
        contentContainerStyle={{ paddingTop: 50, paddingBottom: 20 }}
      >
        {/* Location Header */}
        <TouchableOpacity
          onPress={handleLocationPress}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "transparent",
            marginHorizontal: 20,
            marginBottom: 10,
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: 30,
            borderWidth: 2,
            borderColor: "rgba(255, 255, 255, 0.3)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="location" size={20} color="#fff" />
            <Text
              style={{
                color: "#fff",
                marginLeft: 8,
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              {location?.district ||
                location?.city ||
                location?.area ||
                t.locationError ||
                "Your Location"}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Error Display - Show if no data */}
        {error && !weatherData && (
          <View
            style={{
              backgroundColor: "rgba(211, 47, 47, 0.9)",
              marginHorizontal: 20,
              marginBottom: 20,
              padding: 20,
              borderRadius: 15,
              alignItems: "center",
            }}
          >
            <Ionicons name="cloud-offline-outline" size={60} color="#fff" />
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "bold",
                marginTop: 10,
              }}
            >
              {t.unableToLoad || "Unable to Load"}
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 14,
                textAlign: "center",
                marginTop: 5,
                marginBottom: 15,
              }}
            >
              {error}
            </Text>
            <TouchableOpacity
              onPress={getWeatherData}
              style={{
                backgroundColor: "#fff",
                paddingHorizontal: 25,
                paddingVertical: 10,
                borderRadius: 25,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="refresh" size={18} color="#D32F2F" />
              <Text
                style={{ color: "#D32F2F", fontWeight: "bold", marginLeft: 5 }}
              >
                {t.retry || "Retry"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Weather Card - Only show if data exists */}
        {weatherData && current && (
          <LinearGradient
            colors={["rgba(46, 125, 50, 0.7)", "rgba(27, 94, 32, 0.7)"]}
            style={{
              marginHorizontal: 20,
              marginBottom: 20,
              borderRadius: 30,
              padding: 20,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          >
            {/* Date */}
            <View style={{ alignItems: "center", marginBottom: 10 }}>
              <Text style={{ color: "#fff", fontSize: 16, opacity: 0.9 }}>
                {today}
              </Text>
            </View>

            {/* Temperature */}
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <MaterialCommunityIcons
                name={getWeatherIcon(current.condition, 80)}
                size={80}
                color="#fff"
              />
              <Text
                style={{
                  fontSize: 64,
                  fontWeight: "bold",
                  color: "#fff",
                  textShadowColor: "rgba(0,0,0,0.3)",
                  textShadowOffset: { width: 2, height: 2 },
                  textShadowRadius: 5,
                }}
              >
                {convertDigits(current.temp)}°C
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  color: "#fff",
                  marginTop: 5,
                  textShadowColor: "rgba(0,0,0,0.3)",
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 3,
                }}
              >
                {current.condition}
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  opacity: 0.9,
                  marginTop: 5,
                }}
              >
                Feels like {convertDigits(current.feelsLike || current.temp)}°C
              </Text>
            </View>

            {/* Weather Stats */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.3)",
                paddingTop: 20,
              }}
            >
              <View style={{ alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="water-percent"
                  size={28}
                  color="#ffffff"
                />
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: "bold",
                    marginTop: 5,
                  }}
                >
                  {convertDigits(current.humidity)}%
                </Text>
                <Text style={{ color: "#fff", fontSize: 14, opacity: 0.9 }}>
                  {t.humidity}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="weather-windy"
                  size={28}
                  color="#fff"
                />
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: "bold",
                    marginTop: 5,
                  }}
                >
                  {convertDigits(current.wind)} km/h
                </Text>
                <Text style={{ color: "#fff", fontSize: 14, opacity: 0.9 }}>
                  {t.wind}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <MaterialCommunityIcons name="gauge" size={28} color="#fff" />
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: "bold",
                    marginTop: 5,
                  }}
                >
                  {convertDigits(current.pressure || 1013)} hPa
                </Text>
                <Text style={{ color: "#fff", fontSize: 14, opacity: 0.9 }}>
                  Pressure
                </Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Weather Alert (if any) - Only show if data exists */}
        {weatherData &&
          current &&
          (current.alert ||
            current.condition === "Thunderstorm" ||
            current.temp > 40) && (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(211, 47, 47, 0.9)",
                marginHorizontal: 20,
                marginBottom: 20,
                padding: 15,
                borderRadius: 15,
                borderWidth: 1,
                borderColor: "#ff5252",
              }}
              onPress={() =>
                Alert.alert(
                  t.extremeWeather || "Weather Alert",
                  current.alert ||
                    t.extremeWeatherDesc ||
                    "Extreme weather conditions detected. Please take necessary precautions.",
                )
              }
            >
              <Ionicons name="warning" size={30} color="#fff" />
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}
                >
                  {t.extremeWeather || "Weather Alert"}
                </Text>
                <Text
                  style={{ color: "#fff", fontSize: 14, opacity: 0.9 }}
                  numberOfLines={1}
                >
                  {current.alert || "Tap for more details"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
          )}

        {/* Forecast Section - Only show if forecast exists */}
        {weatherData && forecast.length > 0 && (
          <View style={{ marginHorizontal: 20, marginBottom: 30 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "bold",
                color: "#fff",
                marginBottom: 15,
                textShadowColor: "rgba(0,0,0,0.5)",
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
              }}
            >
              {t.forecast || "7-Day Forecast"} {/* Changed from "5-Day Forecast" to "7-Day Forecast" */}
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {forecast.map((item, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: 20,
                    padding: 15,
                    marginRight: 12,
                    alignItems: "center",
                    minWidth: 90,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 8,
                    }}
                  >
                    {item.day}
                  </Text>
                  <MaterialCommunityIcons
                    name={getWeatherIcon(item.condition, 30)}
                    size={30}
                    color="rgba(249, 210, 17)"
                  />
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 20,
                      fontWeight: "bold",
                      marginTop: 8,
                    }}
                  >
                    {convertDigits(item.temp)}°C
                  </Text>
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 12,
                      opacity: 0.8,
                      marginTop: 4,
                    }}
                  >
                    {item.condition}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Additional Info Card - Only show if weather data exists */}
        {weatherData && current && (
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              marginHorizontal: 20,
              marginBottom: 20,
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.3)",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 15,
              }}
            >
              {t.farmingTips || "Farming Tips"}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <FontAwesome5
                name="tint"
                size={16}
                color="#fff"
                style={{ width: 24 }}
              />
              <Text style={{ color: "#fff", flex: 1, marginLeft: 10 }}>
                {current.humidity < 30
                  ? "Low humidity. Consider irrigation."
                  : current.humidity > 80
                    ? "High humidity. Watch for fungal diseases."
                    : "Optimal humidity for most crops."}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <FontAwesome5
                name="wind"
                size={16}
                color="#fff"
                style={{ width: 24 }}
              />
              <Text style={{ color: "#fff", flex: 1, marginLeft: 10 }}>
                {current.wind > 30
                  ? "Strong winds. Protect young plants."
                  : current.wind > 15
                    ? "Good for pollination."
                    : "Light winds. Ideal for spraying."}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="sunny"
                size={18}
                color="#fff"
                style={{ width: 24 }}
              />
              <Text style={{ color: "#fff", flex: 1, marginLeft: 10 }}>
                {current.uvIndex > 7
                  ? "High UV. Protect crops with shade nets."
                  : "Normal UV levels. Good for photosynthesis."}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
};

export default WeatherScreen;