import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthFormComponent } from '../auth-form.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, AuthFormComponent],
  template: `
    <div class="auth-page">
      <!-- Left: Brand Panel -->
      <div class="brand-panel">
        <div class="brand-bg"></div>
        <div class="brand-content">
          <span class="brand-leaf">🌱</span>
          <h1>Start growing<br>with us.</h1>
          <p>Join a thriving community of plant enthusiasts. Share tips, get inspired, grow together.</p>
        </div>
      </div>

      <!-- Right: Form Panel -->
      <div class="form-panel">
        <app-auth-form mode="register"></app-auth-form>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      min-height: 100vh;
      width: 100vw;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
    }

    .brand-panel {
      width: 50%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .brand-bg {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(135deg, #1a2e05 0%, #365314 40%, #3f6212 70%, #4d7c0f 100%);
    }
    .brand-bg::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 30% 70%, rgba(255,255,255,0.06) 0%, transparent 50%),
        radial-gradient(circle at 70% 30%, rgba(255,255,255,0.04) 0%, transparent 50%);
    }
    .brand-bg::after {
      content: '';
      position: absolute;
      inset: 0;
      background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04' fill-rule='evenodd'%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3C/g%3E%3C/svg%3E");
    }
    .brand-content {
      position: relative;
      z-index: 2;
      color: #fff;
      padding: 48px;
      max-width: 440px;
    }
    .brand-leaf {
      font-size: 3.5rem;
      display: block;
      margin-bottom: 20px;
    }
    .brand-content h1 {
      font-family: 'Playfair Display', serif;
      font-size: 2.8rem;
      font-weight: 800;
      line-height: 1.15;
      margin: 0 0 16px;
      letter-spacing: -0.5px;
    }
    .brand-content p {
      font-size: 1.05rem;
      line-height: 1.6;
      opacity: 0.8;
      margin: 0;
      font-weight: 300;
    }

    .form-panel {
      width: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafbfc;
      padding: 32px;
    }

    @media (max-width: 900px) {
      .auth-page {
        flex-direction: column;
      }
      .brand-panel {
        width: 100%;
        min-height: 200px;
        max-height: 30vh;
      }
      .brand-content {
        padding: 24px;
      }
      .brand-content h1 {
        font-size: 1.6rem;
      }
      .brand-content p {
        display: none;
      }
      .form-panel {
        width: 100%;
        padding: 24px 16px;
      }
    }
  `]
})
export class RegisterComponent { }
