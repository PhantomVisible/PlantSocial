import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-split">
      <!-- Left: Brand Panel -->
      <div class="auth-brand">
        <div class="brand-content">
          <span class="brand-icon">🌿</span>
          <h1 class="brand-title">Trellis</h1>
          <p class="brand-tagline">Grow together.</p>
          <div class="brand-features">
            <div class="feature"><i class="pi pi-users"></i> Connect with plant lovers</div>
            <div class="feature"><i class="pi pi-camera"></i> Share your garden journey</div>
            <div class="feature"><i class="pi pi-book"></i> Discover plant knowledge</div>
          </div>
        </div>
        <div class="brand-overlay"></div>
      </div>

      <!-- Right: Form Panel -->
      <div class="auth-form-panel">
        <div class="form-container">
          <h2 class="form-title">Welcome Back</h2>
          <p class="form-subtitle">Sign in to your garden</p>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="input-group">
              <label for="email">Email</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="you&#64;example.com"
                [class.input-error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              />
              <small *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched" class="error-text">
                Please enter a valid email
              </small>
            </div>

            <div class="input-group">
              <label for="password">Password</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                placeholder="Enter your password"
                [class.input-error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              />
            </div>

            <div *ngIf="errorMessage" class="error-banner">
              <i class="pi pi-exclamation-circle"></i> {{ errorMessage }}
            </div>

            <button
              type="submit"
              class="submit-btn"
              [disabled]="loginForm.invalid || loading"
            >
              <span *ngIf="!loading">Sign In</span>
              <i *ngIf="loading" class="pi pi-spin pi-spinner"></i>
            </button>
          </form>

          <p class="form-footer">
            Don't have an account? <a routerLink="/auth/register">Sign up</a>
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

    /* ===== Brand Panel ===== */
    .auth-brand {
      width: 50%;
      position: relative;
      background: linear-gradient(135deg, #134e4a 0%, #047857 50%, #059669 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .brand-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.08) 0%, transparent 60%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%);
      pointer-events: none;
    }
    .brand-content {
      position: relative;
      z-index: 2;
      text-align: center;
      color: #fff;
      padding: 40px;
    }
    .brand-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 16px;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
    }
    .brand-title {
      font-size: 3rem;
      font-weight: 800;
      letter-spacing: -1.5px;
      margin: 0 0 8px;
    }
    .brand-tagline {
      font-size: 1.2rem;
      font-weight: 300;
      opacity: 0.85;
      margin: 0 0 40px;
      letter-spacing: 0.5px;
    }
    .brand-features {
      display: flex;
      flex-direction: column;
      gap: 14px;
      align-items: center;
    }
    .feature {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.92rem;
      opacity: 0.8;
      font-weight: 400;
    }
    .feature i {
      font-size: 1rem;
      opacity: 0.7;
    }

    /* ===== Form Panel ===== */
    .auth-form-panel {
      width: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
    }
    .form-container {
      width: 100%;
      max-width: 400px;
      padding: 32px;
    }
    .form-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: #134e4a;
      margin: 0 0 4px;
    }
    .form-subtitle {
      font-size: 0.95rem;
      color: #6b7280;
      margin: 0 0 32px;
    }

    .input-group {
      margin-bottom: 20px;
    }
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
    .input-group input::placeholder {
      color: #9ca3af;
    }
    .input-group input:focus {
      border-color: #059669;
      box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
    }
    .input-group input.input-error {
      border-color: #ef4444;
    }
    .error-text {
      display: block;
      margin-top: 4px;
      font-size: 0.78rem;
      color: #ef4444;
    }

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
      background: linear-gradient(135deg, #047857, #059669);
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
    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

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
    .form-footer a:hover {
      text-decoration: underline;
    }

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
      .auth-brand {
        display: none;
      }
      .auth-form-panel {
        width: 100%;
      }
      .form-container {
        padding: 24px 20px;
      }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading = false;
  errorMessage: string | null = null;

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = null;
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          console.error('Login failed', err);
          this.errorMessage = 'Login failed. Check your credentials.';
        }
      });
    }
  }
}
