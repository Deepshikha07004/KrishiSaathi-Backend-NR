import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Modal,
    ImageBackground,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Alert,
    Dimensions,
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { AppContext } from '../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api/apiClient';
import ChatMessage from './ChatMessage';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const FloatingChatbot = () => {
    const navigation = useNavigation();
    const { 
        lang, 
        t, 
        isChatVisible, 
        setChatVisible, 
        chatType, 
        pinnedMessage, 
        setPinnedMessage,
        chatBackground,
        location,
        weatherData,
        user
    } = useContext(AppContext);
    
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Voice recording states
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    
    // Animation for recording wave
    const waveAnim = useRef(new Animated.Value(1)).current;
    const recordingTimer = useRef(null);
    
    // Scroll view reference
    const scrollViewRef = useRef(null);


    // Wave animation for recording
    useEffect(() => {
        let animationLoop;
        if (isRecording) {
            animationLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(waveAnim, {
                        toValue: 1.3,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(waveAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            );
            animationLoop.start();
        } else {
            waveAnim.setValue(1);
            if (animationLoop) {
                animationLoop.stop();
            }
        }
        return () => {
            if (animationLoop) {
                animationLoop.stop();
            }
        };
    }, [isRecording]);

    // Recording duration timer
    useEffect(() => {
        if (isRecording) {
            recordingTimer.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (recordingTimer.current) {
                clearInterval(recordingTimer.current);
                setRecordingDuration(0);
            }
        }
        return () => {
            if (recordingTimer.current) {
                clearInterval(recordingTimer.current);
            }
        };
    }, [isRecording]);

    // Generate or get session ID
    useEffect(() => {
        const userId = user?.id || `guest_${Date.now()}`;
        setSessionId(userId);
    }, [user]);

    // When farm switches, clear messages so stale chat doesn't show
    useEffect(() => {
        if (location?.id) {
            setMessages([]);
            setPinnedMessage(null);
        }
    }, [location?.id]);

    // Load chat messages when chat opens
    useEffect(() => {
        const loadChatMessages = async () => {
            if (isChatVisible && sessionId) {
                setIsLoadingHistory(true);
                try {
                    // Restore pinned message for this farm from AsyncStorage
                    // Always restore from storage — it has the full data, memory may be stale
                    let activePinnedMessage = pinnedMessage;
                    if (location?.id) {
                        const savedPin = await AsyncStorage.getItem(`pinnedMessage_${location.id}`);
                        if (savedPin) {
                            // Always prefer stored version — it has complete data
                            activePinnedMessage = savedPin;
                            if (savedPin !== pinnedMessage) {
                                setPinnedMessage(savedPin);
                            }
                        }
                    }

                    const locationId = location?.id || '';
                    const data = await apiRequest(`/api/chat/history?locationId=${locationId}`, 'GET');

                    // Backend returns: { success: true, data: [{ id, messageText, isFarmerMessage, timestamp }] }
                    if (data?.data && data.data.length > 0) {
                        const formattedMessages = data.data.map(msg => ({
                            id: msg.id || Date.now() + Math.random(),
                            text: msg.messageText,
                            isUser: msg.isFarmerMessage,
                            timestamp: msg.timestamp
                        }));
                        setMessages(formattedMessages);
                    } else {
                        // No history yet — show greeting based on whether crop pin exists
                        if (activePinnedMessage) {
                            // Crop context exists — parse crop name from pin and ask relevant question
                            const cropLine = activePinnedMessage.split('\n').find(l => l.includes('Crop:'));
                            const cropName = cropLine ? cropLine.replace(/.*Crop:\s*/, '').trim() : 'your crop';

                            const greeting = `Your ${cropName} details are saved. Ask me anything — watering, fertilizer, pest control, or anything else about your crop.`;

                            setMessages([{
                                id: Date.now(),
                                text: greeting,
                                isUser: false
                            }]);

                            // Persist pin for this farm
                            if (location?.id && activePinnedMessage) {
                                await AsyncStorage.setItem(`pinnedMessage_${location.id}`, activePinnedMessage);
                            }
                        } else {
                            // No crop context — general welcome
                            setMessages([{
                                id: Date.now(),
                                text: "👋 Hi! I'm your AI Farming Assistant. How can I help you today?",
                                isUser: false
                            }]);
                        }
                    }
                } catch (error) {
                    console.error('Error loading chat messages:', error);
                    setMessages([{
                        id: Date.now(),
                        text: "👋 Hi! I'm your AI Farming Assistant. How can I help you today?",
                        isUser: false
                    }]);
                } finally {
                    setIsLoadingHistory(false);
                }
            }
        };

        loadChatMessages();
    }, [isChatVisible, sessionId, chatType, location?.id]);

    // Save message to backend
    const getAIResponse = async (userMessage) => {
        try {
            const data = await apiRequest('/api/chat/advisory', 'POST', {
                message: userMessage,
                context: pinnedMessage || '',
                language: lang,
            });

            return data.reply || "I'm sorry, I couldn't process that request. Please try again.";
        } catch (error) {
            console.error('AI Response Error:', error);
            return null;
        }
    };

    const handleSend = async () => {
        if (!input.trim()) {
            Alert.alert('Message Required', 'Please type a message to send.');
            return;
        }
        
        const userMsg = { id: Date.now(), text: input, isUser: true };
        setMessages(prev => [...prev, userMsg]);
        
        
        setInput('');
        setIsTyping(true);

        try {
            const aiResponse = await getAIResponse(input);
            
            if (aiResponse) {
                const aiMsg = { 
                    id: Date.now() + 1, 
                    text: aiResponse, 
                    isUser: false 
                };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                Alert.alert(
                    'Unable to Connect',
                    'Please check your internet connection and try again.',
                    [{ text: 'OK' }]
                );
                setMessages(prev => prev.filter(msg => msg.id !== userMsg.id));
            }
        } catch (error) {
            Alert.alert(
                'Something Went Wrong',
                'Please try again in a moment.',
                [{ text: 'OK' }]
            );
            setMessages(prev => prev.filter(msg => msg.id !== userMsg.id));
        } finally {
            setIsTyping(false);
        }
    };

    // Function to send audio to backend for speech-to-text
    const transcribeAudio = async (audioUri) => {
        const formData = new FormData();
        formData.append('audio', {
            uri: audioUri,
            type: 'audio/m4a',
            name: 'recording.m4a'
        });
        formData.append('sessionId', sessionId);
        formData.append('language', lang);

        const response = await fetch(`${API_BASE_URL}/speech-to-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to transcribe audio');
        }

        const data = await response.json();
        return data.text;
    };

    // WhatsApp-style voice recording functions
    const handleStartRecording = async () => {
        try {
            // Request permission if not granted
            if (permissionResponse?.status !== 'granted') {
                const { status } = await Audio.requestPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Permission Required',
                        'Microphone permission is needed to record voice messages.',
                        [{ text: 'OK' }]
                    );
                    return;
                }
            }

            // Configure audio mode for recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });

            // Start recording with high quality
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            
            setRecording(recording);
            setIsRecording(true);
            
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const handleStopRecording = async () => {
        if (!recording) return;

        setIsRecording(false);
        
        try {
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            });

            const uri = recording.getURI();
            
            // Show processing indicator
            setIsTyping(true);
            
            // Send audio to backend for transcription
            const transcribedText = await transcribeAudio(uri);
            
            // Create a message from the transcribed text
            const userMsg = { 
                id: Date.now(), 
                text: transcribedText, 
                isUser: true 
            };
            
            // Add the message to chat
            setMessages(prev => [...prev, userMsg]);
            
            // Get AI response
            const aiResponse = await getAIResponse(transcribedText);
            
            if (aiResponse) {
                const aiMsg = { 
                    id: Date.now() + 1, 
                    text: aiResponse, 
                    isUser: false 
                };
                setMessages(prev => [...prev, aiMsg]);
            }
            
            setIsTyping(false);

        } catch (error) {
            console.error('Failed to process recording:', error);
            Alert.alert('Error', 'Failed to process voice recording. Please try again.');
            setIsTyping(false);
        } finally {
            setRecording(null);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <Modal visible={isChatVisible} animationType="slide" transparent={false}>
            <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
            <ImageBackground
                source={chatBackground || require('../assets/truck.jpg')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.container}>
                        {/* Header - Removed menu button */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <Ionicons name="leaf" size={28} color="#fff" />
                                <Text style={styles.headerText}>Ask your question</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => {
                                    setChatVisible(false);
                                    // If chatbot was opened from the CropAdvisory wizard,
                                    // go straight to Home — avoids the farmer having to
                                    // press back through CropAdvisory → CropRec → Home.
                                    if (chatType === 'Advisory') {
                                        navigation.reset({
                                            index: 0,
                                            routes: [{ name: 'Home' }],
                                        });
                                    }
                                }}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Chat Body */}
                        <ScrollView 
                            ref={scrollViewRef}
                            style={styles.chatBody} 
                            contentContainerStyle={styles.chatContent}
                            showsVerticalScrollIndicator={false}
                            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        >
                            {isLoadingHistory ? (
                                <View style={styles.loadingHistory}>
                                    <ActivityIndicator size="small" color="#2E7D32" />
                                    <Text style={styles.loadingText}>Loading conversation...</Text>
                                </View>
                            ) : (
                                <>
                                    {pinnedMessage && (
                                        <View style={styles.pinnedBox}>
                                            <View style={styles.pinnedHeader}>
                                                <Ionicons name="pin" size={16} color="#2E7D32" />
                                                <Text style={styles.pinnedTitle}>Crop Details</Text>
                                            </View>
                                            <Text style={styles.pinnedText}>{pinnedMessage}</Text>
                                        </View>
                                    )}
                                    
                                    {messages.map(m => (
                                        <ChatMessage key={m.id} message={m} />
                                    ))}
                                    
                                    {isTyping && (
                                        <View style={styles.typingIndicator}>
                                            <ActivityIndicator size="small" color="#2E7D32" />
                                            <Text style={styles.typingText}>AI is thinking...</Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </ScrollView>

                        {/* Recording Indicator */}
                        {isRecording && (
                            <Animated.View style={[styles.recordingIndicator, { transform: [{ scale: waveAnim }] }]}>
                                <Ionicons name="mic" size={24} color="#fff" />
                                <Text style={styles.recordingText}>{formatDuration(recordingDuration)}</Text>
                                <View style={styles.recordingWave}>
                                    <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim }] }]} />
                                    <Animated.View style={[styles.waveBar, { transform: [{ scaleY: Animated.multiply(waveAnim, 1.2) }] }]} />
                                    <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim }] }]} />
                                </View>
                                <Text style={styles.cancelHint}>Release to send</Text>
                            </Animated.View>
                        )}

                        {/* Input Area - Both buttons always visible */}
                        <View style={styles.inputArea}>
                            <TextInput
                                style={styles.input}
                                placeholder="Type your question..."
                                placeholderTextColor="#999"
                                value={input}
                                onChangeText={setInput}
                                multiline
                                editable={!isLoadingHistory && !isTyping && !isRecording}
                            />
                            
                            {/* Send Button - Always enabled */}
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.sendButton]} 
                                onPress={handleSend}
                                disabled={isTyping || isRecording}
                            >
                                <Ionicons name="send" size={22} color="#fff" />
                            </TouchableOpacity>
                            
                            {/* Mic Button - Original color */}
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.micButton]}
                                onPressIn={handleStartRecording}
                                onPressOut={handleStopRecording}
                                delayLongPress={100}
                                disabled={isTyping}
                            >
                                <Ionicons 
                                    name="mic" 
                                    size={22} 
                                    color="#fff" 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </ImageBackground>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    safeArea: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    container: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
    },
    header: {
        backgroundColor: '#2E7D32',
        paddingVertical: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    closeButton: {
        padding: 5,
    },
    chatBody: {
        flex: 1,
    },
    chatContent: {
        paddingVertical: 20,
        paddingHorizontal: 15,
    },
    loadingHistory: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
    pinnedBox: {
        backgroundColor: '#FFF9E6',
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#FF8F00',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    pinnedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    pinnedTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginLeft: 5,
        flex: 1,
    },
    pinnedText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginLeft: 10,
        marginVertical: 10,
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2E7D32',
    },
    typingText: {
        marginLeft: 8,
        color: '#1B5E20',
        fontSize: 14,
        fontStyle: 'italic',
    },
    inputArea: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 25,
        paddingHorizontal: 18,
        paddingVertical: 10,
        marginRight: 10,
        maxHeight: 100,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    actionButton: {
        width: 45,
        height: 45,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 5,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    sendButton: {
        backgroundColor: '#2E7D32',
    },
    micButton: {
        backgroundColor: '#FF8F00',
    },
    recordingIndicator: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        backgroundColor: '#D32F2F',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 1000,
    },
    recordingText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
        marginRight: 12,
    },
    recordingWave: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    waveBar: {
        width: 4,
        height: 20,
        backgroundColor: '#fff',
        marginHorizontal: 2,
        borderRadius: 2,
    },
    cancelHint: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
    },
});

export default FloatingChatbot;