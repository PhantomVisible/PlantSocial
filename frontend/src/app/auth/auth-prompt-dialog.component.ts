import { Component, Output, EventEmitter, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthFormComponent } from './auth-form.component';
import { VerificationComponent } from './verification.component'; // Import

@Component({
  selector: 'app-auth-prompt-dialog',
  standalone: true,
  imports: [CommonModule, AuthFormComponent, VerificationComponent],
  template: `
    <div class="glass-overlay" (click)="close.emit()" [@.disabled]="true">
      <div class="glass-card" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="close.emit()">
          <i class="pi pi-times"></i>
        </button>
        
        <ng-container [ngSwitch]="activeMode()">
            <app-auth-form
              *ngSwitchCase="'login'"
              mode="login"
              (authSuccess)="close.emit()"
              (footerNav)="activeMode.set('register')"
              (forgotPasswordClick)="close.emit()"
            ></app-auth-form>

            <app-auth-form
              *ngSwitchCase="'register'"
              mode="register"
              (registerSuccess)="onRegisterSuccess($event)"
              (footerNav)="activeMode.set('login')"
            ></app-auth-form>

            <app-verification
                *ngSwitchCase="'verify'"
                [email]="registeredEmail()"
                (verifySuccess)="onVerifySuccess()"
                (cancel)="activeMode.set('login')"
            ></app-verification>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .glass-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 5000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: overlay-in 0.3s ease;
    }
    @keyframes overlay-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .glass-card {
      position: relative;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 20px;
      padding: 36px 32px;
      box-shadow:
        0 24px 80px rgba(0, 0, 0, 0.15),
        0 8px 32px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
      max-width: 440px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      animation: card-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes card-in {
      from {
        opacity: 0;
        transform: translateY(24px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.05);
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      transition: all 0.15s ease;
      z-index: 10;
    }
    .close-btn:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #374151;
    }

    /* Scrollbar */
    .glass-card::-webkit-scrollbar { width: 4px; }
    .glass-card::-webkit-scrollbar-track { background: transparent; }
    .glass-card::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
  `]
})
export class AuthPromptDialogComponent {
  @Output() close = new EventEmitter<void>();

  activeMode = signal<'login' | 'register' | 'verify'>('login');
  registeredEmail = signal('');

  toggleMode() {
    this.activeMode.update(m => m === 'login' ? 'register' : 'login');
  }

  onRegisterSuccess(email: string) {
    this.registeredEmail.set(email);
    this.activeMode.set('verify');
  }

  onVerifySuccess() {
    // Maybe show toast? Or just auto-login if backend returned token?
    // Wait, verify endpoint currently just enables account. User needs to login.
    this.activeMode.set('login');
    // Ideally we would pre-fill email in login form.
    // Or we can modify verify endpoint to return token to auto-login.
    // For now, redirect to login is fine.
  }
}
