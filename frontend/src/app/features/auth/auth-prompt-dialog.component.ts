import { Component, Output, EventEmitter, Input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthFormComponent } from '../../auth/auth-form.component';
import { VerificationComponent } from '../../auth/verification.component';

@Component({
  selector: 'app-auth-prompt-dialog',
  standalone: true,
  imports: [CommonModule, AuthFormComponent, VerificationComponent],
  template: `
    <div class="dialog-overlay" (click)="close.emit()">
      <div class="dialog" [class.dialog--form]="view() !== 'prompt'" (click)="$event.stopPropagation()">
        <button class="dialog__close" (click)="close.emit()">&times;</button>
        
        <!-- Prompt View -->
        <ng-container *ngIf="view() === 'prompt'">
          <img src="assets/logo.png" alt="Xyla" class="dialog__logo">
          <h2 class="dialog__title">Start growing with us</h2>
          <p class="dialog__text">
            Join Xyla to like posts, share your garden, and connect with other plant lovers.
          </p>
          
          <div class="dialog__actions">
            <button class="btn btn--login" (click)="view.set('login')">Log in</button>
            <button class="btn btn--signup" (click)="view.set('register')">Sign up</button>
          </div>
        </ng-container>

        <!-- Login Form View -->
        <ng-container *ngIf="view() === 'login'">
          <img src="assets/logo.png" alt="Xyla" class="dialog__logo dialog__logo--sm">
          <h2 class="dialog__title">Welcome back</h2>
          <p class="dialog__text">Sign in to your community</p>
          <app-auth-form
            mode="login"
            [hideFooter]="true"
            [hideHeader]="true"
            (authSuccess)="close.emit()"
            (footerNav)="view.set('register')"
          ></app-auth-form>
          <p class="dialog__footer">
            Don't have an account? <a (click)="view.set('register')">Sign up</a>
          </p>
        </ng-container>

        <!-- Register Form View -->
        <ng-container *ngIf="view() === 'register'">
          <img src="assets/logo.png" alt="Xyla" class="dialog__logo dialog__logo--sm">
          <h2 class="dialog__title">Join the garden</h2>
          <p class="dialog__text">Create your free account</p>
          <app-auth-form
            mode="register"
            [hideFooter]="true"
            [hideHeader]="true"
            (registerSuccess)="onRegisterSuccess($event)"
            (footerNav)="view.set('login')"
          ></app-auth-form>
          <p class="dialog__footer">
            Already have an account? <a (click)="view.set('login')">Sign in</a>
          </p>
        </ng-container>

        <!-- Verification View -->
        <ng-container *ngIf="view() === 'verify'">
          <app-verification
            [email]="registeredEmail"
            (verified)="close.emit()"
          ></app-verification>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fade-in 0.2s ease;
    }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

    .dialog {
      background: var(--trellis-white);
      width: 90%;
      max-width: 400px;
      padding: 32px 24px;
      border-radius: var(--trellis-radius-lg);
      text-align: center;
      position: relative;
      animation: slide-up 0.2s ease;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-height: 90vh;
      overflow-y: auto;
    }
    .dialog--form {
      max-width: 440px;
    }
    @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .dialog__close {
      position: absolute;
      top: 12px;
      right: 12px;
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--trellis-text-hint);
      cursor: pointer;
      line-height: 1;
      z-index: 1;
    }

    .dialog__logo {
      width: 64px;
      height: 64px;
      object-fit: contain;
      margin-bottom: 16px;
      border-radius: 14px;
    }
    .dialog__logo--sm {
      width: 48px;
      height: 48px;
      margin-bottom: 10px;
    }
    .dialog__title {
      font-size: 1.5rem;
      font-weight: 800;
      margin: 0 0 8px;
      color: var(--trellis-text);
    }
    .dialog__text {
      color: var(--trellis-text-secondary);
      margin: 0 0 24px;
      line-height: 1.5;
      font-size: 0.9rem;
    }

    .dialog__actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .btn {
      width: 100%;
      padding: 12px;
      border-radius: 24px;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      font-size: 1rem;
      cursor: pointer;
      border: none;
      transition: transform 0.1s ease;
    }
    .btn:active { transform: scale(0.98); }

    .btn--signup {
      background: var(--trellis-green);
      color: #fff;
    }
    .btn--signup:hover { background: var(--trellis-green-dark); }

    .btn--login {
      background: transparent;
      border: 1px solid var(--trellis-border-light);
      color: var(--trellis-green);
    }
    .btn--login:hover {
      background: var(--trellis-green-ghost);
      border-color: var(--trellis-green);
    }

    .dialog__footer {
      margin: 16px 0 0;
      font-size: 0.88rem;
      color: var(--trellis-text-secondary);
    }
    .dialog__footer a {
      color: var(--trellis-green);
      cursor: pointer;
      font-weight: 600;
    }
    .dialog__footer a:hover {
      text-decoration: underline;
    }
  `]
})
export class AuthPromptDialogComponent implements OnInit {
  @Input() initialView: 'prompt' | 'login' | 'register' = 'prompt';
  @Output() close = new EventEmitter<void>();

  view = signal<'prompt' | 'login' | 'register' | 'verify'>('prompt');
  registeredEmail = '';

  constructor(private router: Router) { }

  ngOnInit() {
    this.view.set(this.initialView);
  }

  navigate(path: string) {
    this.router.navigate([path]);
    this.close.emit();
  }

  onRegisterSuccess(email: string) {
    this.registeredEmail = email;
    this.view.set('verify');
  }
}
