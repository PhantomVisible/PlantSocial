import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService, Notification } from './notification.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

interface GroupedNotification {
  latestNotification: Notification;
  count: number;
  hasUnread: boolean;
  unreadIds: string[];
}

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
        <div *ngIf="groupedNotifications().length === 0" class="empty-state">
          <p>No notifications yet.</p>
        </div>

        <div 
          *ngFor="let group of groupedNotifications()" 
          class="notification-item"
          [class.notification-item--unread]="group.hasUnread"
          (click)="handleGroupClick(group)"
        >
          <div class="avatar-wrapper">
            <app-avatar 
              [imageUrl]="resolveImageUrl(group.latestNotification.senderProfilePicture)" 
              [name]="group.latestNotification.senderName" 
              [size]="44"
            ></app-avatar>
            <span *ngIf="group.count > 1" class="count-badge">{{ group.count }}</span>
          </div>
          
          <div class="notification-content">
            <p class="notification-text">
              <span class="user-name">{{ group.latestNotification.senderHandle }}</span>
              <ng-container [ngSwitch]="group.latestNotification.type">
                <span *ngSwitchCase="'FOLLOW'"> started following you.</span>
                <span *ngSwitchCase="'MESSAGE'">
                  sent you {{ group.count > 1 ? group.count + ' messages' : 'a message' }}.
                </span>
                <span *ngSwitchCase="'LIKE'">
                  {{ group.count > 1 ? 'liked ' + group.count + ' of your posts' : 'liked your post' }}.
                </span>
                <span *ngSwitchCase="'COMMENT'">
                  {{ group.count > 1 ? 'left ' + group.count + ' comments' : 'commented on your post' }}.
                </span>
                <span *ngSwitchDefault> {{ group.latestNotification.content }}</span>
              </ng-container>
            </p>
            <span class="notification-time">{{ group.latestNotification.createdAt | date:'shortTime' }} · {{ group.latestNotification.createdAt | date:'mediumDate' }}</span>
          </div>

          <div *ngIf="group.hasUnread" class="unread-dot"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      padding: 0;
      font-family: 'Inter', sans-serif;
      max-width: 600px;
      margin: 0 auto;
      background: var(--trellis-white);
      min-height: 100vh;
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
      align-items: center;
      gap: 14px;
      padding: 14px 20px;
      cursor: pointer;
      transition: background 0.1s ease;
      position: relative;
    }
    .notification-item:hover {
      background: rgba(0,0,0,0.02);
    }
    .notification-item--unread {
      background: var(--trellis-bg);
    }
    .notification-item--unread:hover {
      background: var(--trellis-green-light);
    }

    .avatar-wrapper {
      position: relative;
      flex-shrink: 0;
    }
    .count-badge {
      position: absolute;
      top: -4px;
      right: -6px;
      background: #e74c3c;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      line-height: 1;
    }

    .notification-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .notification-text {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.4;
      color: var(--trellis-text);
    }
    .user-name {
      font-weight: 600;
      cursor: pointer;
    }
    .user-name:hover {
      text-decoration: underline;
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
      flex-shrink: 0;
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
  `]
})
export class NotificationsPageComponent {
  notifService = inject(NotificationService);
  router = inject(Router);

  /** Group notifications by sender + type (Instagram-style) */
  groupedNotifications = computed<GroupedNotification[]>(() => {
    const all = this.notifService.notificationsList();
    const groupMap = new Map<string, GroupedNotification>();

    for (const n of all) {
      const key = `${n.senderHandle}__${n.type}`;
      const existing = groupMap.get(key);
      if (existing) {
        existing.count++;
        if (!n.isRead) {
          existing.hasUnread = true;
          existing.unreadIds.push(n.id);
        }
        // Keep the latest (first in list, since list is newest-first)
      } else {
        groupMap.set(key, {
          latestNotification: n,
          count: 1,
          hasUnread: !n.isRead,
          unreadIds: n.isRead ? [] : [n.id],
        });
      }
    }
    return Array.from(groupMap.values());
  });

  handleGroupClick(group: GroupedNotification) {
    // Mark all unread in this group as read
    for (const id of group.unreadIds) {
      this.notifService.markAsRead(id);
    }

    const n = group.latestNotification;
    switch (n.type) {
      case 'FOLLOW':
        this.router.navigate(['/profile', n.senderHandle]);
        break;
      case 'MESSAGE':
        this.router.navigate(['/chat'], { queryParams: { userId: n.relatedId } });
        break;
      case 'LIKE':
      case 'COMMENT':
        this.router.navigate(['/post', n.relatedId]);
        break;
      default:
        console.warn('Unknown notification type:', n.type);
    }
  }

  resolveImageUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }
}
