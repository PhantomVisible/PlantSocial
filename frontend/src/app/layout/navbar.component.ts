import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <nav class="navbar">
      <div class="navbar__container">
        <!-- Logo -->
        <a routerLink="/" class="navbar__logo">
          <span class="logo-emoji">🌿</span>
          <span class="logo-text">Trellis</span>
        </a>

        <!-- Right Side: Guest vs User -->
        <div class="navbar__actions">
          <ng-container *ngIf="user(); else guestActions">
             <!-- User Actions -->
             <a routerLink="/feed" class="btn-create" title="Create Post">
               <i class="pi pi-plus"></i>
             </a>
             
             <!-- Avatar dropdown trigger (simple link for now) -->
             <a [routerLink]="['/profile', user()!.id]" class="user-avatar">
               {{ getInitials(user()!.fullName) }}
             </a>
          </ng-container>

          <ng-template #guestActions>
            <a routerLink="/auth/login" class="btn btn--outline">Log In</a>
            <a routerLink="/auth/register" class="btn btn--filled">Sign Up</a>
          </ng-template>
        </div>
      </div>
    </nav>
  `,
    styles: [`
    .navbar {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--trellis-border-light);
      position: sticky;
      top: 0;
      z-index: 1000;
      height: 60px;
    }
    .navbar__container {
      max-width: 1200px;
      margin: 0 auto;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
    }

    .navbar__logo {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
    }
    .logo-emoji { font-size: 1.5rem; }
    .logo-text {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 1.3rem;
      color: var(--trellis-green-dark);
      letter-spacing: -0.5px;
    }

    .navbar__actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* User Actions */
    .btn-create {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--trellis-text);
      text-decoration: none;
      font-size: 1.1rem;
      transition: background 0.15s ease;
    }
    .btn-create:hover { background: rgba(0,0,0,0.05); }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--trellis-green);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      text-decoration: none;
      border: 2px solid var(--trellis-white);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    /* Guest Buttons */
    .btn {
      padding: 8px 18px;
      border-radius: 20px;
      text-decoration: none;
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 0.88rem;
      display: inline-block;
      transition: all 0.15s ease;
    }
    .btn--outline {
      color: var(--trellis-green-dark);
      border: 1px solid var(--trellis-green);
    }
    .btn--outline:hover { background: var(--trellis-green-ghost); }

    .btn--filled {
      background: var(--trellis-green);
      color: white;
      border: 1px solid var(--trellis-green);
    }
    .btn--filled:hover { background: var(--trellis-green-dark); }
  `]
})
export class NavbarComponent {
    authService = inject(AuthService);
    user = this.authService.currentUser;

    getInitials(name: string): string {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
}
