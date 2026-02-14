import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthFormComponent } from '../auth-form.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, AuthFormComponent],
  template: `
    <div class="auth-page">
      <!-- Left: Brand Panel -->
      <div class="brand-panel">
        <div class="brand-bg"></div>
        <div class="brand-content">
          <span class="brand-leaf">🌿</span>
          <h1>Cultivate your<br>community.</h1>
          <p>Share your garden journey with thousands of plant lovers around the world.</p>
        </div>
      </div>

      <!-- Right: Form Panel -->
      <div class="form-panel">
        <app-auth-form mode="login"></app-auth-form>
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

    /* ===== Brand Panel ===== */
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
        linear-gradient(135deg, #064e3b 0%, #047857 40%, #059669 70%, #10b981 100%);
    }
    .brand-bg::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0%, transparent 70%);
    }
    .brand-bg::after {
      content: '';
      position: absolute;
      inset: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      opacity: 0.5;
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
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
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

    /* ===== Form Panel ===== */
    .form-panel {
      width: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafbfc;
      padding: 32px;
    }

    /* ===== Responsive ===== */
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
export class LoginComponent { }
