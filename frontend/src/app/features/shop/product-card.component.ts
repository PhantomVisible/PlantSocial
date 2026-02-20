import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product, ShopService } from './shop.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a [routerLink]="['/shop/product', product.slug]" class="product-card">
      <div class="product-card__image-wrap">
        <img [src]="shop.getProductImage(product.imageUrl)" [alt]="product.name" class="product-card__image" />
        <span *ngIf="product.compareAtPrice" class="product-card__badge">Sale</span>
        <button class="product-card__quick-add" (click)="quickAdd($event)" title="Add to cart">
          <i class="pi pi-shopping-cart"></i>
        </button>
      </div>
      <div class="product-card__info">
        <span class="product-card__category">{{ shop.getCategoryLabel(product.category) }}</span>
        <h3 class="product-card__name">{{ product.name }}</h3>
        <p class="product-card__desc">{{ product.shortDescription }}</p>
        <div class="product-card__meta">
          <div class="product-card__price-row">
            <span class="product-card__price">{{ product.price | currency:'EUR' }}</span>
            <span *ngIf="product.compareAtPrice" class="product-card__compare-price">{{ product.compareAtPrice | currency:'EUR' }}</span>
          </div>
          <div class="product-card__rating" *ngIf="product.reviewCount > 0">
            <span class="stars">{{ getStars(product.rating) }}</span>
            <span class="review-count">({{ product.reviewCount }})</span>
          </div>
        </div>
        <span class="product-card__weight">{{ product.weight }}</span>
      </div>
    </a>
  `,
  styles: [`
    .product-card {
      display: flex;
      flex-direction: column;
      border-radius: 12px;
      background: var(--surface-card);
      border: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }
    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    }

    .product-card__image-wrap {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      background: #f5f8f5;
    }
    .product-card__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .product-card:hover .product-card__image {
      transform: scale(1.08);
    }
    .product-card__badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: #E53E3E;
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .product-card__quick-add {
      position: absolute;
      bottom: 12px;
      right: 12px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--trellis-green, #2e7d32);
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      opacity: 0;
      transform: translateY(8px);
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
    }
    .product-card:hover .product-card__quick-add {
      opacity: 1;
      transform: translateY(0);
    }
    .product-card__quick-add:hover {
      background: #1b5e20;
      transform: scale(1.1) !important;
    }

    .product-card__info {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .product-card__category {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--trellis-green, #2e7d32);
      opacity: 0.7;
    }
    .product-card__name {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
      color: #1a1a1a;
      line-height: 1.3;
    }
    .product-card__desc {
      font-size: 0.82rem;
      color: #666;
      margin: 0;
      line-height: 1.4;
    }

    .product-card__meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4px;
    }
    .product-card__price-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .product-card__price {
      font-size: 1.1rem;
      font-weight: 800;
      color: #1a1a1a;
    }
    .product-card__compare-price {
      font-size: 0.85rem;
      color: #999;
      text-decoration: line-through;
    }
    .product-card__rating {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .stars {
      color: #F59E0B;
      font-size: 0.85rem;
      letter-spacing: 1px;
    }
    .review-count {
      font-size: 0.75rem;
      color: #999;
    }
    .product-card__weight {
      font-size: 0.75rem;
      color: #999;
      margin-top: 2px;
    }
  `]
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  shop = inject(ShopService);

  quickAdd(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.shop.addToCart(this.product.id);
  }

  getStars(rating: number): string {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
  }
}
