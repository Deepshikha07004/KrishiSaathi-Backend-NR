/**
 * Translation Service for Krishi Saathi
 * 
 * HOW IT WORKS:
 * 1. First tries your own backend API (if BASE_API_URL is set)
 * 2. Falls back to free Google Translate API if backend is unavailable
 * 
 * TO CONNECT YOUR BACKEND:
 * Replace BASE_API_URL with your server URL, e.g.:
 *   export const BASE_API_URL = "https://your-backend.com/api";
 * 
 * Your backend /translate endpoint should accept:
 *   POST { text: "Hello", targetLang: "hi" }
 * And return:
 *   { translatedText: "नमस्ते" }
 */

// ─── Set your backend base URL here ───────────────────────────────────────────
// Leave as null to always use the free fallback Google Translate API
export const BASE_API_URL = null; // e.g. "http://192.168.1.10:5000/api"
// ──────────────────────────────────────────────────────────────────────────────

// In-memory cache to avoid re-translating the same text
const translationCache = {};

/**
 * Translates text using the backend API, with fallback to Google Translate.
 * @param {string} text - Text to translate (assumed to be in English)
 * @param {string} targetLang - Target language code: "hi" | "bn"
 * @returns {Promise<string>} - Translated text, or original text on failure
 */
export const translateText = async (text, targetLang) => {
    if (!text || !text.trim()) return text;
    if (targetLang === "en") return text;

    // Skip translation for pure numbers
    if (/^[\d\s.,+-]+$/.test(text)) return text;

    const cacheKey = `${text}__${targetLang}`;
    if (translationCache[cacheKey]) return translationCache[cacheKey];

    let result = text;

    // ── Strategy 1: Your Backend API ────────────────────────────────────────────
    if (BASE_API_URL) {
        try {
            const response = await fetch(`${BASE_API_URL}/translate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, targetLang }),
                timeout: 5000,
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.translatedText) {
                    result = data.translatedText;
                    translationCache[cacheKey] = result;
                    return result;
                }
            }
        } catch (err) {
            console.log("[TranslationService] Backend API failed, falling back to Google:", err.message);
        }
    }

    // ── Strategy 2: Free Google Translate API (fallback) ────────────────────────
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data && data[0] && data[0][0] && data[0][0][0]) {
            result = data[0][0][0];
        }
    } catch (err) {
        console.log("[TranslationService] Google Translate fallback also failed:", err.message);
        // Return original text as last resort
    }

    translationCache[cacheKey] = result;
    return result;
};

/**
 * Translates multiple texts in parallel.
 * @param {string[]} texts - Array of texts to translate
 * @param {string} targetLang - Target language code
 * @returns {Promise<string[]>} - Array of translated texts
 */
export const translateBatch = async (texts, targetLang) => {
    if (targetLang === "en") return texts;
    return Promise.all(texts.map((t) => translateText(t, targetLang)));
};

/**
 * Clears the in-memory translation cache.
 * Call this when the user switches language.
 */
export const clearTranslationCache = () => {
    Object.keys(translationCache).forEach((k) => delete translationCache[k]);
};
