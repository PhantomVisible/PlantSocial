import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface CommentData {
    id: string;
    content: string;
    authorName: string;
    authorId: string;
    createdAt: string;
    replyCount: number;
    authorProfilePictureUrl?: string;
    authorSubscriptionTier?: string;
    likeCount: number;
    likedByCurrentUser: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class CommentService {
    private http = inject(HttpClient);
    private baseUrl = environment.apiUrl;

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

    likeComment(commentId: string): Observable<CommentData> {
        return this.http.post<CommentData>(`${this.baseUrl}/comments/${commentId}/like`, {});
    }

    unlikeComment(commentId: string): Observable<CommentData> {
        return this.http.delete<CommentData>(`${this.baseUrl}/comments/${commentId}/like`);
    }

    reportComment(commentId: string, reason: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/comments/${commentId}/report`, { reason });
    }
}
