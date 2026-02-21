import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ChatService, ChatRoom, ChatMessage, UserSearchResult } from './chat.service';
import { WebSocketService } from '../../core/websocket.service';
import { AuthService } from '../../auth/auth.service';
import { UserService, UserProfile } from '../profile/user.service';

import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DialogModule, AvatarModule, ButtonModule, TooltipModule],
  template: `
    <div class="chat-container">
      <!-- ─── Sidebar ──────────────────────────────────────────── -->
      <div class="chat-sidebar" [class.hidden-mobile]="activeRoom() !== null">
        <div class="sidebar-header">
          <h2>Messages</h2>
          <p-button 
            icon="pi pi-plus" 
            [rounded]="true" 
            pTooltip="New Conversation" 
            tooltipPosition="bottom" 
            styleClass="new-chat-btn shadow-2"
            (onClick)="showNewChatModal = true">
          </p-button>
        </div>

        <div class="sidebar-search">
          <input type="text" placeholder="Search conversations..."
                 [(ngModel)]="searchQuery"
                 (input)="filterRooms()">
        </div>

        <div class="room-list">
          @if (chatService.loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
            </div>
          } @else if (filteredRooms().length === 0) {
            <div class="empty-state">
              <p>No conversations yet</p>
              <button class="btn-start" (click)="showNewChatModal = true">Start a chat</button>
            </div>
          } @else {
            @for (room of filteredRooms(); track room.id) {
              <div class="room-item" [class.active]="activeRoom()?.id === room.id"
                   (click)="selectRoom(room)">
                <div class="room-avatar" [class.online]="isAnyMemberOnline(room)">
                  @if (getRoomAvatarUrl(room)) {
                    <img [src]="resolveImageUrl(getRoomAvatarUrl(room))" class="avatar-img" alt="Avatar">
                  } @else {
                    {{ getRoomInitial(room) }}
                  }
                </div>
                <div class="room-info">
                  <div class="room-name">{{ getRoomDisplayName(room) }}</div>
                  <div class="room-last-msg" *ngIf="room.lastMessage">
                    <span class="msg-sender">{{ room.lastMessage.senderFullName }}:</span>
                    @if (room.lastMessage.messageType === 'IMAGE') {
                      📷 Photo
                    } @else if (room.lastMessage.messageType === 'FILE') {
                      📎 File
                    } @else {
                      {{ room.lastMessage.content | slice:0:40 }}{{ (room.lastMessage.content.length || 0) > 40 ? '...' : '' }}
                    }
                  </div>
                  <div class="room-last-msg" *ngIf="!room.lastMessage">
                    No messages yet
                  </div>
                </div>
                <div class="room-meta">
                  <span class="room-time" *ngIf="room.lastMessage">
                    {{ formatTime(room.lastMessage.createdAt) }}
                  </span>
                  <span class="room-type-badge" *ngIf="room.type === 'GROUP'">Group</span>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- ─── Chat Area ────────────────────────────────────────── -->
      <div class="chat-main" [class.hidden-mobile]="activeRoom() === null">
        @if (!activeRoom()) {
          <div class="no-room-selected">
            <div class="no-room-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3>Select a conversation</h3>
            <p>Choose an existing chat or start a new one</p>
          </div>
        } @else {
          <!-- Room Header -->
          <div class="room-header">
            <button class="btn-back" (click)="activeRoom.set(null)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div class="room-header-avatar" [class.online]="isAnyMemberOnline(activeRoom()!)">
              @if (getRoomAvatarUrl(activeRoom()!)) {
                <img [src]="resolveImageUrl(getRoomAvatarUrl(activeRoom()!))" class="avatar-img" alt="Avatar">
              } @else {
                {{ getRoomInitial(activeRoom()!) }}
              }
            </div>
            <div class="room-header-info">
              <div class="room-header-name">
                @if (activeRoom()!.type === 'PRIVATE') {
                  <a [routerLink]="['/profile', getOtherMember(activeRoom()!)?.username]" class="profile-link">
                    {{ getRoomDisplayName(activeRoom()!) }}
                  </a>
                } @else {
                  {{ getRoomDisplayName(activeRoom()!) }}
                }
              </div>
              <div class="room-header-status">
                @if (chatService.typingUsers().length > 0) {
                  <span class="typing-indicator">
                    {{ chatService.typingUsers()[0].fullName }} is typing
                    <span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>
                  </span>
                } @else if (activeRoom()!.type === 'GROUP') {
                  {{ activeRoom()!.members.length }} members
                } @else {
                  {{ isAnyMemberOnline(activeRoom()!) ? 'Online' : 'Offline' }}
                }
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div class="messages-container" #messagesContainer>
            @for (msg of chatService.messages(); track msg.id) {
              <div class="message" [class.own]="msg.senderId === currentUserId()">
                @if (msg.senderId !== currentUserId()) {
                  <div class="message-avatar">{{ msg.senderFullName.charAt(0) || '?' }}</div>
                }
                <div class="message-bubble">
                  @if (activeRoom()!.type === 'GROUP' && msg.senderId !== currentUserId()) {
                    <div class="message-sender">{{ msg.senderFullName }}</div>
                  }
                  @if (msg.messageType === 'IMAGE' && msg.mediaUrl) {
                    <img [src]="'http://localhost:8080' + msg.mediaUrl" class="message-image" (click)="openImage(msg.mediaUrl!)">
                  } @else {
                    <div class="message-text">{{ msg.content }}</div>
                  }
                  <div class="message-time">{{ formatTime(msg.createdAt) }}</div>
                </div>
              </div>
            }
          </div>

          <!-- Input Bar -->
          <div class="message-input-bar">
            <label class="btn-attach" for="fileInput">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </label>
            <input type="file" id="fileInput" hidden (change)="onFileSelected($event)">
            <input type="text" class="message-input"
                   placeholder="Type a message..."
                   [(ngModel)]="messageText"
                   (keyup.enter)="send()"
                   (input)="onTyping()">
            <button class="btn-send" (click)="send()" [disabled]="!messageText.trim()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        }
      </div>

      <!-- ─── New Chat Dialog ──────────────────────────────────── -->
      <p-dialog header="Start a Conversation" [(visible)]="showNewChatModal" [modal]="true"
        [style]="{ width: '450px' }" [draggable]="false" [resizable]="false"
        (onShow)="loadMutualConnections()">
        <div class="p-4" style="min-height: 300px;">
          @if (isLoadingMutuals()) {
            <div class="flex justify-content-center align-items-center h-10rem">
              <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
            </div>
          } @else if (mutualConnections().length === 0) {
            <div class="text-center p-4">
              <i class="pi pi-users text-4xl text-500 mb-3"></i>
              <p class="m-0 text-color-secondary line-height-3">
                You don't have any mutual connections yet. Go explore the Feed to find fellow gardeners!
              </p>
            </div>
          } @else {
            <div class="flex flex-column gap-2 mt-2">
              @for (user of mutualConnections(); track user.id) {
                <div class="flex align-items-center p-3 gap-3 border-round cursor-pointer transition-colors transition-duration-200 hover:surface-hover"
                     (click)="startConversation(user)">
                  <ng-container *ngIf="user.profilePictureUrl; else noAvatar">
                    <p-avatar [image]="resolveImageUrl(user.profilePictureUrl)" shape="circle" size="large" styleClass="flex-shrink-0"></p-avatar>
                  </ng-container>
                  <ng-template #noAvatar>
                    <p-avatar [label]="(user.fullName.charAt(0) || user.username.charAt(0)) | uppercase" shape="circle" size="large" styleClass="flex-shrink-0" [style]="{'background-color': '#4caf50', 'color': '#ffffff'}"></p-avatar>
                  </ng-template>
                  <div class="flex flex-column">
                    <span class="font-bold text-color">{{ user.fullName }}</span>
                    <span class="text-sm text-color-secondary">&#64;{{ user.username }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    /* ─── Layout ──────────────────────────────────────────────── */
    :host {
      display: flex;
      flex: 1;
      min-width: 0;
      align-items: stretch;
      justify-content: center;
      height: 100vh;
      padding: 1.5rem 1.5rem;
      box-sizing: border-box;
      background: var(--surface-ground);
      overflow: hidden;
    }

    .chat-container {
      display: flex;
      width: 100%;
      max-width: 1300px;
      height: 100%;
      background: var(--surface-card);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.10), 0 1px 4px rgba(0,0,0,0.06);
    }

    /* ─── Sidebar ─────────────────────────────────────────────── */
    .chat-sidebar {
      width: 340px;
      flex-shrink: 0;
      border-right: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
      background: var(--surface-card);
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 16px 12px;
    }

    .sidebar-header h2 {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0;
    }

    .new-chat-btn {
      width: 36px; height: 36px;
      padding: 0;
      background: linear-gradient(135deg, #4caf50, #2e7d32) !important;
      border: none !important;
      color: white !important;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all .2s;
    }
    .new-chat-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 4px 12px rgba(76,175,80,0.3) !important;
    }

    .sidebar-search {
      padding: 4px 16px 12px;
    }
    .sidebar-search input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--surface-border);
      border-radius: 24px;
      font-size: 0.88rem;
      background: var(--surface-ground);
      outline: none;
      transition: all .2s;
      color: var(--text-color);
    }
    .sidebar-search input:focus {
      border-color: #4caf50;
      background: var(--surface-card);
      box-shadow: 0 0 0 3px rgba(76,175,80,0.1);
    }

    .room-list {
      flex: 1;
      overflow-y: auto;
    }

    .room-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background .15s;
      border-bottom: 1px solid var(--surface-border);
    }
    .room-item:hover { background: var(--surface-hover); }
    .room-item.active {
      background: var(--primary-color-transparent, rgba(76, 175, 80, 0.1));
      border-left: 3px solid var(--primary-color);
    }

    .room-avatar {
      width: 44px; height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #66bb6a, #43a047);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
      flex-shrink: 0;
      position: relative;
    }
    .room-avatar.online::after {
      content: '';
      position: absolute;
      bottom: 2px; right: 2px;
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #4caf50;
      border: 2px solid #fff;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .room-info {
      flex: 1;
      min-width: 0;
    }
    .room-name {
      font-weight: 600;
      font-size: 0.92rem;
      color: var(--text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .room-last-msg {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }
    .msg-sender {
      font-weight: 600;
      color: #456745;
    }

    .room-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      flex-shrink: 0;
    }
    .room-time {
      font-size: 0.72rem;
      color: #8a9a8a;
    }
    .room-type-badge {
      font-size: 0.65rem;
      padding: 1px 6px;
      border-radius: 8px;
      background: #e8f5e9;
      color: #2e7d32;
      font-weight: 600;
    }

    /* ─── Chat Main ───────────────────────────────────────────── */
    .chat-main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--surface-ground);
    }

    .no-room-selected {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #8a9a8a;
    }
    .no-room-selected h3 {
      margin: 16px 0 4px;
      color: #4a5c4a;
    }

    /* Room Header */
    .room-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .btn-back {
      display: none;
      background: none;
      border: none;
      cursor: pointer;
      color: #4a5c4a;
      padding: 4px;
    }
    .room-header-avatar {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #66bb6a, #43a047);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      position: relative;
    }
    .room-header-avatar.online::after {
      content: '';
      position: absolute;
      bottom: 1px; right: 1px;
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #4caf50;
      border: 2px solid #fff;
    }
    .room-header-name {
      font-weight: 700;
      font-size: 1rem;
      color: var(--text-color);
    }
    .room-header-status {
      font-size: 0.78rem;
      color: var(--text-color-secondary);
    }

    .typing-indicator {
      color: #4caf50;
      font-style: italic;
    }
    .typing-dots span {
      animation: blink 1.4s infinite;
    }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink {
      0%, 20% { opacity: 0; }
      50% { opacity: 1; }
      100% { opacity: 0; }
    }

    /* Messages */
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .message {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      max-width: 75%;
    }
    .message.own {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: #c8e6c9;
      color: #2e7d32;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .message-bubble {
      padding: 10px 14px;
      border-radius: 18px;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      color: var(--text-color);
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      position: relative;
    }
    .message.own .message-bubble {
      background: linear-gradient(135deg, #4caf50, #43a047);
      color: white;
      border: none;
    }

    .message-sender {
      font-size: 0.72rem;
      font-weight: 700;
      color: #2e7d32;
      margin-bottom: 2px;
    }
    .message.own .message-sender { color: rgba(255,255,255,0.8); }

    .message-text {
      font-size: 0.9rem;
      line-height: 1.4;
      word-break: break-word;
    }

    .message-time {
      font-size: 0.65rem;
      opacity: 0.6;
      text-align: right;
      margin-top: 4px;
    }

    .message-image {
      max-width: 260px;
      max-height: 200px;
      border-radius: 12px;
      cursor: pointer;
      margin-bottom: 4px;
    }

    /* Input Bar */
    .message-input-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--surface-card);
      border-top: 1px solid var(--surface-border);
    }

    .btn-attach {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: var(--surface-ground);
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all .2s;
    }
    .btn-attach:hover {
      background: #e0e8e0;
      color: #2e7d32;
    }

    .message-input {
      flex: 1;
      padding: 10px 16px;
      border: 1px solid var(--surface-border);
      border-radius: 24px;
      font-size: 0.9rem;
      outline: none;
      transition: all .2s;
      background: var(--surface-ground);
      color: var(--text-color);
    }
    .message-input:focus {
      border-color: #4caf50;
      background: var(--surface-card);
      box-shadow: 0 0 0 3px rgba(76,175,80,0.1);
    }

    .btn-send {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4caf50, #2e7d32);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all .2s;
    }
    .btn-send:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(76,175,80,0.3);
    }
    .btn-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ─── New Chat Dialog ─────────────────────────────────────── */
    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn .2s;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .new-chat-dialog {
      background: var(--surface-card);
      border-radius: 20px;
      width: 420px;
      max-height: 70vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 48px rgba(0,0,0,0.15);
      animation: slideUp .25s ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 20px 12px;
    }
    .dialog-header h3 {
      margin: 0;
      font-size: 1.15rem;
      color: var(--text-color);
    }
    .btn-close {
      width: 32px; height: 32px;
      border-radius: 50%;
      border: none;
      background: var(--surface-ground);
      font-size: 1.2rem;
      cursor: pointer;
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-close:hover { background: var(--surface-hover); }

    .dialog-tabs {
      display: flex;
      gap: 4px;
      padding: 0 20px 12px;
    }
    .dialog-tabs button {
      flex: 1;
      padding: 8px;
      border: none;
      border-radius: 10px;
      background: var(--surface-ground);
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--text-color-secondary);
      cursor: pointer;
      transition: all .2s;
    }
    .dialog-tabs button.active {
      background: linear-gradient(135deg, #4caf50, #2e7d32);
      color: white;
    }

    .dialog-body {
      padding: 0 20px 20px;
      overflow-y: auto;
    }
    .dialog-body input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--surface-border);
      background: var(--surface-ground);
      color: var(--text-color);
      border-radius: 12px;
      font-size: 0.88rem;
      outline: none;
      margin-bottom: 12px;
      transition: all .2s;
    }
    .dialog-body input:focus {
      border-color: #4caf50;
      box-shadow: 0 0 0 3px rgba(76,175,80,0.1);
    }

    .user-results {
      max-height: 300px;
      overflow-y: auto;
    }

    .user-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 8px;
      border-radius: 12px;
      cursor: pointer;
      transition: background .15s;
    }
    .user-item:hover { background: var(--surface-hover); }

    .user-avatar {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #a5d6a7, #66bb6a);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      position: relative;
    }
    .user-avatar.online::after {
      content: '';
      position: absolute;
      bottom: 1px; right: 1px;
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #4caf50;
      border: 2px solid #fff;
    }

    .user-name {
      font-weight: 600;
      font-size: 0.92rem;
      color: var(--text-color);
    }
    .user-handle {
      font-size: 0.78rem;
      color: var(--text-color-secondary);
    }

    .check-icon {
      margin-left: auto;
      color: #4caf50;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .selected-members {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }
    .member-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 16px;
      background: var(--primary-color-transparent, rgba(76,175,80,0.1));
      color: var(--primary-color);
      font-size: 0.8rem;
      font-weight: 600;
    }
    .member-chip button {
      background: none;
      border: none;
      color: var(--primary-color);
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0 2px;
    }

    .btn-create-group {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #4caf50, #2e7d32);
      color: white;
      font-weight: 700;
      font-size: 0.92rem;
      cursor: pointer;
      margin-top: 12px;
      transition: all .2s;
    }
    .btn-create-group:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(76,175,80,0.3);
    }
    .btn-create-group:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-start {
      margin-top: 12px;
      padding: 10px 24px;
      border: none;
      border-radius: 24px;
      background: linear-gradient(135deg, #4caf50, #2e7d32);
      color: white;
      font-weight: 600;
      cursor: pointer;
    }

    .empty-state, .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: var(--text-color-secondary);
    }

    .spinner {
      width: 32px; height: 32px;
      border: 3px solid #e0e8e0;
      border-top-color: #4caf50;
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .no-results {
      text-align: center;
      padding: 20px;
      color: var(--text-color-secondary);
    }

    /* ─── Responsive ──────────────────────────────────────────── */
    @media (max-width: 768px) {
      .chat-sidebar { width: 100%; }
      .chat-main { width: 100%; }
      .hidden-mobile { display: none !important; }
      .btn-back { display: flex; }
      .new-chat-dialog { width: 95vw; }
    }

    .profile-link {
      color: inherit;
      text-decoration: none;
      cursor: pointer;
    }
    .profile-link:hover {
      text-decoration: underline;
    }
  `]
})
export class ChatPageComponent implements OnInit, OnDestroy {
  chatService = inject(ChatService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  activeRoom = signal<ChatRoom | null>(null);
  searchQuery = '';
  filteredRooms = signal<ChatRoom[]>([]);
  messageText = '';
  showNewChatModal = false;
  mutualConnections = signal<UserProfile[]>([]);
  isLoadingMutuals = signal(false);

  newChatTab = signal<'private' | 'group'>('private');
  userSearchQuery = '';
  userResults = signal<UserSearchResult[]>([]);
  selectedMembers = signal<UserSearchResult[]>([]);
  newGroupName = '';

  private typingTimeout: any;
  private searchTimeout: any;

  currentUserId = computed(() => this.authService.currentUser()?.id || '');

  private route = inject(ActivatedRoute);
  private ngZone = inject(NgZone);

  ngOnInit(): void {
    console.log('ChatPageComponent initialized');
    console.log('Current URL (window):', window.location.href);
    console.log('Snapshot Query Params:', this.route.snapshot.queryParams);

    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, redirecting to login');
      this.router.navigate(['/auth/login']);
      return;
    }

    console.log('Initializing ChatService...');
    this.chatService.init();
    this.chatService.loadRooms();

    // Sync filtered rooms when rooms change
    setTimeout(() => this.filterRooms(), 1000);

    // Check snapshot first
    const snapshotUserId = this.route.snapshot.queryParams['userId'];
    if (snapshotUserId) {
      console.log('Found userId in snapshot:', snapshotUserId);
      this.openPrivateChatWithUser(snapshotUserId);
    }

    // Also subscribe for changes
    this.route.queryParams.subscribe(params => {
      const targetUserId = params['userId'];
      console.log('ChatPage queryParams changed:', params, 'targetUserId:', targetUserId);
      // Only trigger if we haven't already opened it via snapshot (or if it changed)
      if (targetUserId && targetUserId !== snapshotUserId) {
        this.openPrivateChatWithUser(targetUserId);
      }
    });
  }

