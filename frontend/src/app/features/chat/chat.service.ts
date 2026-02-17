import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { WebSocketService } from '../../core/websocket.service';
import { AuthService } from '../../auth/auth.service';

export interface ChatRoom {
    id: string;
    name: string;
    type: 'PRIVATE' | 'GROUP';
    members: ChatMember[];
    lastMessage: ChatMessage | null;
    createdAt: string;
}

export interface ChatMember {
    userId: string;
    username: string;
    fullName: string;
    role: string;
}

export interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    senderUsername: string;
    senderFullName: string;
    content: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE';
    mediaUrl: string | null;
    createdAt: string;
}

export interface OnlineUser {
    userId: string;
    username: string;
    fullName: string;
}

export interface UserSearchResult {
    id: string;
    username: string;
    fullName: string;
    online: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private apiUrl = 'http://localhost:8080/api/v1/chat';

    // ─── Signals ──────────────────────────────────────────────────
    rooms = signal<ChatRoom[]>([]);
    activeRoom = signal<ChatRoom | null>(null);
    messages = signal<ChatMessage[]>([]);
    onlineUsers = signal<OnlineUser[]>([]);
    typingUsers = signal<{ userId: string; username: string; fullName: string }[]>([]);
    loading = signal(false);

    private currentRoomSubscription: any = null;
    private currentTypingSubscription: any = null;
    private presenceSubscription: any = null;

    constructor(
        private http: HttpClient,
        private ws: WebSocketService
    ) { }

    // ─── WebSocket ────────────────────────────────────────────────

    /**
     * Initialize WebSocket connection and presence subscription.
     */
    init(): void {
        console.log('ChatService: Initializing WebSocket connection...');
        this.ws.connect();
        this.subscribeToPresence();
    }

    /**
     * Subscribe to online presence updates.
     */
    private subscribeToPresence(): void {
        console.log('ChatService: Subscribing to presence...');
        if (this.presenceSubscription) {
            this.presenceSubscription.unsubscribe();
        }
        this.presenceSubscription = this.ws.subscribe<OnlineUser[]>('/topic/presence')
            .subscribe(users => {
                console.log('ChatService: Received presence update', users);
                this.onlineUsers.set(users);
            });
    }

    /**
     * Clean up subscriptions.
     */
    destroy(): void {
        console.log('ChatService: Destroying...');
        this.presenceSubscription?.unsubscribe();
        this.leaveCurrentRoom();
        this.ws.disconnect();
    }

    /**
     * Join a room: subscribe to its WebSocket topic.
     */
    joinRoom(roomId: string, currentUserId?: string): void {
        console.log(`ChatService: Joining room ${roomId}`);
        // Unsubscribe from previous room
        this.leaveCurrentRoom();

        // Subscribe to room messages
        this.currentRoomSubscription = this.ws.subscribe<ChatMessage>(`/topic/room/${roomId}`)
            .subscribe(msg => {
                console.log('ChatService: Received message', msg);
                this.messages.update(msgs => [...msgs, msg]);
                // Update last message in room list
                this.rooms.update(rooms =>
                    rooms.map(r => r.id === roomId ? { ...r, lastMessage: msg } : r)
                );
            });

        // Subscribe to typing indicators
        this.currentTypingSubscription = this.ws
            .subscribe<{ userId: string; username: string; fullName: string }>(`/topic/room/${roomId}/typing`)
            .subscribe(typing => {
                // Ignore self if known
                if (currentUserId && typing.userId === currentUserId) return;

                this.typingUsers.update(users => {
                    const exists = users.some(u => u.userId === typing.userId);
                    if (!exists) {
                        // Auto-remove after 3 seconds
                        setTimeout(() => {
                            this.typingUsers.update(u => u.filter(t => t.userId !== typing.userId));
                        }, 3000);
                        return [...users, typing];
                    }
                    return users;
                });
            });
    }

    leaveCurrentRoom(): void {
        if (this.currentRoomSubscription) {
            console.log('ChatService: Leaving current room');
            this.currentRoomSubscription.unsubscribe();
            this.currentTypingSubscription?.unsubscribe();
            this.currentRoomSubscription = null;
            this.currentTypingSubscription = null;
            this.typingUsers.set([]);
        }
    }

    /**
     * Send a message via WebSocket.
     */
    sendMessage(roomId: string, content: string, messageType: string = 'TEXT'): void {
        console.log(`ChatService: Sending message to room ${roomId}`);
        this.ws.send(`/app/chat.send/${roomId}`, { content, messageType });
    }

    /**
     * Send typing indicator.
     */
    sendTyping(roomId: string): void {
        this.ws.send(`/app/chat.typing/${roomId}`, {});
    }

    // ─── REST API ─────────────────────────────────────────────────

    loadRooms(): void {
        console.log('ChatService: Loading rooms...');
        this.loading.set(true);
        this.http.get<ChatRoom[]>(`${this.apiUrl}/rooms`).subscribe({
            next: rooms => {
                console.log('ChatService: Rooms loaded', rooms.length);
                this.rooms.set(rooms);
                this.loading.set(false);
            },
            error: err => {
                console.error('ChatService: Failed to load rooms', err);
                this.loading.set(false);
            }
        });
    }

    createGroupRoom(name: string, memberIds: string[]): Observable<ChatRoom> {
        return this.http.post<ChatRoom>(`${this.apiUrl}/rooms`, { name, memberIds })
            .pipe(tap(room => this.rooms.update(rooms => [room, ...rooms])));
    }

    getOrCreatePrivateRoom(userId: string): Observable<ChatRoom> {
        return this.http.post<ChatRoom>(`${this.apiUrl}/rooms/private/${userId}`, {});
    }

    loadMessages(roomId: string, page: number = 0): void {
        this.http.get<any>(`${this.apiUrl}/rooms/${roomId}/messages?page=${page}&size=50`)
            .subscribe(response => {
                const msgs: ChatMessage[] = response.content || [];
                if (page === 0) {
                    this.messages.set(msgs.reverse());
                } else {
                    this.messages.update(existing => [...msgs.reverse(), ...existing]);
                }
            });
    }

    uploadMedia(roomId: string, file: File): Observable<ChatMessage> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<ChatMessage>(`${this.apiUrl}/rooms/${roomId}/media`, formData);
    }

    searchUsers(query: string): Observable<UserSearchResult[]> {
        return this.http.get<UserSearchResult[]>(`${this.apiUrl}/users/search?q=${encodeURIComponent(query)}`);
    }

    getOnlineUsers(): Observable<OnlineUser[]> {
        return this.http.get<OnlineUser[]>(`${this.apiUrl}/online`);
    }

    addMember(roomId: string, userId: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/rooms/${roomId}/members`, JSON.stringify(userId), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    isUserOnline(userId: string): boolean {
        return this.onlineUsers().some(u => u.userId === userId);
    }
}
