import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantService, PlantData, PlantLog } from './plant.service';
import { Router } from '@angular/router';
import { AuthGatekeeperService } from '../../auth/auth-gatekeeper.service';
import { AuthService } from '../../auth/auth.service';
import { AddLogDialogComponent } from './add-log-dialog.component';

@Component({
  selector: 'app-plant-details-dialog',
  standalone: true,
  imports: [CommonModule, AddLogDialogComponent],
  template: `
    <div class="dialog-overlay" (click)="close.emit()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <!-- Close Button -->
        <button class="dialog__close" (click)="close.emit()">&times;</button>

        <!-- Loading -->
        <div *ngIf="loading()" class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
        </div>

        <ng-container *ngIf="!loading() && plant()">
            <!-- Tabs -->
            <div class="dialog-tabs">
                <button 
                    class="tab-btn" 
                    [class.active]="activeTab() === 'overview'"
                    (click)="activeTab.set('overview')"
                >Overview</button>
                <button 
                    class="tab-btn" 
                    [class.active]="activeTab() === 'journal'"
                    (click)="activeTab.set('journal')"
                >Journal 📖</button>
            </div>

            <!-- Content: Overview -->
            <div *ngIf="activeTab() === 'overview'" class="dialog__content animate-fade">
              <!-- Hero Image -->
              <div class="hero-image" [style.backgroundImage]="'url(' + resolveUrl(plant()!.imageUrl) + ')'">
                <div class="hero-overlay"></div>
                
                <!-- Change Photo Button (Owner Only) -->
                <button *ngIf="isOwner()" class="change-photo-btn" (click)="fileInput.click()" title="Change Cover Photo">
                     <i class="pi pi-camera"></i>
                </button>
                <input #fileInput type="file" accept="image/*" style="display: none" (change)="onCoverPhotoSelected($event)">

                <div class="status-badge" [class]="'status--' + plant()!.status.toLowerCase()">
                  {{ plant()!.status }}
                </div>
              </div>

              <!-- Body -->
              <div class="dialog__body">
                <h2 class="plant-name">{{ plant()!.nickname }}</h2>
                <p class="plant-species">{{ plant()!.species }}</p>

                <div class="meta-row">
                  <div class="meta-item">
                    <span class="label">Planted</span>
                    <span class="value">{{ formatDate(plant()!.plantedDate || plant()!.createdAt) }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="label">Owner</span>
                    <a class="owner-link" (click)="visitOwner()">&#64;{{ plant()!.ownerName || 'Unknown' }}</a>
                  </div>
                </div>

                <!-- Actions -->
                <div class="dialog__actions">
                  <button class="btn btn--primary" (click)="visitOwner()">
                    View Garden
                  </button>
                </div>
              </div>
            </div>

            <!-- Content: Journal -->
            <div *ngIf="activeTab() === 'journal'" class="dialog__content animate-fade">
                <div class="journal-header">
                    <h3>Growth Timeline</h3>
                    <button *ngIf="isOwner()" class="btn-add" (click)="showAddLogDialog.set(true)">
                        <i class="pi pi-plus"></i> Add Log
                    </button>
                </div>

                <div class="journal-body">
                    <div *ngIf="logs().length === 0" class="empty-logs">
                        <p>No journal entries yet.</p>
                        <span *ngIf="isOwner()">Document the first sprout! 🌱</span>
                    </div>

                    <div class="timeline">
                        <div class="timeline-item" *ngFor="let log of logs()">
                            <div class="timeline-date">
                                <span>{{ formatDate(log.logDate) }}</span>
                            </div>
                            <div class="timeline-content">
                                <div class="timeline-photo" *ngIf="log.imageUrl">
                                    <img [src]="resolveUrl(log.imageUrl)" loading="lazy">
                                </div>

                                <p class="timeline-notes" *ngIf="log.notes">{{ log.notes }}</p>
                                
                                <!-- Log Actions (Owner Only) -->
                                <div *ngIf="isOwner()" class="log-actions">
                                    <button class="log-action-btn" (click)="editLog(log)" title="Edit Notes">
                                        <i class="pi pi-pencil"></i>
                                    </button>
                                    <button class="log-action-btn delete" (click)="deleteLog(log.id)" title="Delete Entry">
                                        <i class="pi pi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ng-container>

        <!-- Error -->
        <div *ngIf="!loading() && !plant()" class="error-state">
          <p>Plant not found 🌱</p>
        </div>
      </div>
      
      <app-add-log-dialog 
        *ngIf="showAddLogDialog()"
        (close)="showAddLogDialog.set(false)"
        (save)="onSaveLog($event)"
      ></app-add-log-dialog>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      animation: fade-in 0.2s ease;
    }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

    .dialog {
      background: var(--trellis-white);
      width: 90%; max-width: 400px;
      border-radius: 24px;
      overflow: hidden;
      position: relative;
      box-shadow: 0 24px 64px rgba(0,0,0,0.25);
      animation: slide-up 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .dialog__close {
      position: absolute; top: 16px; right: 16px;
      width: 36px; height: 36px;
      border-radius: 50%;
      background: rgba(0,0,0,0.3);
      border: none;
      color: #fff;
      font-size: 1.5rem;
      cursor: pointer;
      z-index: 10;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    .dialog__close:hover { background: rgba(0,0,0,0.5); }

    .loading-state, .error-state {
      padding: 60px; text-align: center;
      color: var(--trellis-text-secondary);
    }
    .error-state p { font-size: 1.1rem; font-weight: 600; }

    /* Hero */
    .hero-image {
      height: 240px;
      background-size: cover;
      background-position: center;
      position: relative;
      background-color: var(--trellis-green-pale); /* Fallback */
    }

    .change-photo-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(0,0,0,0.5);
        border: none;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        backdrop-filter: blur(4px);
        transition: background 0.2s;
        z-index: 10;
    }
    .change-photo-btn:hover {
        background: rgba(0,0,0,0.7);
    }
    .hero-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.1), transparent 60%, rgba(0,0,0,0.05));
    }
    .status-badge {
      position: absolute; bottom: 16px; left: 16px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      background: #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .status--seed { color: #795548; }
    .status--germinated { color: #8D6E63; }
    .status--vegetative { color: #2E7D32; }
    .status--flowering { color: #E91E63; }
    .status--fruiting { color: #E65100; }
    .status--harvested { color: #D84315; }
    .status--dead { color: #757575; }
    .status--alive { color: #2E7D32; }

    /* Body */
    .dialog__body { padding: 24px; }
    .plant-name {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--trellis-text);
      line-height: 1.1;
    }
    .plant-species {
      margin: 4px 0 20px;
      font-size: 1rem;
      color: var(--trellis-text-secondary);
      font-style: italic;
    }

    .meta-row {
      display: flex; gap: 24px;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--trellis-border-light);
    }
    .meta-item { display: flex; flex-direction: column; gap: 4px; }
    .label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--trellis-text-hint);
      letter-spacing: 0.5px;
    }
    .value { font-size: 0.95rem; color: var(--trellis-text); font-weight: 500; }
    .owner-link {
        color: var(--trellis-green-dark);
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
    }
    .owner-link:hover { text-decoration: underline; }

    /* Actions */
    .dialog__actions { display: flex; justify-content: flex-end; }
    .btn {
      padding: 10px 24px;
      border-radius: 24px;
      border: none;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      font-size: 0.9rem;
      transition: transform 0.1s;
    }
    .btn:active { transform: scale(0.96); }
    .btn--primary {
      background: var(--trellis-text);
      color: #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .btn--primary:hover { background: #000; }

    /* Tabs */
    .dialog-tabs {
        display: flex; border-bottom: 1px solid var(--surface-border);
        background: var(--surface-ground);
        margin-top: 50px; /* Space for close button */
    }
    .tab-btn {
        flex: 1; padding: 14px; border: none; background: none;
        font-family: 'Inter'; font-weight: 600; color: var(--text-color-secondary); cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
    }
    .tab-btn.active { color: var(--primary-color); border-bottom-color: var(--primary-color); background: var(--surface-card); }
    
    /* Journal Styles */
    .journal-header {
        padding: 16px 24px; display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid var(--surface-border);
    }
    .journal-header h3 { margin: 0; font-size: 1rem; color: var(--text-color); }
    .btn-add {
        background: var(--primary-color); color: #fff; border: none; padding: 6px 12px;
        border-radius: 20px; font-weight: 600; cursor: pointer; font-size: 0.8rem;
        display: flex; align-items: center; gap: 4px;
    }
    .btn-add:hover { background: var(--primary-hover); }
    
    .journal-body { padding: 0 24px 24px; max-height: 400px; overflow-y: auto; }
    .empty-logs { text-align: center; padding: 40px; color: var(--text-color-secondary); }

    /* Timeline */
    .timeline { padding-top: 20px; border-left: 2px solid var(--surface-border); margin-left: 10px; }
    .timeline-item { position: relative; padding-left: 24px; margin-bottom: 24px; }
    .timeline-item::before {
        content: ''; position: absolute; left: -5px; top: 6px;
        width: 8px; height: 8px; background: var(--primary-color); border-radius: 50%;
    }
    .timeline-date { font-size: 0.75rem; color: var(--text-color-secondary); margin-bottom: 6px; font-weight: 600; }
    .timeline-content { background: var(--surface-ground); padding: 12px; border-radius: 12px; }
    .timeline-photo { width: 100%; margin-bottom: 8px; border-radius: 8px; overflow: hidden; }
    .timeline-photo img { width: 100%; display: block; }
    .timeline-notes { margin: 0; font-size: 0.9rem; color: var(--text-color); line-height: 1.4; white-space: pre-wrap; }
    
    .log-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
        justify-content: flex-end;
    }
    .log-action-btn {
        background: transparent;
        border: none;
        color: var(--trellis-text-hint);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: color 0.2s, background 0.2s;
    }
    .log-action-btn:hover {
        background: var(--trellis-bg);
        color: var(--trellis-text);
    }
    .log-action-btn.delete:hover {
        color: #ef4444;
        background: #fee2e2;
    }

    .animate-fade { animation: fade-in 0.2s ease; }
  `]
})
export class PlantDetailsDialogComponent implements OnInit {
  @Input({ required: true }) plantId!: string;
  @Output() close = new EventEmitter<void>();

