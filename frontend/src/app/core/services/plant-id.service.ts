import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PlantIdSuggestion {
    name: string;
    probability: number;
}

export interface PlantIdentificationDTO {
    topMatch: string | null;
    confidence: number;
    suggestions: PlantIdSuggestion[];
}

@Injectable({
    providedIn: 'root'
})
export class PlantIdService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    verify(file: File): Observable<PlantIdentificationDTO> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<PlantIdentificationDTO>(`${this.apiUrl}/plant-id/verify`, formData);
    }
}
