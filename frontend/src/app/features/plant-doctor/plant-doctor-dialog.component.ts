import { Component, inject, signal, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantDoctorService } from './plant-doctor.service';
import { PlantService } from '../garden/plant.service';
import { DiagnosisDTO } from './plant-doctor.model';
import { HttpClientModule } from '@angular/common/http';
import { DiagnosisResultComponent } from './diagnosis-result.component';

@Component({
  selector: 'app-plant-doctor-dialog',
  standalone: true,
  imports: [CommonModule, HttpClientModule, DiagnosisResultComponent],
  template: `
    <div class="dialog-overlay" (click)="close.emit()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="dialog-header">
          <div class="header-title">
            <i class="pi pi-heart-fill header-icon"></i>
            <h2>Plant Doctor</h2>
          </div>
          <button class="close-btn" (click)="close.emit()">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="dialog-body">
          
          <!-- Select Mode (Context Aware) -->
          <div *ngIf="view() === 'select' && !diagnosis() && !loading()" class="select-state">
             <h3>Select a photo to analyze:</h3>
             <div class="image-grid">
                <!-- Upload New Option -->
                <div class="grid-item upload-tile" (click)="fileInput.click()">
                    <i class="pi pi-camera"></i>
                    <span>Upload New</span>
                </div>

                <!-- Existing Images -->
                <div 
                    *ngFor="let img of images()" 
                    class="grid-item"
                    (click)="onSelectImage(img.url)"
                >
                    <img [src]="resolveUrl(img.url)" />
                    <div class="img-meta">
                        <span class="img-label">{{ img.label }}</span>
                        <span class="img-date" *ngIf="img.date">{{ img.date }}</span>
                    </div>
                </div>
             </div>
             
             <!-- Hidden input shared -->
              <input 
                #fileInput 
                type="file" 
                hidden 
                accept="image/*" 
                (change)="onFileSelected($event)">
          </div>

          <!-- Upload State (Fallback) -->
          <div *ngIf="view() === 'upload' && !diagnosis() && !loading()" class="upload-state">
            <div 
              class="drop-zone" 
              [class.dragging]="isDragging"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)"
              (click)="fileInput.click()">
              
              <input 
                #fileInput 
                type="file" 
                hidden 
                accept="image/*" 
                (change)="onFileSelected($event)">
              
              <i class="pi pi-images upload-icon"></i>
              <h3>Upload a photo of your sick plant</h3>
              <p>Drag & drop or click to select</p>
            </div>
          </div>

          <!-- Loading State (Skeleton) -->
          <div *ngIf="loading()" class="loading-state">
            <div class="spinner"></div>
            <p>Analyzing your plant's health with Gemini AI...</p>
          </div>

          <!-- Result State -->
          <div *ngIf="diagnosis()" class="result-wrapper">
            <app-diagnosis-result
                [diagnosis]="diagnosis()!"
                [plantContext]="service.context()"
                [isPostMode]="service.mode() === 'post-compose'"
                (reset)="reset()"
                (insert)="useDiagnosis()"
                (share)="onShare()"
            ></app-diagnosis-result>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.15s ease-out;
    }
    .dialog-content {
      background: var(--trellis-white); width: 500px; max-width: 95%;
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      animation: scaleIn 0.2s ease-out;
    }
    .dialog-header {
      padding: 16px 24px; border-bottom: 1px solid var(--trellis-border-light);
      display: flex; align-items: center; justify-content: space-between;
    }
    .header-title { display: flex; align-items: center; gap: 10px; }
    .header-icon { color: var(--trellis-green); font-size: 1.2rem; }
    .dialog-header h2 { margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--trellis-text); }
    .close-btn {
      background: none; border: none; font-size: 1.1rem; color: var(--trellis-text-secondary);
      cursor: pointer; padding: 8px; border-radius: 50%; transition: background 0.15s;
    }
    .close-btn:hover { background: var(--trellis-border-light); color: var(--trellis-text); }

    .dialog-body { padding: 24px; min-height: 300px; display: flex; flex-direction: column; }

    /* Select State */
    .select-state h3 { margin: 0 0 16px 0; font-size: 1rem; color: var(--trellis-text-secondary); }
    .image-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px;
        max-height: 400px; overflow-y: auto;
    }
    .grid-item {
        aspect-ratio: 1; border-radius: 8px; overflow: hidden; position: relative;
        cursor: pointer; border: 2px solid transparent; transition: all 0.2s;
        background: var(--trellis-bg);
    }
    .grid-item:hover { border-color: var(--trellis-green); transform: translateY(-2px); }
    .grid-item img { width: 100%; height: 100%; object-fit: cover; }
    
    .upload-tile {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        border: 2px dashed var(--trellis-border-light); color: var(--trellis-green); gap: 8px;
    }
    .upload-tile i { font-size: 1.5rem; }
    .upload-tile span { font-size: 0.8rem; font-weight: 600; }
    .upload-tile:hover { background: var(--trellis-green-ghost); border-color: var(--trellis-green); }

    .img-meta {
        position: absolute; bottom: 0; left: 0; right: 0;
        background: rgba(0,0,0,0.6); color: white; padding: 4px 6px;
        font-size: 0.7rem; display: flex; flex-direction: column;
    }
    .img-label { font-weight: 600; }

    /* Upload State */
    .drop-zone {
      flex: 1; border: 2px dashed var(--trellis-border-light); border-radius: 12px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; cursor: pointer; transition: all 0.2s; background: var(--trellis-bg);
      padding: 40px; text-align: center;
    }
    .drop-zone:hover, .drop-zone.dragging {
      border-color: var(--trellis-green); background: var(--trellis-green-ghost);
    }
    .upload-icon { font-size: 2.5rem; color: var(--trellis-green); }
    .drop-zone h3 { margin: 0; font-size: 1.1rem; color: var(--trellis-text); }
    .drop-zone p { margin: 0; color: var(--trellis-text-secondary); font-size: 0.9rem; }

    /* Loading State */
    .loading-state {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
    }
    .spinner {
      width: 40px; height: 40px; border: 3px solid var(--trellis-border-light);
      border-top-color: var(--trellis-green); border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .result-wrapper {
        padding: 0; /* Let component handle it */
    }

    .actions {
      display: flex; flex-direction: column; gap: 8px; margin-top: 10px;
    }

    .use-btn {
      width: 100%; padding: 12px; border: none; border-radius: 8px;
      background: var(--trellis-green); color: white; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: all 0.2s;
    }
    .use-btn:hover { background: var(--trellis-green-dark); transform: translateY(-1px); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class PlantDoctorDialogComponent implements OnInit {
  service = inject(PlantDoctorService);
  private plantService = inject(PlantService);

  @Output() close = new EventEmitter<void>();

  diagnosis = signal<DiagnosisDTO | null>(null);
  loading = signal(false);
  isDragging = false;

  // Context-aware properties
  view = signal<'upload' | 'select'>('upload');
  images = signal<{ url: string, label: string, date?: string }[]>([]);

  currentFile: File | Blob | null = null;

  ngOnInit() {
    const ctx = this.service.context();
    if (ctx) {
      this.view.set('select');
      this.loadContextImages(ctx);
    }
  }

  loadContextImages(plant: any) {
    const imgs: { url: string, label: string, date?: string }[] = [];
    // Primary
    if (plant.imageUrl) {
      imgs.push({ url: plant.imageUrl, label: 'Current Photo', date: 'Now' });
    }

    // Logs
    this.plantService.getLogs(plant.id).subscribe(logs => {
      logs.forEach(log => {
        if (log.imageUrl) {
          imgs.push({ url: log.imageUrl, label: 'Journal Entry', date: new Date(log.logDate).toLocaleDateString() });
        }
      });
      // Sort by date desc (if I had full dates, here mostly rely on order)
      this.images.set(imgs);
    });
  }

  onSelectImage(url: string) {
    this.loading.set(true);
    // Resolve URL (handle localhost)
    const fullUrl = url.startsWith('http') ? url : `http://localhost:8080${url}`;

    this.service.fetchImageAsBlob(fullUrl).subscribe({
      next: (blob) => {
        this.analyze(blob);
      },
      error: (err) => {
        console.error('Failed to fetch image', err);
        this.loading.set(false);
      }
    });
  }

  resolveUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.analyze(file);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.analyze(input.files[0]);
    }
  }

  analyze(file: File | Blob) {
    this.currentFile = file;
    this.loading.set(true);
    this.service.diagnose(file).subscribe({
      next: (result) => {
        this.diagnosis.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        // Could show error state here
      }
    });
  }

  useDiagnosis() {
    const d = this.diagnosis();
    if (!d) return;

    const text = `🚨 **Plant Doctor Diagnosis** 🚨\n\n**Status:** ${d.status}\n**Problem:** ${d.diseaseName} (${d.confidence}% Confidence)\n\n**Rx Treatment:**\n${(d.treatmentSteps || []).map(s => `- ${s}`).join('\n')}`;

    this.service.diagnosisResult.next(text);
    this.service.close();
  }

  onShare() {
    const d = this.diagnosis();
    if (!d || !this.currentFile) return;

    const plantName = this.service.context()?.nickname || 'Plant';
    const content = `My ${plantName} has been diagnosed with **${d.diseaseName}** (${d.confidence}%). 🩺\n\n**The Doctor suggests:**\n${(d.treatmentSteps || []).map(s => `• ${s}`).join('\n')}\n\nHas anyone dealt with this before? Any tips?`;

    this.service.shareDiagnosis({
      content: content,
      imageBlob: this.currentFile,
      plantId: this.service.context()?.id,
      plantTag: this.service.context()?.species // Auto-tag species
    });
  }

  reset() {
    this.diagnosis.set(null);
    this.currentFile = null;
    // Return to select mode if context exists
    if (this.service.context()) {
      this.view.set('select');
    } else {
      this.view.set('upload');
    }
  }
}
