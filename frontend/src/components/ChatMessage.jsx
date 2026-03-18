import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ChatMessage = ({ message }) => {
    return (
        <View style={[
            styles.msgBubble,
            message.isUser ? styles.msgUser : styles.msgAI
        ]}>
            <Text style={[
                styles.msgText,
                message.isUser ? styles.msgTextUser : styles.msgTextAI
            ]}>{message.text}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    msgBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 15,
        marginVertical: 5,
    },
    msgUser: {
        backgroundColor: '#2E7D32',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 5,
    },
    msgAI: {
        backgroundColor: '#E8F5E9',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 5,
        borderWidth: 1,
        borderColor: '#2E7D32',
    },
    msgText: {
        fontSize: 16,
        lineHeight: 22,
    },
    msgTextUser: {
        color: '#FFFFFF',
    },
    msgTextAI: {
        color: '#1B5E20',
    },
});

export default ChatMessage;