import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService, ChatRoom } from '../chat.service';
import { FloatingChatWindowComponent } from './floating-chat-window.component';
import { AuthService } from '../../../auth/auth.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

@Component({
    selector: 'app-floating-chat-container',
    standalone: true,
    imports: [CommonModule, FloatingChatWindowComponent, AvatarComponent],
    template: `
    <div class="floating-container">
      <!-- Open Chat Windows -->
      @for (chat of chatService.activeFloatingChats(); track chat.roomId) {
        <app-floating-chat-window 
          [chatState]="chat" 
          class="chat-window-wrapper">
        </app-floating-chat-window>
      }

      <!-- Chat List Popover -->
      <div *ngIf="showChatList()" class="chat-list-popover">
        <div class="chat-list-header">
            <h3>Messages</h3>
            <div class="header-actions">
                <button class="icon-btn" (click)="chatService.loadRooms()" title="Refresh">
                    <i class="pi pi-refresh"></i>
                </button>
                <button class="icon-btn" (click)="toggleChatList()">
                    <i class="pi pi-times"></i>
                </button>
            </div>
        </div>
        <div class="chat-list-body">
            @if (chatService.loading()) {
                <div class="loading-state">
                    <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
                </div>
            } @else if (chatService.rooms().length === 0) {
                <div class="empty-state">
                    <p>No conversations yet</p>
                    <small>Start a chat from a user profile!</small>
                </div>
            } @else {
                <div *ngFor="let room of chatService.rooms()" 
                     class="chat-list-item" 
                     (click)="openRoom(room)">
                    <div class="avatar-wrap">
                        <app-avatar [imageUrl]="resolveImageUrl(getRoomAvatar(room) || '')" [name]="getRoomName(room)" [size]="48"></app-avatar>
                    </div>
                    <div class="room-info">
                        <span class="room-name">{{ getRoomName(room) }}</span>
                        <div class="last-message-row">
                            <span class="last-message" *ngIf="room.lastMessage">
                                <span *ngIf="isOwnMessage(room.lastMessage)">You: </span>
                                {{ room.lastMessage.content }}
                            </span>
                             <span class="date" *ngIf="room.lastMessage">
                                • {{ formatTime(room.lastMessage.createdAt) }}
                             </span>
                        </div>
                    </div>
                </div>
            }
        </div>
      </div>

      <!-- Messages Trigger Button -->
      <button class="messages-trigger" (click)="toggleChatList()" [class.active]="showChatList()">
        <div class="trigger-content" *ngIf="!showChatList()">
            <span class="trigger-text">Messages</span>
            <div class="trigger-icon">
                <!-- Envelope Icon -->
                <svg viewBox="0 0 24 24" aria-hidden="true"><g><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-1.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1v-13a1 1 0 0 0-1-1h-15z"></path><path d="M11.24 13.65l-7.39-6.38a.75.75 0 1 1 .98-1.14l7.17 6.19 7.17-6.19a.75.75 0 0 1 .98 1.14l-7.39 6.38a1 1 0 0 1-1.52 0z"></path></g></svg>
            </div> 
        </div>
        <div class="trigger-content-close" *ngIf="showChatList()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </div>
      </button>
    </div>
  `,
    styles: [`
    .floating-container {
      position: fixed;
      bottom: 0;
      right: 20px;
      display: flex;
      flex-direction: row-reverse;
      align-items: flex-end;
      gap: 16px;
      z-index: 1000;
      pointer-events: none; /* Let clicks pass through gaps */
    }

    .chat-window-wrapper {
      pointer-events: auto;
      animation: slideUp 0.3s ease-out;
    }

    /* Trigger Button */
    .messages-trigger {
        pointer-events: auto;
        height: 50px;
        background: white;
        border: 1px solid #cfd9de;
        border-radius: 25px 25px 0 0; /* Pill top? No, detached pill */
        border-radius: 25px; 
        box-shadow: 0 0 10px rgba(0,0,0,0.08);
        padding: 0 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-weight: 700;
        font-size: 15px;
        min-width: 140px; 
        color: #0f1419;
        margin-bottom: 20px; /* Float slightly */
        transition: all 0.2s;
    }
    
    .messages-trigger:hover {
        background: #f7f9f9;
        box-shadow: 0 2px 12px rgba(0,0,0,0.12);
    }

    .messages-trigger.active {
        min-width: 50px; /* Shrink to circle/square when open if we want? Or keep pill */
        width: 50px;
        min-width: 50px;
        padding: 0;
        border-radius: 50%;
    }

    .trigger-content {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        justify-content: space-between;
    }

    .trigger-content-close {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .trigger-icon svg {
        width: 20px;
        height: 20px;
        fill: currentColor;
    }

    .trigger-text {
        font-size: 15px;
        letter-spacing: -0.2px;
    }

    /* Popover List */
    .chat-list-popover {
        pointer-events: auto;
        position: absolute;
        bottom: 80px; /* Above trigger */
        right: 0;
        width: 350px;
        height: 500px;
        max-height: 70vh;
        background: white;
        border-radius: 16px;
        box-shadow: 0 5px 25px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid #cfd9de;
        animation: activePop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        transform-origin: bottom right;
    }

    @keyframes activePop {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }

    .chat-list-header {
        padding: 12px 16px;
        border-bottom: 1px solid #eff3f4;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 53px;
    }
    
    .chat-list-header h3 { 
        margin: 0; 
        font-size: 19px;
        font-weight: 800;
    }

    .header-actions {
        display: flex;
        gap: 8px;
    }
    
    .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }
    .icon-btn:hover { background: #eff3f4; }
    .icon-btn i { font-size: 1rem; color: #0f1419; }

    .chat-list-body {
        flex: 1;
        overflow-y: auto;
    }

    .chat-list-item {
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        transition: background 0.2s;
        border-bottom: 1px solid #f7f9f9;
    }

    .chat-list-item:hover {
        background: #f7f9f9;
        border-right: 3px solid #1d9bf0; /* Active indicator hint */
    }

    .avatar-wrap {
        flex-shrink: 0;
    }

    .room-info {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        flex: 1;
        gap: 2px;
    }

    .room-name {
        font-weight: 700;
        font-size: 15px;
        color: #0f1419;
    }

    .last-message-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: #536471;
        font-size: 14px;
    }

    .last-message {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 180px;
    }

    .date {
        font-size: 0.8rem;
        flex-shrink: 0;
    }
    
    .empty-state { 
        display: flex; 
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #536471; 
        text-align: center;
    }
    
    .loading-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100px;
        color: #1d9bf0;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class FloatingChatContainerComponent implements OnInit {
    chatService = inject(ChatService);
    authService = inject(AuthService);

    // Use service signal instead of local
    get showChatList() { return this.chatService.isChatListOpen; }

    ngOnInit() {
        // Load rooms if we are likely to use them, or just wait for click
    }

    toggleChatList() {
        this.chatService.isChatListOpen.update(v => !v);
        if (this.chatService.isChatListOpen()) {
            this.chatService.loadRooms();
        }
    }

    openRoom(room: ChatRoom) {
        this.chatService.openFloatingChat(room);
        this.chatService.isChatListOpen.set(false); // Close list to view chat
    }

    getRoomName(room: ChatRoom): string {
        if (room.type === 'GROUP') return room.name;
        const currentUser = this.authService.currentUser();
        const other = room.members.find(m => m.userId !== currentUser?.id);
        return other ? other.fullName : 'Chat';
    }

    getRoomAvatar(room: ChatRoom): string | undefined {
        if (room.type === 'GROUP') return undefined;
        const currentUser = this.authService.currentUser();
        const other = room.members.find(m => m.userId !== currentUser?.id);
        return other?.profilePictureUrl;
    }

    resolveImageUrl(url: string | null): string {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return 'http://localhost:8080' + url;
    }

    isOwnMessage(msg: any): boolean {
        const currentUser = this.authService.currentUser();
        return currentUser ? msg && msg.senderId === currentUser.id : false;
    }

    formatTime(dateStr: string): string {
        const date = new Date(dateStr);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}
