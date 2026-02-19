import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Forgot Password?</h2>
        <p class="auth-subtitle">Enter your email and we'll send you a link to reset your password.</p>
        
        <form (ngSubmit)="onSubmit()" #form="ngForm">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              [(ngModel)]="email" 
              required 
              email
              placeholder="Enter your email"
              #emailInput="ngModel"
            >
          </div>

          <div *ngIf="errorMessage()" class="alert alert-error">
            {{ errorMessage() }}
          </div>

           <div *ngIf="successMessage()" class="alert alert-success">
            {{ successMessage() }}
          </div>

          <button type="submit" class="btn-primary" [disabled]="form.invalid || isLoading()">
            {{ isLoading() ? 'Sending...' : 'Send Reset Link' }}
          </button>
        </form>

        <div class="auth-footer">
          <a routerLink="/login">Back to Login</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: var(--trellis-background);
      padding: 20px;
    }
    .auth-card {
      background: var(--trellis-white);
      padding: 40px;
      border-radius: var(--trellis-radius-lg);
      box-shadow: var(--trellis-shadow-lg);
      width: 100%;
      max-width: 400px;
      text-align: center;
    }
    h2 {
      color: var(--trellis-text);
      margin-bottom: 10px;
    }
    .auth-subtitle {
      color: var(--trellis-text-secondary);
      margin-bottom: 24px;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    .form-group {
      margin-bottom: 20px;
      text-align: left;
    }
    label {
      display: block;
      margin-bottom: 8px;
      color: var(--trellis-text);
      font-weight: 500;
      font-size: 0.9rem;
    }
    input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--trellis-border-light);
      border-radius: var(--trellis-radius-md);
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus {
      border-color: var(--trellis-green);
    }
    .error-msg {
      color: #e53e3e;
      font-size: 0.8rem;
      margin-top: 4px;
    }
    .alert {
      padding: 10px;
      border-radius: var(--trellis-radius-md);
      margin-bottom: 20px;
      font-size: 0.9rem;
    }
    .alert-error {
      background-color: #fff5f5;
      color: #c53030;
      border: 1px solid #fed7d7;
    }
    .alert-success {
      background-color: #f0fff4;
      color: #2f855a;
      border: 1px solid #c6f6d5;
    }
    .btn-primary {
      width: 100%;
      padding: 12px;
      background-color: var(--trellis-green);
      color: white;
      border: none;
      border-radius: var(--trellis-radius-md);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .btn-primary:hover:not(:disabled) {
      background-color: var(--trellis-green-dark);
    }
    .btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .auth-footer {
      margin-top: 20px;
      font-size: 0.9rem;
    }
    .auth-footer a {
      color: var(--trellis-green);
      text-decoration: none;
      font-weight: 500;
    }
    .auth-footer a:hover {
      text-decoration: underline;
    }
  `]
})
export class ForgotPasswordComponent {
  email = '';
  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);

  private authService = inject(AuthService);

  onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('If an account exists with that email, we sent a link to reset your password.');
        this.email = '';
      },
      error: (err) => {
        this.isLoading.set(false);
        // Security: Don't reveal if user exists or not, generally. But here backend might throw generic error.
        // For UX we might just verify success anyway or generic error.
        console.error(err);
        this.errorMessage.set('Something went wrong. Please try again.');
      }
    });
  }
}
