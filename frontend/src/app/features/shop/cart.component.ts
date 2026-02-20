import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ShopService } from './shop.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="cart">
      <div class="cart__header">
        <h1>Shopping Cart</h1>
        <span class="item-count" *ngIf="shop.cartItemCount() > 0">
          {{ shop.cartItemCount() }} item{{ shop.cartItemCount() !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Empty State -->
      <div class="cart__empty" *ngIf="shop.cartItems().length === 0">
        <span class="empty-icon">🛒</span>
        <h3>Your cart is empty</h3>
        <p>Discover our premium soil mixes and plant care products</p>
        <a routerLink="/shop" class="browse-btn">Browse Shop</a>
      </div>

      <!-- Cart Items -->
      <div class="cart__content" *ngIf="shop.cartItems().length > 0">
        <div class="cart__items">
          <div class="cart-item" *ngFor="let item of shop.cartItems()">
            <a [routerLink]="['/shop/product', item.productSlug]" class="cart-item__image-wrap">
              <img [src]="shop.getProductImage(item.productImageUrl)" [alt]="item.productName" />
            </a>
            <div class="cart-item__details">
              <a [routerLink]="['/shop/product', item.productSlug]" class="cart-item__name">{{ item.productName }}</a>
              <span class="cart-item__price">{{ item.productPrice | currency:'EUR' }} each</span>
            </div>
            <div class="cart-item__qty">
              <button class="qty-btn" (click)="updateQty(item.id, item.quantity - 1)">−</button>
              <span>{{ item.quantity }}</span>
              <button class="qty-btn" (click)="updateQty(item.id, item.quantity + 1)">+</button>
            </div>
            <div class="cart-item__subtotal">
              {{ item.subtotal | currency:'EUR' }}
            </div>
            <button class="cart-item__remove" (click)="shop.removeCartItem(item.id)">
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>

        <!-- Summary -->
        <div class="cart__summary">
          <div class="summary-card">
            <h3>Order Summary</h3>
            <div class="summary-row">
              <span>Subtotal</span>
              <span>{{ shop.cartTotal() | currency:'EUR' }}</span>
            </div>
            <div class="summary-row">
              <span>Shipping</span>
              <span [class.free]="shop.freeShippingRemaining() === 0">
                {{ shop.freeShippingRemaining() === 0 ? 'Free' : ('€5.99') }}
              </span>
            </div>
            <div class="shipping-progress" *ngIf="shop.freeShippingRemaining() > 0">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="(shop.cartTotal() / 70) * 100"></div>
              </div>
              <span class="progress-text">
                Add {{ shop.freeShippingRemaining() | currency:'EUR' }} for free shipping 🚚
              </span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row summary-row--total">
              <span>Total</span>
              <span>{{ shop.totalWithShipping() | currency:'EUR' }}</span>
            </div>
            <a routerLink="/shop/checkout" class="checkout-btn">
              Proceed to Checkout
            </a>
            <a routerLink="/shop" class="continue-link">← Continue Shopping</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cart { padding: 24px; max-width: 1200px; }

    .cart__header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .cart__header h1 {
      font-size: 1.5rem;
      font-weight: 800;
      margin: 0;
      color: #1a1a1a;
    }
    .item-count {
      font-size: 0.85rem;
      color: #888;
      background: #f0f0f0;
      padding: 4px 12px;
      border-radius: 12px;
    }

    .cart__empty {
      text-align: center;
      padding: 60px 24px;
    }
    .empty-icon { font-size: 3rem; display: block; margin-bottom: 12px; }
    .cart__empty h3 { margin: 0 0 8px; color: #555; }
    .cart__empty p { margin: 0 0 20px; color: #888; }
    .browse-btn {
      display: inline-block;
      padding: 12px 28px;
      background: var(--trellis-green, #2e7d32);
      color: #fff;
      text-decoration: none;
      border-radius: 24px;
      font-weight: 700;
      transition: background 0.2s;
    }
    .browse-btn:hover { background: #1b5e20; }

    .cart__content {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .cart__items { display: flex; flex-direction: column; gap: 12px; min-width: 0; }

    .cart-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #fff;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 16px;
      transition: border-color 0.2s;
      min-width: 0;
    }
    .cart-item:hover { border-color: rgba(0,0,0,0.12); }

    .cart-item__image-wrap {
      width: 72px;
      height: 72px;
      border-radius: 12px;
      overflow: hidden;
      background: #f5f8f5;
      flex-shrink: 0;
    }
    .cart-item__image-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cart-item__details { flex: 1; min-width: 0; }
    .cart-item__name {
      display: block;
      font-weight: 700;
      font-size: 0.95rem;
      color: #1a1a1a;
      text-decoration: none;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cart-item__name:hover { color: var(--trellis-green, #2e7d32); }
    .cart-item__price {
      font-size: 0.8rem;
      color: #888;
    }

    .cart-item__qty {
      display: flex;
      align-items: center;
      gap: 0;
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
    }
    .qty-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #fafafa;
      cursor: pointer;
      font-size: 1rem;
      color: #333;
      transition: background 0.15s;
      font-family: 'Inter', sans-serif;
    }
    .qty-btn:hover { background: #eee; }
    .cart-item__qty span {
      width: 32px;
      text-align: center;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .cart-item__subtotal {
      font-weight: 800;
      font-size: 1rem;
      color: #1a1a1a;
      min-width: 70px;
      text-align: right;
      flex-shrink: 0;
    }

    .cart-item__remove {
      background: none;
      border: none;
      cursor: pointer;
      color: #ccc;
      font-size: 0.85rem;
      padding: 4px;
      transition: color 0.15s;
      flex-shrink: 0;
    }
    .cart-item__remove:hover { color: #E53E3E; }

    /* Summary */
    .summary-card {
      background: #fff;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      margin-left: auto; /* aligns right */
    }
    .summary-card h3 {
      margin: 0 0 16px;
      font-size: 1.1rem;
      font-weight: 800;
      color: #1a1a1a;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 0.9rem;
      color: #555;
    }
    .summary-row--total {
      font-size: 1.1rem;
      font-weight: 800;
      color: #1a1a1a;
      padding: 12px 0;
    }
    .free { color: var(--trellis-green, #2e7d32); font-weight: 600; }
    .summary-divider {
      height: 1px;
      background: rgba(0,0,0,0.06);
      margin: 4px 0;
    }

    .shipping-progress {
      padding: 8px 0 4px;
    }
    .progress-bar {
      height: 6px;
      background: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .progress-fill {
      height: 100%;
      background: var(--trellis-green, #2e7d32);
      border-radius: 3px;
      transition: width 0.4s ease;
      max-width: 100%;
    }
    .progress-text {
      font-size: 0.75rem;
      color: #888;
    }

    .checkout-btn {
      display: block;
      width: 100%;
      padding: 14px;
      background: var(--trellis-green, #2e7d32);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 700;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 12px;
    }
    .checkout-btn:hover { background: #1b5e20; }

    .continue-link {
      display: block;
      text-align: center;
      margin-top: 12px;
      font-size: 0.85rem;
      color: var(--trellis-green, #2e7d32);
      text-decoration: none;
    }
    .continue-link:hover { text-decoration: underline; }


  `]
})
export class CartComponent implements OnInit {
  shop = inject(ShopService);

  ngOnInit() {
    this.shop.loadCart();
  }

  updateQty(itemId: string, qty: number) {
    if (qty <= 0) {
      this.shop.removeCartItem(itemId);
    } else {
      this.shop.updateCartItem(itemId, qty);
    }
  }
}