  /**
   * Creates or finds a private chat room with the given user,
   * then selects it to open the conversation.
   */
  private openPrivateChatWithUser(userId: string): void {
    console.log('openPrivateChatWithUser called with:', userId);
    this.chatService.getOrCreatePrivateRoom(userId).subscribe({
      next: (room) => {
        console.log('Private room received:', room.id, room.type);
        this.ngZone.run(() => {
          // Select the room directly
          this.activeRoom.set(room);
          this.chatService.messages.set([]);
          this.chatService.loadMessages(room.id);
          this.chatService.joinRoom(room.id, this.currentUserId(), room);
          // Reload rooms so the sidebar shows the new room
          this.chatService.loadRooms();
          setTimeout(() => {
            this.filterRooms();
            this.scrollToBottom();
          }, 800);
        });
      },
      error: (err) => {
        console.error('Failed to open private chat:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.chatService.destroy();
  }

  filterRooms(): void {
    const rooms = this.chatService.rooms();
    if (!this.searchQuery.trim()) {
      this.filteredRooms.set(rooms);
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredRooms.set(
        rooms.filter(r =>
          this.getRoomDisplayName(r).toLowerCase().includes(q))
      );
    }
  }

  selectRoom(room: ChatRoom): void {
    this.activeRoom.set(room);
    this.chatService.messages.set([]);
    this.chatService.loadMessages(room.id);
    this.chatService.joinRoom(room.id, this.currentUserId(), room);

    // Scroll to bottom after messages load
    setTimeout(() => this.scrollToBottom(), 500);
  }

  isSending = false;

  send(): void {
    if (this.isSending) return;
    const text = this.messageText.trim();
    if (!text || !this.activeRoom()) return;

    this.isSending = true;
    const roomId = this.activeRoom()!.id;

    // Optimistic UI Update (Optional, but good for UX)
    const tempId = 'temp-' + Date.now();
    const currentUser = this.authService.currentUser();
    const tempMsg: ChatMessage = {
      id: tempId,
      roomId: roomId,
      senderId: currentUser?.id || 'unknown',
      senderUsername: currentUser?.username || 'me',
      senderFullName: currentUser?.fullName || 'Me',
      content: text,
      messageType: 'TEXT',
      mediaUrl: null,
      createdAt: new Date().toISOString()
    };

    // Add temp message immediately
    this.chatService.messages.update(prev => [...prev, tempMsg]);

    this.chatService.sendMessage(roomId, text);
    this.messageText = '';
    setTimeout(() => this.scrollToBottom(), 100);

    // Release lock after delay
    setTimeout(() => {
      this.isSending = false;
    }, 500);
  }

  onTyping(): void {
    if (!this.activeRoom()) return;
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.chatService.sendTyping(this.activeRoom()!.id);
    }, 300);
  }

  onFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file || !this.activeRoom()) return;

    this.chatService.uploadMedia(this.activeRoom()!.id, file).subscribe(msg => {
      // The WebSocket subscription will add it to messages
      setTimeout(() => this.scrollToBottom(), 200);
    });
  }
  searchUsersDebounced(): void {
    clearTimeout(this.searchTimeout);
    if (this.userSearchQuery.length < 2) {
      this.userResults.set([]);
      return;
    }
    this.searchTimeout = setTimeout(() => {
      this.chatService.searchUsers(this.userSearchQuery).subscribe(
        users => this.userResults.set(users)
      );
    }, 300);
  }

