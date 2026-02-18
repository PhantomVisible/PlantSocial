import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PlantData {
    id: string;
    nickname: string;
    species: string;
    imageUrl: string | null;
    status: 'SEED' | 'GERMINATED' | 'VEGETATIVE' | 'FLOWERING' | 'FRUITING' | 'HARVESTED' | 'DEAD' | 'ALIVE';
    ownerId: string;
    ownerName: string;
    plantedDate: string;
    harvestDate?: string;
    isVerified: boolean;
    createdAt: string;
}

export interface PlantLog {
    id: string;
    imageUrl: string | null;
    notes: string;
    logDate: string;
}

@Injectable({
    providedIn: 'root'
})
export class PlantService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:8080/api/v1/plants';

    addPlant(nickname: string, species: string, status: string, plantedDate: string, isVerified: boolean, image?: File): Observable<PlantData> {
        const formData = new FormData();
        formData.append('nickname', nickname);
        if (species) formData.append('species', species);
        if (status) formData.append('status', status);
        if (plantedDate) formData.append('plantedDate', plantedDate);
        formData.append('isVerified', String(isVerified));
        if (image) formData.append('image', image);
        return this.http.post<PlantData>(this.baseUrl, formData);
    }

    getUserPlants(userId: string): Observable<PlantData[]> {
        return this.http.get<PlantData[]>(`${this.baseUrl}/user/${userId}`);
    }

    getPlant(plantId: string): Observable<PlantData> {
        return this.http.get<PlantData>(`${this.baseUrl}/${plantId}`);
    }
    updatePlant(id: string, nickname: string, species: string, status: string, plantedDate: string, harvestDate?: string, image?: File): Observable<PlantData> {
        const formData = new FormData();
        formData.append('nickname', nickname);
        if (species) formData.append('species', species);
        if (status) formData.append('status', status);
        if (plantedDate) formData.append('plantedDate', plantedDate);
        if (harvestDate) formData.append('harvestDate', harvestDate);
        if (image) formData.append('image', image);

        return this.http.put<PlantData>(`${this.baseUrl}/${id}`, formData);
    }

    deletePlant(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    addLog(plantId: string, notes: string, logDate: string, image?: File): Observable<PlantLog> {
        const formData = new FormData();
        if (notes) formData.append('notes', notes);
        if (logDate) formData.append('logDate', logDate);
        if (image) formData.append('image', image);
        return this.http.post<PlantLog>(`${this.baseUrl}/${plantId}/logs`, formData);
    }

    getLogs(plantId: string): Observable<PlantLog[]> {
        return this.http.get<PlantLog[]>(`${this.baseUrl}/${plantId}/logs`);
    }

    updateCoverPhoto(plantId: string, image: File): Observable<PlantData> {
        const formData = new FormData();
        formData.append('image', image);
        return this.http.put<PlantData>(`${this.baseUrl}/${plantId}/photo`, formData);
    }

    deleteLog(logId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/logs/${logId}`);
    }

    updateLog(logId: string, notes: string): Observable<PlantLog> {
        return this.http.put<PlantLog>(`${this.baseUrl}/logs/${logId}`, { notes });
    }
}