  private plantService = inject(PlantService);
  private router = inject(Router);
  private gatekeeper = inject(AuthGatekeeperService);
  private authService = inject(AuthService);

  plant = signal<PlantData | null>(null);
  logs = signal<PlantLog[]>([]);
  loading = signal(true);
  activeTab = signal<'overview' | 'journal'>('overview');
  showAddLogDialog = signal(false);

  ngOnInit() {
    this.plantService.getPlant(this.plantId).subscribe({
      next: (data) => {
        this.plant.set(data);
        this.loading.set(false);
        this.loadLogs();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadLogs() {
    if (this.plantId) {
      this.plantService.getLogs(this.plantId).subscribe({
        next: (logs) => this.logs.set(logs)
      });
    }
  }

  isOwner(): boolean {
    const p = this.plant();
    const u = this.authService.currentUser();
    return !!p && !!u && p.ownerId === u.id;
  }

  onSaveLog(data: { notes: string; logDate: string; image?: File }) {
    this.plantService.addLog(this.plantId, data.notes, data.logDate, data.image).subscribe({
      next: () => {
        this.showAddLogDialog.set(false);
        this.loadLogs();
      }
    });
  }

  onCoverPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.plantService.updateCoverPhoto(this.plantId, file).subscribe(updatedPlant => {
        this.plant.set(updatedPlant);
      });
    }
  }

  deleteLog(logId: string) {
    if (confirm('Are you sure you want to delete this log entry?')) {
      this.plantService.deleteLog(logId).subscribe(() => {
        this.logs.update(current => current.filter(l => l.id !== logId));
      });
    }
  }

  editLog(log: PlantLog) {
    const newNotes = prompt('Edit note:', log.notes);
    if (newNotes !== null && newNotes !== log.notes) {
      this.plantService.updateLog(log.id, newNotes).subscribe(updated => {
        this.logs.update(current => current.map(l => l.id === updated.id ? updated : l));
      });
    }
  }

  resolveUrl(url: string | null): string {
    if (!url) return 'assets/placeholder-plant.jpg'; // Fallback
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  visitOwner() {
    const p = this.plant();
    if (p) {
      this.close.emit();
      this.gatekeeper.run(() => {
        this.router.navigate(['/profile', p.ownerId]);
      });
    }
  }
}
