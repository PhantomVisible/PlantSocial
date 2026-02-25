import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VirtualPlant {
    id: number;
    userId: number;
    name: string;
    hydration: number;
    cleanliness: number;
    stage: string;
    createdAt?: string;
    updatedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class VirtualPlantService {
    private apiUrl = environment.gamificationApiUrl;

    constructor(private http: HttpClient) { }

    getMyPlant(userId: number): Observable<VirtualPlant> {
        return this.http.get<VirtualPlant>(`${this.apiUrl}/plant/${userId}`);
    }

    waterPlant(plantId: number): Observable<VirtualPlant> {
        return this.http.post<VirtualPlant>(`${this.apiUrl}/plant/${plantId}/water`, {});
    }

    cleanPlant(plantId: number): Observable<VirtualPlant> {
        return this.http.post<VirtualPlant>(`${this.apiUrl}/plant/${plantId}/clean`, {});
    }
}
