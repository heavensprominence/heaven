const db = require('../db');
const { translateText } = require('./translationService');

async function autoTranslateCategory(category, displayName) {
    if (!displayName) return;
    
    const targetLangs = ['es', 'fr', 'de', 'zh', 'ja', 'ko', 'vi', 'tr',
                        'ar', 'fa', 'ur', 'hi', 'pt', 'ru', 'sv', 'tl'];
    
    let count = 0;
    for (const targetLang of targetLangs) {
        try {
            const translatedName = await translateText(displayName, 'auto', targetLang);
            if (translatedName && translatedName !== displayName) {
                await db.query(
                    `INSERT INTO category_translations (category, language_code, name, translated_by)
                     VALUES ($1, $2, $3, 'auto')
                     ON CONFLICT (category, language_code) 
                     DO UPDATE SET name = $3, updated_at = NOW()`,
                    [category, targetLang, translatedName]
                );
                count++;
            }
        } catch (err) {
            console.error(`Category translate failed for ${targetLang}:`, err.message);
        }
    }
    console.log(`Category "${displayName}" translated: ${count}/${targetLangs.length}`);
}

module.exports = { autoTranslateCategory };
