import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { SliderModule } from 'primeng/slider';
import { MarketplaceService, ListingRequest } from '../marketplace.service';
import { AuthService } from '../../../auth/auth.service';

import { trigger, style, animate, transition } from '@angular/animations';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-marketplace-add',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterLink,
        DialogModule,
        ButtonModule,
        InputTextModule,
        SliderModule,
        InputTextareaModule
    ],
    templateUrl: './marketplace-add.component.html',
    styleUrls: ['./marketplace-add.component.scss'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(10px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ]
})
export class MarketplaceAddComponent implements OnInit {
    listingForm: FormGroup;
    isFetchingPreview = false;
    isSubmitting = false;
    isInputFocused = false;
    previewData: any = null;

    creationMode: 'link' | 'manual' = 'link';
    isEditMode = false;
    listingId: string | null = null;

    constructor(
        private fb: FormBuilder,
        private marketplaceService: MarketplaceService,
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService
    ) {
        this.listingForm = this.fb.group({
            productUrl: ['', [Validators.pattern(/https?:\/\/.+/)]], // Removed required initially
            durationDays: [7, [Validators.required, Validators.min(1), Validators.max(30)]],
            title: ['', Validators.required],
            imageUrl: ['', Validators.required],
            description: [''],
            productPrice: [null],
            currency: ['USD'],
            additionalImages: this.fb.array([])
        });

        // Initialize validators based on default mode
        this.updateValidators();
    }

