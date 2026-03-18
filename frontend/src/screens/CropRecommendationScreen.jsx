import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ImageBackground,
    ActivityIndicator,
    Alert,
    StyleSheet,
    Dimensions,
    // ✅ FIX 1: Removed `isChatVisible` from here — it does not exist in react-native.
    //           It was causing a silent undefined import which broke the useEffect
    //           that tried to watch it.
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { AppContext } from '../context/AppContext';
import { apiRequest } from '../api/apiClient';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const CropRecommendationScreen = ({ navigation }) => {
    // ✅ FIX 1 (continued): `isChatVisible` now pulled from AppContext where it actually lives.
    const {
        t,
        lang,
        setChatType,
        setChatVisible,
        setPinnedMessage,
        weatherData,
        location,          // use `location` — that's the correct AppContext key (not `userLocation`)
        setChatBackground,
        isChatVisible,     // ← correct source
    } = useContext(AppContext);

    const [step, setStep] = useState(0); // 0=checking, 1=yes/no gate, 2=recommendations, 3=active crop exists
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [activeCrop, setActiveCrop] = useState(null); // existing crop data if any
    const [endingCrop, setEndingCrop] = useState(false); // loading state for end crop

    // Speaker state
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);


    // Stop speech when screen loses focus
    useFocusEffect(
        React.useCallback(() => {
            console.log('CropRec screen focused');
            return () => {
                console.log('CropRec screen unfocused — stopping speech');
                Speech.stop();
                setIsSpeaking(false);
            };
        }, [])
    );

    const speak = (msg) => {
        if (isMuted) return;
        Speech.stop();
        setIsSpeaking(true);
        Speech.speak(msg, {
            rate: 1.0,
            pitch: 1.0,
            language: lang,
            onDone:  () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
        });
    };

    const toggleMute = () => {
        if (!isMuted) {
            Speech.stop();
            setIsSpeaking(false);
        }
        setIsMuted(!isMuted);
    };

    // Stop speech on unmount
    useEffect(() => {
        return () => {
            Speech.stop();
            setIsSpeaking(false);
        };
    }, []);

    // Auto-speak when step changes
    // Update header title based on step
    useEffect(() => {
        if (step === 1) {
            navigation.setOptions({ title: 'My Crop' });
        } else {
            navigation.setOptions({ title: 'Crop Recommendation' });
        }
    }, [step]);

    // Check for active crop on mount
    useEffect(() => {
        const checkActiveCrop = async () => {
            setLoading(true);
            try {
                const data = await apiRequest('/api/crops/active', 'GET');
                if (data?.success && data?.data) {
                    // Active crop exists — show the active crop card
                    setActiveCrop(data.data);
                    setStep(3);
                } else {
                    // No active crop — go to yes/no gate
                    setStep(1);
                }
            } catch (err) {
                // 404 means no active crop — normal flow
                setStep(1);
            } finally {
                setLoading(false);
            }
        };
        checkActiveCrop();
    }, []);

    // Auto-speak when step changes
    useEffect(() => {
        Speech.stop();
        setIsSpeaking(false);
        if (isMuted) return;
        if (step === 1) speak(t.sownAlready);
    }, [step, isMuted]);

    // Stop speech when chatbot opens
    useEffect(() => {
        if (isChatVisible) {
            Speech.stop();
            setIsSpeaking(false);
        }
    }, [isChatVisible]);

    // ─── API call ────────────────────────────────────────────────────────────────
    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);

        try {
            const season = getCurrentSeason();

            const requestData = {
                latitude:  location?.latitude  || null,
                longitude: location?.longitude || null,
                season,
                weather:   weatherData || null,
            };

            const data = await apiRequest('/api/crops/recommendation', 'GET');

            if (data?.mode === 'ACTIVE_CROP_EXISTS') {
                // Farmer already has a growing crop — go straight to advisory
                setChatType('CropAdv');
                navigation.navigate('CropAdv');
                return;
            }

            if (data?.data && Array.isArray(data.data)) {
                // Map CropMaster fields to what the card renderer expects
                const mapped = data.data.map(crop => ({
                    id: crop.id,
                    name: crop.cropNameEn,
                    duration: `${crop.growingDurationDays} days`,
                    waterRequirement: crop.waterRequirement,
                    climate: crop.suitableClimate,
                }));
                setRecommendations(mapped);
                setStep(2);
            } else {
                throw new Error('Invalid data');
            }

        } catch (err) {
            console.error('Crop recommendations error:', err);
            setError('Unable to load recommendations');
            setStep(2);
            Alert.alert('Oops!', 'Something went wrong. Please try again.', [{ text: 'OK' }]);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentSeason = () => {
        if (weatherData?.season) return weatherData.season;
        const month = new Date().getMonth();
        if (month >= 2 && month <= 5) return 'Summer';
        if (month >= 6 && month <= 9) return 'Monsoon';
        return 'Winter';
    };

    // ─── Handlers ────────────────────────────────────────────────────────────────
    const handleSownAlready = (val) => {
        setSelectedOption(val);
        setChatBackground(require('../assets/truck.jpg'));

        if (val === 'yes') {
            setChatType('CropAdv');
            navigation.navigate('CropAdv');
        } else {
            fetchRecommendations();
        }
    };

    const handleCropSelect = async (crop) => {
        try {
            // 1️⃣ Save selected crop as ACTIVE CROP on backend
            await apiRequest('/api/crops/select', 'POST', { cropId: crop.id });
        } catch (error) {
            // If crop already active, still proceed to chat — don't block the farmer
            console.log('Crop select note:', error.message);
        }

        // 2️⃣ Build pinned context for chatbot
        const season = getCurrentSeason();
        const summary =
            `🌾 Crop: ${crop.name}\n` +
            `📅 Season: ${season}\n` +
            `⏱ Grows in: ${crop.duration || 'N/A'}\n` +
            `💧 Water Need: ${crop.waterRequirement || 'N/A'}\n` +
            `🌤 Climate: ${crop.climate || 'N/A'}`;

        // 3️⃣ Open chatbot with crop context pinned
        setPinnedMessage(summary);
        setChatType('Recommendation');
        setChatBackground(require('../assets/truck.jpg'));
        setChatVisible(true);
    };

    const handleRetry = () => {
        fetchRecommendations();
    };

    // Continue chatting with existing active crop
    const handleContinueWithActiveCrop = () => {
        if (!activeCrop) return;

        const summary =
            `🌾 Crop: ${activeCrop.cropName}\n` +
            `📅 Sown On: ${activeCrop.sowingDate ? new Date(activeCrop.sowingDate).toLocaleDateString() : 'N/A'}\n` +
            `⏱ Day ${activeCrop.daysCompleted} of ${activeCrop.growingDuration}\n` +
            `💧 Water Need: ${activeCrop.waterRequirement || 'N/A'}`;

        setPinnedMessage(summary);
        if (location?.id) {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            AsyncStorage.setItem(`pinnedMessage_${location.id}`, summary);
        }
        setChatType('Advisory');
        setChatBackground(require('../assets/truck.jpg'));
        setChatVisible(true);
    };

    // End active crop — farmer wants to start fresh
    const handleEndCrop = () => {
        Alert.alert(
            'Start Fresh?',
            `Your current crop data, progress, and all previous advice will be permanently deleted.\n\nA new crop record will be created.\n\nAre you sure you want to continue?`,
            [
                { text: 'No, Go Back', style: 'cancel' },
                {
                    text: 'Yes, Start Fresh',
                    style: 'destructive',
                    onPress: async () => {
                        setEndingCrop(true);
                        try {
                            await apiRequest('/api/crops/end', 'PATCH');
                            setActiveCrop(null);
                            setStep(1);
                        } catch (err) {
                            Alert.alert('Error', 'Could not end crop. Please try again.');
                        } finally {
                            setEndingCrop(false);
                        }
                    }
                }
            ]
        );
    };

    const handleGoBack = () => {
        setStep(1);
        setRecommendations([]);
        setError(null);
        setSelectedOption(null);
        Speech.stop();
        setIsSpeaking(false);
        // ✅ FIX 2: Removed `setIsPaused(false)` — `isPaused` was never declared
        //           as state in this component, causing a ReferenceError crash
        //           every time the user tapped "Go Back" on the recommendations view.
    };

    const getBackgroundImage = () => {
        return step === 1
            ? require('../assets/homebg.jpg')
            : require('../assets/crop.jpg');
    };

    // ─── Crop card ───────────────────────────────────────────────────────────────
    const renderCropCard = (crop) => {
        const imageSource = crop.imageUrl
            ? { uri: crop.imageUrl }
            : require('../assets/crop.jpg');

        return (
            <TouchableOpacity
                key={crop.id || crop._id}
                style={styles.cropCard}
                onPress={() => handleCropSelect(crop)}
                activeOpacity={0.7}
            >
                <ImageBackground
                    source={imageSource}
                    style={styles.cropImage}
                    imageStyle={{ borderRadius: 10 }}
                >
                    <View style={styles.cropOverlay}>
                        <Text style={styles.cropName}>{crop.name}</Text>
                        <View style={styles.cropDetails}>
                            {crop.confidence      && <Text style={styles.cropInfo}>✓ {crop.confidence}</Text>}
                            {crop.duration        && <Text style={styles.cropInfo}>⏱ {crop.duration}</Text>}
                            {crop.waterRequirement && <Text style={styles.cropInfo}>💧 {crop.waterRequirement}</Text>}
                            {crop.profit          && <Text style={styles.cropInfo}>💰 {crop.profit}</Text>}
                        </View>
                    </View>
                </ImageBackground>
            </TouchableOpacity>
        );
    };

    // ─── Render ──────────────────────────────────────────────────────────────────
    return (
        <ImageBackground
            source={getBackgroundImage()}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <View style={[
                styles.overlay,
                step > 1 && { backgroundColor: 'rgba(255, 255, 255, 0.9)' }
            ]}>
                <View style={styles.container}>

                    {/* ── Step 0: Checking active crop (loading) ── */}
                    {step === 0 ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color="#2E7D32" />
                        </View>

                    ) : step === 3 ? (
                        /* ── Step 3: Active crop exists ── */
                        <View style={styles.centerContainer}>
                            {(() => {
                                const pct = Math.min(100, Math.round(((activeCrop?.daysCompleted || 0) / (activeCrop?.growingDuration || 1)) * 100));
                                let stageEmoji = '';
                                let stageLabel = '';
                                let stageDesc  = '';
                                if (pct <= 10) {
                                    stageEmoji = '🌾'; stageLabel = 'Sowing Stage';
                                    stageDesc  = 'Seeds are newly sown. Ensure proper soil moisture and protection.';
                                } else if (pct <= 25) {
                                    stageEmoji = '🌱'; stageLabel = 'Early Growth Stage';
                                    stageDesc  = 'Crop has started growing. Monitor water and basic nutrients.';
                                } else if (pct <= 40) {
                                    stageEmoji = '🌿'; stageLabel = 'Vegetative Growth Stage';
                                    stageDesc  = 'Plants are developing leaves and height. Regular care is important.';
                                } else if (pct <= 60) {
                                    stageEmoji = '🌳'; stageLabel = 'Strong Growth Stage';
                                    stageDesc  = 'Crop is growing actively. Focus on fertilizer and pest monitoring.';
                                } else if (pct <= 75) {
                                    stageEmoji = '🌼'; stageLabel = 'Flowering Stage';
                                    stageDesc  = 'Crop is entering reproductive phase. Water and disease control are crucial.';
                                } else if (pct <= 90) {
                                    stageEmoji = '🌾'; stageLabel = 'Grain / Fruit Formation Stage';
                                    stageDesc  = 'Yield is developing. Maintain nutrition and protect from weather risks.';
                                } else if (pct < 100) {
                                    stageEmoji = '🌞'; stageLabel = 'Maturity Stage';
                                    stageDesc  = 'Crop is almost ready. Prepare for harvesting activities.';
                                } else {
                                    stageEmoji = '🚜'; stageLabel = 'Ready for Harvest';
                                    stageDesc  = 'Your crop is fully mature. You can begin harvesting.';
                                }
                                return (
                                    <View style={styles.activeCropCard}>

                                        {/* Header */}
                                        <Text style={styles.activeCropTitle}>🌾 Your Crop</Text>

                                        {/* Rows */}
                                        <View style={styles.activeCropRow}>
                                            <Text style={styles.activeCropLabel}>Crop:</Text>
                                            <Text style={styles.activeCropValue}>{activeCrop?.cropName}</Text>
                                        </View>
                                        <View style={styles.activeCropRow}>
                                            <Text style={styles.activeCropLabel}>Farm:</Text>
                                            <Text style={styles.activeCropValue}>{activeCrop?.location}</Text>
                                        </View>
                                        <View style={styles.activeCropRow}>
                                            <Text style={styles.activeCropLabel}>Progress:</Text>
                                            <Text style={styles.activeCropValue}>Day {activeCrop?.daysCompleted} of {activeCrop?.growingDuration}</Text>
                                        </View>
                                        <View style={[styles.activeCropRow, { borderBottomWidth: 0, marginBottom: 14 }]}>
                                            <Text style={styles.activeCropLabel}>Days Left:</Text>
                                            <Text style={styles.activeCropValue}>{activeCrop?.daysRemaining} days</Text>
                                        </View>

                                        {/* Stage pill */}
                                        <View style={styles.stagePill}>
                                            <Text style={styles.stagePillText}>{stageEmoji}  {stageLabel}</Text>
                                        </View>

                                        {/* Progress % label + bar */}
                                        <View style={styles.progressLabelRow}>
                                            <Text style={styles.progressLabelText}>Progress</Text>
                                            <Text style={styles.progressLabelPct}>{pct}%</Text>
                                        </View>
                                        <View style={styles.progressBarBg}>
                                            <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                                        </View>

                                        {/* Stage description */}
                                        <Text style={styles.stageDesc}>{stageDesc}</Text>

                                    </View>
                                );
                            })()}

                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={handleContinueWithActiveCrop}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.btnText}>Continue to Chat</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.primaryBtn, styles.secondaryBtn]}
                                onPress={handleEndCrop}
                                activeOpacity={0.8}
                                disabled={endingCrop}
                            >
                                {endingCrop
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={styles.btnText}>Start a New Crop</Text>
                                }
                            </TouchableOpacity>
                        </View>

                    ) : step === 1 ? (
                    /* ── Step 1: Have you sown? ── */
                    <View style={styles.centerContainer}>
                            <Ionicons name="help-circle-outline" size={90} color="#2E7D32" />
                            <Text style={styles.questionText}>{t.sownAlready}</Text>
                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={() => handleSownAlready('yes')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.btnText}>{t.yes}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.primaryBtn, styles.secondaryBtn]}
                                onPress={() => handleSownAlready('no')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.btnText}>{t.no}</Text>
                            </TouchableOpacity>
                        </View>

                    ) : (null)}

                    {/* ── Step 2: Recommendations ── */}
                    {step === 2 ? (
                        <View style={styles.container}>
                            <ScrollView
                                style={styles.scrollContainer}
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.headerContainer}>
                                    <Text style={styles.sectionTitle}>
                                        Recommended Crops for {getCurrentSeason()} Season
                                    </Text>
                                    <Text style={styles.subtitle}>
                                        Based on your location and weather
                                    </Text>
                                </View>

                                {loading ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#2E7D32" />
                                        <Text style={styles.loadingText}>
                                            Finding best crops for you...
                                        </Text>
                                    </View>

                                ) : error ? (
                                    <View style={styles.errorContainer}>
                                        <Ionicons name="cloud-offline-outline" size={60} color="#666" />
                                        <Text style={styles.errorText}>Unable to load recommendations</Text>
                                        <Text style={styles.errorSubText}>Please check your connection</Text>
                                        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                                            <Text style={styles.retryBtnText}>Try Again</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
                                            <Text style={styles.backBtnText}>Go Back</Text>
                                        </TouchableOpacity>
                                    </View>

                                ) : recommendations.length > 0 ? (
                                    <View style={styles.recommendationsContainer}>
                                        {recommendations.map((crop) => renderCropCard(crop))}
                                    </View>

                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="leaf-outline" size={60} color="#666" />
                                        <Text style={styles.emptyText}>No crops found</Text>
                                        <Text style={styles.emptySubText}>
                                            Try again with a different location
                                        </Text>
                                        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                                            <Text style={styles.retryBtnText}>Refresh</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
                                            <Text style={styles.backBtnText}>Go Back</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <View style={styles.bottomPadding} />
                            </ScrollView>
                        </View>
                    ) : null}

                    {/* ── Speaker button ── */}
                    <View style={styles.speakerFixedContainer}>
                        <TouchableOpacity
                            style={[
                                styles.speakerButton,
                                isMuted ? styles.mutedButton : styles.activeButton,
                            ]}
                            onPress={toggleMute}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={isMuted ? 'volume-mute' : 'volume-high'}
                                size={24}
                                color="#fff"
                            />
                        </TouchableOpacity>

                        {isSpeaking && !isMuted && (
                            <View style={styles.waveContainer}>
                                <View style={styles.wave1} />
                                <View style={styles.wave2} />
                                <View style={styles.wave3} />
                            </View>
                        )}
                    </View>

                    {/* ── Back button (step 2 with results) ── */}
                    {step > 1 && !loading && !error && recommendations.length > 0 && (
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleGoBack}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-back-circle" size={50} color="#2E7D32" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
        padding: 16,
    },
    headerContainer: {
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 15,
        borderRadius: 10,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 100,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    questionText: {
        marginTop: 15,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 30,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    primaryBtn: {
        backgroundColor: '#2E7D32',
        paddingVertical: 15,
        paddingHorizontal: 50,
        borderRadius: 30,
        marginVertical: 8,
        width: '80%',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    secondaryBtn: {
        backgroundColor: '#FF8F00',
    },
    btnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2E7D32',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#2E7D32',
        textAlign: 'center',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
    },
    errorText: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        marginTop: 15,
        fontWeight: '600',
    },
    errorSubText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        marginTop: 5,
    },
    retryBtn: {
        backgroundColor: '#2E7D32',
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        marginBottom: 10,
        width: 200,
    },
    retryBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    backBtn: {
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 25,
        width: 200,
    },
    backBtnText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
    },
    emptyText: {
        fontSize: 18,
        color: '#333',
        marginTop: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 25,
        marginTop: 5,
        textAlign: 'center',
    },
    recommendationsContainer: {
        paddingBottom: 20,
    },
    cropCard: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cropImage: {
        width: '100%',
        height: 200,
    },
    cropOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: 16,
        justifyContent: 'flex-end',
    },
    cropName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    cropDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    cropInfo: {
        fontSize: 12,
        color: '#fff',
        backgroundColor: 'rgba(46, 125, 50, 0.85)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        marginRight: 8,
        marginBottom: 8,
        overflow: 'hidden',
        fontWeight: '500',
    },
    backButton: {
        position: 'absolute',
        bottom: 20,
        left: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        padding: 2,
        zIndex: 999,
    },
    bottomPadding: {
        height: 60,
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
        width: 4,
        height: 12,
        backgroundColor: '#2E7D32',
        marginHorizontal: 2,
        borderRadius: 2,
        opacity: 0.7,
    },
    wave2: {
        width: 4,
        height: 20,
        backgroundColor: '#2E7D32',
        marginHorizontal: 2,
        borderRadius: 2,
        opacity: 1,
    },
    wave3: {
        width: 4,
        height: 12,
        backgroundColor: '#2E7D32',
        marginHorizontal: 2,
        borderRadius: 2,
        opacity: 0.7,
    },
    activeCropCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        borderRadius: 16,
        padding: 20,
        width: '90%',
        marginBottom: 24,
        elevation: 5,
        borderWidth: 1.5,
        borderColor: '#2E7D32',
    },
    activeCropTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E7D32',
        textAlign: 'center',
        marginBottom: 14,
    },
    activeCropRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    activeCropLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        width: 80,
    },
    activeCropValue: {
        fontSize: 14,
        color: '#222',
        flex: 1,
        textAlign: 'right',
    },
    stageBadge: {
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignSelf: 'flex-start',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#A5D6A7',
    },
    stageBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2E7D32',
    },
    progressPct: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    progressBarBg: {
        backgroundColor: '#e0e0e0',
        borderRadius: 10,
        height: 12,
        marginBottom: 10,
        overflow: 'hidden',
    },
    progressBarFill: {
        backgroundColor: '#2E7D32',
        height: 12,
        borderRadius: 10,
    },
    stagePill: {
        backgroundColor: '#E8F5E9',
        borderRadius: 20,
        paddingVertical: 7,
        paddingHorizontal: 14,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#A5D6A7',
        marginBottom: 12,
    },
    stagePillText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2E7D32',
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    progressLabelText: {
        fontSize: 12,
        color: '#888',
    },
    progressLabelPct: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2E7D32',
    },
    stageDesc: {
        fontSize: 13,
        color: '#555',
        fontStyle: 'italic',
        lineHeight: 20,
        marginTop: 2,
    },
    stageBox: {
        backgroundColor: '#F9FBE7',
        borderRadius: 12,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#388E3C',
    },
    stageBoxTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 4,
    },
    stageBoxDesc: {
        fontSize: 13,
        color: '#4E4E4E',
        lineHeight: 19,
        fontStyle: 'italic',
    },
    progressText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 4,
    },
});

export default CropRecommendationScreen;