import React, { useState, useRef, useEffect } from 'react';
import { Send, Moon, Sun, Save, Download, Copy, Trash2, Bot, User } from 'lucide-react';

const InkBot = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedConversations, setSavedConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [apiUrl, setApiUrl] = useState('https://f0523cdfafec8c1cc1.gradio.live');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load saved conversations from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('inkbot-conversations');
    if (saved) {
      setSavedConversations(JSON.parse(saved));
    }
    // Test connection on startup
    testConnection();
  }, []);

  const saveConversationsToStorage = (conversations) => {
    localStorage.setItem('inkbot-conversations', JSON.stringify(conversations));
  };

  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionStatus('error');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputMessage.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          history: messages
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.error);
      }
      
      const assistantMessage = { role: 'assistant', content: data.response };
      setMessages([...updatedMessages, assistantMessage]);
      setConnectionStatus('connected');
      
    } catch (error) {
      console.error('API Error:', error);
      setConnectionStatus('error');
      const errorMessage = {
        role: 'assistant',
        content: `❌ Connection Error: ${error.message}\n\n**Troubleshooting Steps:**\n1. Verify your backend is running\n2. Check the API URL: ${apiUrl}\n3. Test the health endpoint: ${apiUrl}/api/health\n4. Make sure CORS is enabled on your backend\n\n**Backend Status:** ${connectionStatus}`
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const saveCurrentConversation = () => {
    if (messages.length === 0) return;

    const timestamp = new Date().toISOString();
    const conversationTitle = messages[0]?.content.substring(0, 50) + '...' || 'New Conversation';
    
    const newConversation = {
      id: currentConversationId || Date.now().toString(),
      title: conversationTitle,
      messages: messages,
      timestamp: timestamp
    };

    let updatedConversations;
    if (currentConversationId) {
      updatedConversations = savedConversations.map(conv => 
        conv.id === currentConversationId ? newConversation : conv
      );
    } else {
      updatedConversations = [newConversation, ...savedConversations];
      setCurrentConversationId(newConversation.id);
    }

    setSavedConversations(updatedConversations);
    saveConversationsToStorage(updatedConversations);
  };

  const loadConversation = (conversation) => {
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const deleteConversation = (conversationId) => {
    const updatedConversations = savedConversations.filter(conv => conv.id !== conversationId);
    setSavedConversations(updatedConversations);
    saveConversationsToStorage(updatedConversations);
    
    if (currentConversationId === conversationId) {
      startNewConversation();
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const exportConversation = () => {
    if (messages.length === 0) return;
    
    const conversationText = messages.map(msg => 
      `${msg.role.toUpperCase()}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ink-bot-conversation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'testing': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '● Connected';
      case 'testing': return '● Testing...';
      case 'error': return '● Disconnected';
      default: return '● Unknown';
    }
  };

  const themeClasses = isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';
  const chatBgClasses = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const inputBgClasses = isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';
  const buttonClasses = isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600';
  const sidebarClasses = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen ${themeClasses} transition-colors duration-300`}>
      <div className="flex h-screen">
        {/* Sidebar for saved conversations */}
        <div className={`w-80 ${sidebarClasses} border-r flex flex-col`}>
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold mb-3">💬 Conversations</h2>
            <button
              onClick={startNewConversation}
              className={`w-full ${buttonClasses} text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium`}
            >
              + New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {savedConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentConversationId === conversation.id
                    ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100')
                    : (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                }`}
              >
                <div
                  onClick={() => loadConversation(conversation)}
                  className="flex-1"
                >
                  <div className="font-medium text-sm truncate">{conversation.title}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    {new Date(conversation.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                  className={`mt-2 p-1 rounded ${isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* API Configuration */}
          <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="mb-2">
              <label className="text-xs font-medium">Backend URL:</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className={`w-full mt-1 px-2 py-1 text-xs rounded border ${inputBgClasses}`}
                placeholder="https://your-backend.gradio.live"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${getConnectionStatusColor()}`}>
                {getConnectionStatusText()}
              </span>
              <button
                onClick={testConnection}
                className={`text-xs px-2 py-1 rounded ${buttonClasses} text-white`}
              >
                Test
              </button>
            </div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className={`${chatBgClasses} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4 flex justify-between items-center`}>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bot className="text-blue-500" size={28} />
                INK Bot
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                🤖 Powered by Google Gemini - Your Research Assistant
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {messages.length > 0 && (
                <>
                  <button
                    onClick={saveCurrentConversation}
                    className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                    title="Save Conversation"
                  >
                    <Save size={20} />
                  </button>
                  <button
                    onClick={exportConversation}
                    className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                    title="Export Conversation"
                  >
                    <Download size={20} />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} size={48} />
                <h2 className="text-xl font-semibold mb-2">Welcome to INK Bot! 🔬</h2>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-md mx-auto`}>
                  I'm your AI research assistant powered by Google Gemini. Ask me anything about your research, 
                  request explanations, or get help with analysis.
                </p>
                <div className={`mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto text-sm`}>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    💡 "Explain quantum computing"
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    📊 "Help me analyze this data"
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    📝 "Write a research summary"
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    🔍 "Literature review on AI"
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-4xl p-4 rounded-lg ${
                    message.role === 'user'
                      ? `${buttonClasses} text-white`
                      : `${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {message.role === 'user' ? (
                          <User size={16} className="opacity-70" />
                        ) : (
                          <Bot size={16} className="text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                        <button
                          onClick={() => copyMessage(message.content)}
                          className={`mt-2 p-1 rounded ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} opacity-70 hover:opacity-100 transition-opacity`}
                          title="Copy message"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className={`max-w-4xl p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <Bot size={16} className="text-blue-500" />
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span>INK Bot is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={`${chatBgClasses} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask INK Bot anything about your research..."
                className={`flex-1 p-3 rounded-lg border ${inputBgClasses} ${isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'} resize-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                rows="1"
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={`${buttonClasses} text-white p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Send message"
              >
                <Send size={20} />
              </button>
            </div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-2 text-center`}>
              Press Enter to send • Shift+Enter for new line • Backend: {connectionStatus}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InkBot;