  startPrivateChat(userId: string): void {
    this.chatService.getOrCreatePrivateRoom(userId).subscribe(room => {
      this.showNewChatModal = false;
      this.chatService.loadRooms();
      setTimeout(() => this.selectRoom(room), 300);
    });
  }

  toggleMember(user: UserSearchResult): void {
    this.selectedMembers.update(members => {
      if (members.some(m => m.id === user.id)) {
        return members.filter(m => m.id !== user.id);
      }
      return [...members, user];
    });
  }

  removeMember(user: UserSearchResult): void {
    this.selectedMembers.update(m => m.filter(u => u.id !== user.id));
  }

  isMemberSelected(user: UserSearchResult): boolean {
    return this.selectedMembers().some(m => m.id === user.id);
  }

  createGroup(): void {
    const name = this.newGroupName.trim();
    if (!name || this.selectedMembers().length === 0) return;

    this.chatService.createGroupRoom(name, this.selectedMembers().map(m => m.id))
      .subscribe(room => {
        this.showNewChatModal = false;
        this.newGroupName = '';
        this.selectedMembers.set([]);
        this.chatService.loadRooms();
        setTimeout(() => this.selectRoom(room), 300);
      });
  }

  loadMutualConnections(): void {
    if (this.mutualConnections().length > 0) return; // already loaded
    this.isLoadingMutuals.set(true);
    const userId = this.currentUserId();
    if (!userId) return;

    this.userService.getMutualConnections(userId).subscribe({
      next: (users) => {
        this.mutualConnections.set(users);
        this.isLoadingMutuals.set(false);
      },
      error: (err) => {
        console.error('Failed to load mutual connections:', err);
        this.isLoadingMutuals.set(false);
      }
    });
  }

