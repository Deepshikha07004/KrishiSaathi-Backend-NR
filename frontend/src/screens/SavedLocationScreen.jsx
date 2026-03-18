import React, { useState, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, StyleSheet, ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { useFocusEffect } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import AsyncStorage from "@react-native-async-storage/async-storage";

const SavedLocationScreen = ({ navigation }) => {

  // BUG FIX: was `setActiveLocation` — doesn't exist in AppContext
  // FIXED:   use `setLocation` which is what AppContext actually exports
  const { setLocation, t, lang } = useContext(AppContext);

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerSpeaking, setIsSpeakerSpeaking] = useState(false);

  const BACKEND_API_URL = "http://192.168.29.33:3000/api/location";


  // =========================
  // SPEECH
  // =========================

  const speak = (msg) => {
    if (isMuted) return;
    Speech.stop();
    setIsSpeakerSpeaking(true);
    Speech.speak(msg, {
      rate: 1,
      pitch: 1,
      language: lang === "hi" ? "hi-IN" : lang === "bn" ? "bn-IN" : "en-US",
      onDone: () => setIsSpeakerSpeaking(false),
      onError: () => setIsSpeakerSpeaking(false)
    });
  };

  const toggleMute = () => {
    if (!isMuted) {
      Speech.stop();
      setIsSpeakerSpeaking(false);
    }
    setIsMuted(!isMuted);
  };


  // =========================
  // LOAD LOCATIONS
  // =========================

  const loadSavedLocations = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        navigation.replace("Login");
        return;
      }

      const response = await fetch(BACKEND_API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const data = await response.json();

      // BUG FIX: backend returns `name` not `locationName` — normalize both
      // Also backend now returns `isActive` (after location_service.js fix)
      const normalized = data.map(loc => ({
        ...loc,
        locationName: loc.locationName || loc.name || "My Farm",
        latitude: loc.latitude ?? loc.coordinates?.latitude,
        longitude: loc.longitude ?? loc.coordinates?.longitude,
      }));

      setLocations(normalized);

      // Speak welcome if locations exist
      if (normalized.length > 0) {
        speak(t.selectFarm || "Select a farm to continue");
      }

    } catch (error) {
      console.log("Error loading locations:", error);
    } finally {
      setLoading(false);
    }
  };


  useFocusEffect(
    React.useCallback(() => {
      loadSavedLocations();
      return () => {
        Speech.stop();
        setIsSpeakerSpeaking(false);
      };
    }, [])
  );


  // =========================
  // ACTIVATE LOCATION
  // =========================

  const selectLocation = async (location) => {
    try {
      Speech.stop();
      setIsSpeakerSpeaking(false);
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        `${BACKEND_API_URL}/${location.id}/activate`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to activate location");
      }

      // BUG FIX: was `setActiveLocation` — use `setLocation` instead
      setLocation({
        ...location,
        latitude: location.latitude ?? location.coordinates?.latitude,
        longitude: location.longitude ?? location.coordinates?.longitude,
      });

      navigation.replace("Home");

    } catch (error) {
      console.log("Error activating location:", error);
      Alert.alert(
        t.error || "Error",
        t.failedToSelect || "Failed to select location"
      );
      setLoading(false);
    }
  };


  // =========================
  // ADD NEW LOCATION
  // =========================

  const addNewLocation = () => {
    Speech.stop();
    setIsSpeakerSpeaking(false);
    navigation.navigate('Location', { isAddingNewLocation: true });
  };


  // =========================
  // FORMAT ADDRESS
  // =========================

  const formatAddress = (location) => {
    if (location.address) return location.address;
    const lat = location.latitude ?? location.coordinates?.latitude;
    const lon = location.longitude ?? location.coordinates?.longitude;
    return `${lat?.toFixed(4) ?? ''}, ${lon?.toFixed(4) ?? ''}`;
  };


  // =========================
  // RENDER LOCATION ITEM
  // =========================

  const renderLocationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.locationCard}
      onPress={() => selectLocation(item)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={item.isActive ? ['#2E7D32', '#1B5E20'] : ['#fff', '#f9f9f9']}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>

          <View style={[styles.iconContainer, item.isActive && styles.activeIconContainer]}>
            <Ionicons
              name={item.isActive ? "home" : "location"}
              size={24}
              color={item.isActive ? "#fff" : "#2E7D32"}
            />
          </View>

          <View style={styles.locationInfo}>
            <Text style={[styles.locationName, item.isActive && styles.activeLocationName]}>
              {item.locationName}
            </Text>
            <Text
              style={[styles.locationAddress, item.isActive && styles.activeLocationAddress]}
              numberOfLines={2}
            >
              {formatAddress(item)}
            </Text>
            {item.isActive && (
              <View style={styles.activeIndicator}>
                <View style={styles.activeDot} />
                <Text style={styles.activeIndicatorText}>
                  {t.currentlyActive || 'Currently Active'}
                </Text>
              </View>
            )}
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={item.isActive ? "#fff" : "#999"}
          />

        </View>
      </LinearGradient>
    </TouchableOpacity>
  );


  // =========================
  // LOADING SCREEN
  // =========================

  if (loading) {
    return (
      <ImageBackground
        source={require("../assets/locationbg.jpg")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.centered}>
          <LinearGradient
            colors={["#2E7D32", "#1B5E20"]}
            style={styles.loadingIcon}
          >
            <Ionicons name="location" size={40} color="#fff" />
          </LinearGradient>
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>
            {t.loadingFarms || 'Loading your farms...'}
          </Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }


  // =========================
  // MAIN UI
  // =========================

  return (
    <ImageBackground
      source={require("../assets/locationbg.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      {/* Background overlay */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(210, 243, 144, 0.4)'
      }} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={["#2E7D32", "#1B5E20"]}
              style={styles.headerIcon}
            >
              <Ionicons name="location" size={30} color="#fff" />
            </LinearGradient>
            <Text style={styles.headerTitle}>
              {t.yourFarms || 'Your Farms'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {t.selectFarm || 'Select a farm to continue'}
            </Text>
          </View>

          {/* Location List or Empty State */}
          {locations.length > 0 ? (
            <FlatList
              data={locations}
              renderItem={renderLocationItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text style={styles.listHeader}>
                  {t.savedFarms || 'Saved Farms'}
                </Text>
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={["#2E7D32", "#1B5E20"]}
                style={styles.emptyIcon}
              >
                <Ionicons name="location-outline" size={50} color="#fff" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>
                {t.noFarmsYet || 'No Farms Yet'}
              </Text>
              <Text style={styles.emptyText}>
                {t.addFirstFarm || 'Add your first farm to get started.'}
              </Text>
            </View>
          )}

          {/* Add New Farm Button */}
          <TouchableOpacity
            onPress={addNewLocation}
            activeOpacity={0.8}
            style={styles.addButtonContainer}
          >
            <LinearGradient
              colors={["#2E7D32", "#1B5E20"]}
              style={styles.addButton}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.addButtonText}>
                {t.addNewFarm || 'Add New Farm'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </SafeAreaView>

      {/* Speaker Button */}
      <View style={styles.speakerFixedContainer}>
        <TouchableOpacity
          style={[styles.speakerButton, isMuted ? styles.mutedButton : styles.activeButton]}
          onPress={toggleMute}
        >
          <Ionicons
            name={isMuted ? "volume-mute" : "volume-high"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
        {isSpeakerSpeaking && !isMuted && (
          <View style={styles.waveContainer}>
            <View style={styles.wave1} />
            <View style={styles.wave2} />
            <View style={styles.wave3} />
          </View>
        )}
      </View>

    </ImageBackground>
  );
};


// =========================
// STYLES — was MISSING entirely, causing the crash
// =========================

const styles = StyleSheet.create({

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingIcon: {
    padding: 20,
    borderRadius: 50,
    elevation: 8,
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  headerContainer: {
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 15,
  },

  headerIcon: {
    padding: 15,
    borderRadius: 50,
    marginBottom: 12,
    elevation: 8,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 5,
  },

  headerSubtitle: {
    fontSize: 15,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '500',
  },

  listContainer: {
    paddingBottom: 20,
  },

  listHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  locationCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  cardGradient: {
    padding: 16,
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  activeIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  locationInfo: {
    flex: 1,
  },

  locationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 3,
  },

  activeLocationName: {
    color: '#fff',
  },

  locationAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  activeLocationAddress: {
    color: 'rgba(255,255,255,0.85)',
  },

  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A5D6A7',
    marginRight: 6,
  },

  activeIndicatorText: {
    fontSize: 12,
    color: '#A5D6A7',
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyIcon: {
    padding: 25,
    borderRadius: 50,
    marginBottom: 20,
    elevation: 6,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 22,
  },

  addButtonContainer: {
    marginTop: 15,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },

  addButton: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    marginLeft: 10,
    letterSpacing: 0.3,
  },

  speakerFixedContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 10,
  },

  speakerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  activeButton: {
    backgroundColor: '#2E7D32',
  },

  mutedButton: {
    backgroundColor: '#D32F2F',
  },

  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },

  wave1: {
    width: 4, height: 12,
    backgroundColor: '#2E7D32',
    marginHorizontal: 2,
    borderRadius: 2,
    opacity: 0.7,
  },

  wave2: {
    width: 4, height: 20,
    backgroundColor: '#2E7D32',
    marginHorizontal: 2,
    borderRadius: 2,
    opacity: 1,
  },

  wave3: {
    width: 4, height: 12,
    backgroundColor: '#2E7D32',
    marginHorizontal: 2,
    borderRadius: 2,
    opacity: 0.7,
  },

});

export default SavedLocationScreen;