import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../core/notification.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
    selector: 'app-notifications-page',
    standalone: true,
    imports: [CommonModule, RouterModule, AvatarComponent],
    template: `
    <div class="notifications-container">
      <header class="notifications-header">
        <h1>Notifications</h1>
      </header>

      <div class="notifications-list">
        <div *ngIf="notifService.notificationsList().length === 0" class="empty-state">
          <i class="pi pi-bell-slash"></i>
          <p>No notifications yet.</p>
        </div>

        <div 
          *ngFor="let n of notifService.notificationsList()" 
          class="notification-item"
          [class.notification-item--unread]="!n.isRead"
          (click)="handleNotificationClick(n)"
        >
          <app-avatar 
            [imageUrl]="resolveImageUrl(n.senderProfilePicture)" 
            [name]="n.senderName" 
            [size]="40"
          ></app-avatar>
          
          <div class="notification-content">
            <p class="notification-text">
              <span class="user-name">{{ n.senderName }}</span> {{ n.content }}
            </p>
            <span class="notification-time">{{ n.createdAt | date:'short' }}</span>
          </div>

          <div *ngIf="!n.isRead" class="unread-dot"></div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .notifications-container {
      padding: 0;
      font-family: 'Inter', sans-serif;
    }
    .notifications-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--trellis-border-light);
      background: var(--trellis-white);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .notifications-header h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--trellis-text);
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--trellis-border-light);
      cursor: pointer;
      transition: background 0.1s ease;
      position: relative;
    }
    .notification-item:hover {
      background: rgba(0,0,0,0.02);
    }
    .notification-item--unread {
      background: var(--trellis-green-ghost);
    }
    .notification-item--unread:hover {
      background: var(--trellis-green-light);
    }

    .notification-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .notification-text {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.4;
      color: var(--trellis-text);
    }
    .user-name {
      font-weight: 700;
    }
    .notification-time {
      font-size: 0.8rem;
      color: var(--trellis-text-hint);
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--trellis-green);
      margin-top: 6px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      color: var(--trellis-text-hint);
      text-align: center;
    }
    .empty-state i {
      font-size: 3rem;
      margin-bottom: 16px;
    }
  `]
})
export class NotificationsPageComponent {
    notifService = inject(NotificationService);

    handleNotificationClick(n: Notification) {
        if (!n.isRead) {
            this.notifService.markAsRead(n.id);
        }
        // TODO: Navigate to related activity (Post or Chat)
    }

    resolveImageUrl(url: string | null): string | null {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return 'http://localhost:8080' + url;
    }
}
