import { useState, useEffect, useRef, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { AppContext } from '../context/AppContext';
import translations from '../translations/translations';

export const useLanguage = () => {
    const { setLang } = useContext(AppContext);
    const [selected, setSelected] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const mountedRef = useRef(true);
    const isAnnouncementRunningRef = useRef(true);

    const t = translations;

    const languages = [
        { code: 'en', key: '1', name: 'English', voiceText: 'Press 1 for English', selectedMessage: 'English selected!', continueButtonText: 'Continue' },
        { code: 'hi', key: '2', name: 'हिन्दी', voiceText: 'हिंदी के लिए 2 दबाएँ', selectedMessage: 'हिंदी चुनी गई!', continueButtonText: 'जारी रखें' },
        { code: 'bn', key: '3', name: 'বাংলা', voiceText: 'বাংলার জন্য ৩ চাপুন', selectedMessage: 'বাংলা নির্বাচন করা হয়েছে!', continueButtonText: 'চালিয়ে যান' },
    ];

    useEffect(() => {
        mountedRef.current = true;
        playFullSequence();
        return () => {
            mountedRef.current = false;
            isAnnouncementRunningRef.current = false;
            Speech.stop();
        };
    }, []);

    const playFullSequence = () => {
        handleStopAudio(); // Stops any current speech first
        
        setTimeout(() => {
            if (!mountedRef.current) return;
            setIsSpeaking(true);
            isAnnouncementRunningRef.current = true;
            
            const options = { rate: 1.05, pitch: 1.3, volume: 1.1 };
            const sequence = [
                { text: t.en.voiceWelcome, lang: 'en' },
                { text: t.hi.voiceWelcome, lang: 'hi' },
                { text: t.bn.voiceWelcome, lang: 'bn' },
                { text: t.en.voiceInstrEn, lang: 'en' },
                { text: t.hi.voiceInstrHi, lang: 'hi' },
                { text: t.bn.voiceInstrBn, lang: 'bn' }
            ];

            let currentIndex = 0;
            const speakNext = () => {
                if (!mountedRef.current || !isAnnouncementRunningRef.current || currentIndex >= sequence.length) {
                    setIsSpeaking(false);
                    return;
                }

                Speech.speak(sequence[currentIndex].text, {
                    ...options,
                    language: sequence[currentIndex].lang,
                    onDone: () => { currentIndex++; speakNext(); },
                    onError: () => setIsSpeaking(false)
                });
            };
            speakNext();
        }, 100); 
    };

    const handleStopAudio = () => {
        isAnnouncementRunningRef.current = false;
        Speech.stop();
        setIsSpeaking(false);
    };

    const select = (code) => {
        handleStopAudio();
        setSelected(code);
        setLang(code);
        AsyncStorage.setItem('lang', code);
        Speech.speak(translations[code].voiceConfirm, { rate: 1.05, pitch: 1.3, language: code });
    };

    const handleTextEntry = (val) => {
        const langObj = languages.find(l => l.key === val);
        if (langObj) select(langObj.code);
    };

    return {
        selected,
        select,
        handleTextEntry,
        handleStopAudio,
        playFullSequence,
        languages,
        isSpeaking,
        isAnnouncementRunningRef
    };
};