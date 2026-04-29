import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MarketplaceService } from '../marketplace.service';
import { AuthService } from '../../../auth/auth.service';

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
    private authService = inject(AuthService);

    get maxDuration(): number {
        return this.authService.currentUser()?.subscriptionTier === 'PRO' ? 14 : 7;
    }

    listingForm = this.fb.group({
        productUrl: ['', [Validators.required, Validators.pattern('https?://.+')]],
        title: ['', Validators.required],
        price: [null as number | null],
        currency: ['USD'],
        durationDays: [7, [Validators.required, Validators.min(1)]]
    });

    // Image gallery state — managed outside reactive form
    imageUrls = signal<string[]>([]);
    selectedImageIndex = signal(0);

    isSubmitting = false;
    isFetchingPreview = false;
    isUploadingImage = false;
    fetchWarning = signal<string | null>(null);

    get selectedImage(): string | null {
        const imgs = this.imageUrls();
        return imgs.length > 0 ? imgs[this.selectedImageIndex()] : null;
    }

    get hasImages(): boolean {
        return this.imageUrls().length > 0;
    }

    get isFormValid(): boolean {
        return this.listingForm.valid && this.imageUrls().length > 0;
    }

    selectImage(index: number): void {
        this.selectedImageIndex.set(index);
    }

    onSubmit() {
        if (!this.isFormValid) return;

        this.isSubmitting = true;
        const v = this.listingForm.value;

        this.marketplaceService.createListing({
            productUrl: v.productUrl!,
            title: v.title!,
            imageUrls: this.imageUrls(),
            productPrice: v.price ?? undefined,
            originalPrice: v.price ?? undefined,
            currency: v.currency ?? 'USD',
            durationDays: Number(v.durationDays)
        }).subscribe({
            next: (res) => this.router.navigate(['/marketplace/listing', res.id]),
            error: (err) => {
                console.error('Failed to create listing', err);
                this.isSubmitting = false;
            }
        });
    }

    onImageFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const files = Array.from(input.files ?? []);
        if (!files.length) return;
        input.value = '';

        this.isUploadingImage = true;
        let remaining = files.length;

        files.forEach(file => {
            this.marketplaceService.uploadImage(file).subscribe({
                next: (url) => {
                    this.imageUrls.update(prev => [...prev, url].slice(0, 5));
                    remaining--;
                    if (remaining === 0) this.isUploadingImage = false;
                },
                error: (err) => {
                    console.error('Image upload failed', err);
                    remaining--;
                    if (remaining === 0) this.isUploadingImage = false;
                }
            });
        });
    }

    fetchPreview() {
        const url = this.listingForm.get('productUrl')?.value;
        if (!url || this.listingForm.get('productUrl')?.invalid) return;

        this.isFetchingPreview = true;
        this.fetchWarning.set(null);
        this.marketplaceService.previewListing(url).subscribe({
            next: (preview) => {
                this.listingForm.patchValue({
                    title: preview.title,
                    price: preview.productPrice ?? null,
                    currency: preview.currency ?? 'USD'
                });
                this.imageUrls.set(preview.imageUrls ?? []);
                this.selectedImageIndex.set(0);
                this.isFetchingPreview = false;
                if (!preview.imageUrls?.length) {
                    this.fetchWarning.set("We couldn't fetch images or a description for this listing — the site may block automated access. Please add them manually below.");
                }
            },
            error: (err) => {
                console.error('Failed to fetch preview', err);
                this.fetchWarning.set("Couldn't reach this URL. Please check the link or fill in the details manually.");
                this.isFetchingPreview = false;
            }
        });
    }
}
