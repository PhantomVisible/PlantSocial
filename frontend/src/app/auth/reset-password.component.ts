import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Reset Password</h2>
        <p class="auth-subtitle">Enter your new password below.</p>
        
        <form (ngSubmit)="onSubmit()" #form="ngForm">
          <div class="form-group">
            <label for="password">New Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              [(ngModel)]="password" 
              required 
              minlength="6"
              placeholder="Min 6 characters"
              #passInput="ngModel"
            >
            <div *ngIf="passInput.invalid && (passInput.dirty || passInput.touched)" class="error-msg">
              Password must be at least 6 characters.
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              name="confirmPassword" 
              [(ngModel)]="confirmPassword" 
              required 
              placeholder="Confirm new password"
              #confirmInput="ngModel"
            >
             <div *ngIf="confirmPassword && password !== confirmPassword" class="error-msg">
              Passwords do not match.
            </div>
          </div>

          <div *ngIf="errorMessage()" class="alert alert-error">
            {{ errorMessage() }}
          </div>

          <button type="submit" class="btn-primary" [disabled]="form.invalid || isLoading() || password !== confirmPassword">
            {{ isLoading() ? 'Resetting...' : 'Reset Password' }}
          </button>
        </form>
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
  `]
})
export class ResetPasswordComponent implements OnInit {
    password = '';
    confirmPassword = '';
    token = '';
    errorMessage = signal('');
    isLoading = signal(false);

    private authService = inject(AuthService);
    activateRoute = inject(ActivatedRoute);
    router = inject(Router);

    ngOnInit() {
        this.activateRoute.queryParams.subscribe(params => {
            this.token = params['token'];
            if (!this.token) {
                this.errorMessage.set('Invalid or missing reset token.');
            }
        });
    }

    onSubmit() {
        if (!this.token) return;

        this.isLoading.set(true);
        this.errorMessage.set('');

        this.authService.resetPassword(this.token, this.password).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.router.navigate(['/login'], { queryParams: { resetSuccess: true } });
            },
            error: (err) => {
                this.isLoading.set(false);
                console.error(err);
                this.errorMessage.set('Failed to reset password. Token may be expired.');
            }
        });
    }
}
