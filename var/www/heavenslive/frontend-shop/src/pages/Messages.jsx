import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './Messages.css';

const Messages = () => {
    const { t } = useTranslation();
    const { conversationId } = useParams();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    useEffect(() => { fetchConversations(); }, []);
    useEffect(() => { if (conversationId && conversations.length) { const conv = conversations.find(c => c.id === conversationId); if (conv) { setSelectedConversation(conv); fetchMessages(conversationId); } } }, [conversationId, conversations]);
    useEffect(() => { scrollToBottom(); }, [messages]);

    const fetchConversations = async () => {
        try { const res = await axios.get('/api/shop/messages/conversations', { headers: { Authorization: `Bearer ${token}` } }); setConversations(res.data.conversations || []); }
        catch (err) { console.error('Failed to fetch conversations:', err); } finally { setLoading(false); }
    };
    const fetchMessages = async (convId) => {
        try { const res = await axios.get(`/api/shop/messages/conversations/${convId}/messages`, { headers: { Authorization: `Bearer ${token}` } }); setMessages(res.data.messages || []); fetchConversations(); }
        catch (err) { console.error('Failed to fetch messages:', err); }
    };
    const handleSelectConversation = (conv) => { setSelectedConversation(conv); fetchMessages(conv.id); };
    const handleSendMessage = async (e) => {
        e.preventDefault(); if (!newMessage.trim() || !selectedConversation) return; setSending(true);
        try { await axios.post(`/api/shop/messages/conversations/${selectedConversation.id}/messages`, { message: newMessage }, { headers: { Authorization: `Bearer ${token}` } }); setNewMessage(''); fetchMessages(selectedConversation.id); }
        catch (err) { alert('Failed: ' + (err.response?.data?.error || err.message)); } finally { setSending(false); }
    };
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
    const getOtherParty = (conv) => user ? (conv.buyer_id === user.id ? (conv.seller_name || conv.seller_email) : (conv.buyer_name || conv.buyer_email)) : 'Unknown';

    if (loading) return <div className="messages-loading">{t('common.loading')}</div>;
    return (
        <div className="messages-page">
            <h1>{t('messages.title')}</h1>
            <Link to="/" className="back-link">{t('messages.backToShop')}</Link>
            <div className="messages-container">
                <div className="conversations-sidebar">
                    <h3>{t('messages.conversations')}</h3>
                    {conversations.length === 0 ? <p className="no-conversations">{t('messages.noConversations')}</p> : (
                        <div className="conversations-list">{conversations.map(conv => (
                            <div key={conv.id} className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''} ${conv.unread_count > 0 ? 'unread' : ''}`} onClick={() => handleSelectConversation(conv)}>
                                <div className="conv-avatar">{conv.listing_image ? <img src={conv.listing_image} alt="" /> : <span>📦</span>}</div>
                                <div className="conv-info"><div className="conv-header"><span className="conv-with">{getOtherParty(conv)}</span>{conv.unread_count > 0 && <span className="unread-badge">{conv.unread_count}</span>}</div><div className="conv-subject">{conv.listing_title || 'General'}</div><div className="conv-last-message">{conv.last_message || 'No messages'}</div></div>
                            </div>
                        ))}</div>
                    )}
                </div>
                <div className="messages-main">
                    {selectedConversation ? (
                        <>
                            <div className="messages-header"><div className="conversation-info"><h3>{getOtherParty(selectedConversation)}</h3><p className="conversation-subject">Re: {selectedConversation.listing_title || 'General'}</p></div></div>
                            <div className="messages-list">{messages.length === 0 ? <p className="no-messages">{t('messages.startConversation')}</p> : messages.map(msg => (
                                <div key={msg.id} className={`message-item ${msg.sender_id === user?.id ? 'sent' : 'received'}`}><div className="message-bubble"><div className="message-sender">{msg.sender_name}</div><div className="message-content">{msg.message}</div><div className="message-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div></div>
                            ))}<div ref={messagesEndRef} /></div>
                            <form className="message-input-form" onSubmit={handleSendMessage}><input type="text" placeholder={t('messages.typeMessage')} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={sending} /><button type="submit" disabled={sending || !newMessage.trim()}>{sending ? t('messages.sending') : t('messages.send')}</button></form>
                        </>
                    ) : (<div className="no-conversation-selected"><p>{t('messages.selectConversation')}</p></div>)}
                </div>
            </div>
        </div>
    );
};
export default Messages;
