import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MarketplaceService, ListingResponse } from '../marketplace.service';
import { AuthService } from '../../../auth/auth.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DialogModule, ButtonModule],
  templateUrl: './listing-detail.component.html',
  styleUrl: './listing-detail.component.scss'
})
export class ListingDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private marketplaceService = inject(MarketplaceService);
  private authService = inject(AuthService);

  listing = signal<ListingResponse | null>(null);
  loading = signal<boolean>(true);
  showPaymentModal = signal<boolean>(false);

  // Computed properties for UI logic
  currentUser = this.authService.currentUser;

  isOwner = computed(() => {
    const listingUser = this.listing()?.userId;
    const currentUserId = this.currentUser()?.id;
    return listingUser === currentUserId;
  });

  canPay = computed(() => {
    return this.isOwner() && this.listing()?.status === 'PENDING_PAYMENT';
  });

  isActive = computed(() => this.listing()?.status === 'ACTIVE');

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadListing(id);
      }
    });
  }

  loadListing(id: string) {
    this.loading.set(true);
    this.marketplaceService.getListingById(id).subscribe({
      next: (data) => {
        this.listing.set(data);
        this.selectedImage.set(data.imageUrl);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load listing', err);
        this.loading.set(false);
        // this.router.navigate(['/marketplace']); // Optional: redirect on error
      }
    });
  }

  openPaymentModal() {
    this.showPaymentModal.set(true);
  }

  closePaymentModal() {
    this.showPaymentModal.set(false);
  }

  handlePayment() {
    const id = this.listing()?.id;
    if (id) {
      if (confirm('Simulate Payment of ' + this.listing()?.totalCost + '?')) {
        this.marketplaceService.processPayment(id).subscribe({
          next: (updatedListing) => {
            this.listing.set(updatedListing);
            alert('Payment Successful! Your listing is now active.');
          },
          error: (err) => {
            console.error('Payment failed', err);
            alert('Payment failed. Please try again.');
          }
        });
      }
    }
  }

  showDeleteModal = signal<boolean>(false);
  isDeleting = signal<boolean>(false);

  deleteListing() {
    this.showDeleteModal.set(true);
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
  }

  confirmDelete() {
    const id = this.listing()?.id;
    if (id) {
      this.isDeleting.set(true);
      this.marketplaceService.deleteListing(id).subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.showDeleteModal.set(false);
          this.router.navigate(['/marketplace']);
        },
        error: (err) => {
          console.error('Delete failed', err);
          this.isDeleting.set(false);
          this.showDeleteModal.set(false);
          alert('Delete failed. Please try again.');
        }
      });
    }
  }

  visitProduct() {
    const url = this.listing()?.productUrl;
    if (url) window.open(url, '_blank');
  }

  selectedImage = signal<string | null>(null);

  selectImage(url: string) {
    this.selectedImage.set(url);
  }

  getAllImages(item: ListingResponse): string[] {
    const images = [item.imageUrl];
    if (item.additionalImages) {
      images.push(...item.additionalImages);
    }
    return images;
  }

  getImageUrl(url: string | null | undefined): string {
    if (!url) return '/assets/placeholder-plant.jpg';
    if (url.startsWith('/images/')) {
      return `http://localhost:8080${url}`;
    }
    return url;
  }
}
