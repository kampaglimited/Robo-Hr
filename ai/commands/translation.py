import logging
from typing import Dict, Optional, Any
import asyncio
import hashlib

# For production, you'd use these imports:
# from googletrans import Translator
# import openai
# from transformers import MarianMTModel, MarianTokenizer

logger = logging.getLogger(__name__)

class TranslationService:
    """Multilingual translation service for HRMS commands and responses"""
    
    def __init__(self):
        self.translator = None
        self.translation_cache = {}
        self.supported_languages = {
            'en': 'English',
            'es': 'Spanish', 
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'ru': 'Russian',
            'ar': 'Arabic',
            'hi': 'Hindi'
        }
        self.initialized = False
        
        # HR-specific translations for common terms
        self.hr_terminology = self._load_hr_terminology()
    
    async def initialize(self):
        """Initialize translation service"""
        try:
            logger.info("Initializing Translation Service...")
            
            # In production, initialize actual translation services:
            # self.translator = Translator()
            # openai.api_key = os.getenv("OPENAI_API_KEY")
            # Load pre-trained translation models
            
            self.initialized = True
            logger.info("✅ Translation Service initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize translation service: {e}")
            raise
    
    async def cleanup(self):
        """Cleanup resources"""
        self.translation_cache.clear()
        self.initialized = False
        logger.info("Translation Service cleaned up")
    
    async def health_check(self) -> bool:
        """Check if translation service is healthy"""
        return self.initialized
    
    async def translate(self, text: str, source_lang: str = "auto", target_lang: str = "en") -> str:
        """Translate text from source language to target language"""
        try:
            # Check cache first
            cache_key = self._generate_cache_key(text, source_lang, target_lang)
            if cache_key in self.translation_cache:
                return self.translation_cache[cache_key]
            
            # Auto-detect language if needed
            if source_lang == "auto":
                source_lang = await self.detect_language(text)
            
            # Skip translation if source and target are the same
            if source_lang == target_lang:
                return text
            
            # Perform translation
            translated_text = await self._perform_translation(text, source_lang, target_lang)
            
            # Apply HR-specific terminology corrections
            translated_text = self._apply_hr_terminology(translated_text, target_lang)
            
            # Cache the result
            self.translation_cache[cache_key] = translated_text
            
            return translated_text
            
        except Exception as e:
            logger.error(f"Translation error: {e}")
            # Return original text as fallback
            return text
    
    async def translate_to_english(self, text: str, source_lang: str) -> str:
        """Convenience method to translate any language to English"""
        return await self.translate(text, source_lang, "en")
    
    async def translate_from_english(self, text: str, target_lang: str) -> str:
        """Convenience method to translate from English to target language"""
        return await self.translate(text, "en", target_lang)
    
    async def _perform_translation(self, text: str, source_lang: str, target_lang: str) -> str:
        """Perform actual translation using available services"""
        
        # Mock implementation for demo
        # In production, you'd use actual translation services:
        
        """
        # Using Google Translate:
        try:
            result = self.translator.translate(text, src=source_lang, dest=target_lang)
            return result.text
        except Exception as e:
            logger.error(f"Google Translate error: {e}")
        
        # Using OpenAI API:
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": f"Translate the following text from {source_lang} to {target_lang}. Focus on HR and workplace terminology."},
                    {"role": "user", "content": text}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI translation error: {e}")
        
        # Using Hugging Face transformers:
        model_name = f"Helsinki-NLP/opus-mt-{source_lang}-{target_lang}"
        try:
            model = MarianMTModel.from_pretrained(model_name)
            tokenizer = MarianTokenizer.from_pretrained(model_name)
            
            inputs = tokenizer(text, return_tensors="pt", padding=True)
            outputs = model.generate(**inputs)
            translated = tokenizer.decode(outputs[0], skip_special_tokens=True)
            return translated
        except Exception as e:
            logger.error(f"Hugging Face translation error: {e}")
        """
        
        # Mock translations for demo
        mock_translations = {
            ("en", "es"): {
                "show me my attendance": "muéstrame mi asistencia",
                "clock in": "fichar entrada",
                "clock out": "fichar salida", 
                "request leave": "solicitar permiso",
                "view payroll": "ver nómina",
                "employee": "empleado",
                "department": "departamento",
                "manager": "gerente"
            },
            ("en", "fr"): {
                "show me my attendance": "montrez-moi ma présence",
                "clock in": "pointer à l'arrivée",
                "clock out": "pointer au départ",
                "request leave": "demander un congé",
                "view payroll": "voir la paie",
                "employee": "employé",
                "department": "département", 
                "manager": "directeur"
            },
            ("es", "en"): {
                "muéstrame mi asistencia": "show me my attendance",
                "fichar entrada": "clock in",
                "fichar salida": "clock out",
                "solicitar permiso": "request leave",
                "empleado": "employee"
            },
            ("fr", "en"): {
                "montrez-moi ma présence": "show me my attendance",
                "pointer à l'arrivée": "clock in",
                "pointer au départ": "clock out",
                "demander un congé": "request leave",
                "employé": "employee"
            }
        }
        
        # Look up in mock translations
        translation_key = (source_lang, target_lang)
        if translation_key in mock_translations:
            # Check for exact match first
            if text.lower() in mock_translations[translation_key]:
                return mock_translations[translation_key][text.lower()]
            
            # Check for partial matches
            for source_phrase, target_phrase in mock_translations[translation_key].items():
                if source_phrase in text.lower():
                    return text.lower().replace(source_phrase, target_phrase)
        
        # Fallback: return original text
        return text
    
    async def detect_language(self, text: str) -> str:
        """Detect the language of input text"""
        
        # Mock implementation for demo
        # In production, you'd use actual language detection:
        
        """
        # Using langdetect:
        from langdetect import detect
        try:
            detected = detect(text)
            return detected
        except:
            return "en"
        
        # Using Google Translate detection:
        try:
            result = self.translator.detect(text)
            return result.lang
        except:
            return "en"
        """
        
        # Simple keyword-based language detection for demo
        spanish_keywords = ['mi', 'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'una', 'del', 'todo', 'está', 'muy', 'fue', 'han', 'era', 'sobre', 'entre', 'cuando', 'hasta', 'antes', 'después', 'porque', 'sin', 'contra', 'desde', 'durante', 'mediante', 'según', 'bajo', 'tras', 'hacia', 'donde', 'mientras', 'aunque', 'sino', 'menos', 'excepto', 'salvo', 'incluso', 'además', 'también', 'tampoco', 'así', 'entonces', 'aquí', 'ahí', 'allí', 'acá', 'allá']
        french_keywords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'comme', 'autre', 'mais', 'son', 'me', 'année', 'où', 'mon', 'lui', 'temps', 'très', 'chose', 'état', 'person', 'peu', 'jour', 'même', 'faire', 'aussi', 'deux', 'way', 'elle', 'bien', 'eau', 'sans', 'voir', 'depuis', 'pendant', 'contre', 'jusqu', 'avant', 'après', 'parce', 'chez', 'vers', 'sous', 'toujours', 'jamais', 'souvent', 'parfois', 'quelquefois', 'maintenant', 'hier', 'aujourd', 'demain']
        
        text_lower = text.lower()
        
        spanish_count = sum(1 for word in spanish_keywords if word in text_lower)
        french_count = sum(1 for word in french_keywords if word in text_lower)
        
        if spanish_count > french_count and spanish_count > 0:
            return "es"
        elif french_count > 0:
            return "fr"
        else:
            return "en"
    
    def _generate_cache_key(self, text: str, source_lang: str, target_lang: str) -> str:
        """Generate cache key for translation"""
        combined = f"{text}_{source_lang}_{target_lang}"
        return hashlib.md5(combined.encode()).hexdigest()
    
    def _apply_hr_terminology(self, text: str, target_lang: str) -> str:
        """Apply HR-specific terminology corrections"""
        
        if target_lang not in self.hr_terminology:
            return text
        
        # Replace HR terms with proper translations
        for english_term, translations in self.hr_terminology.items():
            if target_lang in translations:
                # Case-insensitive replacement
                text = text.replace(english_term.lower(), translations[target_lang].lower())
                text = text.replace(english_term.title(), translations[target_lang].title())
                text = text.replace(english_term.upper(), translations[target_lang].upper())
        
        return text
    
    def _load_hr_terminology(self) -> Dict[str, Dict[str, str]]:
        """Load HR-specific terminology translations"""
        return {
            "employee": {
                "es": "empleado",
                "fr": "employé", 
                "de": "Mitarbeiter",
                "it": "dipendente",
                "pt": "funcionário"
            },
            "manager": {
                "es": "gerente",
                "fr": "directeur",
                "de": "Manager", 
                "it": "manager",
                "pt": "gerente"
            },
            "department": {
                "es": "departamento",
                "fr": "département",
                "de": "Abteilung",
                "it": "dipartimento", 
                "pt": "departamento"
            },
            "attendance": {
                "es": "asistencia",
                "fr": "présence",
                "de": "Anwesenheit",
                "it": "presenza",
                "pt": "presença"
            },
            "payroll": {
                "es": "nómina",
                "fr": "paie",
                "de": "Lohnabrechnung",
                "it": "busta paga",
                "pt": "folha de pagamento"
            },
            "leave": {
                "es": "permiso",
                "fr": "congé", 
                "de": "Urlaub",
                "it": "permesso",
                "pt": "licença"
            },
            "vacation": {
                "es": "vacaciones",
                "fr": "vacances",
                "de": "Urlaub",
                "it": "ferie",
                "pt": "férias"
            },
            "sick leave": {
                "es": "baja por enfermedad",
                "fr": "congé maladie",
                "de": "Krankenurlaub",
                "it": "congedo per malattia",
                "pt": "licença médica"
            },
            "performance": {
                "es": "rendimiento",
                "fr": "performance",
                "de": "Leistung",
                "it": "prestazione", 
                "pt": "desempenho"
            },
            "salary": {
                "es": "salario",
                "fr": "salaire",
                "de": "Gehalt",
                "it": "stipendio",
                "pt": "salário"
            },
            "overtime": {
                "es": "horas extra",
                "fr": "heures supplémentaires",
                "de": "Überstunden",
                "it": "straordinario",
                "pt": "horas extras"
            },
            "benefits": {
                "es": "beneficios",
                "fr": "avantages",
                "de": "Leistungen",
                "it": "benefici",
                "pt": "benefícios"
            }
        }
    
    async def get_supported_languages(self) -> Dict[str, str]:
        """Get list of supported languages"""
        return self.supported_languages.copy()
    
    async def batch_translate(self, texts: list, source_lang: str, target_lang: str) -> list:
        """Translate multiple texts at once"""
        results = []
        
        # Process in batches to avoid rate limits
        batch_size = 10
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_results = []
            
            for text in batch:
                try:
                    translated = await self.translate(text, source_lang, target_lang)
                    batch_results.append(translated)
                except Exception as e:
                    logger.error(f"Batch translation error for '{text}': {e}")
                    batch_results.append(text)  # Fallback to original
            
            results.extend(batch_results)
            
            # Small delay to avoid rate limiting
            await asyncio.sleep(0.1)
        
        return results
    
    async def translate_with_confidence(self, text: str, source_lang: str, target_lang: str) -> Dict[str, Any]:
        """Translate text and return confidence score"""
        
        translated_text = await self.translate(text, source_lang, target_lang)
        
        # Mock confidence calculation
        # In production, this would come from the translation service
        confidence = 0.9 if len(text.split()) > 1 else 0.7
        
        # Lower confidence for very short texts or unsupported languages
        if len(text) < 3:
            confidence *= 0.5
        
        if source_lang not in self.supported_languages or target_lang not in self.supported_languages:
            confidence *= 0.6
        
        return {
            "translated_text": translated_text,
            "confidence": min(confidence, 1.0),
            "source_language": source_lang,
            "target_language": target_lang,
            "original_text": text
        }
    
    async def get_translation_stats(self) -> Dict[str, Any]:
        """Get translation service statistics"""
        return {
            "cache_size": len(self.translation_cache),
            "supported_languages": len(self.supported_languages),
            "hr_terms": len(self.hr_terminology),
            "most_common_pairs": [
                ("en", "es"),
                ("en", "fr"), 
                ("es", "en"),
                ("fr", "en")
            ],
            "initialized": self.initialized
        }
    
    async def clear_cache(self):
        """Clear translation cache"""
        cache_size = len(self.translation_cache)
        self.translation_cache.clear()
        logger.info(f"Cleared translation cache ({cache_size} entries)")
        return {"cleared_entries": cache_size}
    
    async def validate_language_code(self, lang_code: str) -> bool:
        """Validate if language code is supported"""
        return lang_code in self.supported_languages
    
    async def get_language_name(self, lang_code: str) -> str:
        """Get full language name from code"""
        return self.supported_languages.get(lang_code, "Unknown")