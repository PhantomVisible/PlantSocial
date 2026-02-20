import { Component, Input, OnInit, OnDestroy, signal, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, FloatingChatState, ChatMessage } from '../chat.service';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../auth/auth.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-floating-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AvatarComponent],
  template: `
    <div class="floating-window" [class.minimized]="chatState.minimized">
      <!-- Header -->
      <div class="window-header" (click)="toggleMinimize()">
        <div class="header-user">
          <app-avatar [imageUrl]="resolveImageUrl(chatState.targetProfilePictureUrl || '')" [name]="chatState.displayName" [size]="28"></app-avatar>
          <span class="username">{{ chatState.displayName }}</span>
        </div>
        <div class="header-actions">
          <button (click)="toggleMinimize(); $event.stopPropagation()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12" *ngIf="!chatState.minimized"/>
              <polyline points="18 15 12 9 6 15" *ngIf="chatState.minimized"/>
            </svg>
          </button>
          <button (click)="close(); $event.stopPropagation()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Body (only if not minimized) -->
      @if (!chatState.minimized) {
        <div class="window-body">
          <div class="messages-list" #scrollContainer>
            @for (msg of messages(); track msg.id) {
              <div class="message" [class.own]="isOwnMessage(msg)">
                <div class="msg-content" [class.sending]="msg.id.startsWith('temp-')">
                    @if (msg.messageType === 'IMAGE') {
                        <img [src]="resolveImageUrl(msg.mediaUrl)" class="msg-image">
                    } @else {
                        {{ msg.content }}
                    }
                </div>
              </div>
            }
          </div>
          
          <div class="input-area">
            <input type="text"
                   [(ngModel)]="newMessage"
                   (keyup.enter)="sendMessage()"
                   placeholder="Message..." />
            <button (click)="sendMessage()" [disabled]="!newMessage.trim()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <line x1="22" y1="2" x2="11" y2="13"/>
                 <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .floating-window {
      width: 330px;
      background: white;
      border-radius: 12px 12px 0 0;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      transition: height 0.3s ease;
      /* Border to separate from white background if any */
      border: 1px solid #eee;
    }

    .floating-window.minimized {
      width: 250px;
      height: 48px; /* Header only */
    }

    /* Header */
    .window-header {
      padding: 12px 16px;
      background: white;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      height: 48px;
    }
    
    .window-header:hover {
        background: #f9f9f9;
        color: #1d9bf0;
    }

    .header-user {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .username {
      font-weight: 700;
      font-size: 14px;
      color: #0f1419;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .header-actions button {
      background: none;
      border: none;
      color: #536471;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      transition: background 0.2s;
    }

    .header-actions button:hover {
      background: #eff3f4;
      color: #1d9bf0;
    }

    /* Body */
    .window-body {
      height: 350px;
      display: flex;
      flex-direction: column;
      background: #fff;
    }

    .messages-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .message {
      max-width: 80%;
      align-self: flex-start;
    }

    .message.own {
      align-self: flex-end;
    }

    .msg-content {
      padding: 10px 14px;
      border-radius: 18px;
      border-bottom-left-radius: 4px;
      font-size: 14px;
      line-height: 1.4;
      background: #eff3f4;
      color: #0f1419;
      word-wrap: break-word;
    }

    .message.own .msg-content {
      background: #1d9bf0;
      color: white;
      border-bottom-left-radius: 18px;
      border-bottom-right-radius: 4px;
    }
    
    .msg-content.sending {
        opacity: 0.7;
    }

    .msg-image {
        max-width: 100%;
        border-radius: 8px;
    }

    /* Input */
    .input-area {
      padding: 8px 12px;
      background: white;
      border-top: 1px solid #eff3f4;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .input-area input {
      flex: 1;
      background: #eff3f4;
      border: 1px solid transparent;
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 14px;
      outline: none;
      color: #0f1419;
      transition: border 0.2s, background 0.2s;
    }

    .input-area input:focus {
      background: white;
      border-color: #1d9bf0;
    }

    .input-area button {
      background: #1d9bf0;
      color: white;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .input-area button:hover:not(:disabled) {
        background: #1a8cd8;
    }

    .input-area button:disabled {
      background: #eff3f4;
      color: #ccc;
      cursor: default;
    }
  `]
})
export class FloatingChatWindowComponent implements OnInit, AfterViewChecked {
  @Input({ required: true }) chatState!: FloatingChatState;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  chatService = inject(ChatService);
  newMessage = '';

