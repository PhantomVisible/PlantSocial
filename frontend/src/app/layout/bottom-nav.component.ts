import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../features/notifications/notification.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bottom-nav">
      <a
        routerLink="/feed"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        class="bottom-nav__item"
      >
        <i class="pi pi-home"></i>
        <span>Home</span>
      </a>

      <a
        routerLink="/explore"
        routerLinkActive="active"
        class="bottom-nav__item"
      >
        <i class="pi pi-search"></i>
        <span>Explore</span>
      </a>

      <a
        *ngIf="user()"
        routerLink="/greenhouse"
        routerLinkActive="active"
        class="bottom-nav__item"
      >
        <i class="pi pi-sparkles"></i>
        <span>Garden</span>
      </a>

      <a
        *ngIf="user()"
        routerLink="/notifications"
        routerLinkActive="active"
        class="bottom-nav__item"
      >
        <span class="icon-wrap">
          <i class="pi pi-bell"></i>
          <span *ngIf="unreadCount() > 0" class="badge">{{
            unreadCount() > 9 ? '9+' : unreadCount()
          }}</span>
        </span>
        <span>Alerts</span>
      </a>

      <a
        *ngIf="user()"
        [routerLink]="['/profile', user()!.username]"
        routerLinkActive="active"
        class="bottom-nav__item"
      >
        <i class="pi pi-user"></i>
        <span>Profile</span>
      </a>

      <!-- Guest fallback: show Login instead of authenticated-only items -->
      <a *ngIf="!user()" routerLink="/auth/login" class="bottom-nav__item">
        <i class="pi pi-sign-in"></i>
        <span>Log In</span>
      </a>
    </nav>
  `,
  styles: [
    `
      .bottom-nav {
        display: none;
      }

      @media (max-width: 768px) {
        .bottom-nav {
          display: flex;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 64px;
          padding: 4px 8px 8px;
          justify-content: space-around;
          align-items: center;

          /* Glassmorphic background */
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.04);
        }

        /* Dark mode support */
        :host-context(.dark-mode) .bottom-nav,
        :host-context([data-theme='dark']) .bottom-nav {
          background: rgba(30, 30, 30, 0.88);
          border-top-color: rgba(255, 255, 255, 0.08);
        }
      }

      .bottom-nav__item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        flex: 1;
        min-width: 0;
        padding: 6px 4px;
        border-radius: 12px;
        text-decoration: none;
        color: var(--trellis-text-secondary, #888);
        font-family: 'Inter', sans-serif;
        transition: all 0.2s ease;
        -webkit-tap-highlight-color: transparent;
        border: none;
        background: none;
        cursor: pointer;
      }

      .bottom-nav__item i {
        font-size: 1.25rem;
        transition:
          transform 0.2s ease,
          color 0.2s ease;
      }

      .bottom-nav__item span:not(.badge):not(.icon-wrap) {
        font-size: 0.6rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .bottom-nav__item:active i {
        transform: scale(0.85);
      }

      /* Active state */
      .bottom-nav__item.active {
        color: var(--xyla-green, #00c853);
      }

      .bottom-nav__item.active i {
        transform: scale(1.1);
      }

      /* Active pill indicator */
      .bottom-nav__item.active::before {
        content: '';
        position: absolute;
        top: 0;
        width: 24px;
        height: 3px;
        border-radius: 0 0 3px 3px;
        background: var(--xyla-green, #00c853);
      }

      .bottom-nav__item {
        position: relative;
      }

      /* Badge */
      .icon-wrap {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .badge {
        position: absolute;
        top: -5px;
        right: -10px;
        background: #ef4444;
        color: #fff;
        font-size: 0.55rem;
        font-weight: 700;
        min-width: 14px;
        height: 14px;
        border-radius: 7px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 3px;
        border: 1.5px solid #fff;
        line-height: 1;
      }
    `,
  ],
})
export class BottomNavComponent {
  private authService = inject(AuthService);
  private notifService = inject(NotificationService);

  user = this.authService.currentUser;
  unreadCount = this.notifService.unreadCount;
}
