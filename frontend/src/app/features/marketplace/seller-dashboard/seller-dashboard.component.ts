import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MarketplaceService, ListingResponse } from '../marketplace.service';

@Component({
    selector: 'app-seller-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, DatePipe],
    templateUrl: './seller-dashboard.component.html',
    styleUrl: './seller-dashboard.component.scss'
})
export class SellerDashboardComponent implements OnInit {
    private marketplaceService = inject(MarketplaceService);

    listings = signal<ListingResponse[]>([]);
    isLoading = signal(true);
    boostingId = signal<string | null>(null);
    errorMessage = signal<string | null>(null);

    ngOnInit(): void {
        this.marketplaceService.getMyListings().subscribe({
            next: (data) => {
                this.listings.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
            }
        });
    }

    activateFreeBoost(listing: ListingResponse): void {
        this.boostingId.set(listing.id);
        this.errorMessage.set(null);

        this.marketplaceService.activateFreeBoost(listing.id).subscribe({
            next: (updated) => {
                this.listings.update(all => all.map(l => l.id === updated.id ? updated : l));
                this.boostingId.set(null);
            },
            error: (err) => {
                this.errorMessage.set(err?.error?.message ?? 'Failed to activate boost. Please try again.');
                this.boostingId.set(null);
            }
        });
    }

    get totalClicks(): number {
        return this.listings().reduce((sum, l) => sum + (l.clickCount ?? 0), 0);
    }

    get activeCount(): number {
        return this.listings().filter(l => l.status === 'ACTIVE').length;
    }
}
