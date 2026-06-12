import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Mic, Volume2, Keyboard, MessageCircle, HelpCircle, Play, Square } from 'lucide-react';

const VoiceSupport = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceAssistantActive, setVoiceAssistantActive] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [recognition, setRecognition] = useState(null);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const [micPermission, setMicPermission] = useState('prompt');
  const fromVoiceRef = useRef(false);

  // Initialize Web Speech API
  useEffect(() => {
    // Check for browser support
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = language === 'en' ? 'en-IN' : 'kn-IN'; // English India or Kannada India
      
      recognitionInstance.onstart = () => {
        console.log('Voice recognition started');
        setIsListening(true);
      };
      
      recognitionInstance.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
        
        if (event.results[current].isFinal) {
          fromVoiceRef.current = true;
          setCurrentMessage(transcriptText);
        }
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicPermission('denied');
          alert(language === 'en' 
            ? 'Microphone access denied. Please enable microphone permissions in your browser settings.'
            : 'ಮೈಕ್ರೊಫೋನ್ ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ.');
        }
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        console.log('Voice recognition ended');
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    } else {
      console.warn('Speech Recognition not supported in this browser');
    }

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, [language]);

  // Update recognition language when language changes
  useEffect(() => {
    if (recognition) {
      recognition.lang = language === 'en' ? 'en-IN' : 'kn-IN';
    }
  }, [language, recognition]);

  // Auto-process voice command when speech recognition finishes
  useEffect(() => {
    if (fromVoiceRef.current && currentMessage.trim() && voiceAssistantActive) {
      fromVoiceRef.current = false;
      handleVoiceQuery();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMessage, voiceAssistantActive]);

  const voiceFAQs = [
    {
      question: 'How do I add a new crop?',
      kannadaQuestion: 'ಹೊಸ ಬೆಳೆಯನ್ನು ಹೇಗೆ ಸೇರಿಸುವುದು?',
      answer: 'Go to Marketplace, click "Create New Listing" button, fill in crop details and submit.',
      kannadaAnswer: 'ಮಾರುಕಟ್ಟೆಗೆ ಹೋಗಿ, "ಹೊಸ ಪಟ್ಟಿ ರಚಿಸಿ" ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ, ಬೆಳೆ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ ಮತ್ತು ಸಲ್ಲಿಸಿ.',
    },
    {
      question: 'How to check weather forecast?',
      kannadaQuestion: 'ಹವಾಮಾನ ಮುನ್ಸೂಚನೆಯನ್ನು ಹೇಗೆ ಪರಿಶೀಲಿಸುವುದು?',
      answer: 'Navigate to Crop Planning page to see current weather and 5-day forecast.',
      kannadaAnswer: 'ಪ್ರಸ್ತುತ ಹವಾಮಾನ ಮತ್ತು 5-ದಿನದ ಮುನ್ಸೂಚನೆಯನ್ನು ನೋಡಲು ಬೆಳೆ ಯೋಜನೆ ಪುಟಕ್ಕೆ ನ್ಯಾವಿಗೇಟ್ ಮಾಡಿ.',
    },
    {
      question: 'How to view crop recommendations?',
      kannadaQuestion: 'ಬೆಳೆ ಶಿಫಾರಸುಗಳನ್ನು ಹೇಗೆ ವೀಕ್ಷಿಸುವುದು?',
      answer: 'Go to Crop Planning > Crop Recommendations tab to see AI-powered suggestions.',
      kannadaAnswer: 'AI-ಚಾಲಿತ ಸಲಹೆಗಳನ್ನು ನೋಡಲು ಬೆಳೆ ಯೋಜನೆ > ಬೆಳೆ ಶಿಫಾರಸುಗಳು ಟ್ಯಾಬ್‌ಗೆ ಹೋಗಿ.',
    },
    {
      question: 'How to contact buyers?',
      kannadaQuestion: 'ಖರೀದಿದಾರರನ್ನು ಹೇಗೆ ಸಂಪರ್ಕಿಸುವುದು?',
      answer: 'In Marketplace, click the Chat button on any listing to start a conversation.',
      kannadaAnswer: 'ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ, ಸಂಭಾಷಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸಲು ಯಾವುದೇ ಪಟ್ಟಿಯಲ್ಲಿ ಚಾಟ್ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.',
    },
  ];

  const navigationCommands = [
    { command: 'Go to home', kannadaCommand: 'ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ', action: '/', keywords: ['home', 'ಮುಖಪುಟ'] },
    { command: 'Open crop planning', kannadaCommand: 'ಬೆಳೆ ಯೋಜನೆ ತೆರೆಯಿರಿ', action: '/crop-planning', keywords: ['crop planning', 'crop', 'planning', 'ಬೆಳೆ ಯೋಜನೆ', 'ಬೆಳೆ'] },
    { command: 'Show analytics', kannadaCommand: 'ವಿಶ್ಲೇಷಣೆ ತೋರಿಸು', action: '/analytics', keywords: ['analytics', 'analysis', 'ವಿಶ್ಲೇಷಣೆ'] },
    { command: 'Open marketplace', kannadaCommand: 'ಮಾರುಕಟ್ಟೆ ತೆರೆಯಿರಿ', action: '/marketplace', keywords: ['marketplace', 'market', 'ಮಾರುಕಟ್ಟೆ'] },
    { command: 'View profile', kannadaCommand: 'ಪ್ರೊಫೈಲ್ ನೋಡಿ', action: '/profile', keywords: ['profile', 'ಪ್ರೊಫೈಲ್'] },
    { command: 'Open chat', kannadaCommand: 'ಚಾಟ್ ತೆರೆಯಿರಿ', action: '/chat', keywords: ['chat', 'message', 'conversation', 'ಚಾಟ್', 'ಸಂದೇಶ'] },
    { command: 'Show farming activity', kannadaCommand: 'ಕೃಷಿ ಚಟುವಟಿಕೆ ತೋರಿಸು', action: '/farming-activity', keywords: ['farming activity', 'activity', 'sowing', 'harvesting', 'ಕೃಷಿ ಚಟುವಟಿಕೆ', 'ಚಟುವಟಿಕೆ'] },
    { command: 'Open input marketplace', kannadaCommand: 'ಇನ್ಪುಟ್ ಮಾರುಕಟ್ಟೆ ತೆರೆಯಿರಿ', action: '/input-marketplace', keywords: ['input marketplace', 'seeds', 'fertilizer', 'tools', 'ಇನ್ಪುಟ್ ಮಾರುಕಟ್ಟೆ', 'ಬೀಜ', 'ಗೊಬ್ಬರ'] },
    { command: 'Show equipment rental', kannadaCommand: 'ಉಪಕರಣ ಬಾಡಿಗೆ ತೋರಿಸು', action: '/equipment-rental', keywords: ['equipment rental', 'equipment', 'rental', 'tractor', 'ಉಪಕರಣ ಬಾಡಿಗೆ', 'ಟ್ರಾಕ್ಟರ್'] },
    { command: 'Open government schemes', kannadaCommand: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ತೆರೆಯಿರಿ', action: '/government-schemes', keywords: ['government schemes', 'schemes', 'subsidy', 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು', 'ಯೋಜನೆ'] },
    { command: 'View market intelligence', kannadaCommand: 'ಮಾರುಕಟ್ಟೆ ಬುದ್ಧಿವಂತಿಕೆ ನೋಡಿ', action: '/market-intelligence', keywords: ['market intelligence', 'intelligence', 'ಮಾರುಕಟ್ಟೆ ಬುದ್ಧಿವಂತಿಕೆ'] },
    { command: 'Open buyer dashboard', kannadaCommand: 'ಖರೀದಿದಾರ ಡ್ಯಾಶ್ಬೋರ್ಡ್ ತೆರೆಯಿರಿ', action: '/buyer-dashboard', keywords: ['buyer dashboard', 'buyer', 'ಖರೀದಿದಾರ'] },
    { command: 'View trust center', kannadaCommand: 'ನಂಬಿಕೆ ಕೇಂದ್ರ ನೋಡಿ', action: '/trust-center', keywords: ['trust center', 'trust', 'ನಂಬಿಕೆ ಕೇಂದ್ರ'] },
  ];

  const startVoiceInput = async () => {
    if (!recognition) {
      alert(language === 'en' 
        ? 'Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.'
        : 'ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು Chrome, Edge ಅಥವಾ Safari ಬಳಸಿ.');
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      
      setTranscript('');
      recognition.start();
    } catch (error) {
      console.error('Microphone permission error:', error);
      setMicPermission('denied');
      alert(language === 'en'
        ? 'Cannot access microphone. Please grant microphone permissions and try again.'
        : 'ಮೈಕ್ರೊಫೋನ್ ಪ್ರವೇಶಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿಗಳನ್ನು ನೀಡಿ ಮತ್ತು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.');
    }
  };

  const stopVoiceInput = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
  };

  const toggleVoiceAssistant = () => {
    setVoiceAssistantActive(!voiceAssistantActive);
    if (!voiceAssistantActive) {
      const welcomeMessage = language === 'en'
        ? 'Hello! I am your voice assistant. How can I help you today?'
        : 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಧ್ವನಿ ಸಹಾಯಕ. ನಾನು ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?';
      setChatHistory([{ type: 'assistant', message: welcomeMessage, time: new Date().toLocaleTimeString() }]);
    }
  };

  const speakText = (text) => {
    if (!speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'en' ? 'en-IN' : 'kn-IN';
    utterance.rate = 0.9; // Slightly slower for better clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    // Get available voices
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith(language === 'en' ? 'en' : 'kn')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      console.log('Speech started');
    };

    utterance.onend = () => {
      console.log('Speech ended');
    };

    utterance.onerror = (event) => {
      console.error('Speech error:', event.error);
    };

    speechSynthesis.speak(utterance);
  };

  const handleVoiceQuery = () => {
    if (!currentMessage.trim()) return;

    const userMsg = { type: 'user', message: currentMessage, time: new Date().toLocaleTimeString() };
    setChatHistory([...chatHistory, userMsg]);

    // Process voice command
    setTimeout(() => {
      const lowerMessage = currentMessage.toLowerCase();
      let response = '';
      let shouldNavigate = false;
      let navigatePath = '';

      // Check navigation commands
      const matchedCommand = navigationCommands.find(cmd => 
        cmd.keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()))
      );

      if (matchedCommand) {
        // Navigation command matched
        const pageName = language === 'en' 
          ? matchedCommand.command.replace(/^(Go to|Open|Show|View)\s+/i, '')
          : matchedCommand.kannadaCommand.replace(/^(ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ|ತೆರೆಯಿರಿ|ತೋರಿಸು|ನೋಡಿ)\s*/i, '');
        
        response = language === 'en' 
          ? `Opening ${pageName}...` 
          : `${pageName} ತೆರೆಯಲಾಗುತ್ತಿದೆ...`;
        shouldNavigate = true;
        navigatePath = matchedCommand.action;
      }
      // Information queries
      else if (lowerMessage.includes('price') || lowerMessage.includes('ಬೆಲೆ')) {
        response = language === 'en'
          ? 'You can check live market prices in the Marketplace and Analytics sections. Current rice price is ₹2102 per quintal.'
          : 'ನೀವು ಮಾರುಕಟ್ಟೆ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ ವಿಭಾಗಗಳಲ್ಲಿ ನೇರ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಬಹುದು. ಪ್ರಸ್ತುತ ಅಕ್ಕಿ ಬೆಲೆ ಪ್ರತಿ ಕ್ವಿಂಟಾಲ್ ₹2102 ಆಗಿದೆ.';
      } else if (lowerMessage.includes('weather') || lowerMessage.includes('ಹವಾಮಾನ')) {
        response = language === 'en'
          ? 'Current weather is partly cloudy. Check Crop Planning page for detailed 5-day forecast and weather alerts.'
          : 'ಪ್ರಸ್ತುತ ಹವಾಮಾನ ಭಾಗಶಃ ಮೋಡ ಕವಿದಿದೆ. ವಿವರವಾದ 5-ದಿನದ ಮುನ್ಸೂಚನೆ ಮತ್ತು ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳಿಗಾಗಿ ಬೆಳೆ ಯೋಜನೆ ಪುಟವನ್ನು ಪರಿಶೀಲಿಸಿ.';
      } else if (lowerMessage.includes('help') || lowerMessage.includes('ಸಹಾಯ')) {
        response = language === 'en'
          ? 'I can help you navigate the app, check prices, weather, add crops, and more. Just ask me anything!'
          : 'ನಾನು ಅಪ್ಲಿಕೇಶನ್ ನ್ಯಾವಿಗೇಟ್ ಮಾಡಲು, ಬೆಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲು, ಹವಾಮಾನ, ಬೆಳೆಗಳನ್ನು ಸೇರಿಸಲು ಮತ್ತು ಹೆಚ್ಚಿನದನ್ನು ಮಾಡಲು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ನನ್ನನ್ನು ಏನು ಬೇಕಾದರೂ ಕೇಳಿ!';
      } else if (!matchedCommand) {
        // No command matched - provide helpful suggestions
        response = language === 'en'
          ? 'I can help you navigate to different pages. Try saying: "open marketplace", "show analytics", "go to chat", "farming activity", "equipment rental", or "government schemes".'
          : 'ನಾನು ವಿವಿಧ ಪುಟಗಳಿಗೆ ನ್ಯಾವಿಗೇಟ್ ಮಾಡಲು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಹೇಳಲು ಪ್ರಯತ್ನಿಸಿ: "ಮಾರುಕಟ್ಟೆ ತೆರೆಯಿರಿ", "ವಿಶ್ಲೇಷಣೆ ತೋರಿಸು", "ಚಾಟ್‌ಗೆ ಹೋಗಿ", "ಕೃಷಿ ಚಟುವಟಿಕೆ", "ಉಪಕರಣ ಬಾಡಿಗೆ", ಅಥವಾ "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು".';
      }

      const assistantMsg = { type: 'assistant', message: response, time: new Date().toLocaleTimeString() };
      setChatHistory(prev => [...prev, assistantMsg]);
      
      // Speak the response
      speakText(response);
      
      // Navigate if needed
      if (shouldNavigate && navigatePath) {
        setTimeout(() => {
          navigate(navigatePath);
        }, 2000);
      }
      
      setCurrentMessage('');
    }, 500);
  };

  return (
    <div className="voice-support-page">
      <div className="page-header">
        <h1>
          <Volume2 size={32} />
          {language === 'en' ? 'Voice & Language Support' : 'ಧ್ವನಿ ಮತ್ತು ಭಾಷಾ ಬೆಂಬಲ'}
        </h1>
        <p>{language === 'en' ? 'Voice input and bilingual support for easy access' : 'ಸುಲಭ ಪ್ರವೇಶಕ್ಕಾಗಿ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಮತ್ತು ದ್ವಿಭಾಷಾ ಬೆಂಬಲ'}</p>
      </div>

      <div className="voice-support-container">
        {/* Voice Input Section */}
        <div className="voice-section">
          <div className="section-card">
            <div className="section-header">
              <h2>
                <Mic size={24} />
                {language === 'en' ? 'Voice-to-Text Input' : 'ಧ್ವನಿ-ಟು-ಪಠ್ಯ ಇನ್‌ಪುಟ್'}
              </h2>
            </div>
            <div className="voice-input-area">
              <div className={`microphone-button ${isListening ? 'listening' : ''}`}>
                <button
                  className="mic-btn"
                  onClick={isListening ? stopVoiceInput : startVoiceInput}
                >
                  {isListening ? <Square size={48} /> : <Mic size={48} />}
                </button>
              </div>
              <p className="voice-status">
                {isListening 
                  ? (language === 'en' ? 'Listening...' : 'ಆಲಿಸುತ್ತಿದೆ...')
                  : (language === 'en' ? 'Click microphone to start speaking' : 'ಮಾತನಾಡಲು ಮೈಕ್ರೊಫೋನ್ ಕ್ಲಿಕ್ ಮಾಡಿ')
                }
              </p>
              {transcript && (
                <div className="transcript-box">
                  <h4>{language === 'en' ? 'Transcript:' : 'ಪ್ರತಿಲಿಪಿ:'}</h4>
                  <p>{transcript}</p>
                </div>
              )}
            </div>
          </div>

          {/* Kannada Keyboard Section */}
          <div className="section-card">
            <div className="section-header">
              <h2>
                <Keyboard size={24} />
                {language === 'en' ? 'Kannada Keyboard Input' : 'ಕನ್ನಡ ಕೀಬೋರ್ಡ್ ಇನ್‌ಪುಟ್'}
              </h2>
            </div>
            <div className="keyboard-demo">
              <textarea
                placeholder={language === 'en' ? 'Type in Kannada here...' : 'ಇಲ್ಲಿ ಕನ್ನಡದಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...'}
                rows="4"
                className="kannada-input"
              />
              <div className="keyboard-info">
                <p>
                  {language === 'en' 
                    ? '✓ Supports Kannada character input'
                    : '✓ ಕನ್ನಡ ಅಕ್ಷರ ಇನ್‌ಪುಟ್ ಅನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ'
                  }
                </p>
                <p>
                  {language === 'en'
                    ? '✓ Switch between English and Kannada easily'
                    : '✓ ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಕನ್ನಡ ನಡುವೆ ಸುಲಭವಾಗಿ ಬದಲಿಸಿ'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Assistant Section */}
        <div className="assistant-section">
          <div className="section-card">
            <div className="section-header">
              <h2>
                <MessageCircle size={24} />
                {language === 'en' ? 'Voice Assistant' : 'ಧ್ವನಿ ಸಹಾಯಕ'}
              </h2>
              <button 
                className={`btn ${voiceAssistantActive ? 'btn-danger' : 'btn-primary'}`}
                onClick={toggleVoiceAssistant}
              >
                {voiceAssistantActive 
                  ? (language === 'en' ? 'Deactivate' : 'ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಿ')
                  : (language === 'en' ? 'Activate Assistant' : 'ಸಹಾಯಕ ಸಕ್ರಿಯಗೊಳಿಸಿ')
                }
              </button>
            </div>

            {voiceAssistantActive && (
              <div className="chat-interface">
                <div className="chat-messages">
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.type}`}>
                      <div className="message-content">
                        <p>{msg.message}</p>
                        <span className="message-time">{msg.time}</span>
                      </div>
                      <button 
                        className="speak-btn"
                        onClick={() => speakText(msg.message)}
                        title={language === 'en' ? 'Speak this message' : 'ಈ ಸಂದೇಶವನ್ನು ಮಾತನಾಡಿಸಿ'}
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="chat-input">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleVoiceQuery()}
                    placeholder={language === 'en' ? 'Ask me anything...' : 'ನನ್ನನ್ನು ಏನು ಬೇಕಾದರೂ ಕೇಳಿ...'}
                  />
                  <button className="btn btn-primary" onClick={handleVoiceQuery}>
                    {language === 'en' ? 'Send' : 'ಕಳುಹಿಸಿ'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={startVoiceInput}
                    title={language === 'en' ? 'Voice input' : 'ಧ್ವನಿ ಇನ್‌ಪುಟ್'}
                  >
                    <Mic size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Commands */}
          <div className="section-card">
            <div className="section-header">
              <h2>
                <HelpCircle size={24} />
                {language === 'en' ? 'Navigation Commands' : 'ಸಂಚಾರ ಆಜ್ಞೆಗಳು'}
              </h2>
            </div>
            <div className="commands-list">
              {navigationCommands.map((cmd, index) => (
                <div key={index} className="command-item">
                  <div className="command-text">
                    <span className="command-icon">🎤</span>
                    <span>{language === 'en' ? cmd.command : cmd.kannadaCommand}</span>
                  </div>
                  <button 
                    className="btn btn-sm"
                    onClick={() => {
                      setCurrentMessage(language === 'en' ? cmd.command : cmd.kannadaCommand);
                      setTimeout(() => handleVoiceQuery(), 100);
                    }}
                  >
                    {language === 'en' ? 'Try' : 'ಪ್ರಯತ್ನಿಸಿ'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div className="section-card">
            <div className="section-header">
              <h2>
                <HelpCircle size={24} />
                {language === 'en' ? 'Frequently Asked Questions' : 'ಆಗಾಗ್ಗೆ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು'}
              </h2>
            </div>
            <div className="faq-list">
              {voiceFAQs.map((faq, index) => (
                <div key={index} className="faq-item">
                  <h4>{language === 'en' ? faq.question : faq.kannadaQuestion}</h4>
                  <p>{language === 'en' ? faq.answer : faq.kannadaAnswer}</p>
                  <button 
                    className="speak-answer-btn"
                    onClick={() => speakText(language === 'en' ? faq.answer : faq.kannadaAnswer)}
                  >
                    <Volume2 size={16} />
                    {language === 'en' ? 'Speak Answer' : 'ಉತ್ತರ ಮಾತನಾಡಿಸಿ'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSupport;
