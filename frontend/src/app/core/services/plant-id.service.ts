import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface PlantNetSpecies {
    scientificNameWithoutAuthor: string;
    commonNames: string[];
}

export interface PlantNetResult {
    score: number;
    species: PlantNetSpecies;
}

@Injectable({
    providedIn: 'root'
})
export class PlantIdService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/api/v1'; // Hardcoded to fix build error

    verify(file: File): Observable<PlantNetResult[]> {
        const formData = new FormData();
        formData.append('file', file);

        // Call the backend proxy endpoint
        return this.http.post<PlantNetResult[]>(`${this.apiUrl}/plant-id/verify`, formData);
    }
}
