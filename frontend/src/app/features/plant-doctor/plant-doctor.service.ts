import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { DiagnosisDTO } from './plant-doctor.model';

@Injectable({
    providedIn: 'root'
})
export class PlantDoctorService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/api/v1/plant-doctor/diagnose';

    isOpen = signal(false);
    mode = signal<'standalone' | 'post-compose'>('standalone');
    context = signal<any | null>(null); // PlantData
    diagnosisResult = new Subject<string>();

    // Draft state for sharing to feed
    shareDraft = signal<{
        content: string;
        imageBlob?: Blob | File;
        plantId?: string;
        plantTag?: string;
    } | null>(null);

    private router = inject(Router); // Need to import Router

    open(mode: 'standalone' | 'post-compose' = 'standalone', plantContext: any = null) {
        this.mode.set(mode);
        this.context.set(plantContext);
        this.isOpen.set(true);
    }

    close() {
        this.isOpen.set(false);
        this.context.set(null);
    }

    shareDiagnosis(data: { content: string, imageBlob?: Blob | File, plantId?: string, plantTag?: string }) {
        this.shareDraft.set(data);
        this.close();
        this.router.navigate(['/feed']);
    }

    diagnose(file: File | Blob): Observable<DiagnosisDTO> {
        const formData = new FormData();
        formData.append('image', file);
        return this.http.post<DiagnosisDTO>(this.apiUrl, formData);
    }

    fetchImageAsBlob(url: string): Observable<Blob> {
        return this.http.get(url, { responseType: 'blob' });
    }
}
