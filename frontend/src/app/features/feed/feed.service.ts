import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  likesCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
  plantId?: string;
  plantNickname?: string;
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

  createPost(caption: string, file?: File, plantId?: string): Observable<Post> {
    const formData = new FormData();
    formData.append('caption', caption);
    if (file) {
      formData.append('file', file);
    }
    if (plantId) {
      formData.append('plantId', plantId);
    }
    return this.http.post<Post>(this.apiUrl, formData);
  }

  editPost(postId: string, caption: string): Observable<Post> {
    const formData = new FormData();
    formData.append('caption', caption);
    return this.http.put<Post>(`${this.apiUrl}/${postId}`, formData);
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${postId}`);
  }

  likePost(postId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${postId}/like`, {});
  }

  commentOnPost(postId: string, request: CommentRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${postId}/comment`, request);
  }
}