  startConversation(user: UserProfile): void {
    this.showNewChatModal = false;
    this.openPrivateChatWithUser(user.id);
  }

  resolveImageUrl(url: string | null | undefined): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }

  getOtherMember(room: ChatRoom): any {
    if (!room || !room.members || room.type === 'GROUP') return null;
    const currentId = this.currentUserId();
    return room.members.find(m => m.userId !== currentId);
  }

  getRoomDisplayName(room: ChatRoom): string {
    if (room.type === 'GROUP') return room.name || 'Group Chat';
    const other = this.getOtherMember(room);
    return other?.fullName || 'Private Chat';
  }

  getRoomAvatarUrl(room: ChatRoom): string | undefined {
    if (room.type === 'GROUP') return undefined;
    const other = this.getOtherMember(room);
    return other?.profilePictureUrl;
  }

  getRoomInitial(room: ChatRoom): string {
    return this.getRoomDisplayName(room).charAt(0).toUpperCase();
  }

  isAnyMemberOnline(room: ChatRoom): boolean {
    if (!room || !room.members) return false;
    const currentId = this.currentUserId();
    return room.members
      .filter(m => m.userId !== currentId)
      .some(m => this.chatService.isUserOnline(m.userId));
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  openImage(url: string): void {
    window.open('http://localhost:8080' + url, '_blank');
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
