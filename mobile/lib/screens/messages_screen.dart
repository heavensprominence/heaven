import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/auth_service.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});
  @override State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  List<Map<String, dynamic>> _conversations = [];
  bool _loading = true;

  @override void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final token = await AuthService().getToken();
    if (token == null) return;
    try {
      final resp = await http.get(
        Uri.parse('https://heavenslive.com/api/shop/messages/conversations'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        setState(() {
          _conversations = List<Map<String, dynamic>>.from(data['conversations'] ?? []);
          _loading = false;
        });
      }
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        backgroundColor: const Color(0xFF0F0F1A),
        foregroundColor: const Color(0xFFC8A951),
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator(color: Color(0xFFC8A951)))
        : _conversations.isEmpty
          ? const Center(child: Text('No messages yet', style: TextStyle(color: Colors.grey)))
          : ListView.builder(
              itemCount: _conversations.length,
              itemBuilder: (ctx, i) {
                final c = _conversations[i];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: const Color(0xFFC8A951).withOpacity(0.2),
                    child: Text((c['other_name'] ?? '?')[0].toUpperCase(),
                      style: const TextStyle(color: Color(0xFFC8A951))),
                  ),
                  title: Text(c['other_name'] ?? 'Unknown', style: const TextStyle(color: Colors.white)),
                  subtitle: Text(c['last_message'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.grey)),
                  trailing: c['unread_count'] != null && c['unread_count'] > 0
                    ? Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(
                        color: const Color(0xFFC8A951), borderRadius: BorderRadius.circular(12)),
                        child: Text('${c['unread_count']}', style: const TextStyle(color: Color(0xFF0F0F1A), fontSize: 11)))
                    : null,
                  onTap: () => _openChat(c),
                );
              },
            ),
    );
  }

  void _openChat(Map<String, dynamic> conv) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => _ChatScreen(conversation: conv)));
  }
}

class _ChatScreen extends StatefulWidget {
  final Map<String, dynamic> conversation;
  const _ChatScreen({required this.conversation});
  @override State<_ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<_ChatScreen> {
  final _controller = TextEditingController();
  List<Map<String, dynamic>> _messages = [];
  bool _loading = true;

  @override void initState() { super.initState(); _load(); }
  @override void dispose() { _controller.dispose(); super.dispose(); }

  Future<void> _load() async {
    final token = await AuthService().getToken();
    if (token == null) return;
    try {
      final resp = await http.get(
        Uri.parse('https://heavenslive.com/api/shop/messages/conversations/${widget.conversation['id']}'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        setState(() {
          _messages = List<Map<String, dynamic>>.from(data['messages'] ?? []).reversed.toList();
          _loading = false;
        });
      }
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    final token = await AuthService().getToken();
    if (token == null) return;
    try {
      await http.post(
        Uri.parse('https://heavenslive.com/api/shop/messages/conversations/${widget.conversation['id']}/messages'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({'message': text}),
      );
      _controller.clear();
      _load();
    } catch (e) { /* ignore */ }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.conversation['other_name'] ?? 'Chat'),
        backgroundColor: const Color(0xFF0F0F1A),
        foregroundColor: const Color(0xFFC8A951),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
              ? const Center(child: CircularProgressIndicator(color: Color(0xFFC8A951)))
              : ListView.builder(
                  reverse: true,
                  itemCount: _messages.length,
                  itemBuilder: (ctx, i) {
                    final m = _messages[i];
                    final isMe = m['sender_id'] == widget.conversation['user_id'];
                    return Align(
                      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isMe ? const Color(0xFFC8A951).withOpacity(0.2) : const Color(0xFF16213E),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(m['message'] ?? '', style: const TextStyle(color: Colors.white)),
                      ),
                    );
                  },
                ),
          ),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(color: Color(0xFF0F0F1A), border: Border(top: BorderSide(color: Color(0xFF2A2A3E)))),
            child: Row(children: [
              Expanded(child: TextField(controller: _controller, style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(hintText: 'Type a message...', hintStyle: TextStyle(color: Colors.grey),
                  border: InputBorder.none, contentPadding: EdgeInsets.symmetric(horizontal: 12)))),
              IconButton(icon: const Icon(Icons.send, color: Color(0xFFC8A951)), onPressed: _send),
            ]),
          ),
        ],
      ),
    );
  }
}
