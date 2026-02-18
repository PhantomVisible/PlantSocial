import { Component, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlantService, PlantData } from '../garden/plant.service';
import { AuthService } from '../../auth/auth.service';
import { WikipediaService } from '../../shared/wikipedia.service';

@Component({
  selector: 'app-post-composer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="composer">
      <div class="composer__avatar">
        <i class="pi pi-user"></i>
      </div>
      <div class="composer__body">
        <!-- Text Area -->
        <textarea
          class="composer__input"
          [(ngModel)]="content"
          placeholder="What's growing on?"
          rows="2"
          (input)="autoResize($event)"
        ></textarea>

        <!-- Image Preview -->
        <div *ngIf="previewUrl" class="composer__preview">
          <img [src]="previewUrl" alt="Attached image" />
          <button class="preview-remove" (click)="removeFile()">&times;</button>
        </div>

        <!-- Plant Tag Autocomplete -->
        <div class="composer__tag-row">
          <input
            class="composer__tag-input"
            [(ngModel)]="plantTag"
            placeholder="🌿 Tag a plant (e.g., Tomato)..."
            maxlength="40"
            (input)="onTagSearch()"
            (focus)="tagFocused = true"
            (blur)="onTagBlur()"
            autocomplete="off"
          />
          <i *ngIf="validatingTag()" class="pi pi-spin pi-spinner tag-spinner"></i>
          <div *ngIf="tagSuggestions().length > 0 && tagFocused" class="tag-suggestions">
            <button
              *ngFor="let s of tagSuggestions()"
              class="tag-suggestion-item"
              (mousedown)="selectTag(s)"
            >
              🌿 {{ s }}
            </button>
          </div>
        </div>

        <div class="composer__toolbar">
          <div class="composer__icons">
            <button class="icon-btn" title="Add image" (click)="fileInput.click()">
              <i class="pi pi-image"></i>
            </button>
            <button class="icon-btn" title="Add location">
              <i class="pi pi-map-marker"></i>
            </button>
            
            <!-- Plant Selector Dropdown Trigger -->
            <div class="plant-select-wrap">
              <button 
                class="icon-btn" 
                [class.active]="selectedPlantId()" 
                title="Tag your plant"
                (click)="togglePlantDropdown()"
              >
                <i class="pi pi-ticket"></i>
              </button>
              
              <!-- Plant Dropdown -->
              <div *ngIf="showPlantDropdown()" class="plant-dropdown">
                <div class="plant-dropdown__header">Tag your plant</div>
                <div 
                    class="plant-option" 
                    [class.selected]="!selectedPlantId()"
                    (click)="selectPlant(null)"
                >
                    <span class="plant-emoji">❌</span>
                    <span>No tag</span>
                </div>
                <div 
                    *ngFor="let plant of myPlants()" 
                    class="plant-option"
                    [class.selected]="selectedPlantId() === plant.id"
                    (click)="selectPlant(plant)"
                >
                    <img *ngIf="plant.imageUrl" [src]="resolveUrl(plant.imageUrl)" class="plant-thumb" />
                    <span *ngIf="!plant.imageUrl" class="plant-emoji">🌱</span>
                    <span class="plant-name">{{ plant.nickname }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="composer__actions">
             <span *ngIf="selectedPlantNickname()" class="plant-tag-badge">
                🌿 {{ selectedPlantNickname() }}
                <button (click)="selectPlant(null)">&times;</button>
             </span>
             
             <button
                class="composer__post-btn"
                [disabled]="!content.trim()"
                (click)="submitPost()"
              >
                Post
              </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      #fileInput
      type="file"
      accept="image/*"
      (change)="onFileSelected($event)"
      style="display: none"
    />
    
    <!-- Backdrop for dropdown -->
    <div *ngIf="showPlantDropdown()" class="dropdown-backdrop" (click)="showPlantDropdown.set(false)"></div>

    <!-- Tag Toast -->
    <div *ngIf="tagToast" class="tag-toast" (click)="tagToast = null">
      {{ tagToast }}
    </div>
  `,
  styles: [`
    .composer {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      background: var(--trellis-white);
      border-bottom: 1px solid var(--trellis-border-light);
    }

    .composer__avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: var(--trellis-green-pale);
      color: var(--trellis-green-dark);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .composer__body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .composer__input {
      width: 100%;
      border: none;
      outline: none;
      resize: none;
      font-family: 'Inter', sans-serif;
      font-size: 1.05rem;
      line-height: 1.5;
      color: var(--trellis-text);
      background: transparent;
      padding: 8px 0;
      min-height: 52px;
    }

    .composer__input::placeholder {
      color: var(--trellis-text-hint);
    }

    /* Image Preview */
    .composer__preview {
      position: relative;
      border-radius: var(--trellis-radius-lg);
      overflow: hidden;
      border: 1px solid var(--trellis-border-light);
      max-height: 200px;
    }

    .composer__preview img {
      width: 100%;
      display: block;
      object-fit: cover;
      max-height: 200px;
    }

    .preview-remove {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      background: rgba(0,0,0,0.6);
      color: #fff;
      font-size: 1.1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      transition: background 0.15s ease;
    }

    .preview-remove:hover {
      background: rgba(0,0,0,0.8);
    }

    .composer__toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--trellis-border-light);
      padding-top: 12px;
    }

    .composer__icons {
      display: flex;
      gap: 4px;
      position: relative;
    }

    .icon-btn {
      width: 34px;
      height: 34px;
      border: none;
      background: none;
      border-radius: 50%;
      color: var(--trellis-green);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      transition: all 0.15s ease;
    }

    .icon-btn:hover, .icon-btn.active {
      background: var(--trellis-green-pale);
    }
    
    .composer__actions {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .plant-tag-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--trellis-green-ghost);
        color: var(--trellis-green-dark);
        font-size: 0.85rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 16px;
    }
    .plant-tag-badge button {
        background: none;
        border: none;
        color: var(--trellis-text-secondary);
        font-size: 1.1rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        display: flex;
        align-items: center;
    }
    .plant-tag-badge button:hover {
        color: #E53E3E;
    }

    .composer__post-btn {
      padding: 8px 24px;
      border: none;
      border-radius: 20px;
      background: var(--trellis-green);
      color: #fff;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .composer__post-btn:hover:not(:disabled) {
      background: var(--trellis-green-dark);
    }

    .composer__post-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    /* Plant Dropdown */
    .plant-select-wrap {
        position: relative;
    }
    
    .plant-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 8px;
        background: var(--trellis-white);
        border: 1px solid var(--trellis-border-light);
        border-radius: var(--trellis-radius-md);
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        width: 220px;
        max-height: 260px;
        overflow-y: auto;
        z-index: 1001;
        padding: 4px 0;
    }
    
    .dropdown-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: transparent;
    }
    
    .plant-dropdown__header {
        padding: 8px 12px;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--trellis-text-hint);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .plant-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        cursor: pointer;
        transition: background 0.1s ease;
    }
    .plant-option:hover {
        background: var(--trellis-bg);
    }
    .plant-option.selected {
        background: var(--trellis-green-ghost);
        color: var(--trellis-green-dark);
        font-weight: 600;
    }
    
    .plant-thumb {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        object-fit: cover;
    }
    .plant-emoji {
        font-size: 1.2rem;
        width: 24px;
        text-align: center;
    }
    .plant-name {
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* Plant Tag Input */
    .composer__tag-row {
      padding: 0;
      margin-top: 4px;
    }
    .composer__tag-input {
      width: 100%;
      border: none;
      border-top: 1px solid var(--trellis-border-light);
      padding: 8px 0;
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      color: var(--trellis-text);
      background: transparent;
      outline: none;
    }
    .composer__tag-input::placeholder {
      color: var(--trellis-text-hint);
    }
    .composer__tag-row {
      position: relative;
    }
    .tag-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--trellis-white);
      border: 1px solid var(--trellis-border-light);
      border-radius: 0 0 8px 8px;
      box-shadow: var(--trellis-shadow-lg);
      z-index: 100;
      max-height: 180px;
      overflow-y: auto;
    }
    .tag-suggestion-item {
      display: block;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: none;
      text-align: left;
      font-family: 'Inter', sans-serif;
      font-size: 0.88rem;
      color: var(--trellis-text);
      cursor: pointer;
      transition: background 0.1s ease;
    }
    .tag-suggestion-item:hover {
      background: var(--trellis-green-ghost);
    }

    .tag-spinner {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.85rem;
      color: var(--trellis-green);
    }

    .tag-toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #991b1b;
      color: #fff;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      z-index: 9999;
      animation: toast-pop 0.3s ease;
      cursor: pointer;
      max-width: 90vw;
      text-align: center;
    }
    @keyframes toast-pop {
      from { opacity: 0; transform: translateX(-50%) translateY(8px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `]
})
export class PostComposerComponent implements OnInit {
  content = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  plantTag = '';
  tagFocused = false;
  tagSuggestions = signal<string[]>([]);
  validatingTag = signal(false);
  tagToast: string | null = null;
  private tagToastTimeout: any;

  private plantService = inject(PlantService);
  private authService = inject(AuthService);
  private wikiService = inject(WikipediaService);

  myPlants = signal<PlantData[]>([]);
  showPlantDropdown = signal(false);
  selectedPlantId = signal<string | null>(null);
  selectedPlantNickname = signal<string | null>(null);

  @Output() postCreated = new EventEmitter<{ content: string; file?: File, plantId?: string, plantTag?: string }>();

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.plantService.getUserPlants(user.id).subscribe({
        next: (plants) => this.myPlants.set(plants)
      });
    }
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  // ---- Tag Autocomplete ----
  private searchTimeout: any;

  onTagSearch() {
    clearTimeout(this.searchTimeout);
    const term = this.plantTag.trim();
    if (term.length < 2) {
      this.tagSuggestions.set([]);
      return;
    }
    this.searchTimeout = setTimeout(() => {
      this.wikiService.search(term).subscribe({
        next: (results) => this.tagSuggestions.set(results),
        error: () => this.tagSuggestions.set([])
      });
    }, 300);
  }

  onTagBlur() {
    setTimeout(() => {
      this.tagFocused = false;
    }, 200);
  }

  selectTag(name: string) {
    this.tagSuggestions.set([]);
    this.tagFocused = false;
    this.validatingTag.set(true);
    this.plantTag = name;

    this.wikiService.validateTopic(name).subscribe({
      next: (result) => {
        this.validatingTag.set(false);
        if (result.isValid) {
          this.plantTag = name;
        } else {
          this.plantTag = '';
          this.showTagToast(`🌱 "${name}" doesn't look like a plant. Try searching for the species name!`);
        }
      },
      error: () => {
        this.validatingTag.set(false);
        // Allow it on network error — don't block the user
        this.plantTag = name;
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      // Generate preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  togglePlantDropdown() {
    if (this.myPlants().length > 0) {
      this.showPlantDropdown.update(v => !v);
    }
  }

  selectPlant(plant: PlantData | null) {
    if (plant) {
      this.selectedPlantId.set(plant.id);
      this.selectedPlantNickname.set(plant.nickname);

      // Auto-tag species if verified
      if (plant.isVerified && plant.species) {
        // Use the species as the post tag
        this.plantTag = plant.species;
        // Trigger validation or just set it? 
        // Since it comes from PlantNet/Verification, we assume it's a valid plant topic.
        // We can flash it to show it was added.
        this.showTagToast(`🏷️ Auto-tagged species: ${plant.species}`);
      }
    } else {
      this.selectedPlantId.set(null);
      this.selectedPlantNickname.set(null);
      // Optional: Clear tag if it matched the plant? 
      // Better to leave it in case they want to keep the tag.
    }
    this.showPlantDropdown.set(false);
  }

  resolveUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }

  submitPost() {
    if (this.content.trim()) {
      this.postCreated.emit({
        content: this.content,
        file: this.selectedFile || undefined,
        plantId: this.selectedPlantId() || undefined,
        plantTag: this.plantTag.trim() || undefined
      });
      // Reset
      this.content = '';
      this.selectedFile = null;
      this.previewUrl = null;
      this.selectedPlantId.set(null);
      this.selectedPlantNickname.set(null);
      this.plantTag = '';
    }
  }

  showTagToast(message: string) {
    clearTimeout(this.tagToastTimeout);
    this.tagToast = message;
    this.tagToastTimeout = setTimeout(() => this.tagToast = null, 4000);
  }
}
