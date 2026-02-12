import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from '../login/login.component';
import { RegisterComponent } from '../register/register.component';

@Component({
    selector: 'app-landing-page',
    standalone: true,
    imports: [CommonModule, LoginComponent, RegisterComponent],
    template: `
    <!-- ===== Top Header Bar (FB-style) ===== -->
    <header class="landing-header">
      <div class="landing-header__inner">
        <div class="landing-header__brand">
          <i class="pi pi-sun brand-icon"></i>
          <span class="brand-name">trellis</span>
        </div>
        <div class="landing-header__login">
          <app-login></app-login>
        </div>
      </div>
    </header>

    <!-- ===== Main Split Layout ===== -->
    <main class="landing-body">
      <div class="landing-split">

        <!-- Left: Hero Panel -->
        <div class="landing-hero">
          <div class="landing-hero__overlay">
            <h1 class="landing-hero__title">Support for<br>your growth.</h1>
            <p class="landing-hero__sub">Join the community that helps your garden thrive.</p>
          </div>
        </div>

        <!-- Right: Signup Panel -->
        <div class="landing-signup">
          <div class="landing-signup__card">
            <h2 class="landing-signup__title">Join Trellis today</h2>
            <p class="landing-signup__sub">It's free and always will be.</p>
            <app-register></app-register>
          </div>
          <div class="landing-signup__footer">
            <p>By signing up, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.</p>
          </div>
        </div>

      </div>
    </main>

    <!-- ===== Footer ===== -->
    <footer class="landing-footer">
      <span>© 2026 Trellis · A PlantSocial experience</span>
    </footer>
  `,
    styles: [`
    /* ===== Header Bar ===== */
    :host {
      display: block;
      min-height: 100vh;
      background: var(--trellis-bg);
    }

    .landing-header {
      background: var(--trellis-green-darkest);
      padding: 0 24px;
      height: 56px;
      display: flex;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }

    .landing-header__inner {
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .landing-header__brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-icon {
      font-size: 1.5rem;
      color: var(--trellis-green-light);
    }

    .brand-name {
      font-size: 1.6rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.5px;
    }

    .landing-header__login {
      display: flex;
      align-items: center;
    }

    /* ===== Main Body ===== */
    .landing-body {
      max-width: 1100px;
      margin: 0 auto;
      padding: 60px 24px 40px;
    }

    .landing-split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      align-items: center;
      min-height: 480px;
    }

    /* ===== Hero Panel ===== */
    .landing-hero {
      background: 
        linear-gradient(135deg, #1B4332 0%, #2D6A4F 40%, #40916C 70%, #52B788 100%);
      border-radius: var(--trellis-radius-xl);
      min-height: 480px;
      position: relative;
      overflow: hidden;
      box-shadow: var(--trellis-shadow-lg);
    }

    .landing-hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(255,255,255,0.06) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(82,183,136,0.15) 0%, transparent 60%);
      pointer-events: none;
    }

    .landing-hero__overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 40px 32px;
      background: linear-gradient(transparent, rgba(27, 67, 50, 0.92));
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .landing-hero__title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 8px;
      line-height: 1.2;
    }

    .landing-hero__sub {
      font-size: 1.05rem;
      color: var(--trellis-green-pale);
      margin: 0;
      font-weight: 400;
    }

    /* ===== Signup Panel ===== */
    .landing-signup {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .landing-signup__card {
      background: var(--trellis-white);
      border-radius: var(--trellis-radius-lg);
      padding: 36px 32px;
      box-shadow: var(--trellis-shadow-md);
      border: 1px solid var(--trellis-border-light);
    }

    .landing-signup__title {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--trellis-text);
      margin: 0 0 4px;
    }

    .landing-signup__sub {
      font-size: 0.95rem;
      color: var(--trellis-text-secondary);
      margin: 0 0 24px;
    }

    .landing-signup__footer {
      text-align: center;
    }

    .landing-signup__footer p {
      font-size: 0.8rem;
      color: var(--trellis-text-hint);
    }

    .landing-signup__footer a {
      color: var(--trellis-green-dark);
      text-decoration: underline;
    }

    /* ===== Footer ===== */
    .landing-footer {
      text-align: center;
      padding: 24px;
      color: var(--trellis-text-hint);
      font-size: 0.85rem;
    }

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
      .landing-split {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .landing-hero {
        min-height: 280px;
      }

      .landing-hero__title {
        font-size: 1.8rem;
      }

      .landing-header__login {
        display: none; /* Show full login on mobile via signup page */
      }
    }
  `]
})
export class LandingPageComponent { }
