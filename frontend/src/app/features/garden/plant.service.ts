import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PlantData {
    id: string;
    nickname: string;
    species: string;
    imageUrl: string | null;
    status: 'ALIVE' | 'HARVESTED' | 'DIED';
    ownerId: string;
    ownerName: string;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class PlantService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:8080/api/v1/plants';

    addPlant(nickname: string, species: string, image?: File): Observable<PlantData> {
        const formData = new FormData();
        formData.append('nickname', nickname);
        if (species) formData.append('species', species);
        if (image) formData.append('image', image);
        return this.http.post<PlantData>(this.baseUrl, formData);
    }

    getUserPlants(userId: string): Observable<PlantData[]> {
        return this.http.get<PlantData[]>(`${this.baseUrl}/user/${userId}`);
    }

    getPlant(plantId: string): Observable<PlantData> {
        return this.http.get<PlantData>(`${this.baseUrl}/${plantId}`);
    }
}
