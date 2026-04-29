import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MarketplaceService, ListingResponse } from '../marketplace.service';
import { AuthGatekeeperService } from '../../../auth/auth-gatekeeper.service';
import { AuthService } from '../../../auth/auth.service';
import { ProUpgradeModalComponent } from '../pro-upgrade-modal/pro-upgrade-modal.component';
import { ProBadgeComponent } from '../../../shared/components/pro-badge/pro-badge.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-marketplace-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ProUpgradeModalComponent, ProBadgeComponent],
  templateUrl: './marketplace-list.component.html',
  styleUrl: './marketplace-list.component.scss'
})
export class MarketplaceListComponent implements OnInit {
  listings = signal<ListingResponse[]>([]);
  loading = signal<boolean>(true);
  showProModal = signal<boolean>(false);
  searchQuery = signal('');
  viewMode: 'market' | 'my-listings' = 'market';

  filteredListings = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.listings();
    return this.listings().filter(l => l.title.toLowerCase().includes(q));
  });

  private marketplaceService = inject(MarketplaceService);
  private router = inject(Router);
  private gatekeeper = inject(AuthGatekeeperService);
  readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.loadListings();
  }

  loadListings() {
    this.loading.set(true);
    const fetchObs = this.viewMode === 'market'
      ? this.marketplaceService.getAllActiveListings()
      : this.marketplaceService.getMyListings();

    fetchObs.subscribe({
      next: (data) => { this.listings.set(data); this.loading.set(false); },
      error: (err) => { console.error('Failed to load listings', err); this.loading.set(false); }
    });
  }

  setViewMode(mode: 'market' | 'my-listings') {
    this.viewMode = mode;
    this.loadListings();
  }

  createListing() {
    this.gatekeeper.run(() => {
      this.router.navigate(['/marketplace/create']);
    });
  }

  openProModal() {
    this.gatekeeper.run(() => this.showProModal.set(true));
  }

  get isAlreadyPro(): boolean {
    return this.authService.currentUser()?.subscriptionTier === 'PRO';
  }

  getImageUrl(url: string | null | undefined): string {
    if (!url) return '/assets/placeholder-plant.jpg';
    if (url.startsWith('/images/')) return `${environment.baseUrl}${url}`;
    return url;
  }
}
