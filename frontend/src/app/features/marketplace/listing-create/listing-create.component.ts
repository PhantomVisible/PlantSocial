import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MarketplaceService } from '../marketplace.service';

@Component({
  selector: 'app-listing-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './listing-create.component.html',
  styleUrl: './listing-create.component.scss'
})
export class ListingCreateComponent {
  private fb = inject(FormBuilder);
  private marketplaceService = inject(MarketplaceService);
  private router = inject(Router);

  listingForm = this.fb.group({
    productUrl: ['', [Validators.required, Validators.pattern('https?://.+')]],
    title: ['', Validators.required],
    imageUrl: ['', [Validators.required, Validators.pattern('https?://.+')]],
    durationDays: [7, [Validators.required, Validators.min(1)]]
  });

  isSubmitting = false;
  isFetchingPreview = false;

  onSubmit() {
    if (this.listingForm.valid) {
      this.isSubmitting = true;
      const formValue = this.listingForm.value;

      const request = {
        productUrl: formValue.productUrl!,
        title: formValue.title!,
        imageUrl: formValue.imageUrl!,
        durationDays: Number(formValue.durationDays)
      };

      this.marketplaceService.createListing(request).subscribe({
        next: (res) => {
          this.router.navigate(['/marketplace/listing', res.id]);
        },
        error: (err) => {
          console.error('Failed to create listing', err);
          this.isSubmitting = false;
        }
      });
    }
  }

  fetchPreview() {
    const url = this.listingForm.get('productUrl')?.value;
    if (url && this.listingForm.get('productUrl')?.valid) {
      this.isFetchingPreview = true;
      this.marketplaceService.previewListing(url).subscribe({
        next: (preview) => {
          this.listingForm.patchValue({
            title: preview.title,
            imageUrl: preview.imageUrl
          });
          this.isFetchingPreview = false;
        },
        error: (err) => {
          console.error('Failed to fetch preview', err);
          alert('Could not fetch details from this URL. Please enter them manually.');
          this.isFetchingPreview = false;
        }
      });
    }
  }

  // Helper to fill mock data for demo purposes
  fillMockData() {
    this.listingForm.patchValue({
      productUrl: 'https://www.amazon.com/dp/B08XMS1K5P',
      title: 'Monstera Deliciosa - Swiss Cheese Plant',
      imageUrl: '/assets/placeholder-plant.jpg', // Using local placeholder for demo
      durationDays: 7
    });
  }
}
