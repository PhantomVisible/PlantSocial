import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  authorName: string;
  createdAt: string;
  likesCount: number;
  likedByCurrentUser: boolean;
}

export interface CreatePostRequest {
  content: string;
  imageUrl?: string;
}

export interface CommentRequest {
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/feed';

  getFeed(page: number = 0, size: number = 10): Observable<{ content: Post[] }> {
    return this.http.get<{ content: Post[] }>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  createPost(request: CreatePostRequest): Observable<Post> {
    return this.http.post<Post>(this.apiUrl, request);
  }

  likePost(postId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${postId}/like`, {});
  }

  commentOnPost(postId: string, request: CommentRequest): Observable<void> {
      return this.http.post<void>(`${this.apiUrl}/${postId}/comment`, request);
  }
}
