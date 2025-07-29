import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Smile, Paperclip, MessageCircle, Minimize2 } from 'lucide-react';
import { distance } from 'fastest-levenshtein';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  isNotification?: boolean;
}

interface NotificationData {
  title: string;
  message: string;
  email: string;
}

interface ChatSession {
  messages: Message[];
  userEmail: string;
  sessionId: string;
  isFirstMessage: boolean;
  hasSubmittedEmail: boolean;
}

interface FAQ {
  question: string;
  answer: string;
  keywords: string[];
}

// FAQ Database - Add your common questions here
const FAQ_DATABASE: FAQ[] = [
  {
    question: "Hii",
    answer: "Hii there! How can I assist you today?",
    keywords: ["hi", "hello", "greetings","Whatsaap", "howdy"]
  },
   {
    question: "Thank you",
    answer: "You're welcome! If you have any more questions or need assistance, feel free to ask.",
    keywords: ["thanks","Thanks", "thank you", "appreciate it", "grateful"]
  },
  {
    question: "What is OPPZ AI?",
    answer: "OPPZ AI helps automate your job search using AI-powered resume matching, application submission, and tracking — all from one dashboard.",
    keywords: ["oppz ai", "what is oppz", "oppz", "platform", "ai tool"]
  },
  {
    question: "How do I install the Chrome Extension?",
    answer: "Go to the Chrome Web Store, search for 'OPPZ AI', and click 'Add to Chrome'. Once installed, pin it to your toolbar for easy access.",
    keywords: ["install extension", "chrome extension", "how to install", "browser plugin"]
  },
  {
    question: "Can I use OPPZ AI without the extension?",
    answer: "The Chrome Extension is required for auto-applying and job scraping features. The dashboard works without it, but with limited functionality.",
    keywords: ["without extension", "no plugin", "extension required", "without chrome"]
  },
  {
    question: "Does OPPZ AI apply for jobs automatically?",
    answer: "Yes! Once set up, OPPZ AI automatically applies to jobs that match your profile using your saved templates and preferences.",
    keywords: ["auto apply", "automatically", "auto-apply", "apply for me"]
  },
  {
    question: "How do I update my resume?",
    answer: "Visit your dashboard, go to 'Profile Builder', and upload your latest resume. OPPZ AI will use it for all future applications.",
    keywords: ["upload resume", "update cv", "resume update", "new resume"]
  },
  {
    question: "Can I customize my job filters?",
    answer: "Yes. Use the filter settings on your dashboard or extension to exclude certain job types, companies, or roles.",
    keywords: ["filters", "job filters", "custom filters", "skip"]
  },
  {
    question: "Where can I track my job applications?",
    answer: "In the 'Application Tracker' section of the dashboard, you can see every job OPPZ AI has applied for — including status and date.",
    keywords: ["track", "status", "job history", "application tracking"]
  },
  {
    question: "Is there a mobile app for OPPZ AI?",
    answer: "Not yet, but we're working on it! For now, use the web dashboard and Chrome Extension.",
    keywords: ["mobile", "app", "android", "iphone"]
  },
  {
    question: "What if the job form is different?",
    answer: "Our AI handles most standard forms. If a job form is unusual, you can report it via the extension so we can add support.",
    keywords: ["form issue", "broken form", "error", "different form"]
  },
  {
    question: "How do I pause auto-apply?",
    answer: "Click the toggle in your extension or dashboard to pause the auto-apply feature anytime.",
    keywords: ["pause", "stop applying", "turn off", "disable"]
  },
  {
    question: "Is there a free plan?",
    answer: "Yes! Our free plan allows limited job tracking and profile setup. Upgrade for full auto-apply features.",
    keywords: ["free", "pricing", "free version", "trial"]
  },
  {
    question: "How many jobs can OPPZ AI apply to per day?",
    answer: "Depending on your plan, OPPZ AI can apply to 20–200 jobs daily. You control the limit in settings.",
    keywords: ["apply limit", "daily jobs", "how many", "quota"]
  },
  {
    question: "Can I see what jobs were skipped?",
    answer: "Yes, the dashboard shows skipped jobs along with the reason — such as filter matches or duplicates.",
    keywords: ["skipped", "ignored", "not applied", "why skipped"]
  },
  {
    question: "Does it work with LinkedIn Premium?",
    answer: "Yes, OPPZ AI supports all LinkedIn versions including Premium.",
    keywords: ["linkedin", "premium", "linkedin job"]
  },
  {
    question: "How do I contact support?",
    answer: "You can chat with us here, or email support@oppz.ai anytime. We respond within 24 hours.",
    keywords: ["contact", "email", "support", "help team"]
  },
  {
    question: "What is Profile Completion?",
    answer: "Profile Completion shows how much of your profile is filled out. 100% helps OPPZ AI better match jobs.",
    keywords: ["profile", "completion", "setup", "complete profile"]
  },
  {
    question: "Can I export my application history?",
    answer: "Yes. Go to 'Application Tracker' and click 'Export CSV' to download your data.",
    keywords: ["export", "csv", "download", "history"]
  },
  {
    question: "Is OPPZ AI safe to use?",
    answer: "Absolutely. We use encryption and follow data privacy best practices. Your info is never sold or shared.",
    keywords: ["safe", "secure", "private", "data safety"]
  },
  {
    question: "What job platforms does it support?",
    answer: "Currently, OPPZ AI supports LinkedIn, Indeed, Monster, Glassdoor, and more being added weekly.",
    keywords: ["supported platforms", "which sites", "job board", "indeed"]
  },
  {
    question: "Can I save custom answers for applications?",
    answer: "Yes! Use the 'Question Library' to save pre-written answers to common job application questions.",
    keywords: ["saved answers", "reusable", "question library", "templates"]
  },
  {
    question: "How often does the extension update?",
    answer: "We roll out updates weekly to support more job platforms, fix bugs, and improve matching.",
    keywords: ["update", "extension update", "new version"]
  },
  {
    question: "Can I refer a friend?",
    answer: "Yes! Share your referral link and earn discounts when your friends sign up.",
    keywords: ["refer", "referral", "invite friends"]
  },
  {
    question: "Where can I change my email or password?",
    answer: "Go to 'Account Settings' in the dashboard to update your email, password, or subscription details.",
    keywords: ["change email", "change password", "account settings"]
  },
  {
    question: "What does auto-apply mean?",
    answer: "Auto-apply means OPPZ AI fills and submits job applications on your behalf using your saved info.",
    keywords: ["auto apply", "automatic apply", "one-click apply"]
  },
  {
    question: "What makes OPPZ AI different from other job platforms?",
    answer: "Unlike traditional job boards, OPPZ AI actively applies for you, saves time, and learns your preferences to improve match quality over time.",
    keywords: ["why oppz", "oppz vs", "better", "difference"]
  }
];


