import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Product, ShopService } from './shop.service';
import { ProductCardComponent } from './product-card.component';

@Component({
  selector: 'app-shop-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  template: `
    <div class="shop">
      <!-- Hero -->
      <div class="shop__hero">
        <div class="hero-content">
          <span class="hero-badge">🌿 Trellis Shop</span>
          <h1 class="hero-title">Premium Soil & Plant Care</h1>
          <p class="hero-subtitle">Everything your plants need to thrive. Hand-crafted soil mixes, organic amendments, and expert plant food.</p>
        </div>
        <div class="hero-decoration">
          <div class="deco-circle deco-circle--1"></div>
          <div class="deco-circle deco-circle--2"></div>
          <div class="deco-circle deco-circle--3"></div>
        </div>
      </div>

      <!-- Filters -->
      <div class="shop__toolbar">
        <div class="filter-pills">
          <button
            *ngFor="let cat of categories"
            class="pill"
            [class.pill--active]="selectedCategory() === cat.value"
            (click)="filterByCategory(cat.value)">
            {{ cat.label }}
          </button>
        </div>
        <div class="toolbar-right">
          <div class="search-box">
            <i class="pi pi-search"></i>
            <input
              type="text"
              placeholder="Search products..."
              [ngModel]="searchQuery()"
              (ngModelChange)="onSearch($event)" />
          </div>
          <select class="sort-select" [ngModel]="selectedSort()" (ngModelChange)="sortBy($event)">
            <option value="">Sort by</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
            <option value="name_asc">Name A–Z</option>
          </select>
          <button
            *ngIf="shop.cartItemCount() > 0"
            class="view-cart-btn"
            routerLink="/shop/cart">
            <i class="pi pi-shopping-cart"></i>
            <span>Cart ({{ shop.cartItemCount() }})</span>
          </button>
        </div>
      </div>

      <!-- Product count -->
      <p class="shop__count" *ngIf="!loading()">
        {{ products().length }} product{{ products().length !== 1 ? 's' : '' }}
        <span *ngIf="selectedCategory()"> in {{ getCategoryLabel(selectedCategory()!) }}</span>
      </p>

      <!-- Loading skeleton -->
      <div class="shop__grid" *ngIf="loading()">
        <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6]">
          <div class="skeleton-image"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text skeleton-text--short"></div>
        </div>
      </div>

      <!-- Products Grid -->
      <div class="shop__grid" *ngIf="!loading()">
        <app-product-card
          *ngFor="let product of products()"
          [product]="product">
        </app-product-card>
      </div>

      <!-- Empty state -->
      <div class="shop__empty" *ngIf="!loading() && products().length === 0">
        <span class="empty-icon">🌱</span>
        <h3>No products found</h3>
        <p>Try adjusting your search or filters</p>
        <button class="reset-btn" (click)="resetFilters()">View All Products</button>
      </div>

      <!-- Free shipping banner -->
      <div class="shop__banner">
        <div class="banner-icon">🚚</div>
        <div>
          <strong>Free shipping on orders over €70</strong>
          <p>Orders placed before 4:30 PM ship same day</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shop { padding: 0 0 40px; }

    /* ── Hero ────────────────── */
    .shop__hero {
      position: relative;
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%);
      padding: 48px 32px;
      border-bottom: 1px solid rgba(46, 125, 50, 0.1);
      overflow: hidden;
    }
    .hero-content { position: relative; z-index: 1; }
    .hero-badge {
      display: inline-block;
      font-size: 0.8rem;
      font-weight: 600;
      background: rgba(255,255,255,0.7);
      backdrop-filter: blur(8px);
      padding: 6px 14px;
      border-radius: 20px;
      color: var(--primary-color);
      margin-bottom: 12px;
    }
    .hero-title {
      font-size: 2rem;
      font-weight: 900;
      color: var(--primary-hover);
      margin: 0 0 8px;
      line-height: 1.2;
    }
    .hero-subtitle {
      font-size: 0.95rem;
      color: var(--primary-color);
      margin: 0;
      max-width: 480px;
      line-height: 1.5;
      opacity: 0.85;
    }
    .hero-decoration { position: absolute; top: 0; right: 0; bottom: 0; width: 50%; }
    .deco-circle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.15;
    }
    .deco-circle--1 { width: 200px; height: 200px; background: #2e7d32; top: -40px; right: -20px; }
    .deco-circle--2 { width: 120px; height: 120px; background: #1b5e20; bottom: -30px; right: 80px; }
    .deco-circle--3 { width: 80px; height: 80px; background: #4caf50; top: 40px; right: 160px; }

    /* ── Toolbar ─────────────── */
    .shop__toolbar {
      padding: 20px 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .filter-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pill {
      padding: 8px 16px;
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 24px;
      background: #fff;
      font-size: 0.82rem;
      font-weight: 600;
      color: #555;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Inter', sans-serif;
    }
    .pill:hover { border-color: var(--primary-color); color: var(--primary-color); }
    .pill--active {
      background: var(--primary-color);
      color: #fff;
      border-color: var(--primary-color);
    }
    .toolbar-right {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 24px;
      background: #fafafa;
      transition: border-color 0.2s;
    }
    .search-box:focus-within { border-color: var(--primary-color); }
    .search-box i { color: #999; font-size: 0.85rem; }
    .search-box input {
      border: none;
      outline: none;
      background: none;
      font-size: 0.85rem;
      font-family: 'Inter', sans-serif;
      width: 160px;
    }
    .sort-select {
      padding: 8px 14px;
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 24px;
      background: #fafafa;
      font-size: 0.82rem;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      color: #555;
    }

    .view-cart-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--primary-color);
      color: #fff;
      border: none;
      border-radius: 24px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background 0.2s;
      text-decoration: none;
      font-family: 'Inter', sans-serif;
    }
    .view-cart-btn:hover { background: var(--primary-hover); }

    .shop__count {
      padding: 12px 24px 0;
      font-size: 0.85rem;
      color: #888;
      margin: 0;
    }

    /* ── Product Grid ────────── */
    .shop__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
      padding: 20px 24px;
    }

    /* ── Skeleton ────────────── */
    .skeleton-card {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.06);
    }
    .skeleton-image {
      aspect-ratio: 1;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    .skeleton-text {
      height: 14px;
      margin: 16px;
      border-radius: 6px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    .skeleton-text--short { width: 60%; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* ── Empty ───────────────── */
    .shop__empty {
      text-align: center;
      padding: 60px 24px;
      color: #888;
    }
    .empty-icon { font-size: 3rem; display: block; margin-bottom: 12px; }
    .shop__empty h3 { margin: 0 0 8px; color: #555; }
    .shop__empty p { margin: 0 0 16px; }
    .reset-btn {
      padding: 10px 24px;
      background: var(--primary-color);
      color: #fff;
      border: none;
      border-radius: 24px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .reset-btn:hover { background: var(--primary-hover); }

    /* ── Banner ──────────────── */
    .shop__banner {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 20px 24px 0;
      padding: 20px 24px;
      background: linear-gradient(135deg, #f1f8e9, #e8f5e9);
      border-radius: 16px;
      border: 1px solid rgba(46, 125, 50, 0.1);
    }
    .banner-icon { font-size: 2rem; }
    .shop__banner strong { color: var(--primary-hover); font-size: 0.95rem; }
    .shop__banner p { margin: 4px 0 0; font-size: 0.82rem; color: var(--primary-color); opacity: 0.7; }

    @media (max-width: 600px) {
      .shop__hero { padding: 32px 20px; }
      .hero-title { font-size: 1.5rem; }
      .shop__toolbar { padding: 16px; }
      .shop__grid { padding: 16px; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
      .toolbar-right { width: 100%; }
      .search-box { flex: 1; }
      .search-box input { width: 100%; }
    }
  `]
})
export class ShopPageComponent implements OnInit {
  shop = inject(ShopService);

  products = signal<Product[]>([]);
  loading = signal(true);
  selectedCategory = signal<string | null>(null);
  selectedSort = signal('');
  searchQuery = signal('');

  categories = [
    { label: 'All', value: null as string | null },
    { label: 'Soil Mixes', value: 'SOIL_MIX' },
    { label: 'Soil Improvers', value: 'SOIL_IMPROVER' },
    { label: 'Plant Food', value: 'PLANT_FOOD' },
    { label: 'Pots', value: 'POTS' },
    { label: 'Tools', value: 'TOOLS' },
    { label: 'Accessories', value: 'ACCESSORIES' }
  ];

  private searchTimeout: any;

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);
    this.shop.getProducts({
      category: this.selectedCategory() || undefined,
      sort: this.selectedSort() || undefined,
      search: this.searchQuery() || undefined
    }).subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filterByCategory(cat: string | null) {
    this.selectedCategory.set(cat);
    this.searchQuery.set('');
    this.loadProducts();
  }

  sortBy(sort: string) {
    this.selectedSort.set(sort);
    this.loadProducts();
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadProducts(), 400);
  }

  resetFilters() {
    this.selectedCategory.set(null);
    this.selectedSort.set('');
    this.searchQuery.set('');
    this.loadProducts();
  }

  getCategoryLabel(cat: string): string {
    return this.shop.getCategoryLabel(cat);
  }
}
