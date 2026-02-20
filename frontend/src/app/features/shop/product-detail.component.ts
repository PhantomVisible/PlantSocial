import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Product, ShopService } from './shop.service';
import { ProductCardComponent } from './product-card.component';

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ProductCardComponent],
    template: `
    <div class="detail" *ngIf="product()">
      <!-- Breadcrumbs -->
      <div class="detail__breadcrumbs">
        <a routerLink="/shop">Shop</a>
        <span>›</span>
        <span>{{ shop.getCategoryLabel(product()!.category) }}</span>
        <span>›</span>
        <span class="current">{{ product()!.name }}</span>
      </div>

      <div class="detail__layout">
        <!-- Left: Image -->
        <div class="detail__image-section">
          <div class="detail__image-wrap">
            <img [src]="shop.getProductImage(product()!.imageUrl)" [alt]="product()!.name" />
            <span *ngIf="product()!.compareAtPrice" class="sale-badge">Sale</span>
          </div>
        </div>

        <!-- Right: Info -->
        <div class="detail__info">
          <span class="detail__category">{{ shop.getCategoryLabel(product()!.category) }}</span>
          <h1 class="detail__name">{{ product()!.name }}</h1>

          <div class="detail__rating" *ngIf="product()!.reviewCount > 0">
            <span class="stars">{{ getStars(product()!.rating) }}</span>
            <span class="rating-text">{{ product()!.rating }} ({{ product()!.reviewCount }} reviews)</span>
          </div>

          <div class="detail__price-row">
            <span class="detail__price">{{ product()!.price | currency:'EUR' }}</span>
            <span *ngIf="product()!.compareAtPrice" class="detail__compare">{{ product()!.compareAtPrice | currency:'EUR' }}</span>
            <span *ngIf="product()!.compareAtPrice" class="detail__discount">
              Save {{ (product()!.compareAtPrice! - product()!.price) | currency:'EUR' }}
            </span>
          </div>

          <p class="detail__short-desc">{{ product()!.shortDescription }}</p>

          <div class="detail__meta">
            <div class="meta-item">
              <i class="pi pi-box"></i>
              <span>{{ product()!.weight }}</span>
            </div>
            <div class="meta-item">
              <i class="pi pi-check-circle"></i>
              <span [class.out-of-stock]="!product()!.inStock">
                {{ product()!.inStock ? 'In Stock (' + product()!.stock + ' available)' : 'Out of Stock' }}
              </span>
            </div>
          </div>

          <!-- Quantity + Add to Cart -->
          <div class="detail__actions">
            <div class="qty-control">
              <button class="qty-btn" (click)="decreaseQty()" [disabled]="quantity() <= 1">−</button>
              <span class="qty-value">{{ quantity() }}</span>
              <button class="qty-btn" (click)="increaseQty()" [disabled]="quantity() >= product()!.stock">+</button>
            </div>
            <button
              class="add-to-cart-btn"
              [disabled]="!product()!.inStock"
              (click)="addToCart()">
              <i class="pi pi-shopping-cart"></i>
              Add to Cart — {{ (product()!.price * quantity()) | currency:'EUR' }}
            </button>
          </div>

          <!-- Shipping info -->
          <div class="detail__shipping">
            <div class="shipping-item">
              <i class="pi pi-truck"></i>
              <span>Free shipping over €70</span>
            </div>
            <div class="shipping-item">
              <i class="pi pi-clock"></i>
              <span>Order before 4:30 PM — ships today</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Description + Ingredients tabs -->
      <div class="detail__tabs">
        <div class="tabs-header">
          <button class="tab-btn" [class.active]="activeTab() === 'desc'" (click)="activeTab.set('desc')">Description</button>
          <button class="tab-btn" [class.active]="activeTab() === 'ingredients'" (click)="activeTab.set('ingredients')">Ingredients</button>
        </div>
        <div class="tab-content" *ngIf="activeTab() === 'desc'">
          <p>{{ product()!.description }}</p>
        </div>
        <div class="tab-content" *ngIf="activeTab() === 'ingredients'">
          <p>{{ product()!.ingredients }}</p>
        </div>
      </div>

      <!-- Related Products -->
      <div class="detail__related" *ngIf="relatedProducts().length > 0">
        <h2>You might also like</h2>
        <div class="related-grid">
          <app-product-card
            *ngFor="let rp of relatedProducts()"
            [product]="rp">
          </app-product-card>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div class="detail-loading" *ngIf="!product()">
      <div class="loader-spinner"></div>
    </div>
  `,
    styles: [`
    .detail { padding: 0 24px 40px; }

    .detail__breadcrumbs {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 20px 0;
      font-size: 0.82rem;
      color: #888;
    }
    .detail__breadcrumbs a {
      color: var(--trellis-green, #2e7d32);
      text-decoration: none;
      font-weight: 500;
    }
    .detail__breadcrumbs a:hover { text-decoration: underline; }
    .detail__breadcrumbs .current { color: #555; font-weight: 500; }

    .detail__layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      max-width: 900px;
    }

    .detail__image-wrap {
      position: relative;
      border-radius: 20px;
      overflow: hidden;
      background: #f5f8f5;
      aspect-ratio: 1;
    }
    .detail__image-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .sale-badge {
      position: absolute;
      top: 16px;
      left: 16px;
      background: #E53E3E;
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail__info { display: flex; flex-direction: column; gap: 12px; padding-top: 8px; }

    .detail__category {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--trellis-green, #2e7d32);
      opacity: 0.7;
    }
    .detail__name {
      font-size: 1.8rem;
      font-weight: 900;
      margin: 0;
      color: #1a1a1a;
      line-height: 1.2;
    }

    .detail__rating {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .stars { color: #F59E0B; font-size: 1rem; letter-spacing: 2px; }
    .rating-text { font-size: 0.85rem; color: #888; }

    .detail__price-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .detail__price {
      font-size: 1.6rem;
      font-weight: 900;
      color: #1a1a1a;
    }
    .detail__compare {
      font-size: 1.1rem;
      color: #999;
      text-decoration: line-through;
    }
    .detail__discount {
      font-size: 0.8rem;
      font-weight: 700;
      color: #E53E3E;
      background: #FFF5F5;
      padding: 4px 10px;
      border-radius: 12px;
    }

    .detail__short-desc {
      font-size: 0.95rem;
      color: #555;
      line-height: 1.6;
      margin: 4px 0 0;
    }

    .detail__meta {
      display: flex;
      gap: 16px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: #666;
    }
    .meta-item i { color: var(--trellis-green, #2e7d32); font-size: 0.9rem; }
    .out-of-stock { color: #E53E3E; }

    /* ── Actions ─────── */
    .detail__actions {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }
    .qty-control {
      display: flex;
      align-items: center;
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 12px;
      overflow: hidden;
    }
    .qty-btn {
      width: 40px;
      height: 44px;
      border: none;
      background: #fafafa;
      font-size: 1.1rem;
      cursor: pointer;
      transition: background 0.15s;
      color: #333;
      font-family: 'Inter', sans-serif;
    }
    .qty-btn:hover:not(:disabled) { background: #eee; }
    .qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .qty-value {
      width: 44px;
      text-align: center;
      font-weight: 700;
      font-size: 1rem;
    }

    .add-to-cart-btn {
      flex: 1;
      padding: 0 24px;
      height: 44px;
      background: var(--trellis-green, #2e7d32);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      font-family: 'Inter', sans-serif;
    }
    .add-to-cart-btn:hover:not(:disabled) { background: #1b5e20; transform: translateY(-1px); }
    .add-to-cart-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .detail__shipping {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: #f8faf8;
      border-radius: 12px;
      margin-top: 4px;
    }
    .shipping-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.85rem;
      color: #555;
    }
    .shipping-item i { color: var(--trellis-green, #2e7d32); }

    /* ── Tabs ─────────── */
    .detail__tabs {
      margin-top: 40px;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 16px;
      overflow: hidden;
    }
    .tabs-header {
      display: flex;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .tab-btn {
      flex: 1;
      padding: 16px;
      border: none;
      background: #fafafa;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      color: #888;
      transition: all 0.2s;
      font-family: 'Inter', sans-serif;
    }
    .tab-btn:hover { color: #555; }
    .tab-btn.active {
      background: #fff;
      color: var(--trellis-green, #2e7d32);
      box-shadow: inset 0 -2px 0 var(--trellis-green, #2e7d32);
    }
    .tab-content {
      padding: 24px;
      font-size: 0.92rem;
      line-height: 1.7;
      color: #555;
    }
    .tab-content p { margin: 0; }

    /* ── Related ──────── */
    .detail__related {
      margin-top: 40px;
    }
    .detail__related h2 {
      font-size: 1.2rem;
      font-weight: 800;
      margin: 0 0 16px;
      color: #1a1a1a;
    }
    .related-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    /* ── Loading ──────── */
    .detail-loading {
      display: flex;
      justify-content: center;
      padding: 80px 0;
    }
    .loader-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(0,0,0,0.08);
      border-top-color: var(--trellis-green, #2e7d32);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 700px) {
      .detail__layout {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .detail__name { font-size: 1.4rem; }
      .detail__price { font-size: 1.3rem; }
    }
  `]
})
export class ProductDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    shop = inject(ShopService);

    product = signal<Product | null>(null);
    relatedProducts = signal<Product[]>([]);
    quantity = signal(1);
    activeTab = signal('desc');

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const slug = params.get('slug');
            if (slug) {
                this.shop.getProductBySlug(slug).subscribe(p => {
                    this.product.set(p);
                    this.quantity.set(1);
                    // Load related products from same category
                    this.shop.getProducts({ category: p.category }).subscribe(all => {
                        this.relatedProducts.set(all.filter(x => x.slug !== p.slug).slice(0, 4));
                    });
                });
            }
        });
    }

    increaseQty() {
        if (this.quantity() < this.product()!.stock) {
            this.quantity.update(q => q + 1);
        }
    }

    decreaseQty() {
        if (this.quantity() > 1) {
            this.quantity.update(q => q - 1);
        }
    }

    addToCart() {
        this.shop.addToCart(this.product()!.id, this.quantity());
    }

    getStars(rating: number): string {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5 ? 1 : 0;
        return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
    }
}
