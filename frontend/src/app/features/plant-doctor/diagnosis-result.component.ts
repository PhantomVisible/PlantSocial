import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagnosisDTO } from './plant-doctor.model';
import { PlantService } from '../garden/plant.service';

@Component({
  selector: 'app-diagnosis-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="diagnosis-result">
      <!-- Header -->
      <div class="result-header" [class.healthy]="isHealthy">
        <i class="pi" [ngClass]="isHealthy ? 'pi-check-circle' : 'pi-exclamation-triangle'"></i>
        <div class="header-text">
          <h2 *ngIf="isHealthy">Healthy Plant!</h2>
          <h2 *ngIf="!isHealthy">{{ diagnosis.diseaseName }}</h2>
        </div>
      </div>

      <div class="result-body">
        
        <!-- Healthy Message -->
        <p *ngIf="isHealthy" class="healthy-msg">
          Your plant looks great! No signs of disease or pests found. Keep up the good work!
        </p>

        <!-- Confidence Bar -->
        <div class="confidence-section">
          <div class="confidence-header">
            <span>Confidence</span>
            <strong>{{ diagnosis.confidence || 0 }}%</strong>
          </div>
          <div class="confidence-bar">
            <div class="bar-fill" [style.width.%]="diagnosis.confidence || 0" [class.healthy]="isHealthy"></div>
          </div>
        </div>

        <!-- Treatment Steps (if sick) -->
        <div *ngIf="!isHealthy && diagnosis.treatmentSteps?.length" class="treatment-section">
          <h3>Treatment Plan</h3>
          <ul class="treatment-list">
            <li *ngFor="let step of diagnosis.treatmentSteps">
              <span class="bullet">•</span>
              <span>{{ step }}</span>
            </li>
          </ul>
        </div>

        <!-- Actions -->
        <div class="actions">
            <!-- Save to History (Only if plant context exists) -->
            <button 
                *ngIf="plantContext && !saved()" 
                class="action-btn save-btn" 
                (click)="onSave()"
                [disabled]="saving()"
            >
                <i class="pi" [class.pi-spin]="saving()" [class.pi-spinner]="saving()" [class.pi-history]="!saving()"></i>
                <span>{{ saving() ? 'Saving...' : 'Save to Plant History' }}</span>
            </button>
            
            <button 
                class="action-btn share-btn" 
                (click)="share.emit()"
            >
                <i class="pi pi-users"></i>
                <span>Ask Community</span>
            </button>
            
            <div *ngIf="saved()" class="saved-badge">
                <i class="pi pi-check"></i> Saved to History
            </div>

            <div class="secondary-actions">
                <button class="action-btn text-btn" (click)="reset.emit()">
                    Analyze Another
                </button>
                <button 
                    class="action-btn primary-btn" 
                    (click)="insert.emit()"
                    *ngIf="isPostMode"
                >
                    Insert Diagnosis
                </button>
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .diagnosis-result {
      display: flex; flex-direction: column; gap: 0;
      animation: fadeIn 0.3s ease;
    }

    .result-header {
      background: #FEF2F2; color: #DC2626;
      padding: 20px; display: flex; align-items: center; gap: 16px;
      border-radius: 12px 12px 0 0;
    }
    .result-header.healthy {
      background: #ECFDF5; color: #059669;
    }
    .result-header i { font-size: 2rem; }
    .result-header h2 { margin: 0; font-size: 1.4rem; font-weight: 700; }

    .result-body {
      padding: 20px;
      display: flex; flex-direction: column; gap: 20px;
    }

    .healthy-msg {
        font-size: 1rem; color: var(--trellis-text); line-height: 1.5; margin: 0;
    }

    .confidence-section {
        display: flex; flex-direction: column; gap: 6px;
    }
    .confidence-header {
        display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--trellis-text-secondary);
    }
    .confidence-bar {
        height: 8px; background: var(--trellis-border-light); border-radius: 4px; overflow: hidden;
    }
    .bar-fill {
        height: 100%; background: #DC2626; border-radius: 4px; transition: width 0.5s ease;
    }
    .bar-fill.healthy { background: #059669; }

    .treatment-section h3 {
        margin: 0 0 10px 0; font-size: 1rem; color: var(--trellis-text); font-weight: 700;
    }
    .treatment-list {
        list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px;
    }
    .treatment-list li {
        display: flex; gap: 10px; align-items: flex-start; font-size: 0.95rem; color: var(--trellis-text); line-height: 1.4;
    }
    .treatment-list .bullet {
        color: var(--trellis-green); font-weight: bold; font-size: 1.2rem; line-height: 1rem;
    }

    .actions {
        display: flex; flex-direction: column; gap: 12px; margin-top: 10px;
    }
    .action-btn {
        width: 100%; padding: 12px; border: none; border-radius: 8px;
        font-weight: 600; font-size: 0.95rem; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        transition: all 0.2s;
    }
    
    .save-btn {
        background: var(--trellis-bg); color: var(--trellis-text); border: 1px solid var(--trellis-border-light);
    }
    .save-btn:hover:not(:disabled) {
        background: var(--trellis-border-light);
    }
    .save-btn:disabled { opacity: 0.7; cursor: not-allowed; }

    .share-btn {
        background: var(--trellis-white); color: var(--trellis-green-dark); border: 2px solid var(--trellis-green-ghost);
    }
    .share-btn:hover {
        background: var(--trellis-green-ghost);
    }

    .saved-badge {
        background: var(--trellis-green-ghost); color: var(--trellis-green-dark);
        padding: 10px; border-radius: 8px; text-align: center; font-weight: 600;
        display: flex; align-items: center; justify-content: center; gap: 8px;
    }

    .secondary-actions {
        display: flex; gap: 10px;
    }
    .primary-btn {
        background: var(--trellis-green); color: white; flex: 1;
    }
    .primary-btn:hover { background: var(--trellis-green-dark); }
    
    .text-btn {
        background: var(--trellis-green); color: white; flex: 1; opacity: 0.9;
    }
    .text-btn:hover { opacity: 1; }

    .action-btn {
        width: 100%; padding: 12px; border: none; border-radius: 8px;
        font-weight: 600; font-size: 0.95rem; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        transition: all 0.2s;
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DiagnosisResultComponent {
  @Input({ required: true }) diagnosis!: DiagnosisDTO;
  @Input() plantContext: any = null; // PlantData
  @Input() isPostMode = false;

  @Output() save = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() insert = new EventEmitter<void>(); // For post mode

  private plantService = inject(PlantService);
  saving = signal(false);
  saved = signal(false);

  get isHealthy() {
    return this.diagnosis.status === 'Healthy';
  }

  onSave() {
    if (!this.plantContext || this.saved()) return;

    this.saving.set(true);
    const notes = `Diagnosed as ${this.diagnosis.diseaseName} (${this.diagnosis.confidence}%)\n\nTreatment:\n${(this.diagnosis.treatmentSteps || []).join('\n')}`;

    // Create a log
    // Note: We might want to save the image too, but for now we just save the diagnosis text to logs
    // If the image was a blob from the gallery, we might not have it as a file easily here without passing it down.
    // For now, let's just save the text note.

    this.plantService.addLog(
      this.plantContext.id,
      notes,
      new Date().toISOString().split('T')[0]
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        this.save.emit();
      },
      error: (err) => {
        console.error('Failed to save log', err);
        this.saving.set(false);
      }
    });
  }
}
