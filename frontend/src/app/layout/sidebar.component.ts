import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { AuthPromptDialogComponent } from '../auth/auth-prompt-dialog.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, AuthPromptDialogComponent],
  template: `
    <nav class="sidebar">
      <!-- Logo -->
      <div class="sidebar__logo">
        <span class="logo-icon">🌿</span>
        <span class="logo-text">Trellis</span>
      </div>

      <!-- Nav Items -->
      <div class="sidebar__nav">
        <a routerLink="/feed" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
          <i class="pi pi-home"></i>
          <span>Home</span>
        </a>

        <button class="nav-item" (click)="showComingSoon('Explore')">
          <i class="pi pi-search"></i>
          <span>Explore</span>
        </button>

        <button class="nav-item" (click)="showComingSoon('Notifications')">
          <i class="pi pi-bell"></i>
          <span>Notifications</span>
        </button>

        <button class="nav-item" (click)="showComingSoon('Chat')">
          <i class="pi pi-comments"></i>
          <span>Chat</span>
        </button>

        <button class="nav-item" (click)="showComingSoon('Sage')">
          <i class="pi pi-sparkles"></i>
          <span>Sage</span>
          <span class="badge-ai">AI</span>
        </button>

        <a *ngIf="user()" [routerLink]="['/profile', user()!.id]" routerLinkActive="active" class="nav-item">
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
            <div class="user-avatar">{{ getInitials(user()!.fullName) }}</div>
            <div class="user-info">
              <span class="user-name">{{ user()!.fullName }}</span>
              <span class="user-email">{{ user()!.email }}</span>
            </div>
          </div>
        </ng-container>
        <ng-template #guestBlock>
          <button class="nav-item" (click)="showAuthModal.set(true)">
            <i class="pi pi-sign-in"></i>
            <span>Log In</span>
          </button>
          <button class="nav-item nav-item--signup" (click)="showAuthModal.set(true)">
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
    }
    .logo-icon { font-size: 1.8rem; }
    .logo-text {
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--trellis-green);
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
      background: var(--trellis-green);
      color: #fff !important;
      font-weight: 600;
      justify-content: center;
      margin-top: 4px;
    }
    .nav-item--signup i { color: #fff; }
    .nav-item--signup:hover { background: var(--trellis-green-dark); }

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
export class SidebarComponent {
  authService = inject(AuthService);
  user = this.authService.currentUser;
  showAuthModal = signal(false);
  toastMessage: string | null = null;
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
}
