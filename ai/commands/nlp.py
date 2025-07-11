import re
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import asyncio

# For production, you'd use these imports:
# from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
# import openai
# import spacy

logger = logging.getLogger(__name__)

class CommandProcessor:
    """Natural Language Processing for HRMS commands"""
    
    def __init__(self):
        self.intent_patterns = self._load_intent_patterns()
        self.entity_patterns = self._load_entity_patterns()
        self.command_cache = {}
        self.initialized = False
        
    async def initialize(self):
        """Initialize NLP models and resources"""
        try:
            logger.info("Initializing NLP Command Processor...")
            
            # In production, load actual models here:
            # self.intent_classifier = pipeline("text-classification", model="microsoft/DialoGPT-medium")
            # self.ner_model = spacy.load("en_core_web_sm")
            # openai.api_key = os.getenv("OPENAI_API_KEY")
            
            # For now, use pattern-based processing
            self.initialized = True
            logger.info("✅ NLP Command Processor initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize NLP processor: {e}")
            raise
    
    async def cleanup(self):
        """Cleanup resources"""
        self.command_cache.clear()
        self.initialized = False
        logger.info("NLP Command Processor cleaned up")
    
    async def health_check(self) -> bool:
        """Check if NLP service is healthy"""
        return self.initialized
    
    async def process_command(self, text: str, lang: str = "en", employee_id: Optional[int] = None) -> Dict[str, Any]:
        """Process natural language command and extract intent and entities"""
        try:
            # Normalize input
            text = text.strip().lower()
            
            # Check cache first
            cache_key = f"{text}_{lang}_{employee_id}"
            if cache_key in self.command_cache:
                return self.command_cache[cache_key]
            
            # Classify intent
            intent, confidence = await self._classify_intent(text)
            
            # Extract entities
            entities = await self._extract_entities(text)
            
            # Generate response
            result = await self._generate_response(intent, entities, text, employee_id)
            result['confidence'] = confidence
            
            # Cache result
            self.command_cache[cache_key] = result
            
            return result
            
        except Exception as e:
            logger.error(f"Command processing error: {e}")
            return {
                'action': 'error',
                'message': f'Sorry, I couldn\'t understand that command: {str(e)}',
                'parameters': {},
                'confidence': 0.0
            }
    
    async def _classify_intent(self, text: str) -> Tuple[str, float]:
        """Classify the intent of the input text"""
        
        # Pattern-based intent classification
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    confidence = self._calculate_pattern_confidence(text, pattern)
                    return intent, confidence
        
        # If no pattern matches, try keyword matching
        return await self._keyword_based_classification(text)
    
    def _calculate_pattern_confidence(self, text: str, pattern: str) -> float:
        """Calculate confidence score for pattern matching"""
        # Simple confidence based on pattern specificity and text length
        matches = len(re.findall(pattern, text, re.IGNORECASE))
        pattern_length = len(pattern.replace('[.*?]', '').replace('\\b', ''))
        text_length = len(text)
        
        # Higher confidence for longer patterns and exact matches
        confidence = min(0.9, (matches * pattern_length) / (text_length + 1))
        return max(0.3, confidence)  # Minimum confidence of 0.3
    
    async def _keyword_based_classification(self, text: str) -> Tuple[str, float]:
        """Fallback keyword-based classification"""
        
        keyword_map = {
            'attendance': ['attendance', 'present', 'absent', 'work', 'office'],
            'clock_in': ['clock in', 'start work', 'arrive', 'check in'],
            'clock_out': ['clock out', 'leave', 'finish', 'end work', 'check out'],
            'leave': ['leave', 'vacation', 'holiday', 'time off', 'absent'],
            'payroll': ['salary', 'pay', 'payroll', 'money', 'wages'],
            'employee': ['employee', 'staff', 'worker', 'person', 'team'],
            'report': ['report', 'summary', 'analytics', 'data']
        }
        
        max_score = 0
        best_intent = 'unknown'
        
        for intent, keywords in keyword_map.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > max_score:
                max_score = score
                best_intent = intent
        
        confidence = min(0.7, max_score / 5.0) if max_score > 0 else 0.1
        return best_intent, confidence
    
    async def _extract_entities(self, text: str) -> Dict[str, Any]:
        """Extract entities from the input text"""
        entities = {}
        
        # Extract dates
        date_entities = self._extract_dates(text)
        if date_entities:
            entities.update(date_entities)
        
        # Extract employee names/IDs
        employee_entities = self._extract_employee_references(text)
        if employee_entities:
            entities.update(employee_entities)
        
        # Extract numbers
        number_entities = self._extract_numbers(text)
        if number_entities:
            entities.update(number_entities)
        
        # Extract departments
        department_entities = self._extract_departments(text)
        if department_entities:
            entities.update(department_entities)
        
        return entities
    
    def _extract_dates(self, text: str) -> Dict[str, Any]:
        """Extract date-related entities"""
        entities = {}
        
        # Common date patterns
        date_patterns = {
            'today': datetime.now().date(),
            'tomorrow': (datetime.now() + timedelta(days=1)).date(),
            'yesterday': (datetime.now() - timedelta(days=1)).date(),
            'this week': datetime.now().date(),
            'next week': (datetime.now() + timedelta(weeks=1)).date(),
            'last week': (datetime.now() - timedelta(weeks=1)).date(),
        }
        
        for pattern, date_value in date_patterns.items():
            if pattern in text.lower():
                entities['date'] = date_value.isoformat()
                break
        
        # Specific date patterns (YYYY-MM-DD, MM/DD/YYYY, etc.)
        date_regex_patterns = [
            r'\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b',  # YYYY-MM-DD or YYYY/MM/DD
            r'\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b',  # MM-DD-YYYY or MM/DD/YYYY
            r'\b(\d{1,2}[-/]\d{1,2}[-/]\d{2})\b',  # MM-DD-YY or MM/DD/YY
        ]
        
        for pattern in date_regex_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    # Parse the date (simplified parsing)
                    date_str = match.group(1)
                    # You'd use a proper date parser here like dateutil
                    entities['specific_date'] = date_str
                    break
                except:
                    continue
        
        return entities
    
    def _extract_employee_references(self, text: str) -> Dict[str, Any]:
        """Extract employee name or ID references"""
        entities = {}
        
        # Employee ID pattern
        emp_id_match = re.search(r'\b(?:employee|emp)\s*(?:id|#)?\s*(\d+)\b', text, re.IGNORECASE)
        if emp_id_match:
            entities['employee_id'] = int(emp_id_match.group(1))
        
        # Simple name patterns (first name + last name)
        name_match = re.search(r'\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b', text)
        if name_match:
            entities['employee_name'] = f"{name_match.group(1)} {name_match.group(2)}"
        
        return entities
    
    def _extract_numbers(self, text: str) -> Dict[str, Any]:
        """Extract numeric entities"""
        entities = {}
        
        # Extract numbers for hours, days, amounts, etc.
        number_matches = re.findall(r'\b(\d+(?:\.\d+)?)\b', text)
        if number_matches:
            # Context-based number interpretation
            if any(word in text.lower() for word in ['hour', 'hrs', 'h']):
                entities['hours'] = float(number_matches[0])
            elif any(word in text.lower() for word in ['day', 'days']):
                entities['days'] = int(number_matches[0])
            elif any(word in text.lower() for word in ['dollar', '$', 'amount']):
                entities['amount'] = float(number_matches[0])
            else:
                entities['number'] = float(number_matches[0])
        
        return entities
    
    def _extract_departments(self, text: str) -> Dict[str, Any]:
        """Extract department references"""
        entities = {}
        
        departments = [
            'engineering', 'hr', 'human resources', 'sales', 'marketing', 
            'finance', 'it', 'operations', 'design', 'legal'
        ]
        
        for dept in departments:
            if dept in text.lower():
                entities['department'] = dept.title()
                break
        
        return entities
    
    async def _generate_response(self, intent: str, entities: Dict[str, Any], text: str, employee_id: Optional[int]) -> Dict[str, Any]:
        """Generate appropriate response based on intent and entities"""
        
        response_map = {
            'attendance': self._handle_attendance_command,
            'clock_in': self._handle_clock_in_command,
            'clock_out': self._handle_clock_out_command,
            'leave': self._handle_leave_command,
            'payroll': self._handle_payroll_command,
            'employee': self._handle_employee_command,
            'report': self._handle_report_command,
        }
        
        handler = response_map.get(intent, self._handle_unknown_command)
        return await handler(entities, text, employee_id)
    
    async def _handle_attendance_command(self, entities: Dict[str, Any], text: str, employee_id: Optional[int]) -> Dict[str, Any]:
        """Handle attendance-related commands"""
        return {
            'action': 'view_attendance',
            'parameters': {
                'employee_id': entities.get('employee_id', employee_id),
                'date': entities.get('date'),
                'employee_name': entities.get('employee_name')
            },
            'message': 'I\'ll retrieve the attendance information for you.'
        }
    
    async def _handle_clock_in_command(self, entities: Dict[str, Any], text: str, employee_id: Optional[int]) -> Dict[str, Any]:
        """Handle clock in commands"""
        return {
            'action': 'clock_in',
            'parameters': {
                'employee_id': employee_id,
                'timestamp': datetime.now().isoformat()
            },
            'message': 'I\'ll clock you in right away.'
        }
    
    async def _handle_clock_out_command(self, entities: Dict[str, Any], text: str, employee_id: Optional[int]) -> Dict[str, Any]:
        """Handle clock out commands"""
        return {
            'action': 'clock_out',
            'parameters': {
                'employee_id': employee_id,
                'timestamp': datetime.now().isoformat()
            },
            'message': 'I\'ll clock you out now.'
        }
    
    async def _handle_leave_command(self, entities: Dict[str, Any], text: str, employee_id: Optional[int]) -> Dict[str, Any]:
        """Handle leave request commands"""
        
        # Determine if it's a request or view
        if any(word in text for word in ['request', 'apply', 'take']):
            return {
                'action': 'request_leave',
                'parameters': {
                    'employee_id': employee_id,
                    'start_date': entities.get('date'),
                    'end_date': entities.get('end_date'),
                    'days': entities.get('days'),
                    'reason': self._extract_leave_reason(text)
                },
                'message': 'I\'ll submit your leave request.'
            }
        else:
            return {
                'action': 'view_leave',
                'parameters': {
                    'employee_id': entities.get('employee_id', employee_id)
                },
                'message': 'I\'ll show you the leave information.'
            }
    
    async def _handle_payroll_command(self, entities: Dict[str, Any], text: str, employee_id: Optional[int]) -> Dict[str, Any]:
        """Handle payroll-related commands"""
        return {
            'action': 'view_payroll',
            'parameters': {
                'employee_id': entities.get('employee_id', employee_id),
                'month': entities.get('month'),
                'year': entities.get('year')
            },
            'message': 'I\'ll retrieve your payroll information.'
        }
    
    async def _handle_employee_command(self, entities: Dict[str, Any], text: str, employee_id: Optional[int]) -> Dict[str, Any]:
        """Handle employee-related commands"""
        
        if any(word in text for word in ['add', 'create', 'new']):
            return {
                'action': 'create_employee',
                'parameters': {
                    'name': entities.get('employee_name'),
                    'department': entities.get('department')
                },
                'message': 'I\'ll help you create a new employee record.'
            }
        elif any(word in text for word in ['find', 'search', 'show']):
            return {
                'action': 'search_employees',
                'parameters': {
                    'name': entities.get('employee_name'),
                    'department': entities.get('department'),
                    'employee_id': entities.get('employee_id')
                },
                'message': 'I\'ll search for employees matching your criteria.'
            }
        else:
            return {
                'action': 'view_employees',
                'parameters': {
                    'department': entities.get('department')
                },
                'message': 'I\'ll show you the employee information.'
            }
    
    async def _handle_report_command(self, entities: Dict[str, Any], text: str, employee_id: Optional[int]) -> Dict[str, Any]:
        """Handle report generation commands"""
        
        report_type = 'general'
        if 'attendance' in text:
            report_type = 'attendance'
        elif 'payroll' in text:
            report_type = 'payroll'
        elif 'performance' in text:
            report_type = 'performance'
        elif 'leave' in text:
            report_type = 'leave'
        
        return {
            'action': 'generate_report',
            'parameters': {
                'report_type': report_type,
                'department': entities.get('department'),
                'date_from': entities.get('date'),
                'date_to': entities.get('end_date')
            },
            'message': f'I\'ll generate a {report_type} report for you.'
        }
    
    async def _handle_unknown_command(self, entities: Dict[str, Any], text: str, employee_id: Optional[int]) -> Dict[str, Any]:
        """Handle unknown or unrecognized commands"""
        
        suggestions = [
            "Try asking about your attendance",
            "You can request leave by saying 'request leave for tomorrow'",
            "Ask about payroll with 'show my payroll'",
            "View employees by saying 'show employees in engineering'"
        ]
        
        return {
            'action': 'unknown',
            'parameters': {'original_text': text},
            'message': 'I\'m not sure how to help with that. Here are some things you can try:',
            'suggestions': suggestions
        }
    
    def _extract_leave_reason(self, text: str) -> str:
        """Extract reason from leave request text"""
        
        # Look for common reason patterns
        reason_patterns = [
            r'for (.+?)(?:\.|$)',
            r'because (.+?)(?:\.|$)',
            r'due to (.+?)(?:\.|$)'
        ]
        
        for pattern in reason_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        # Default reasons based on keywords
        if any(word in text.lower() for word in ['sick', 'illness', 'doctor']):
            return 'Medical leave'
        elif any(word in text.lower() for word in ['vacation', 'holiday', 'trip']):
            return 'Vacation'
        elif any(word in text.lower() for word in ['personal', 'family']):
            return 'Personal leave'
        
        return 'Leave request'
    
    def _load_intent_patterns(self) -> Dict[str, List[str]]:
        """Load intent classification patterns"""
        return {
            'attendance': [
                r'\b(?:show|view|check|see)\s+(?:my\s+)?attendance\b',
                r'\b(?:attendance|present|absent)\s+(?:for|on|today|yesterday)\b',
                r'\bhow many\s+(?:days|hours)\s+(?:have|did)\s+i\s+work',
                r'\bwhen\s+(?:did|was)\s+i\s+(?:in|out|present)'
            ],
            'clock_in': [
                r'\b(?:clock|check)\s+in\b',
                r'\bstart\s+work(?:ing)?\b',
                r'\bi\'m\s+(?:here|in|arriving)\b',
                r'\bbegin\s+(?:my\s+)?(?:work|shift)\b'
            ],
            'clock_out': [
                r'\b(?:clock|check)\s+out\b',
                r'\b(?:end|finish|stop)\s+work(?:ing)?\b',
                r'\bi\'m\s+(?:leaving|done|finished)\b',
                r'\bgoing\s+home\b'
            ],
            'leave': [
                r'\b(?:request|apply|take|need)\s+(?:a\s+)?leave\b',
                r'\b(?:vacation|holiday|time\s+off)\b',
                r'\bcan\'t\s+(?:come|work)\s+(?:today|tomorrow)\b',
                r'\b(?:sick|personal)\s+(?:leave|day)\b'
            ],
            'payroll': [
                r'\b(?:show|view|check)\s+(?:my\s+)?(?:payroll|salary|pay)\b',
                r'\bhow\s+much\s+(?:do|did)\s+i\s+(?:earn|make|get\s+paid)\b',
                r'\b(?:payslip|pay\s+stub|salary\s+slip)\b',
                r'\bwhat\'s\s+my\s+(?:salary|pay)\b'
            ],
            'employee': [
                r'\b(?:show|list|find|search)\s+(?:all\s+)?employees?\b',
                r'\b(?:add|create|new)\s+employee\b',
                r'\bwho\s+(?:works|is)\s+in\b',
                r'\bemployee\s+(?:list|directory|information)\b'
            ],
            'report': [
                r'\b(?:generate|create|show|get)\s+(?:a\s+)?report\b',
                r'\b(?:analytics|statistics|summary)\b',
                r'\breport\s+(?:for|on|about)\b',
                r'\bshow\s+(?:me\s+)?(?:stats|data|analytics)\b'
            ]
        }
    
    def _load_entity_patterns(self) -> Dict[str, List[str]]:
        """Load entity extraction patterns"""
        return {
            'date': [
                r'\b(?:today|tomorrow|yesterday)\b',
                r'\b(?:this|next|last)\s+(?:week|month|year)\b',
                r'\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b',
                r'\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b'
            ],
            'employee_id': [
                r'\b(?:employee|emp)\s*(?:id|#)?\s*(\d+)\b',
                r'\bid\s*:?\s*(\d+)\b'
            ],
            'employee_name': [
                r'\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b'
            ],
            'department': [
                r'\b(?:engineering|hr|human\s+resources|sales|marketing|finance|it|operations|design|legal)\b'
            ],
            'time': [
                r'\b\d{1,2}:\d{2}(?:\s*(?:am|pm))?\b',
                r'\b(?:morning|afternoon|evening|night)\b'
            ]
        }   