import React, { useState, useEffect, useContext } from 'react';
import {
    Text,
    TouchableOpacity,
    ScrollView,
    View,
    Linking,
    ImageBackground,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import StorageCard from '../components/StorageCard';

const { width, height } = Dimensions.get('window');

const StorageScreen = () => {
    const { t, location, userLocation, lang } = useContext(AppContext);
    const [storages, setStorages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // API Base URL - Replace with your actual backend URL
    const API_BASE_URL = 'https://your-backend-api.com/api';

    const fetchStorages = async (pageNum = 1, refresh = false) => {
        if (refresh) {
            setLoading(true);
            setPage(1);
        } else if (pageNum > 1) {
            setLoadingMore(true);
        }

        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/storages/nearby`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    latitude: userLocation?.latitude || location?.latitude || 28.6139,
                    longitude: userLocation?.longitude || location?.longitude || 77.2090,
                    district: location?.district || null,
                    language: lang || 'en',
                    page: pageNum,
                    limit: 10
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch storages');
            }

            const data = await response.json();
            
            if (refresh) {
                setStorages(data.storages || []);
            } else {
                setStorages(prev => [...prev, ...(data.storages || [])]);
            }
            
            setHasMore(data.hasMore || false);
            
        } catch (error) {
            console.error('Error fetching storages:', error);
            setError('Unable to load storage facilities');
            Alert.alert(
                'Connection Error',
                'Please check your internet connection and try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchStorages(1, true);
    }, [location, lang]);

    // Load more when page changes
    useEffect(() => {
        if (page > 1 && hasMore) {
            fetchStorages(page);
        }
    }, [page]);

    const onRefresh = () => {
        setRefreshing(true);
        setStorages([]);
        setPage(1);
        fetchStorages(1, true);
    };

    const loadMore = () => {
        if (hasMore && !loadingMore) {
            setPage(prev => prev + 1);
        }
    };

    const handleCall = (phone) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        } else {
            Alert.alert('No Phone Number', 'Phone number not available for this facility.');
        }
    };

    const handleNavigate = (latitude, longitude, name) => {
        if (latitude && longitude) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
            Linking.openURL(url);
        } else {
            Alert.alert('Location Unavailable', 'Map location not available for this facility.');
        }
    };

    const handleShare = async (item) => {
        try {
            // Using Share API instead of Sharing
            const message = `${item.name}\n\n📍 Address: ${item.address}\n📞 Phone: ${item.phone}\n💾 Capacity: ${item.capacity}\n💰 Price: ${item.price}\n⭐ Rating: ${item.rating}/5`;
            
            if (navigator.share) {
                await navigator.share({
                    title: item.name,
                    message: message,
                });
            } else {
                Alert.alert('Share', message);
            }
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    const renderLocationHeader = () => {
        const count = storages.length;
        
        if (!location && !userLocation) {
            return (
                <View style={styles.locationHeader}>
                    <Ionicons name="location-outline" size={20} color="#1976D2" />
                    <Text style={styles.locationText}>Using default location</Text>
                </View>
            );
        }

        return (
            <View style={styles.locationHeader}>
                <Ionicons name="location" size={20} color="#1976D2" />
                <Text style={styles.locationText}>
                    {count} storage facilities near {location?.district || location?.place_name || location?.city || "your area"}
                </Text>
            </View>
        );
    };

    return (
        <ImageBackground
            source={require('../assets/storagebg.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <ScrollView 
                    style={styles.container}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh}
                            colors={["#2E7D32"]}
                            tintColor="#2E7D32"
                        />
                    }
                    onMomentumScrollEnd={loadMore}
                >
                    {renderLocationHeader()}

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#2E7D32" />
                            <Text style={styles.loadingText}>Finding storage facilities near you...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="cloud-offline-outline" size={70} color="#f44336" />
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity 
                                style={styles.retryButton}
                                onPress={onRefresh}
                            >
                                <Ionicons name="refresh" size={20} color="#fff" />
                                <Text style={styles.retryButtonText}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    ) : storages.length > 0 ? (
                        <>
                            <View style={styles.headerContainer}>
                                <Text style={styles.sectionTitle}>
                                    {t.storage || "Storage Facilities"}
                                </Text>
                                <View style={styles.countBadge}>
                                    <Text style={styles.countText}>
                                        {storages.length} found
                                    </Text>
                                </View>
                            </View>
                            
                            {storages.map((item, index) => (
                                <StorageCard 
                                    key={item.id || index.toString()}
                                    item={item}
                                    t={t}
                                    onCall={() => handleCall(item.phone)}
                                    onNavigate={() => handleNavigate(item.latitude, item.longitude, item.name)}
                                    onShare={() => handleShare(item)}
                                />
                            ))}
                            
                            {loadingMore && (
                                <View style={styles.loadingMoreContainer}>
                                    <ActivityIndicator size="small" color="#2E7D32" />
                                    <Text style={styles.loadingMoreText}>Loading more facilities...</Text>
                                </View>
                            )}
                            
                            {hasMore && !loadingMore && storages.length >= 10 && (
                                <TouchableOpacity 
                                    style={styles.loadMoreButton}
                                    onPress={loadMore}
                                >
                                    <Text style={styles.loadMoreText}>Load More Facilities</Text>
                                    <Ionicons name="arrow-down" size={18} color="#2E7D32" />
                                </TouchableOpacity>
                            )}
                            
                            <View style={styles.bottomPadding} />
                        </>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cube-outline" size={80} color="#999" />
                            <Text style={styles.emptyText}>No storage facilities found</Text>
                            <Text style={styles.emptySubText}>Try searching in a different area</Text>
                            <TouchableOpacity 
                                style={styles.refreshButton}
                                onPress={onRefresh}
                            >
                                <Ionicons name="refresh" size={18} color="#2E7D32" />
                                <Text style={styles.refreshButtonText}>Refresh</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(6, 11, 0, 0.5)',
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 30,
    },
    locationHeader: {
        backgroundColor: 'rgba(227, 242, 253, 0.9)',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1976D2',
    },
    locationText: {
        color: '#1976D2',
        fontWeight: '600',
        marginLeft: 10,
        fontSize: 14,
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    countBadge: {
        backgroundColor: '#2E7D32',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    countText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#2E7D32',
        fontWeight: '500',
    },
    loadingMoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
    },
    loadingMoreText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#666',
    },
    errorContainer: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
    },
    errorText: {
        fontSize: 18,
        color: '#f44336',
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 20,
        fontWeight: '600',
    },
    retryButton: {
        backgroundColor: '#2E7D32',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    emptyContainer: {
        padding: 50,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        marginTop: 15,
        fontWeight: '600',
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 20,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2E7D32',
    },
    refreshButtonText: {
        color: '#2E7D32',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
    loadMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        borderRadius: 10,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#2E7D32',
        borderStyle: 'dashed',
    },
    loadMoreText: {
        color: '#2E7D32',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    bottomPadding: {
        height: 20,
    },
});

export default StorageScreen;