import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { AuthPromptDialogComponent } from '../features/auth/auth-prompt-dialog.component';
import { PlantDoctorService } from '../features/plant-doctor/plant-doctor.service';

import { AvatarComponent } from '../shared/components/avatar/avatar.component';
import { NotificationService } from '../features/notifications/notification.service';
import { ShopService } from '../features/shop/shop.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, AuthPromptDialogComponent, AvatarComponent],
  template: `
    <nav class="sidebar">
      <!-- Logo -->
      <div class="sidebar__logo" routerLink="/feed">
        <img src="assets/logo.png" alt="Xyla" class="logo-img">
        <span class="logo-text">Xyla</span>
      </div>

      <!-- Nav Items -->
      <div class="sidebar__nav">
        <a routerLink="/feed" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
          <i class="pi pi-home"></i>
          <span>Home</span>
        </a>

        <a routerLink="/explore" routerLinkActive="active" class="nav-item">
          <i class="pi pi-search"></i>
          <span>Explore</span>
        </a>

        <a routerLink="/marketplace" routerLinkActive="active" class="nav-item nav-item--shop">
          <i class="pi pi-shopping-bag"></i>
          <span>Marketplace</span>
        </a>

        <!-- Cart temporarily hidden implementation of Marketplace is direct pay
        <a *ngIf="shopService.cartItemCount() > 0" routerLink="/shop/cart" routerLinkActive="active" class="nav-item nav-item--cart">
          <i class="pi pi-shopping-cart"></i>
          <span>Cart</span>
          <span class="badge-count badge-count--cart">
            {{ shopService.cartItemCount() }}
          </span>
        </a>
        -->

        <a *ngIf="user()" routerLink="/notifications" routerLinkActive="active" class="nav-item">
          <span class="icon-wrap">
            <i class="pi pi-bell"></i>
            <span *ngIf="notifService.unreadCount() > 0" class="badge-count">{{ notifService.unreadCount() }}</span>
          </span>
          <span>Notifications</span>
        </a>

        <a *ngIf="user()" routerLink="/chat" routerLinkActive="active" class="nav-item">
          <span class="icon-wrap">
            <i class="pi pi-comments"></i>
            <span *ngIf="unreadMessageCount() > 0" class="badge-count">{{ unreadMessageCount() }}</span>
          </span>
          <span>Chat</span>
        </a>

        <button class="nav-item" (click)="plantDoctor.open()">
          <i class="pi pi-heart"></i>
          <span>Plant Doctor</span>
          <span class="badge-ai">AI</span>
        </button>

        <a *ngIf="user()" [routerLink]="['/profile', user()!.username]" routerLinkActive="active" class="nav-item">
          <i class="pi pi-user"></i>
          <span>Profile</span>
        </a>
      </div>

      <!-- Bottom -->
      <div class="sidebar__bottom">
        <ng-container *ngIf="user(); else guestBlock">
          <button class="nav-item nav-item--logout" (click)="authService.logout()">
            <i class="pi pi-sign-out"></i>
            <span>Log Out</span>
          </button>
          <div class="sidebar__user">
            <!-- Avatar -->
            <app-avatar 
              [imageUrl]="resolveImageUrl(user()!.profilePictureUrl)" 
              [name]="user()!.fullName" 
              [size]="36">
            </app-avatar>
            
            <div class="user-info">
              <span class="user-name">{{ user()!.fullName }}</span>
              <span class="user-email">{{ user()!.email }}</span>
            </div>
          </div>
        </ng-container>
        <ng-template #guestBlock>
          <button class="nav-item" (click)="openAuth('login')">
            <i class="pi pi-sign-in"></i>
            <span>Log In</span>
          </button>
          <button class="nav-item nav-item--signup" routerLink="/auth/register">
            <i class="pi pi-user-plus"></i>
            <span>Sign Up</span>
          </button>
        </ng-template>
      </div>

      <!-- Toast -->
      <div *ngIf="toastMessage" class="sidebar-toast" (click)="toastMessage = null">
        {{ toastMessage }}
      </div>
    </nav>

    <!-- Auth Modal -->
    <app-auth-prompt-dialog
      *ngIf="showAuthModal()"
      [initialView]="authInitialView()"
      (close)="showAuthModal.set(false)"
    ></app-auth-prompt-dialog>

  `,
  styles: [`
    .sidebar {
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: sticky;
      top: 0;
      width: 250px;
      padding: 12px 12px 16px;
      border-right: 1px solid var(--trellis-border-light);
      background: var(--trellis-white);
      font-family: 'Inter', sans-serif;
    }

    .sidebar__logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px 20px;
      cursor: pointer;
    }
    .logo-img {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      object-fit: contain;
      background: #fff;
      padding: 2px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .logo-text {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--xyla-green);
      letter-spacing: -0.5px;
    }

    .sidebar__nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 14px;
      border-radius: 28px;
      font-size: 1.05rem;
      font-weight: 500;
      color: var(--trellis-text);
      text-decoration: none;
      border: none;
      background: none;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: 'Inter', sans-serif;
      white-space: nowrap;
    }
    .nav-item i { font-size: 1.3rem; width: 24px; text-align: center; }
    .nav-item:hover { background: var(--trellis-green-ghost); }
    .nav-item.active { font-weight: 700; color: var(--trellis-green); }
    .nav-item.active i { color: var(--trellis-green); }

    .badge-ai {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 6px;
      background: linear-gradient(135deg, #A855F7, #6366F1);
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .nav-item--logout:hover { background: #FFF5F5; color: #E53E3E; }
    .nav-item--logout:hover i { color: #E53E3E; }

    .nav-item--signup {
      background: var(--xyla-green);
      color: #fff !important;
      font-weight: 600;
      justify-content: center;
      margin-top: 4px;
    }
    .nav-item--signup i { color: #fff; }
    .nav-item--signup:hover { background: var(--xyla-green-dark); }

    .nav-item--notifications,
    .nav-item--chat {
      /* no longer needed — badges are anchored to .icon-wrap */
    }

    .icon-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .badge-count {
      position: absolute;
      top: -6px;
      right: -8px;
      background: #EF4444;
      color: #fff;
      font-size: 0.62rem;
      font-weight: 700;
      min-width: 16px;
      height: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
      border: 2px solid #fff;
      line-height: 1;
    }

    .sidebar__bottom {
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-top: 1px solid var(--trellis-border-light);
      padding-top: 12px;
      margin-top: 8px;
    }

    .sidebar__user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 28px;
      transition: background 0.15s ease;
    }
    .sidebar__user:hover { background: rgba(0,0,0,0.03); }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--trellis-green); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
    }
    .user-info { display: flex; flex-direction: column; overflow: hidden; }
    .user-name {
      font-size: 0.88rem; font-weight: 600; color: var(--trellis-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .user-email {
      font-size: 0.75rem; color: var(--trellis-text-hint);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .sidebar-toast {
      position: fixed; bottom: 24px; left: 270px;
      background: var(--trellis-text); color: #fff;
      padding: 10px 20px; border-radius: 8px;
      font-size: 0.88rem; font-weight: 500;
      box-shadow: var(--trellis-shadow-lg); z-index: 9999;
      animation: toast-in 0.25s ease; cursor: pointer;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 1100px) {
      .sidebar { width: 72px; align-items: center; }
      .nav-item span, .logo-text, .user-info, .badge-ai { display: none; }
      .nav-item {
        justify-content: center; padding: 12px;
        border-radius: 50%; width: 48px; height: 48px;
      }
      .nav-item i { margin: 0; }
      .sidebar__logo { justify-content: center; padding-bottom: 16px; }
      .sidebar__user { justify-content: center; }
      .sidebar-toast { left: 80px; }
    }

    @media (max-width: 768px) {
      .sidebar { display: none; }
    }
  `]
})
export class SidebarComponent implements OnInit {
  authService = inject(AuthService);
  notifService = inject(NotificationService);
  plantDoctor = inject(PlantDoctorService);
  shopService = inject(ShopService);
  private router = inject(Router);
  user = this.authService.currentUser;
  showAuthModal = signal(false);
  authInitialView = signal<'prompt' | 'login' | 'register'>('prompt');
  toastMessage: string | null = null;

