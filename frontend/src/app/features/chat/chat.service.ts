import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, Subject, Subscription } from 'rxjs';
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
    online: boolean;
}

export interface UserSearchResult {
    id: string;
    username: string;
    fullName: string;
    online: boolean;
}

export interface FloatingChatState {
    roomId: string;
    displayName: string;
    type: 'PRIVATE' | 'GROUP';
    minimized: boolean;
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

    // Floating Chats
    activeFloatingChats = signal<FloatingChatState[]>([]);
    isChatListOpen = signal(false);

    // Computed visibility for other UI elements (e.g. Wiki Sidebar)
    showRightSidebar = computed(() => {
        const listOpen = this.isChatListOpen();
        const chats = this.activeFloatingChats();
        const anyChatOpenAndMaximized = chats.some(c => !c.minimized);

        // Hide sidebar if:
        // 1. The chat list (popover) is open
        // 2. OR any floating chat window is open AND maximized (not minimized)
        return !listOpen && !anyChatOpenAndMaximized;
    });

    private currentRoomSubscription: any = null;
    private currentTypingSubscription: any = null;
    private presenceSubscription: any = null;

    // Global message stream for decoupled components
    public messageReceived$ = new Subject<ChatMessage>();

    // Track active WS subscriptions by Room ID to avoid duplicates
    private roomSubscriptions = new Map<string, Subscription>();

    constructor(
        private http: HttpClient,
        private ws: WebSocketService,
        private authService: AuthService
    ) { }

    // ─── Floating Chat Management ─────────────────────────────────

    openFloatingChat(userOrRoom: UserSearchResult | ChatRoom | any): void {
        let roomId: string | undefined;
        let displayName: string;
        let type: 'PRIVATE' | 'GROUP';
        let participantId: string | undefined;

        // Determine input type
        if ('members' in userOrRoom) {
            // It's a ChatRoom
            const room = userOrRoom as ChatRoom;
            roomId = room.id;
            displayName = this.getRoomDisplayName(room);
            type = room.type;
        } else {
            // It's a UserSearchResult or similar
            const user = userOrRoom;
            displayName = user.fullName;
            participantId = user.id;
            type = 'PRIVATE';

            // Check if we already have a room for this user in our loaded rooms
            const existingRoom = this.rooms().find(r =>
                r.type === 'PRIVATE' && r.members.some(m => m.userId === user.id)
            );

            if (existingRoom) {
                roomId = existingRoom.id;
            }
        }

        if (roomId) {
            this.addFloatingChat(roomId, displayName, type!);
        } else if (participantId) {
            // Create/Get room via API then open
            this.getOrCreatePrivateRoom(participantId).subscribe(room => {
                const name = this.getRoomDisplayName(room);
                this.addFloatingChat(room.id, name, room.type);
            });
        }
    }

    private getRoomDisplayName(room: ChatRoom): string {
        if (room.type === 'GROUP') return room.name;
        const other = room.members.find(m => m.userId !== this.authService.currentUser()?.id);
        return other ? other.fullName : 'Unknown';
    }

    private addFloatingChat(roomId: string, displayName: string, type: 'PRIVATE' | 'GROUP') {
        this.activeFloatingChats.update(chats => {
            if (chats.some(c => c.roomId === roomId)) return chats; // Already open
            return [...chats, { roomId, displayName, type, minimized: false }];
        });
        this.subscribeToRoom(roomId);
    }

    closeFloatingChat(roomId: string) {
        this.activeFloatingChats.update(chats => chats.filter(c => c.roomId !== roomId));
    }

    toggleMinimizeFloatingChat(roomId: string) {
        this.activeFloatingChats.update(chats =>
            chats.map(c => c.roomId === roomId ? { ...c, minimized: !c.minimized } : c)
        );
    }

    // ─── WebSocket ────────────────────────────────────────────────

    init(): void {
        console.log('ChatService: Initializing WebSocket connection...');
        this.ws.connect();
        this.subscribeToPresence();
    }

    private subscribeToPresence(): void {
        console.log('ChatService: Subscribing to presence...');
        if (this.presenceSubscription) {
            this.presenceSubscription.unsubscribe();
        }
        this.presenceSubscription = this.ws.subscribe<OnlineUser[]>('/topic/presence')
            .subscribe(users => {
                this.onlineUsers.set(users);
            });
    }

    destroy(): void {
        console.log('ChatService: Destroying...');
        this.presenceSubscription?.unsubscribe();
        this.leaveCurrentRoom();
        this.roomSubscriptions.forEach(sub => sub.unsubscribe());
        this.roomSubscriptions.clear();
        this.ws.disconnect();
    }

    joinRoom(roomId: string, currentUserId?: string, room?: ChatRoom): void {
        console.log(`ChatService: Joining room ${roomId} (Main View)`);
        this.leaveCurrentRoom(); // Leave previous MAIN room

        // Find the room object and set it as active
        let targetRoom = this.rooms().find(r => r.id === roomId);

        // If provided room object is not found in list, use the provided one
        if (!targetRoom && room) {
            targetRoom = room;
        }

        if (targetRoom) {
            this.activeRoom.set(targetRoom);
        } else {
            // Fallback: If we still don't have the room object, we can't fully set activeRoom.
            // This might happen on direct navigation if loadRooms() is too slow.
            // But ChatPageComponent usually fetches the room first.
            console.warn(`ChatService: Room ${roomId} not found during join. Messages might not appear until room is loaded.`);
        }

        this.subscribeToRoom(roomId);
    }

    public subscribeToRoom(roomId: string): void {
        if (this.roomSubscriptions.has(roomId)) {
            return;
        }

        console.log(`ChatService: Subscribing to room ${roomId} (WS)`);
        const sub = this.ws.subscribe<ChatMessage>(`/topic/room/${roomId}`)
            .subscribe(msg => {
                // 1. Emit to global stream
                this.messageReceived$.next(msg);

                // 2. Update MAIN view if it matches activeRoom
                if (this.activeRoom()?.id === roomId) {
                    this.messages.update(msgs => {
                        // Avoid duplicates: check by ID
                        if (msgs.some(m => m.id === msg.id)) return msgs;

                        // Fallback: Check for temp message (optimistic UI) match using content & sender
                        // This handles the case where we added a temp message, and now the real one arrives
                        // with a different ID but same content.
                        const isOwn = msg.senderId === this.authService.currentUser()?.id;
                        if (isOwn) {
                            const oneMinuteAgo = Date.now() - 60000;
                            // Find a recent temp message with same content
                            const tempMatchIndex = msgs.findIndex(m =>
                                m.id.startsWith('temp-') &&
                                m.content === msg.content &&
                                new Date(m.createdAt).getTime() > oneMinuteAgo
                            );

                            if (tempMatchIndex !== -1) {
                                // Replace temp message with real one
                                const newMsgs = [...msgs];
                                newMsgs[tempMatchIndex] = msg;
                                return newMsgs;
                            }
                        }

                        return [...msgs, msg];
                    });
                }

                // 3. Update room list preview
                this.rooms.update(rooms =>
                    rooms.map(r => r.id === roomId ? { ...r, lastMessage: msg } : r)
                );
            });

        this.roomSubscriptions.set(roomId, sub);
    }

    leaveCurrentRoom(): void {
        this.activeRoom.set(null);
        this.messages.set([]);
    }

    sendMessage(roomId: string, content: string, messageType: string = 'TEXT'): void {
        console.log(`ChatService: Sending message to room ${roomId}`);
        this.ws.send(`/app/chat.send/${roomId}`, { content, messageType });
    }

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
