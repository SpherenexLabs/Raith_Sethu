import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MessageCircle, Send, User, Search, Loader } from 'lucide-react';
import { getUserChats, getChatMessages, sendMessage, markMessagesAsRead } from '../services/chatService';

const Chat = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) return;

    const userRole = user.role || 'farmer';
    const unsubscribe = getUserChats(user.uid, userRole, (chatsData) => {
      setChats(chatsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!selectedChat) return;

    const unsubscribe = getChatMessages(selectedChat.id, (messagesData) => {
      setMessages(messagesData);
      scrollToBottom();
    });

    // Mark messages as read
    const userRole = user.role || 'farmer';
    markMessagesAsRead(selectedChat.id, userRole);

    return () => unsubscribe();
  }, [selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const userRole = user.role || 'farmer';
    await sendMessage(
      selectedChat.id,
      user.uid,
      user.name || 'User',
      userRole,
      newMessage
    );

    setNewMessage('');
  };

  const filteredChats = chats.filter(chat => {
    const otherUserName = user.role === 'farmer' ? chat.buyerName : chat.farmerName;
    return otherUserName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="chat-page">
        <div className="loading">
          <Loader size={48} className="spinner" />
          <p>Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="page-header">
        <h1>
          <MessageCircle size={32} />
          Messages
        </h1>
        <p>Chat with {user.role === 'farmer' ? 'buyers' : 'farmers'} in real-time</p>
      </div>

      <div className="chat-container">
        {/* Chat List */}
        <div className="chat-list">
          <div className="chat-list-header">
            <h3>Conversations</h3>
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="chats-scroll">
            {filteredChats.length === 0 ? (
              <div className="no-chats">
                <MessageCircle size={48} color="#ccc" />
                <p>No conversations yet</p>
                <small>Start chatting from marketplace listings</small>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const otherUserName = user.role === 'farmer' ? chat.buyerName : chat.farmerName;
                const isSelected = selectedChat?.id === chat.id;

                return (
                  <div
                    key={chat.id}
                    className={`chat-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="chat-avatar">
                      <User size={24} />
                    </div>
                    <div className="chat-info">
                      <div className="chat-header">
                        <h4>{otherUserName}</h4>
                        <span className="chat-time">{formatTime(chat.lastMessageTime)}</span>
                      </div>
                      <p className="chat-preview">{chat.lastMessage || 'Start conversation'}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="chat-messages-container">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <div className="chat-avatar">
                  <User size={28} />
                </div>
                <div>
                  <h3>{user.role === 'farmer' ? selectedChat.buyerName : selectedChat.farmerName}</h3>
                  <span className="online-status">Active</span>
                </div>
              </div>

              <div className="messages-list">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message ${msg.senderId === user.uid ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <p>{msg.message}</p>
                      <span className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-input-container" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" disabled={!newMessage.trim()}>
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <MessageCircle size={64} color="#ccc" />
              <h3>Select a conversation</h3>
              <p>Choose a chat from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
