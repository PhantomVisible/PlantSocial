import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CommentData {
    id: string;
    content: string;
    authorName: string;
    authorId: string;
    createdAt: string;
    replyCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class CommentService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:8080/api/v1';

    getComments(postId: string): Observable<CommentData[]> {
        return this.http.get<CommentData[]>(`${this.baseUrl}/feed/${postId}/comments`);
    }

    addComment(postId: string, content: string): Observable<CommentData> {
        return this.http.post<CommentData>(`${this.baseUrl}/feed/${postId}/comments`, { content });
    }

    getReplies(commentId: string): Observable<CommentData[]> {
        return this.http.get<CommentData[]>(`${this.baseUrl}/comments/${commentId}/replies`);
    }

    addReply(commentId: string, content: string): Observable<CommentData> {
        return this.http.post<CommentData>(`${this.baseUrl}/comments/${commentId}/replies`, { content });
    }
}
