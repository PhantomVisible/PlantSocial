import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap, map } from 'rxjs';

export interface ListingRequest {
    productUrl: string;
    imageUrl: string;
    title: string;
    description?: string;
    additionalImages?: string[];
    durationDays: number;
}

export interface ListingResponse {
    id: string;
    userId: string;
    userFullName: string;
    userHandle: string;
    productUrl: string;
    imageUrl: string;
    title: string;
    description?: string;
    additionalImages?: string[];
    pricePerDay: number;
    durationDays: number;
    totalCost: number;
    status: 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'REJECTED';
    expiryDate: string;
    createdAt: string;
}

export interface ProductPreviewDTO {
    title: string;
    imageUrl: string;
    url: string;
}

@Injectable({
    providedIn: 'root'
})
export class MarketplaceService {
    private apiUrl = `${environment.apiUrl}/marketplace`;

    // Signals for managing state if needed, though simple CRUD might not strictly need them globally yet
    listings = signal<ListingResponse[]>([]);

    constructor(private http: HttpClient) { }

    getAllActiveListings(): Observable<ListingResponse[]> {
        return this.http.get<ListingResponse[]>(`${this.apiUrl}/listings`).pipe(
            tap(data => this.listings.set(data))
        );
    }

    getMyListings(): Observable<ListingResponse[]> {
        return this.http.get<ListingResponse[]>(`${this.apiUrl}/my-listings`);
    }

    createListing(request: ListingRequest): Observable<ListingResponse> {
        return this.http.post<ListingResponse>(`${this.apiUrl}/listings`, request);
    }

    getListingById(id: string): Observable<ListingResponse> {
        return this.http.get<ListingResponse>(`${this.apiUrl}/listings/${id}`);
    }

    processPayment(id: string): Observable<ListingResponse> {
        return this.http.post<ListingResponse>(`${this.apiUrl}/listings/${id}/pay`, {});
    }

    previewListing(url: string): Observable<ProductPreviewDTO> {
        return this.http.post<ProductPreviewDTO>(`${this.apiUrl}/preview`, { url });
    }

    uploadImage(file: File): Observable<string> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.apiUrl}/upload`, formData, { responseType: 'text' }).pipe(
            map((url: string) => url.replace(/^"|"$/g, ''))
        );
    }

    deleteListing(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/listings/${id}`).pipe(
            tap(() => {
                this.listings.update(current => current.filter(l => l.id !== id));
            })
        );
    }
}
