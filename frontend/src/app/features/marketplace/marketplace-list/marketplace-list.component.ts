import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MarketplaceService, ListingResponse } from '../marketplace.service';

@Component({
  selector: 'app-marketplace-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './marketplace-list.component.html',
  styleUrl: './marketplace-list.component.scss'
})
export class MarketplaceListComponent implements OnInit {
  listings = signal<ListingResponse[]>([]);
  loading = signal<boolean>(true);
  viewMode: 'market' | 'my-listings' = 'market';

  constructor(private marketplaceService: MarketplaceService) { }

  ngOnInit(): void {
    this.loadListings();
  }

  loadListings() {
    this.loading.set(true);
    let fetchObs;

    if (this.viewMode === 'market') {
      fetchObs = this.marketplaceService.getAllActiveListings();
    } else {
      fetchObs = this.marketplaceService.getMyListings();
    }

    fetchObs.subscribe({
      next: (data) => {
        this.listings.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load listings', err);
        this.loading.set(false);
      }
    });
  }

  setViewMode(mode: 'market' | 'my-listings') {
    this.viewMode = mode;
    this.loadListings();
  }
}
