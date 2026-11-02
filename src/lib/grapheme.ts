/**
 * Multilingual & Unicode text utilities.
 * Handles grapheme cluster counting (Intl.Segmenter) and universal slug generation.
 */

/**
 * Counts user-perceived graphemes (characters) rather than raw UTF-16 code units or UTF-8 bytes.
 * Correctly accounts for Indic conjuncts, combining diacritics, Arabic marks, and compound emojis.
 */
export function countGraphemes(text: string): number {
  if (!text) return 0;

  try {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      // @ts-ignore - Intl.Segmenter is supported in modern browsers and Node 16+
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      let count = 0;
      for (const _ of segmenter.segment(text)) {
        count++;
      }
      return count;
    }
  } catch {
    // Fallback if Intl.Segmenter encounters an issue
  }

  // Fallback: Array.from iterates over Unicode code points
  return Array.from(text).length;
}

/**
 * Generates clean, URL-safe canonical slugs for any language.
 * Preserves readable Unicode words while replacing spaces and punctuations with hyphens.
 * Example:
 *  "Unknown Story of Princess Gouramma" -> "unknown-story-of-princess-gouramma"
 *  "കേരളത്തിലെ സ്റ്റോക്ക് വിപണി മുന്നേറ്റം" -> "കേരളത്തിലെ-സ്റ്റോക്ക്-വിപണി-മുന്നേറ്റം"
 *  "शेयर बाजार में रिकॉर्ड उछाल" -> "शेयर-बाजार-में-रिकॉर्ड-उछाल"
 */
export function generateCanonicalSlug(heading: string): string {
  if (!heading) return '';

  return heading
    .trim()
    .toLowerCase()
    // Normalize unicode compositions (NFC)
    .normalize('NFC')
    // Replace spaces, underscores, slashes, and common punctuation with a single hyphen
    .replace(/[\s\t\n\r_\\/|.,:;!?'"()[\]{}@#$%^&*+=<>~`]+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Detects the predominant language script from text.
 */
export function detectScript(text: string): { name: string; code: string; isRTL: boolean } {
  if (!text) return { name: 'English', code: 'en', isRTL: false };

  // Malayalam
  if (/[\u0D00-\u0D7F]/.test(text)) {
    return { name: 'Malayalam (മലയാളം)', code: 'ml', isRTL: false };
  }
  // Devanagari (Hindi, Marathi, Sanskrit)
  if (/[\u0900-\u097F]/.test(text)) {
    return { name: 'Hindi (हिंदी)', code: 'hi', isRTL: false };
  }
  // Tamil
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return { name: 'Tamil (தமிழ்)', code: 'ta', isRTL: false };
  }
  // Telugu
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return { name: 'Telugu (తెలుగు)', code: 'te', isRTL: false };
  }
  // Kannada
  if (/[\u0C80-\u0CFF]/.test(text)) {
    return { name: 'Kannada (ಕನ್ನಡ)', code: 'kn', isRTL: false };
  }
  // Bengali
  if (/[\u0980-\u09FF]/.test(text)) {
    return { name: 'Bengali (বাংলা)', code: 'bn', isRTL: false };
  }
  // Arabic / Urdu
  if (/[\u0600-\u06FF\u0750-\u077F]/.test(text)) {
    return { name: 'Arabic (العربية)', code: 'ar', isRTL: true };
  }
  // CJK
  if (/[\u4E00-\u9FFF\u3040-\u30FF]/.test(text)) {
    return { name: 'CJK', code: 'zh', isRTL: false };
  }

  return { name: 'English', code: 'en', isRTL: false };
}
