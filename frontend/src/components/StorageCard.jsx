import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/globalStyles';

const StorageCard = ({ item, t }) => (
    <View style={styles.storageCard}>
        <View style={styles.storageRow}>
            <Text style={styles.storageName}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'Full' ? '#FFCDD2' : (item.status === 'Available' ? '#C8E6C9' : '#FFE0B2') }]}>
                <Text style={{ color: item.status === 'Full' ? '#B71C1C' : (item.status === 'Available' ? '#2E7D32' : '#E65100') }}>{t[`status${item.status.replace(' ', '')}`]}</Text>
            </View>
        </View>
        <Text style={styles.storageAddr}>{item.address}</Text>
        <Text>{t.distance}: {item.distance}</Text>
        <Text>{t.capacity}: {item.capacity}</Text>
        <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.callText}>{t.call}</Text>
        </TouchableOpacity>
    </View>
);

export default StorageCard;
