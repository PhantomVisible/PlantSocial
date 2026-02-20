import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ShopService } from './shop.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="checkout">
      <div class="checkout__header">
        <a routerLink="/shop/cart" class="back-link">← Back to Cart</a>
        <h1>Checkout</h1>
      </div>

      <div class="checkout__empty" *ngIf="shop.cartItems().length === 0">
        <h3>Your cart is empty</h3>
        <a routerLink="/shop" class="browse-btn">Browse Shop</a>
      </div>

      <div class="checkout__layout" *ngIf="shop.cartItems().length > 0">
        <!-- Form -->
        <div class="checkout__form">
          <div class="form-section">
            <h2>Shipping Address</h2>
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" [(ngModel)]="fullName" placeholder="Your full name" />
            </div>
            <div class="form-group">
              <label>Street Address</label>
              <input type="text" [(ngModel)]="address" placeholder="123 Main Street" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>City</label>
                <input type="text" [(ngModel)]="city" placeholder="City" />
              </div>
              <div class="form-group">
                <label>Postal Code</label>
                <input type="text" [(ngModel)]="postalCode" placeholder="12345" />
              </div>
            </div>
            <div class="form-group">
              <label>Country</label>
              <input type="text" [(ngModel)]="country" placeholder="Netherlands" />
            </div>
          </div>

          <div class="form-section">
            <h2>Payment Method</h2>
            <div class="payment-options">
              <label class="payment-option" [class.selected]="paymentMethod() === 'ideal'">
                <input type="radio" name="payment" value="ideal" [(ngModel)]="paymentMethodModel" (ngModelChange)="paymentMethod.set($event)" />
                <div class="payment-content">
                  <span class="payment-icon">🏦</span>
                  <span class="payment-label">iDEAL</span>
                </div>
              </label>
              <label class="payment-option" [class.selected]="paymentMethod() === 'card'">
                <input type="radio" name="payment" value="card" [(ngModel)]="paymentMethodModel" (ngModelChange)="paymentMethod.set($event)" />
                <div class="payment-content">
                  <span class="payment-icon">💳</span>
                  <span class="payment-label">Credit Card</span>
                </div>
              </label>
              <label class="payment-option" [class.selected]="paymentMethod() === 'paypal'">
                <input type="radio" name="payment" value="paypal" [(ngModel)]="paymentMethodModel" (ngModelChange)="paymentMethod.set($event)" />
                <div class="payment-content">
                  <span class="payment-icon">🅿️</span>
                  <span class="payment-label">PayPal</span>
                </div>
              </label>
            </div>
            <p class="payment-note">
              <i class="pi pi-lock"></i>
              Payment is simulated — no real charges will be made
            </p>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="checkout__summary">
          <div class="summary-card">
            <h3>Order Summary</h3>
            <div class="summary-items">
              <div class="summary-item" *ngFor="let item of shop.cartItems()">
                <div class="si-info">
                  <span class="si-name">{{ item.productName }}</span>
                  <span class="si-qty">× {{ item.quantity }}</span>
                </div>
                <span class="si-price">{{ item.subtotal | currency:'EUR' }}</span>
              </div>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row">
              <span>Subtotal</span>
              <span>{{ shop.cartTotal() | currency:'EUR' }}</span>
            </div>
            <div class="summary-row">
              <span>Shipping</span>
              <span [class.free]="shop.freeShippingRemaining() === 0">
                {{ shop.freeShippingRemaining() === 0 ? 'Free' : '€5.99' }}
              </span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row summary-row--total">
              <span>Total</span>
              <span>{{ shop.totalWithShipping() | currency:'EUR' }}</span>
            </div>
            <button
              class="place-order-btn"
              [disabled]="submitting() || !isFormValid()"
              (click)="placeOrder()">
              {{ submitting() ? 'Placing Order...' : 'Place Order' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout { padding: 24px; max-width: 900px; }

    .checkout__header { margin-bottom: 24px; }
    .back-link {
      font-size: 0.85rem;
      color: var(--trellis-green, #2e7d32);
      text-decoration: none;
      margin-bottom: 8px;
      display: inline-block;
    }
    .back-link:hover { text-decoration: underline; }
    .checkout__header h1 { margin: 4px 0 0; font-size: 1.5rem; font-weight: 800; color: #1a1a1a; }

    .checkout__empty { text-align: center; padding: 40px; }
    .browse-btn {
      display: inline-block;
      padding: 12px 28px;
      background: var(--trellis-green, #2e7d32);
      color: #fff;
      text-decoration: none;
      border-radius: 24px;
      font-weight: 700;
      margin-top: 12px;
    }

    .checkout__layout {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .form-section {
      background: #fff;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 16px;
    }
    .form-section h2 { margin: 0 0 16px; font-size: 1.1rem; font-weight: 700; color: #1a1a1a; }

    .form-group { margin-bottom: 14px; }
    .form-group label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: #555;
      margin-bottom: 6px;
    }
    .form-group input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 10px;
      font-size: 0.9rem;
      font-family: 'Inter', sans-serif;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .form-group input:focus {
      outline: none;
      border-color: var(--trellis-green, #2e7d32);
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .payment-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .payment-option {
      display: block;
      cursor: pointer;
    }
    .payment-option input { display: none; }
    .payment-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 16px 8px;
      border: 2px solid rgba(0,0,0,0.08);
      border-radius: 12px;
      transition: all 0.2s;
    }
    .payment-option:hover .payment-content { border-color: rgba(46, 125, 50, 0.3); }
    .payment-option.selected .payment-content {
      border-color: var(--trellis-green, #2e7d32);
      background: rgba(46, 125, 50, 0.04);
    }
    .payment-icon { font-size: 1.5rem; }
    .payment-label { font-size: 0.82rem; font-weight: 600; color: #555; }

    .payment-note {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      color: #999;
      margin: 12px 0 0;
    }

    /* Summary */
    .summary-card {
      background: #fff;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      margin-left: auto;
    }
    .summary-card h3 { margin: 0 0 16px; font-size: 1.1rem; font-weight: 800; color: #1a1a1a; }

    .summary-items { display: flex; flex-direction: column; gap: 8px; }
    .summary-item { display: flex; justify-content: space-between; align-items: center; }
    .si-info { display: flex; align-items: center; gap: 6px; }
    .si-name { font-size: 0.85rem; color: #555; font-weight: 500; }
    .si-qty { font-size: 0.78rem; color: #999; }
    .si-price { font-size: 0.85rem; font-weight: 600; color: #333; }

    .summary-divider { height: 1px; background: rgba(0,0,0,0.06); margin: 12px 0; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 0.9rem;
      color: #555;
    }
    .summary-row--total { font-size: 1.1rem; font-weight: 800; color: #1a1a1a; padding: 8px 0; }
    .free { color: var(--trellis-green, #2e7d32); font-weight: 600; }

    .place-order-btn {
      width: 100%;
      padding: 14px;
      background: var(--trellis-green, #2e7d32);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 12px;
      font-family: 'Inter', sans-serif;
    }
    .place-order-btn:hover:not(:disabled) { background: #1b5e20; }
    .place-order-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 960px) {
      .payment-options { grid-template-columns: 1fr; }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  shop = inject(ShopService);
  private router = inject(Router);

  fullName = '';
  address = '';
  city = '';
  postalCode = '';
  country = '';
  paymentMethod = signal('ideal');
  paymentMethodModel = 'ideal';
  submitting = signal(false);

  ngOnInit() {
    this.shop.loadCart();
  }

  isFormValid(): boolean {
    return !!(this.fullName.trim() && this.address.trim() && this.city.trim() && this.postalCode.trim() && this.country.trim());
  }

  placeOrder() {
    if (!this.isFormValid()) return;
    this.submitting.set(true);

    const shippingAddress = `${this.fullName}\n${this.address}\n${this.postalCode} ${this.city}\n${this.country}`;

    this.shop.checkout(shippingAddress, this.paymentMethod()).subscribe({
      next: (order) => {
        this.submitting.set(false);
        this.shop.loadCart();
        this.router.navigate(['/shop/order-confirmation', order.id]);
      },
      error: () => {
        this.submitting.set(false);
      }
    });
  }
}
