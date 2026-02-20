import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { SliderModule } from 'primeng/slider';
import { MarketplaceService, ListingRequest } from '../marketplace.service';

import { trigger, style, animate, transition } from '@angular/animations';

@Component({
    selector: 'app-marketplace-add',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
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
export class MarketplaceAddComponent {
    listingForm: FormGroup;
    isFetchingPreview = false;
    isSubmitting = false;
    isInputFocused = false;
    previewData: any = null;

    creationMode: 'link' | 'manual' = 'link';

    constructor(
        private fb: FormBuilder,
        private marketplaceService: MarketplaceService,
        private router: Router
    ) {
        this.listingForm = this.fb.group({
            productUrl: ['', [Validators.pattern(/https?:\/\/.+/)]], // Removed required initially
            durationDays: [7, [Validators.required, Validators.min(1), Validators.max(30)]],
            title: ['', Validators.required],
            imageUrl: ['', Validators.required],
            description: [''],
            additionalImages: this.fb.array([])
        });

        // Initialize validators based on default mode
        this.updateValidators();
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
                    imageUrl: data.imageUrl,
                    description: data.description || ''
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
        this.showPaymentModal = true;
        this.paymentStatus = 'processing';
        this.createListing(true);
    }

    private createListing(processPayment: boolean) {
        this.isSubmitting = true;
        const formVal = this.listingForm.value;

        const request: ListingRequest = {
            productUrl: formVal.productUrl,
            title: formVal.title,
            imageUrl: formVal.imageUrl,
            description: formVal.description,
            additionalImages: formVal.additionalImages,
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
                            }, 1500); // Wait 1.5s to show success before navigating
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
            return `http://localhost:8080${url}`;
        }
        return url;
    }
}
