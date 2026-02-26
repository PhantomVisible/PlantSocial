import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VirtualPlantService, VirtualPlant, VirtualPlantResponse } from '../../services/virtual-plant/virtual-plant.service';

export type PlantStage = 'SEED' | 'SPROUT' | 'SAPLING' | 'BLOOM' | 'ANCIENT';

@Component({
  selector: 'app-greenhouse',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './greenhouse.component.html',
  styleUrl: './greenhouse.component.scss'
})
export class GreenhouseComponent implements OnInit {
  isLoading: boolean = true;
  availableSeeds: string[] = ['Monstera', 'Cactus', 'Sunflower', 'Bonsai'];
  
  showInfo: boolean = false;

  plantSlots: (VirtualPlant | null)[] = [null, null, null, null];
  selectedSlotIndex: number | null = null;

  plant: VirtualPlant | null = null;
  phantomMessage: string = "The Hall of Guardians! Which of our latent warriors shall we commune with today, Commander?";

  constructor(private virtualPlantService: VirtualPlantService) {}

  ngOnInit() {
    // Currently hardcoding userId=1 until AuthContext covers gamification-service
    const userId = 1;
    this.virtualPlantService.getMyPlants(userId).subscribe({
      next: (plants) => {
        plants.forEach((p, i) => {
          if (i < 4) this.plantSlots[i] = p;
        });
        setTimeout(() => this.isLoading = false, 1500);
      },
      error: () => {
        setTimeout(() => this.isLoading = false, 1500);
      }
    });
  }

  selectSlot(index: number) {
    this.selectedSlotIndex = index;
    const selectedPlant = this.plantSlots[index];

    if (selectedPlant) {
      this.plant = selectedPlant;
      this.phantomMessage = "The dormant vessel awaits! We must nurture this latent power!";
    } else {
      this.plant = null;
      this.phantomMessage = "Behold, Guardian! The arena of life has expanded! The cosmic soil of the Greenhouse is ready for your first vessel!";
    }
  }

  goBackToSlots() {
    this.selectedSlotIndex = null;
    this.plant = null;
    this.phantomMessage = "The Hall of Guardians! Which of our latent warriors shall we commune with today, Commander?";
  }

  toggleInfo() {
    this.showInfo = !this.showInfo;
    if (this.showInfo) {
      this.phantomMessage = "Reviewing the cosmic laws of growth, Guardian? Knowledge is the ultimate weapon!";
    } else {
      if (this.plant) {
        this.phantomMessage = "The dormant vessel awaits! We must nurture this latent power!";
      } else if (this.selectedSlotIndex === null) {
        this.phantomMessage = "The Hall of Guardians! Which of our latent warriors shall we commune with today, Commander?";
      } else {
        this.phantomMessage = "Behold, Guardian! The arena of life has expanded! The cosmic soil of the Greenhouse is ready for your first vessel!";
      }
    }
  }

  selectSeed(species: string) {
    this.isLoading = true;
    const userId = 1; // Hardcoded
    this.virtualPlantService.plantSeed(userId, species).subscribe({
      next: (response) => {
        this.plant = response.plant;
        if (this.selectedSlotIndex !== null) {
          this.plantSlots[this.selectedSlotIndex] = this.plant;
        }
        this.phantomMessage = response.message;
        setTimeout(() => this.isLoading = false, 1500);
      },
      error: (err) => {
        console.error("Failed to plant seed:", err);
        setTimeout(() => this.isLoading = false, 1500);
      }
    });
  }

  water() {
    if (!this.plant) return;
    this.virtualPlantService.waterPlant(this.plant.id).subscribe({
      next: (response) => {
        this.plant = response.plant;
        if (this.selectedSlotIndex !== null) this.plantSlots[this.selectedSlotIndex] = this.plant;
        this.phantomMessage = response.message;
      },
      error: (err) => console.error(err)
    });
  }

  clean() {
    if (!this.plant) return;
    this.virtualPlantService.cleanPlant(this.plant.id).subscribe({
      next: (response) => {
        this.plant = response.plant;
        if (this.selectedSlotIndex !== null) this.plantSlots[this.selectedSlotIndex] = this.plant;
        this.phantomMessage = response.message;
      },
      error: (err) => console.error(err)
    });
  }

  getSpriteUrl(species: string): string {
    return 'http://localhost:8081/sprites/' + species.toLowerCase() + '.png';
  }

  getStageOffset(stage: string): string {
    switch (stage) {
      case 'SEED': return '0% 50%';
      case 'SPROUT': return '25% 50%';
      case 'SAPLING': return '50% 50%';
      case 'BLOOM': return '75% 50%';
      case 'ANCIENT': return '100% 50%';
      default: return '0% 50%';
    }
  }
}
