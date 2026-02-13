import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-split">
      <!-- Left: Brand Panel -->
      <div class="auth-brand">
        <div class="brand-content">
          <span class="brand-icon">🌱</span>
          <h1 class="brand-title">Trellis</h1>
          <p class="brand-tagline">Your garden community awaits.</p>
          <div class="brand-features">
            <div class="feature"><i class="pi pi-heart"></i> Share plant care tips</div>
            <div class="feature"><i class="pi pi-images"></i> Document your garden</div>
            <div class="feature"><i class="pi pi-globe"></i> Join global plant lovers</div>
          </div>
        </div>
        <div class="brand-overlay"></div>
      </div>

      <!-- Right: Form Panel -->
      <div class="auth-form-panel">
        <div class="form-container">
          <h2 class="form-title">Create Account</h2>
          <p class="form-subtitle">Start your gardening journey today</p>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="input-group">
              <label for="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                formControlName="fullName"
                placeholder="Your full name"
                [class.input-error]="registerForm.get('fullName')?.invalid && registerForm.get('fullName')?.touched"
              />
              <small *ngIf="registerForm.get('fullName')?.invalid && registerForm.get('fullName')?.touched" class="error-text">
                Name is required
              </small>
            </div>

            <div class="input-group">
              <label for="email">Email</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="you&#64;example.com"
                [class.input-error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
              />
              <small *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched" class="error-text">
                Please enter a valid email
              </small>
            </div>

            <div class="input-group">
              <label for="password">Password</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                placeholder="Min 6 characters"
                [class.input-error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
              />
              <small *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched" class="error-text">
                Minimum 6 characters required
              </small>
            </div>

            <div *ngIf="errorMessage" class="error-banner">
              <i class="pi pi-exclamation-circle"></i> {{ errorMessage }}
            </div>

            <button
              type="submit"
              class="submit-btn"
              [disabled]="registerForm.invalid || loading"
            >
              <span *ngIf="!loading">Create Account</span>
              <i *ngIf="loading" class="pi pi-spin pi-spinner"></i>
            </button>
          </form>

          <p class="form-footer">
            Already have an account? <a routerLink="/auth/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-split {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
    }

    .auth-brand {
      width: 50%;
      position: relative;
      background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .brand-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 70% 30%, rgba(255,255,255,0.06) 0%, transparent 60%),
                  radial-gradient(circle at 20% 80%, rgba(255,255,255,0.04) 0%, transparent 50%);
      pointer-events: none;
    }
    .brand-content {
      position: relative;
      z-index: 2;
      text-align: center;
      color: #fff;
      padding: 40px;
    }
    .brand-icon { font-size: 4rem; display: block; margin-bottom: 16px; }
    .brand-title { font-size: 3rem; font-weight: 800; letter-spacing: -1.5px; margin: 0 0 8px; }
    .brand-tagline { font-size: 1.2rem; font-weight: 300; opacity: 0.85; margin: 0 0 40px; letter-spacing: 0.5px; }
    .brand-features { display: flex; flex-direction: column; gap: 14px; align-items: center; }
    .feature { display: flex; align-items: center; gap: 10px; font-size: 0.92rem; opacity: 0.8; }
    .feature i { font-size: 1rem; opacity: 0.7; }

    .auth-form-panel {
      width: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
    }
    .form-container { width: 100%; max-width: 400px; padding: 32px; }
    .form-title { font-size: 1.8rem; font-weight: 700; color: #064e3b; margin: 0 0 4px; }
    .form-subtitle { font-size: 0.95rem; color: #6b7280; margin: 0 0 32px; }

    .input-group { margin-bottom: 18px; }
    .input-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
    }
    .input-group input {
      width: 100%;
      padding: 12px 16px;
      border: 1.5px solid #d1d5db;
      border-radius: 12px;
      font-size: 0.95rem;
      font-family: 'Inter', sans-serif;
      background: #fff;
      color: #111827;
      transition: all 0.2s ease;
      outline: none;
      box-sizing: border-box;
    }
    .input-group input::placeholder { color: #9ca3af; }
    .input-group input:focus {
      border-color: #059669;
      box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
    }
    .input-group input.input-error { border-color: #ef4444; }
    .error-text { display: block; margin-top: 4px; font-size: 0.78rem; color: #ef4444; }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      font-size: 0.85rem;
      color: #dc2626;
      margin-bottom: 16px;
    }

    .submit-btn {
      width: 100%;
      height: 50px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #064e3b, #059669);
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
    }
    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(5, 150, 105, 0.4);
    }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .form-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 0.9rem;
      color: #6b7280;
    }
    .form-footer a {
      color: #059669;
      font-weight: 600;
      text-decoration: none;
    }
    .form-footer a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .auth-brand { display: none; }
      .auth-form-panel { width: 100%; }
      .form-container { padding: 24px 20px; }
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  registerForm: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = false;
  errorMessage: string | null = null;

  onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = null;
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          console.error('Registration failed', err);
          this.errorMessage = 'Registration failed. Please try again.';
        }
      });
    }
  }
}