// Simple in-memory storage
const chatStorage = {
  session: null as ChatSession | null
};

// Generate unique session ID
function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveChatSession(session: ChatSession) {
  chatStorage.session = { ...session };
}

function getChatSession(): ChatSession | null {
  return chatStorage.session;
}

// Function to find matching FAQ
function findMatchingFAQ(userMessage: string): FAQ | null {
  const normalizedMessage = userMessage.toLowerCase();

  // Try keyword match first
  for (const faq of FAQ_DATABASE) {
    for (const keyword of faq.keywords) {
      if (normalizedMessage.includes(keyword.toLowerCase())) {
        return faq;
      }
    }
  }

  // If no direct keyword match, apply fuzzy logic
  let bestMatch: FAQ | null = null;
  let lowestDistance = Infinity;

  for (const faq of FAQ_DATABASE) {
    const question = faq.question.toLowerCase();
    const d = distance(normalizedMessage, question);

    if (d < lowestDistance && d <= 10) { // Accept if distance is reasonable
      bestMatch = faq;
      lowestDistance = d;
    }
  }

  return bestMatch;
}
 

export const Contect: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState<NotificationData>({
    title: '',
    message: 'We reply in 24 hours or less, please leave your contact info so we can get back to you.',
    email: ''
  });
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  
  // Persistent chat session state
  const [chatSession, setChatSession] = useState<ChatSession>(() => {
    const savedSession = getChatSession();
    return savedSession || {
      messages: [],
      userEmail: '',
      sessionId: generateSessionId(),
      isFirstMessage: true,
      hasSubmittedEmail: false
    };
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save session whenever it changes
  useEffect(() => {
    saveChatSession(chatSession);
  }, [chatSession]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatSession.messages]);

  useEffect(() => {
    if (isOpen) {
      setHasUnreadMessages(false);
    }
  }, [isOpen]);

  const handleToggleChat = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      const savedSession = getChatSession();
      if (savedSession) {
        setChatSession(savedSession);
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update chat session with new message
    setChatSession(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));

    const userMessageText = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // Check if the message matches any FAQ
    const matchingFAQ = findMatchingFAQ(userMessageText);
    
    if (matchingFAQ) {
      // Respond with FAQ answer
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: matchingFAQ.answer,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setChatSession(prev => ({
          ...prev,
          messages: [...prev.messages, botResponse]
        }));
        
        setIsTyping(false);
        if (!isOpen) {
          setHasUnreadMessages(true);
        }
      }, 1000);
    } else {
      // Question not in FAQ - show email form if first message or email not submitted
      if (chatSession.isFirstMessage && !chatSession.hasSubmittedEmail) {
        setShowNotification(true);
        setChatSession(prev => ({
          ...prev,
          isFirstMessage: false
        }));
      }

      // Simulate backend response for non-FAQ questions
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: chatSession.hasSubmittedEmail 
            ? `I understand you're asking about "${userMessageText}". Our team will review your query and get back to you within 24 hours. Is there anything else I can help you with from our common questions?`
            : `Thank you for your question about "${userMessageText}". This seems like a specific inquiry that our team should handle personally. Please provide your email so we can give you a detailed response within 24 hours.`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setChatSession(prev => ({
          ...prev,
          messages: [...prev.messages, botResponse]
        }));
        
        setIsTyping(false);
        if (!isOpen) {
          setHasUnreadMessages(true);
        }
      }, 1500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNotificationSubmit = async () => {
    // Update chat session with user email
    setChatSession(prev => ({
      ...prev,
      userEmail: notificationData.email,
      hasSubmittedEmail: true
    }));

    // Here you would send the data to your backend
    const contactData = {
      email: notificationData.email,
      problem: chatSession.messages.find(msg => msg.sender === 'user')?.text || 'No initial message',
      sessionId: chatSession.sessionId,
      allMessages: chatSession.messages
    };

    console.log('Contact submitted:', contactData);
    
    setShowNotification(false);
    
    // Add a confirmation message
    const confirmationMessage: Message = {
      id: (Date.now() + 2).toString(),
      text: "Thank you! We've received your contact information and will get back to you within 24 hours. In the meantime, feel free to ask me about our services, pricing, or any other common questions!",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatSession(prev => ({
      ...prev,
      messages: [...prev.messages, confirmationMessage]
    }));
  };

  const closeNotification = () => {
    setShowNotification(false);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Button */}
      {!isOpen && (
        <div className="relative p-4 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 transition-all duration-600 transform hover:scale-110 shadow-[0_0_20px_rgba(139,92,246,0.6)] group">
          <button
            onClick={handleToggleChat}
            className="relative bg-gradient-to-br from-indigo-700 to-purple-800 text-white p-4 rounded-full shadow-md transition-all duration-300 transform hover:scale-110"
          >
            <MessageCircle
              size={24}
              className="transition-transform duration-500 ease-in-out group-hover:rotate-90"
            />
            {hasUnreadMessages && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className={`bg-white rounded-2xl shadow-2xl transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-96 mb-8 h-[500px]'
        }`}>
          {/* Header */}
          <div className="bg-black text-white p-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <img src="/OPPZ_Ai_Logo.png" alt="Logo" className="w-8 h-8" />
              </div>
              <div>
                <span className="font-semibold">OPPZ AI</span>
                {chatSession.hasSubmittedEmail && (
                  <div className="text-xs text-gray-400">
                    Session: {chatSession.sessionId.slice(-6)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={isMinimized ? handleMaximize : handleMinimize}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Minimize2 size={20} />
              </button>
              <button
                onClick={handleCloseChat}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Chat Content - Hidden when minimized */}
          {!isMinimized && (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96">
                {chatSession.messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                    <p className="text-center">
                      👋 Hello! I'm OPPZ AI assistant. Ask me anything!
                    </p>
                      
                  </div>
                )}
                
                {chatSession.messages.map((message) => (
                  <div key={message.id} className="flex flex-col">
                    {message.sender === 'user' ? (
                      <div className="flex justify-end">
                        <div className="bg-purple-500 text-white px-4 py-2 rounded-2xl max-w-xs">
                          {message.text}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div className="bg-black text-white px-4 py-2 rounded-2xl max-w-xs">
                          {message.text}
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1 px-2">
                      {message.timestamp}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-black text-white px-4 py-2 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 bg-gray-50 rounded-b-2xl">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything..."
                      className="w-full p-3 pr-20 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Smile size={20} />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Paperclip size={20} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={inputMessage.trim() === ''}
                    className="bg-purple-500 text-white p-3 rounded-2xl hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Notification Popup */}
      {showNotification && isOpen && !isMinimized && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 rounded-2xl">
          <div className="bg-black text-white rounded-2xl p-6 max-w-sm w-full mx-4 relative">
            <button
              onClick={closeNotification}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <div className="space-y-4">
              <div className="mb-6">
                <p className="text-sm text-gray-300">
                  {notificationData.message}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={notificationData.email}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-transparent border-b border-gray-600 focus:border-purple-500 focus:outline-none text-white"
                  placeholder="your@email.com"
                />
              </div>
              
              <button
                onClick={handleNotificationSubmit}
                disabled={!notificationData.email.trim()}
                className="w-full bg-gray-700 text-white py-3 rounded-2xl hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};