  http = inject(HttpClient);
  authService = inject(AuthService);

  // Local messages signal just for this window
  messages = signal<ChatMessage[]>([]);

  ngOnInit(): void {
    this.loadMessages();

    // Subscribe to global messages but filter for this room
    this.chatService.messageReceived$.subscribe(msg => {
      if (msg.roomId === this.chatState.roomId) {
        // Check ownership by ID
        const isOwn = this.isOwnMessage(msg);

        this.messages.update(prev => {
          const temps = prev.filter(m => m.id.startsWith('temp-'));
          const others = prev.filter(m => !m.id.startsWith('temp-'));

          let matchedTempIndex = -1;

          // Strategy 1: FIFO match if we identify the sender as ourselves
          if (isOwn && temps.length > 0) {
            matchedTempIndex = 0; // Remove oldest temp
          }
          // Strategy 2: Content match fallback (if ID check failed but content is identical)
          else if (!isOwn && temps.length > 0) {
            const sameContentIndex = temps.findIndex(t => t.content === msg.content && t.messageType === msg.messageType);
            if (sameContentIndex !== -1) {
              matchedTempIndex = sameContentIndex;
            }
          }

          if (matchedTempIndex !== -1) {
            temps.splice(matchedTempIndex, 1); // Remove the matched temp message
          }

          return [...others, ...temps, msg];
        });
        setTimeout(() => this.scrollToBottom(), 50);
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  loadMessages() {
    // Fetch messages independently
    this.http.get<any>(`http://localhost:8080/api/v1/chat/rooms/${this.chatState.roomId}/messages?page=0&size=50`)
      .subscribe(response => {
        const msgs: ChatMessage[] = response.content || [];
        this.messages.set(msgs.reverse());
        setTimeout(() => this.scrollToBottom(), 100);
      });
  }

  isSending = false;

  sendMessage() {
    if (this.isSending || !this.newMessage.trim()) return;

    this.isSending = true;
    const content = this.newMessage;
    const tempId = 'temp-' + Date.now();
    const currentUser = this.authService.currentUser();

    // Optimistic UI Update
    const tempMsg: ChatMessage = {
      id: tempId,
      roomId: this.chatState.roomId,
      senderId: currentUser?.id || 'unknown',
      senderUsername: currentUser?.username || 'me',
      senderFullName: currentUser?.fullName || 'Me',
      content: content,
      messageType: 'TEXT',
      mediaUrl: null,
      createdAt: new Date().toISOString()
    };

    this.messages.update(prev => [...prev, tempMsg]);
    setTimeout(() => this.scrollToBottom(), 50);

    this.chatService.sendMessage(this.chatState.roomId, content);
    this.newMessage = '';

    // Unlock after delay to prevent double-sends from rapid events
    setTimeout(() => {
      this.isSending = false;
    }, 500);
  }

  toggleMinimize() {
    this.chatService.toggleMinimizeFloatingChat(this.chatState.roomId);
  }

  close() {
    this.chatService.closeFloatingChat(this.chatState.roomId);
  }

  isOwnMessage(msg: ChatMessage): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;

    // Ensure both are strings for comparison
    const senderIdStr = String(msg.senderId);
    const currentIdStr = String(currentUser.id);

    // Log for debugging if needed (remove before prod)
    // console.log(`Checking ownership: msg=${senderIdStr}, current=${currentIdStr}, match=${senderIdStr === currentIdStr}`);

    return senderIdStr === currentIdStr;
  }

  resolveImageUrl(url: string | null): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }

  scrollToBottom(): void {
    if (this.scrollContainer) {
      try {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      } catch (err) { }
    }
  }
}
