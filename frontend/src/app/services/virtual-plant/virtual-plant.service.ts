import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VirtualPlant {
    id: number;
    userId: number;
    name: string;
    species: string;
    hydration: number;
    cleanliness: number;
    stage: string;
    daysAlive: number;
    lastWatered?: string;
    lastCleaned?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface VirtualPlantResponse {
    plant: VirtualPlant;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class VirtualPlantService {
    private apiUrl = environment.gamificationApiUrl;

    constructor(private http: HttpClient) { }

    getMyPlants(userId: number): Observable<VirtualPlant[]> {
        return this.http.get<VirtualPlant[]>(`${this.apiUrl}/plant/${userId}`);
    }

    plantSeed(userId: number, species: string): Observable<VirtualPlantResponse> {
        return this.http.post<VirtualPlantResponse>(`${this.apiUrl}/plant/${userId}?species=${species}`, {});
    }

    waterPlant(plantId: number): Observable<VirtualPlantResponse> {
        return this.http.post<VirtualPlantResponse>(`${this.apiUrl}/plant/${plantId}/water`, {});
    }

    cleanPlant(plantId: number): Observable<VirtualPlantResponse> {
        return this.http.post<VirtualPlantResponse>(`${this.apiUrl}/plant/${plantId}/clean`, {});
    }

    deletePlant(plantId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/plant/${plantId}`);
    }
}
