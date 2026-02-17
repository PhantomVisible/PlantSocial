import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    private apiUrl = 'http://localhost:8080/api/v1/news';

    getTrendingNews(): Observable<NewsArticle[]> {
        return this.http.get<NewsArticle[]>(`${this.apiUrl}/trending`);
    }
}
