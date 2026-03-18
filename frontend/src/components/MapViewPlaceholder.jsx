import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MapViewPlaceholder = ({ style, children }) => (
    <View style={[style, { backgroundColor: '#C8E6C9', justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="map" size={40} color="#2E7D32" />
        <Text style={{ color: '#2E7D32', fontWeight: 'bold' }}>Map View</Text>
        {children}
    </View>
);

export default MapViewPlaceholder;
