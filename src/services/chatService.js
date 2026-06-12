import { ref, push, set, update, onValue, query, orderByChild, equalTo, get } from 'firebase/database';
import { database } from '../config/firebase';

// Create a new chat between farmer and buyer
export const createChat = async (farmerId, farmerName, buyerId, buyerName, listingId = null) => {
  try {
    const chatsRef = ref(database, 'chats');
    const newChatRef = push(chatsRef);
    
    const chatId = newChatRef.key;
    const chat = {
      id: chatId,
      farmerId,
      farmerName,
      buyerId,
      buyerName,
      listingId,
      createdAt: new Date().toISOString(),
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: { farmer: 0, buyer: 0 }
    };
    
    await set(newChatRef, chat);
    return { success: true, chatId };
  } catch (error) {
    console.error('Error creating chat:', error);
    return { success: false, error: error.message };
  }
};

// Send a message in a chat
export const sendMessage = async (chatId, senderId, senderName, senderRole, message) => {
  try {
    const messagesRef = ref(database, `messages/${chatId}`);
    const newMessageRef = push(messagesRef);
    
    const messageData = {
      id: newMessageRef.key,
      senderId,
      senderName,
      senderRole,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    await set(newMessageRef, messageData);
    
    // Update chat's last message without overwriting the chat record.
    const chatRef = ref(database, `chats/${chatId}`);
    const chatSnapshot = await get(chatRef);
    const chat = chatSnapshot.val() || {};
    const receiverRole = senderRole === 'farmer' ? 'buyer' : 'farmer';
    const currentUnread = Number(chat?.unreadCount?.[receiverRole] || 0);

    await update(chatRef, {
      lastMessage: message.substring(0, 50),
      lastMessageTime: new Date().toISOString(),
      [`unreadCount/${receiverRole}`]: currentUnread + 1
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
};

// Get all chats for a user
export const getUserChats = (userId, userRole, callback) => {
  const chatsRef = ref(database, 'chats');
  const roleField = userRole === 'farmer' ? 'farmerId' : 'buyerId';
  const userChatsQuery = query(chatsRef, orderByChild(roleField), equalTo(userId));
  
  return onValue(userChatsQuery, (snapshot) => {
    const data = snapshot.val();
    const chats = data ? Object.values(data).sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    ) : [];
    callback(chats);
  });
};

// Get messages for a specific chat
export const getChatMessages = (chatId, callback) => {
  const messagesRef = ref(database, `messages/${chatId}`);
  
  return onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    const messages = data ? Object.values(data).sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    ) : [];
    callback(messages);
  });
};

// Check if chat exists between two users
export const findExistingChat = async (farmerId, buyerId) => {
  try {
    const chatsRef = ref(database, 'chats');
    const snapshot = await get(chatsRef);
    
    if (snapshot.exists()) {
      const chats = Object.values(snapshot.val());
      const existingChat = chats.find(chat => 
        chat.farmerId === farmerId && chat.buyerId === buyerId
      );
      return existingChat ? existingChat.id : null;
    }
    return null;
  } catch (error) {
    console.error('Error finding chat:', error);
    return null;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (chatId, userRole) => {
  try {
    const chatRef = ref(database, `chats/${chatId}/unreadCount/${userRole}`);
    await set(chatRef, 0);
    return { success: true };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error: error.message };
  }
};
