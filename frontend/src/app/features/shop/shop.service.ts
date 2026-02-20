import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../core/toast.service';

export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    price: number;
    compareAtPrice: number | null;
    category: string;
    imageUrl: string;
    images: string | null;
    stock: number;
    weight: string;
    ingredients: string;
    rating: number;
    reviewCount: number;
    featured: boolean;
    inStock: boolean;
}

export interface CartItem {
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    productImageUrl: string;
    productPrice: number;
    quantity: number;
    subtotal: number;
}

export interface CartResponse {
    items: CartItem[];
    total: number;
    itemCount: number;
}

export interface OrderItem {
    id: string;
    productId: string;
    productName: string;
    productImageUrl: string;
    quantity: number;
    priceAtPurchase: number;
    subtotal: number;
}

export interface Order {
    id: string;
    status: string;
    totalAmount: number;
    shippingAddress: string;
    paymentMethod: string;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string | null;
}

const API = 'http://localhost:8080/api/v1/shop';

@Injectable({ providedIn: 'root' })
export class ShopService {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    private toast = inject(ToastService);

    // Cart state
    cartItems = signal<CartItem[]>([]);
    cartTotal = signal<number>(0);
    cartItemCount = signal<number>(0);

    totalWithShipping = computed(() => {
        const total = this.cartTotal();
        return total > 70 ? total : total + 5.99;
    });

    freeShippingRemaining = computed(() => {
        const remaining = 70 - this.cartTotal();
        return remaining > 0 ? remaining : 0;
    });

    // ── Products ─────────────────────────────────────────

    getProducts(params?: { category?: string; sort?: string; search?: string }) {
        let httpParams = new HttpParams();
        if (params?.category) httpParams = httpParams.set('category', params.category);
        if (params?.sort) httpParams = httpParams.set('sort', params.sort);
        if (params?.search) httpParams = httpParams.set('search', params.search);
        return this.http.get<Product[]>(`${API}/products`, { params: httpParams });
    }

    getProductBySlug(slug: string) {
        return this.http.get<Product>(`${API}/products/${slug}`);
    }

    getFeaturedProducts() {
        return this.http.get<Product[]>(`${API}/products/featured`);
    }

    // ── Cart ─────────────────────────────────────────────

    loadCart() {
        if (!this.auth.currentUser()) return;
        this.http.get<CartResponse>(`${API}/cart`).subscribe({
            next: (res) => {
                this.cartItems.set(res.items);
                this.cartTotal.set(res.total);
                this.cartItemCount.set(res.itemCount);
            },
            error: () => { }
        });
    }

    addToCart(productId: string, quantity: number = 1) {
        if (!this.auth.currentUser()) {
            this.toast.showWarn('Please log in to add items to your cart');
            return;
        }
        this.http.post<CartItem>(`${API}/cart`, { productId, quantity }).subscribe({
            next: () => {
                this.toast.showSuccess('Added to cart! 🛒');
                this.loadCart();
            },
            error: (err) => {
                this.toast.showError(err.error?.message || 'Failed to add to cart');
            }
        });
    }

    updateCartItem(itemId: string, quantity: number) {
        this.http.put<CartItem>(`${API}/cart/${itemId}`, { quantity }).subscribe({
            next: () => this.loadCart(),
            error: () => this.toast.showError('Failed to update cart')
        });
    }

    removeCartItem(itemId: string) {
        this.http.delete(`${API}/cart/${itemId}`).subscribe({
            next: () => {
                this.toast.showInfo('Item removed');
                this.loadCart();
            },
            error: () => this.toast.showError('Failed to remove item')
        });
    }

    // ── Orders ───────────────────────────────────────────

    checkout(shippingAddress: string, paymentMethod: string) {
        return this.http.post<Order>(`${API}/checkout`, {
            shippingAddress,
            paymentMethod,
            notes: ''
        });
    }

    getOrders() {
        return this.http.get<Order[]>(`${API}/orders`);
    }

    getOrderById(id: string) {
        return this.http.get<Order>(`${API}/orders/${id}`);
    }

    // ── Helpers ──────────────────────────────────────────

    getProductImage(imageUrl: string | null): string {
        if (!imageUrl) return 'https://placehold.co/400x400/e8f5e9/2e7d32?text=🌱';
        if (imageUrl.startsWith('http')) return imageUrl;
        return 'http://localhost:8080' + imageUrl;
    }

    getCategoryLabel(cat: string): string {
        const labels: Record<string, string> = {
            'SOIL_MIX': 'Soil Mixes',
            'SOIL_IMPROVER': 'Soil Improvers',
            'PLANT_FOOD': 'Plant Food',
            'POTS': 'Pots & Planters',
            'TOOLS': 'Tools',
            'ACCESSORIES': 'Accessories'
        };
        return labels[cat] || cat;
    }
}
