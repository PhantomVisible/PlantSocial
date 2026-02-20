import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Order, ShopService } from './shop.service';

@Component({
    selector: 'app-order-history',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="orders">
      <h1>Order History</h1>

      <div class="orders__empty" *ngIf="!loading() && orders().length === 0">
        <span class="empty-icon">📦</span>
        <h3>No orders yet</h3>
        <p>Your order history will appear here</p>
        <a routerLink="/shop" class="browse-btn">Browse Shop</a>
      </div>

      <div class="orders__loading" *ngIf="loading()">
        <div class="loader-spinner"></div>
      </div>

      <div class="orders__list" *ngIf="!loading() && orders().length > 0">
        <div class="order-card" *ngFor="let order of orders()">
          <div class="order-card__header">
            <div class="order-meta">
              <span class="order-id">Order #{{ order.id.substring(0, 8).toUpperCase() }}</span>
              <span class="order-date">{{ order.createdAt | date:'MMM d, y, h:mm a' }}</span>
            </div>
            <span class="status-badge" [ngClass]="'status--' + order.status.toLowerCase()">
              {{ order.status }}
            </span>
          </div>
          <div class="order-card__items">
            <div class="order-item" *ngFor="let item of order.items">
              <img [src]="shop.getProductImage(item.productImageUrl)" [alt]="item.productName" class="oi-image" />
              <div class="oi-info">
                <span class="oi-name">{{ item.productName }}</span>
                <span class="oi-qty-price">{{ item.quantity }} × {{ item.priceAtPurchase | currency:'EUR' }}</span>
              </div>
              <span class="oi-subtotal">{{ item.subtotal | currency:'EUR' }}</span>
            </div>
          </div>
          <div class="order-card__footer">
            <span class="order-total">Total: {{ order.totalAmount | currency:'EUR' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .orders { padding: 24px; max-width: 700px; }
    .orders h1 { font-size: 1.5rem; font-weight: 800; margin: 0 0 24px; color: #1a1a1a; }

    .orders__empty {
      text-align: center;
      padding: 60px 24px;
    }
    .empty-icon { font-size: 3rem; display: block; margin-bottom: 12px; }
    .orders__empty h3 { margin: 0 0 8px; color: #555; }
    .orders__empty p { margin: 0 0 20px; color: #888; }
    .browse-btn {
      display: inline-block;
      padding: 12px 28px;
      background: var(--trellis-green, #2e7d32);
      color: #fff;
      text-decoration: none;
      border-radius: 24px;
      font-weight: 700;
    }

    .orders__loading {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    .loader-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(0,0,0,0.08);
      border-top-color: var(--trellis-green, #2e7d32);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .orders__list { display: flex; flex-direction: column; gap: 16px; }

    .order-card {
      background: #fff;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 16px;
      overflow: hidden;
    }
    .order-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #fafafa;
      border-bottom: 1px solid rgba(0,0,0,0.04);
    }
    .order-meta { display: flex; flex-direction: column; gap: 4px; }
    .order-id { font-weight: 700; font-size: 0.9rem; color: #1a1a1a; }
    .order-date { font-size: 0.78rem; color: #999; }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status--confirmed { background: #E8F5E9; color: #2e7d32; }
    .status--pending { background: #FFF3E0; color: #E65100; }
    .status--processing { background: #E3F2FD; color: #1565C0; }
    .status--shipped { background: #F3E5F5; color: #7B1FA2; }
    .status--delivered { background: #E8F5E9; color: #1B5E20; }
    .status--cancelled { background: #FFEBEE; color: #C62828; }

    .order-card__items { padding: 12px 20px; }
    .order-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }
    .order-item + .order-item { border-top: 1px solid rgba(0,0,0,0.04); }

    .oi-image {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      object-fit: cover;
      background: #f5f8f5;
    }
    .oi-info { flex: 1; }
    .oi-name { display: block; font-weight: 600; font-size: 0.88rem; color: #333; }
    .oi-qty-price { font-size: 0.78rem; color: #999; }
    .oi-subtotal { font-weight: 700; font-size: 0.9rem; color: #1a1a1a; }

    .order-card__footer {
      padding: 12px 20px;
      border-top: 1px solid rgba(0,0,0,0.04);
      text-align: right;
    }
    .order-total { font-weight: 800; font-size: 1rem; color: #1a1a1a; }
  `]
})
export class OrderHistoryComponent implements OnInit {
    shop = inject(ShopService);
    orders = signal<Order[]>([]);
    loading = signal(true);

    ngOnInit() {
        this.shop.getOrders().subscribe({
            next: (o) => { this.orders.set(o); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }
}
