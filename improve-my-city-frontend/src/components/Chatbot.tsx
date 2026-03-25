import { useAuthStore } from '@/stores/authStore';
import { useState, useEffect, useRef } from 'react';
import { callApi } from '@/services/api';
import { issuesAPI } from '@/api/issues';
import type { IssueCategory } from '@/types';
import toast from 'react-hot-toast';
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RiMapPin2Line, RiLoader4Line, RiCloseLine, RiCameraLine } from 'react-icons/ri';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

type IssueCreationStep = 'idle' | 'title' | 'description' | 'category' | 'priority' | 'location' | 'images' | 'confirm';

const CATEGORIES: IssueCategory[] = [
  "Pothole",
  "Garbage",
  "Streetlight",
  "Water Supply",
  "Drainage",
  "Road Damage",
  "Parks",
  "Other",
];

const STORAGE_KEY = 'chatbot_messages';

export function Chatbot() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm Civica, your city assistant. I can help you check your issues, view community problems, or report a new issue. How can I help you?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Issue creation state
  const [creationStep, setCreationStep] = useState<IssueCreationStep>('idle');
  type IssueChatData = {
    title?: string;
    description?: string;
    category?: IssueCategory;
    priority?: 'low' | 'medium' | 'high';
    location?: { address: string; latitude: number; longitude: number };
  };
  const [issueData, setIssueData] = useState<IssueChatData>({});
  
  // New state for interactive form controls
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<number | null>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    if (user) {
      const storedMessages = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (storedMessages) {
        try {
          const parsed = JSON.parse(storedMessages);
          const formattedMessages = parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(formattedMessages);
        } catch (error) {
          console.error('Failed to parse stored messages:', error);
        }
      }
    }
  }, [user]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (user && messages.length > 1) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(messages));
    }
  }, [messages, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const clearHistory = () => {
    if (user) {
      localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
    }
    // Reset to welcome message only
    setMessages([
      {
        id: '1',
        text: "Hi! I'm Civica, your city assistant. I can help you check your issues, view community problems, or report a new issue. How can I help you?",
        isBot: true,
        timestamp: new Date(),
      },
    ]);
    setCreationStep('idle');
    setIssueData({});
    setUploadedImages([]);
    setUploadedFiles([]);
    setLocationInput('');
    setLocationSuggestions([]);
  };

  const addMessage = (text: string, isBot: boolean) => {
    const message: Message = {
      id: Date.now().toString() + Math.random(),
      text,
      isBot,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  // Location helper functions
  const fetchLocationSuggestions = async (query: string): Promise<any[]> => {
    if (!query || query.length < 3) return [];
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      return [];
    }
  };

  const getHumanReadableLocation = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error("Error fetching address:", error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const address = await getHumanReadableLocation(lat, lng);
        
        setLocationInput(address);
        setIssueData((prev) => ({
          ...prev,
          location: { address, latitude: lat, longitude: lng },
        }));
        setLocationSuggestions([]);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Could not get your location. Please enter it manually.");
        setIsGettingLocation(false);
      }
    );
  };

  const handleLocationInputChange = async (val: string) => {
    setLocationInput(val);
    
    if (val.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    setIsLoadingSuggestions(true);

    // Set new timer with 500ms delay
    debounceTimer.current = window.setTimeout(async () => {
      try {
        const results = await fetchLocationSuggestions(val);
        setLocationSuggestions(results);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 500);
  };

  const selectLocationSuggestion = (place: any) => {
    const address = place.display_name;
    setLocationInput(address);
    setIssueData((prev) => ({
      ...prev,
      location: {
        address,
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
      },
    }));
    setLocationSuggestions([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filesArray = Array.from(files);
    setUploadedFiles((prev) => [...prev, ...filesArray]);

    filesArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    addMessage(userMessage, false);
    setInput('');
    setIsTyping(true);

    // If we're in creation mode and user wants to cancel
    if (creationStep !== 'idle') {
      const cancelIntent = /(cancel|stop|nevermind|never mind|quit)/i;
      if (cancelIntent.test(userMessage)) {
        setCreationStep('idle');
        setIssueData({});
        setUploadedImages([]);
        setUploadedFiles([]);
        setLocationInput('');
        setLocationSuggestions([]);
        addMessage("Issue creation cancelled. How else can I help you?", true);
        setIsTyping(false);
        return;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    const response = await processMessage(userMessage);
    addMessage(response, true);
    setIsTyping(false);
  };

  const submitIssue = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (!issueData.title || !issueData.description || !issueData.category || !issueData.location) {
        toast.error("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      // Upload images first if any
      let photoUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        photoUrls = await issuesAPI.uploadIssueImages(uploadedFiles);
      }

      // Use API wrapper to include friendly fields (like priority) in normalized response
      await issuesAPI.createIssue(
        issueData.title,
        issueData.description,
        issueData.category,
        issueData.priority || 'medium',
        issueData.location,
        photoUrls,
        user?.id || '',
        user?.name || 'User'
      );

      addMessage("✅ Your issue has been reported successfully! You can view it in 'My Issues'.", true);
      toast.success('Issue reported successfully!');
      setCreationStep('idle');
      setIssueData({});
      setUploadedImages([]);
      setUploadedFiles([]);
      setLocationInput('');
      setLocationSuggestions([]);
    } catch (error) {
      console.error('Failed to create issue:', error);
      addMessage("Sorry, there was an error submitting your issue. Please try again later.", true);
      toast.error(`Failed to submit issue: ${error instanceof Error ? error.message : 'Please try again later.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const processMessage = async (message: string): Promise<string> => {
    if (!user) {
      return "Please login to use the chatbot. You can login from the top right corner.";
    }

    try {
      const response = await callApi('/chatbot/message', {
        method: 'POST',
        body: { message },
      }) as { message: string; timestamp: number; openForm?: boolean };

      // Check if the backend signaled to open the form
      if (response.openForm === true) {
        // Start issue creation flow
        setCreationStep('title');
        setIssueData({});
        setUploadedImages([]);
        setUploadedFiles([]);
        setLocationInput('');
        setLocationSuggestions([]);
        return response.message || "Sure! Let's report an issue. Please fill in the details below.";
      }

      return response.message;
    } catch (error: any) {
      console.error('Chatbot error:', error);
      return "I'm having trouble connecting right now. Please try again in a moment or check your issues directly on the dashboard.";
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-primary to-primary/80 dark:from-primary dark:to-primary/90 text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        aria-label="Open chat"
      >
        <svg 
          className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 group-hover:scale-110" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
          />
        </svg>
      </button>

      {/* Chat Window */}
      <div
        className={`fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[440px] sm:h-[650px] w-full h-full z-50 flex flex-col sm:rounded-3xl overflow-hidden transition-all duration-500 ease-out ${
          isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-8 pointer-events-none'
        }`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Backdrop blur effect */}
        <div className="absolute inset-0 bg-card/95 backdrop-blur-xl" />
        
        {/* Content */}
        <div className="relative flex flex-col h-full">
          {/* Header */}
          <div className="relative bg-linear-to-r from-primary to-primary/90 text-primary-foreground px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative">
                <img 
                  src="/civica.png" 
                  alt="Civica" 
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-primary-foreground/30"
                />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">Civica</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-xs text-primary-foreground/90">Smart help for a better city</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearHistory}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-full p-2 transition-all duration-200"
                aria-label="Clear history"
                title="Clear conversation history"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-full p-2 transition-all duration-200"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-4 bg-muted/30">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`flex items-end space-x-2 max-w-[85%] sm:max-w-[80%] ${message.isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
                  {message.isBot && (
                    <img 
                      src="/civica.png" 
                      alt="Civica" 
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 mb-1"
                    />
                  )}
                  <div>
                    <div
                      className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm ${
                        message.isBot
                          ? 'bg-card text-card-foreground rounded-tl-sm'
                          : 'bg-primary text-primary-foreground rounded-tr-sm'
                      }`}
                    >
                      <div className="text-xs sm:text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                        <ReactMarkdown
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-base sm:text-lg font-bold mb-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-sm sm:text-base font-bold mb-1.5" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-xs sm:text-sm font-semibold mb-1" {...props} />,
                            p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                            em: ({node, ...props}) => <em className="italic" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside my-1 space-y-0.5" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside my-1 space-y-0.5" {...props} />,
                            li: ({node, ...props}) => <li className="ml-2" {...props} />,
                            code: ({node, className, children, ...props}) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-muted/50 px-1 py-0.5 rounded text-xs" {...props}>
                                  {children}
                                </code>
                              ) : (
                                <code className="block bg-muted/50 p-2 rounded my-1 text-xs overflow-x-auto" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            a: ({node, ...props}) => <a className="underline hover:no-underline" target="_blank" rel="noopener noreferrer" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-muted-foreground/30 pl-2 italic my-1" {...props} />,
                          }}
                        >
                          {message.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <p className={`text-xs mt-1 px-1 ${message.isBot ? 'text-muted-foreground' : 'text-muted-foreground text-right'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-end space-x-2">
                  <img 
                    src="/civica.png" 
                    alt="Civica" 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 mb-1"
                  />
                  <div className="bg-card text-card-foreground rounded-2xl rounded-tl-sm px-4 sm:px-5 py-2.5 sm:py-3 shadow-sm">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area / Form */}
          <div className="p-4 bg-card border-t border-border">
            {creationStep === 'idle' ? (
              // Normal chat input
              <>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-all duration-200 placeholder:text-muted-foreground"
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary shadow-sm hover:shadow-md active:scale-95"
                    aria-label="Send message"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Powered by AI • Always here to help
                </p>
              </>
            ) : (
              // Issue creation form
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Report New Issue</h3>
                  <button
                    onClick={() => {
                      setCreationStep('idle');
                      setIssueData({});
                      setUploadedImages([]);
                      setUploadedFiles([]);
                      setLocationInput('');
                      setLocationSuggestions([]);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>

                {/* Title Input */}
                <div className="space-y-1">
                  <Label htmlFor="issue-title" className="text-xs">Title *</Label>
                  <Input
                    id="issue-title"
                    value={issueData.title || ''}
                    onChange={(e) => setIssueData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description"
                    className="h-9 text-sm"
                  />
                </div>

                {/* Description Textarea */}
                <div className="space-y-1">
                  <Label htmlFor="issue-description" className="text-xs">Description *</Label>
                  <Textarea
                    id="issue-description"
                    value={issueData.description || ''}
                    onChange={(e) => setIssueData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide more details..."
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>

                {/* Category Select */}
                <div className="space-y-1">
                  <Label className="text-xs">Category *</Label>
                  <Select
                    value={issueData.category}
                    onValueChange={(val) => setIssueData(prev => ({ ...prev, category: val as IssueCategory }))}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Select */}
                <div className="space-y-1">
                  <Label className="text-xs">Priority</Label>
                  <Select
                    value={issueData.priority || 'medium'}
                    onValueChange={(val) => setIssueData(prev => ({ ...prev, priority: val as 'low' | 'medium' | 'high' }))}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Input with Suggestions */}
                <div className="space-y-1">
                  <Label className="text-xs">Location *</Label>
                  <div className="relative">
                    <Input
                      value={locationInput}
                      onChange={(e) => handleLocationInputChange(e.target.value)}
                      placeholder="Enter address..."
                      className="h-9 text-sm"
                    />
                    
                    {/* Location Suggestions Dropdown */}
                    {locationSuggestions.length > 0 && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto z-50">
                        {locationSuggestions.map((place, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0 text-xs"
                            onClick={() => selectLocationSuggestion(place)}
                          >
                            <div className="flex items-start gap-2">
                              <RiMapPin2Line className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
                              <span className="line-clamp-2">{place.display_name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {isLoadingSuggestions && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-lg shadow-lg p-3 z-50">
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <RiLoader4Line className="w-3 h-3 animate-spin" />
                          Searching...
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={useCurrentLocation}
                    disabled={isGettingLocation}
                    className="h-7 text-xs mt-1"
                  >
                    <RiMapPin2Line className="w-3 h-3 mr-1" />
                    {isGettingLocation ? 'Getting location...' : 'Use current location'}
                  </Button>
                </div>

                {/* Image Upload */}
                <div className="space-y-1">
                  <Label className="text-xs">Photos (Optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="chatbot-image-upload"
                    />
                    <label htmlFor="chatbot-image-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <RiCameraLine className="w-5 h-5 text-primary" />
                        <p className="text-xs text-muted-foreground">
                          Click to upload
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Image Previews */}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <RiCloseLine className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  onClick={submitIssue}
                  className="w-full h-9 text-sm"
                  disabled={isSubmitting || !issueData.title || !issueData.description || !issueData.category || !issueData.location}
                >
                  {isSubmitting ? 'Submitting…' : 'Submit Issue'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}