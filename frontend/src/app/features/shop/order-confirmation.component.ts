import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Order, ShopService } from './shop.service';

@Component({
    selector: 'app-order-confirmation',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="confirmation" *ngIf="order()">
      <div class="success-icon">✅</div>
      <h1>Order Confirmed!</h1>
      <p class="subtitle">Thank you for your order. Your plants will love this! 🌿</p>

      <div class="order-details">
        <div class="detail-row">
          <span class="label">Order Number</span>
          <span class="value">#{{ order()!.id.substring(0, 8).toUpperCase() }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status</span>
          <span class="status-badge">{{ order()!.status }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Total</span>
          <span class="value total">{{ order()!.totalAmount | currency:'EUR' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Payment</span>
          <span class="value">{{ order()!.paymentMethod | titlecase }}</span>
        </div>
      </div>

      <div class="items-section">
        <h3>Items Ordered</h3>
        <div class="item" *ngFor="let item of order()!.items">
          <img [src]="shop.getProductImage(item.productImageUrl)" [alt]="item.productName" />
          <div class="item-info">
            <span class="item-name">{{ item.productName }}</span>
            <span class="item-qty">Qty: {{ item.quantity }}</span>
          </div>
          <span class="item-price">{{ item.subtotal | currency:'EUR' }}</span>
        </div>
      </div>

      <div class="shipping-section" *ngIf="order()!.shippingAddress">
        <h3>Shipping To</h3>
        <p class="address">{{ order()!.shippingAddress }}</p>
      </div>

      <div class="actions">
        <a routerLink="/shop/orders" class="btn btn--secondary">View All Orders</a>
        <a routerLink="/shop" class="btn btn--primary">Continue Shopping</a>
      </div>
    </div>

    <div class="loading" *ngIf="!order()">
      <div class="loader-spinner"></div>
    </div>
  `,
    styles: [`
    .confirmation {
      max-width: 560px;
      margin: 0 auto;
      padding: 40px 24px;
      text-align: center;
    }
    .success-icon { font-size: 3rem; margin-bottom: 12px; }
    .confirmation h1 { font-size: 1.6rem; font-weight: 900; color: #1a1a1a; margin: 0 0 8px; }
    .subtitle { font-size: 0.95rem; color: #888; margin: 0 0 32px; }

    .order-details {
      background: #fff;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
    }
    .detail-row + .detail-row { border-top: 1px solid rgba(0,0,0,0.04); }
    .label { font-size: 0.85rem; color: #888; }
    .value { font-size: 0.9rem; font-weight: 600; color: #333; }
    .total { font-size: 1.1rem; font-weight: 800; color: #1a1a1a; }
    .status-badge {
      font-size: 0.75rem;
      font-weight: 700;
      background: #E8F5E9;
      color: #2e7d32;
      padding: 4px 12px;
      border-radius: 12px;
    }

    .items-section, .shipping-section {
      background: #fff;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
      text-align: left;
    }
    .items-section h3, .shipping-section h3 {
      margin: 0 0 12px;
      font-size: 0.95rem;
      font-weight: 700;
      color: #1a1a1a;
    }

    .item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
    }
    .item + .item { border-top: 1px solid rgba(0,0,0,0.04); }
    .item img {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      object-fit: cover;
      background: #f5f8f5;
    }
    .item-info { flex: 1; }
    .item-name { display: block; font-weight: 600; font-size: 0.88rem; color: #333; }
    .item-qty { font-size: 0.78rem; color: #999; }
    .item-price { font-weight: 700; font-size: 0.9rem; color: #1a1a1a; }

    .address {
      font-size: 0.9rem;
      color: #555;
      line-height: 1.6;
      white-space: pre-line;
      margin: 0;
    }

    .actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 8px;
    }
    .btn {
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn--primary {
      background: var(--trellis-green, #2e7d32);
      color: #fff;
    }
    .btn--primary:hover { background: #1b5e20; }
    .btn--secondary {
      background: #f5f5f5;
      color: #555;
    }
    .btn--secondary:hover { background: #eee; }

    .loading { display: flex; justify-content: center; padding: 80px; }
    .loader-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(0,0,0,0.08);
      border-top-color: var(--trellis-green, #2e7d32);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class OrderConfirmationComponent implements OnInit {
    private route = inject(ActivatedRoute);
    shop = inject(ShopService);
    order = signal<Order | null>(null);

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.shop.getOrderById(id).subscribe(o => this.order.set(o));
            }
        });
    }
}