    ngOnInit() {
        this.clampDuration();
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.isEditMode = true;
                this.listingId = id;
                this.creationMode = 'manual';
                this.updateValidators();
                this.fetchListingForEdit(id);
            }
        });
    }

    private clampDuration() {
        const ctrl = this.listingForm.get('durationDays');
        if (ctrl && ctrl.value > this.maxDuration) {
            ctrl.setValue(this.maxDuration);
        }
    }

    fetchListingForEdit(id: string) {
        this.isFetchingPreview = true;
        this.marketplaceService.getListingById(id).subscribe({
            next: (listing) => {
                this.previewData = { manual: true }; // Setup dummy preview to show form
                const allImages = listing.imageUrls?.length ? listing.imageUrls
                    : [listing.imageUrl, ...(listing.additionalImages ?? [])].filter(Boolean);

                this.listingForm.patchValue({
                    title: listing.title,
                    description: listing.description || '',
                    imageUrl: allImages[0] ?? listing.imageUrl,
                    productPrice: listing.productPrice,
                    currency: listing.currency ?? 'USD',
                    productUrl: listing.productUrl,
                    durationDays: listing.durationDays
                });

                // Keep the URL control disabled during edit
                this.listingForm.get('productUrl')?.disable();
                this.listingForm.get('durationDays')?.disable();

                // Populate additional images (index 1+)
                allImages.slice(1).forEach((img: string) => {
                    this.additionalImages.push(this.fb.control(img, Validators.required));
                });
                this.isFetchingPreview = false;
            },
            error: (err) => {
                console.error('Failed to fetch listing for edit', err);
                this.isFetchingPreview = false;
                this.router.navigate(['/marketplace']);
            }
        });
    }

    setMode(mode: 'link' | 'manual') {
        this.creationMode = mode;
        this.updateValidators();

        if (mode === 'manual') {
            this.previewData = { manual: true }; // Dummy preview data to show details form
        } else {
            this.previewData = null;
            this.listingForm.reset({ durationDays: 7 });
        }
    }

    updateValidators() {
        const urlControl = this.listingForm.get('productUrl');
        if (this.creationMode === 'link') {
            urlControl?.setValidators([Validators.required, Validators.pattern(/https?:\/\/.+/)]);
        } else {
            urlControl?.clearValidators();
            urlControl?.setValue(null);
        }
        urlControl?.updateValueAndValidity();
    }

    get additionalImages() {
        return this.listingForm.get('additionalImages') as import('@angular/forms').FormArray;
    }

    addAdditionalImage() {
        this.additionalImages.push(this.fb.control('', Validators.required));
    }

    removeAdditionalImage(index: number) {
        this.additionalImages.removeAt(index);
    }

    readonly currencySymbols: Record<string, string> = {
        USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', CHF: '₣', CNY: '¥', KRW: '₩', INR: '₹'
    };

    get currencySymbol(): string {
        const code = this.listingForm.get('currency')?.value ?? 'USD';
        return this.currencySymbols[code] ?? code;
    }

    get isPro(): boolean {
        return this.authService.currentUser()?.subscriptionTier === 'PRO';
    }

    get maxDuration(): number {
        return this.isPro ? 14 : 7;
    }

    get totalCost(): number {
        const days = this.listingForm.get('durationDays')?.value || 0;
        return days * 5;
    }

    cancel() {
        this.router.navigate(['/marketplace']);
    }

    fetchPreview() {
        const url = this.listingForm.get('productUrl')?.value;
        if (!url) return;

        this.isFetchingPreview = true;
        this.marketplaceService.previewListing(url).subscribe({
            next: (data) => {
                this.previewData = data;
                this.listingForm.patchValue({
                    title: data.title,
                    imageUrl: data.imageUrls?.[0] ?? '',
                    description: data.description || '',
                    productPrice: data.productPrice || null
                });
                // Populate additional images (index 1+)
                this.additionalImages.clear();
                (data.imageUrls ?? []).slice(1, 5).forEach((img: string) => {
                    this.additionalImages.push(this.fb.control(img, Validators.required));
                });
                this.isFetchingPreview = false;
            },
            error: (err) => {
                console.error('Preview failed', err);
                this.isFetchingPreview = false;
            }
        });
    }

    saveDraft() {
        if (this.listingForm.invalid) return;
        this.createListing(false);
    }

    showPaymentModal = false;
    paymentStatus: 'processing' | 'success' = 'processing';

    payAndList() {
        if (this.listingForm.invalid) return;
        if (this.isEditMode && this.listingId) {
            this.updateExistingListing();
        } else {
            this.createListing(true);
        }
    }

    private updateExistingListing() {
        if (!this.listingId) return;
        this.isSubmitting = true;
        const formVal = this.listingForm.getRawValue();
        const extras: string[] = (formVal.additionalImages as string[]).filter(Boolean);

        const request: ListingRequest = {
            productUrl: formVal.productUrl,
            title: formVal.title,
            imageUrls: [formVal.imageUrl, ...extras].filter(Boolean),
            description: formVal.description,
            productPrice: formVal.productPrice,
            currency: formVal.currency ?? 'USD',
            durationDays: formVal.durationDays
        };

        this.marketplaceService.updateListing(this.listingId, request).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.router.navigate(['/marketplace/listing', this.listingId]);
            },
            error: (err) => {
                console.error('Update failed', err);
                this.isSubmitting = false;
                alert('Update failed. Please try again.');
            }
        });
    }

    private createListing(processPayment: boolean) {
        this.isSubmitting = true;
        const formVal = this.listingForm.value;
        const extras: string[] = (formVal.additionalImages as string[]).filter(Boolean);

        const request: ListingRequest = {
            productUrl: formVal.productUrl,
            title: formVal.title,
            imageUrls: [formVal.imageUrl, ...extras].filter(Boolean),
            description: formVal.description,
            productPrice: formVal.productPrice,
            durationDays: formVal.durationDays
        };

        this.marketplaceService.createListing(request).subscribe({
            next: (listing) => {
                const navigateHome = () => {
                    this.isSubmitting = false;
                    this.router.navigate(['/marketplace']);
                };

                if (processPayment) {
                    this.marketplaceService.processPayment(listing.id).subscribe({
                        next: () => {
                            this.paymentStatus = 'success';
                            setTimeout(() => {
                                this.showPaymentModal = false;
                                navigateHome();
                            }, 2500); // Wait 2.5s to show full success animation before navigating
                        },
                        error: (err) => {
                            console.error('Payment failed', err);
                            this.showPaymentModal = false;
                            alert('Payment failed. Please try again.');
                            this.isSubmitting = false;
                        }
                    });
                } else {
                    navigateHome();
                }
            },
            error: (err) => {
                console.error('Creation failed', err);
                this.isSubmitting = false;
                this.showPaymentModal = false;
            }
        });
    }

    onFileSelected(event: any, isMain: boolean) {
        const file = event.target.files[0];
        if (!file) return;

        this.marketplaceService.uploadImage(file).subscribe({
            next: (url) => {
                if (isMain) {
                    this.listingForm.patchValue({ imageUrl: url });
                } else {
                    this.additionalImages.push(this.fb.control(url, Validators.required));
                }
            },
            error: (err) => console.error('Upload failed', err)
        });
    }

    getImageUrl(url: string | null | undefined): string {
        if (!url) return '/assets/placeholder-plant.jpg';
        if (url.startsWith('/images/')) {
            return `${environment.baseUrl}${url}`;
        }
        return url;
    }
}
