import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NewsArticle {
    title: string;
    sourceName: string;
    url: string;
    urlToImage: string;
    publishedAt: string;
    description: string;
}

@Injectable({
    providedIn: 'root'
})
export class NewsService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/news`;

    getTrendingNews(): Observable<NewsArticle[]> {
        return this.http.get<NewsArticle[]>(`${this.apiUrl}/trending`);
    }
}