  openAuth(view: 'prompt' | 'login' | 'register') {
    this.authInitialView.set(view);
    this.showAuthModal.set(true);
  }

  /** Count unread MESSAGE-type notifications for the Chat badge */
  unreadMessageCount = computed(() => {
    return this.notifService.notificationsList().filter(
      n => n.type === 'MESSAGE' && !n.isRead
    ).length;
  });

  ngOnInit() {
    // When navigating to /chat, mark all MESSAGE notifications as read
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.url.startsWith('/chat')) {
        this.markAllMessageNotificationsAsRead();
      }
    });
  }

  private markAllMessageNotificationsAsRead() {
    const unreadMessages = this.notifService.notificationsList().filter(
      n => n.type === 'MESSAGE' && !n.isRead
    );
    unreadMessages.forEach(n => this.notifService.markAsRead(n.id));
  }
  private toastTimeout: any;

  showComingSoon(name: string) {
    clearTimeout(this.toastTimeout);
    const messages: Record<string, string> = {
      'Explore': '🌍 Explore is on the way. Coming soon!',
      'Notifications': '🔔 Notifications are being planted. Coming soon!',
      'Chat': '💬 Chat is sprouting. Coming soon!',
      'Sage': '✨ Sage is currently sleeping. Coming soon!'
    };
    this.toastMessage = messages[name] || `${name} — Coming soon!`;
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  resolveImageUrl(url: string | undefined | null): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }
}
