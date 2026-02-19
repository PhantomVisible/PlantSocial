import { Component, Input, Output, EventEmitter, inject, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-auth-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-form">
      <!-- Header -->
      <div class="auth-header" *ngIf="!hideHeader">
        <img src="assets/logo.png" alt="Xyla" class="auth-logo">
        <h2 class="auth-title">{{ mode === 'login' ? 'Welcome back' : 'Join the garden' }}</h2>
        <p class="auth-subtitle">{{ mode === 'login' ? 'Sign in to your community' : 'Create your free account' }}</p>
      </div>

      <!-- Social Buttons (Visual Only) -->
      <div class="social-btns">
        <button type="button" class="social-btn" (click)="showSocialToast('Google')">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.44 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          <span>Continue with Google</span>
        </button>
        <button type="button" class="social-btn" (click)="showSocialToast('Apple')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          <span>Continue with Apple</span>
        </button>
      </div>

      <!-- Divider -->
      <div class="divider">
        <span>or</span>
      </div>

      <!-- Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <!-- Full Name (Register only) -->
        <div *ngIf="mode === 'register'" class="input-group">
          <label for="af-name">Full name</label>
          <div class="input-wrapper">
            <i class="pi pi-user input-icon"></i>
            <input
              id="af-name"
              type="text"
              formControlName="fullName"
              placeholder="Your full name"
              [class.has-error]="form.get('fullName')?.invalid && form.get('fullName')?.touched"
            />
          </div>
          <small *ngIf="form.get('fullName')?.invalid && form.get('fullName')?.touched" class="field-error">Required</small>
        </div>

        <!-- Username (Register only) -->
        <div *ngIf="mode === 'register'" class="input-group">
          <label for="af-username">Username</label>
          <div class="input-wrapper">
            <i class="pi pi-at input-icon"></i>
            <input
              id="af-username"
              type="text"
              formControlName="username"
              placeholder="Pick a username"
              [class.has-error]="form.get('username')?.invalid && form.get('username')?.touched"
            />
          </div>
          <small *ngIf="form.get('username')?.invalid && form.get('username')?.touched" class="field-error">
            Username must be 3-20 chars
          </small>
        </div>

        <!-- Email -->
        <div class="input-group">
          <label for="af-email">Email</label>
          <div class="input-wrapper">
            <i class="pi pi-envelope input-icon"></i>
            <input
              id="af-email"
              type="email"
              formControlName="email"
              placeholder="you&#64;example.com"
              [class.has-error]="form.get('email')?.invalid && form.get('email')?.touched"
            />
          </div>
          <small *ngIf="form.get('email')?.invalid && form.get('email')?.touched" class="field-error">Valid email required</small>
        </div>

        <!-- Password -->
        <div class="input-group">
          <label for="af-pass">Password</label>
          <div class="input-wrapper">
            <i class="pi pi-lock input-icon"></i>
            <input
              id="af-pass"
              [type]="showPassword ? 'text' : 'password'"
              formControlName="password"
              [placeholder]="mode === 'register' ? 'Min 6 characters' : 'Enter your password'"
              [class.has-error]="form.get('password')?.invalid && form.get('password')?.touched"
            />
            <button type="button" class="toggle-pass" (click)="showPassword = !showPassword">
              <i [class]="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>
          <small *ngIf="form.get('password')?.invalid && form.get('password')?.touched" class="field-error">
            {{ mode === 'register' ? 'Min 6 characters' : 'Required' }}
          </small>
        </div>

        <!-- Error Banner -->
        <div *ngIf="errorMessage()" class="error-banner">
          <i class="pi pi-exclamation-triangle"></i>
          <div class="error-content">
            {{ errorMessage() }}
            <a *ngIf="mode === 'login'" routerLink="/forgot-password" (click)="forgotPasswordClick.emit()" class="error-link">Forgot Password?</a>
          </div>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="submit-btn"
          [disabled]="form.invalid || loading()"
        >
          <span *ngIf="!loading()">{{ mode === 'login' ? 'Sign In' : 'Create Account' }}</span>
          <i *ngIf="loading()" class="pi pi-spin pi-spinner"></i>
        </button>
      </form>

      <!-- Footer -->
      <p class="auth-footer" *ngIf="!hideFooter">
        <ng-container *ngIf="mode === 'login'">
          Don't have an account? <a routerLink="/auth/register" (click)="footerNav.emit()">Sign up</a>
        </ng-container>
        <ng-container *ngIf="mode === 'register'">
          Already have an account? <a routerLink="/auth/login" (click)="footerNav.emit()">Sign in</a>
        </ng-container>
      </p>

      <!-- Social Toast -->
      <div *ngIf="socialToast" class="mini-toast">{{ socialToast }}</div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap');

    .auth-form {
      width: 100%;
      max-width: 380px;
      font-family: 'Inter', sans-serif;
    }

    /* ===== Header ===== */
    .auth-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .auth-logo {
      width: 56px;
      height: 56px;
      object-fit: contain;
      display: block;
      margin: 0 auto 12px;
      border-radius: 12px;
    }
    .auth-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: #064e3b;
      margin: 0 0 6px;
      letter-spacing: -0.3px;
    }
    .auth-subtitle {
      font-size: 0.9rem;
      color: #6b7280;
      margin: 0;
    }

    /* ===== Social Buttons ===== */
    .social-btns {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    .social-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 11px 16px;
      border: 1.5px solid #e5e7eb;
      border-radius: 24px;
      background: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .social-btn:hover {
      border-color: #d1d5db;
      background: #f9fafb;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    /* ===== Divider ===== */
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e5e7eb;
    }
    .divider span {
      font-size: 0.78rem;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 500;
    }

    /* ===== Inputs ===== */
    .input-group {
      margin-bottom: 16px;
    }
    .input-group label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
    }
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-icon {
      position: absolute;
      left: 14px;
      font-size: 0.9rem;
      color: #9ca3af;
      pointer-events: none;
      z-index: 1;
    }
    .input-wrapper input {
      width: 100%;
      padding: 12px 14px 12px 40px;
      border: 1.5px solid #d1d5db;
      border-radius: 12px;
      font-size: 0.92rem;
      font-family: 'Inter', sans-serif;
      background: #fff;
      color: #111827;
      outline: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }
    .input-wrapper input::placeholder { color: #9ca3af; }
    .input-wrapper input:focus {
      border-color: #059669;
      box-shadow: 0 0 0 3px rgba(5,150,105,0.1);
    }
    .input-wrapper input.has-error {
      border-color: #ef4444;
    }
    .toggle-pass {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      font-size: 0.9rem;
      padding: 4px;
    }
    .toggle-pass:hover { color: #6b7280; }
    .field-error {
      display: block;
      margin-top: 4px;
      font-size: 0.76rem;
      color: #ef4444;
    }

    /* ===== Error Banner ===== */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      font-size: 0.84rem;
      color: #dc2626;
      margin-bottom: 16px;
      animation: shake 0.3s ease;
    }
    .error-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
    .error-link {
        color: #b91c1c;
        text-decoration: underline;
        font-weight: 600;
        cursor: pointer;
    }
    .error-link:hover {
        color: #991b1b;
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }

    /* ===== Submit ===== */
    .submit-btn {
      width: 100%;
      height: 48px;
      border: none;
      border-radius: 24px;
      background: #064e3b;
      color: #fff;
      font-size: 0.95rem;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 12px rgba(6,78,59,0.25);
      margin-top: 4px;
    }
    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(6,78,59,0.35);
      background: #065f46;
    }
    .submit-btn:active:not(:disabled) {
      transform: translateY(0);
    }
    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ===== Footer ===== */
    .auth-footer {
      text-align: center;
      margin-top: 20px;
      font-size: 0.88rem;
      color: #6b7280;
    }
    .auth-footer a {
      color: #059669;
      font-weight: 600;
      text-decoration: none;
    }
    .auth-footer a:hover {
      text-decoration: underline;
    }

    /* ===== Mini Toast ===== */
    .mini-toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #1f2937;
      color: #fff;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 9999;
      animation: toast-pop 0.25s ease;
    }
    @keyframes toast-pop {
      from { opacity: 0; transform: translateX(-50%) translateY(8px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `]
})
export class AuthFormComponent implements OnInit, OnChanges {
  @Input() mode: 'login' | 'register' = 'login';
  @Input() hideFooter = false;
  @Input() hideHeader = false;
  @Output() footerNav = new EventEmitter<void>();
  @Output() authSuccess = new EventEmitter<void>();
  @Output() registerSuccess = new EventEmitter<string>();
  @Output() forgotPasswordClick = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = false;
  socialToast: string | null = null;
  private socialTimeout: any;

  form!: FormGroup;

  ngOnInit() {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['mode'] && !changes['mode'].firstChange) {
      this.buildForm();
      this.errorMessage.set(null);
    }
  }

  private buildForm() {
    if (this.mode === 'register') {
      this.form = this.fb.group({
        fullName: ['', Validators.required],
        username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
      });
    } else {
      this.form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required]
      });
    }
  }

  onSubmit() {
    if (!this.form.valid) {
      console.warn('Form Invalid:', this.form.errors);
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    let action$;
    if (this.mode === 'login') {
      action$ = this.authService.login(this.form.value);
    } else {
      const val = this.form.getRawValue();
      const request = {
        fullName: val.fullName,
        username: val.username,
        email: val.email,
        password: val.password
      };
      action$ = this.authService.register(request);
    }

    action$.subscribe({
      next: () => {
        this.loading.set(false);
        if (this.mode === 'login') {
          this.authSuccess.emit();
        } else {
          this.registerSuccess.emit(this.form.get('email')?.value);
        }
      },
      error: (err: any) => {
        this.loading.set(false);
        if (this.mode === 'login') {
          this.toastService.showError('Invalid credentials. Please try again.');
          this.errorMessage.set('Invalid email or password. Please try again.');
        } else {
          this.errorMessage.set('Registration failed. This email or username may already be taken.');
        }
      }
    });
  }

  showSocialToast(provider: string) {
    clearTimeout(this.socialTimeout);
    this.socialToast = `${provider} sign-in coming soon! Use email for now.`;
    this.socialTimeout = setTimeout(() => this.socialToast = null, 3000);
  }
}
