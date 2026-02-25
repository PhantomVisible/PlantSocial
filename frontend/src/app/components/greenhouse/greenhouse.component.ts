import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  hasActivePlant: boolean = false;
  availableSeeds: string[] = ['Monstera', 'Cactus', 'Sunflower', 'Bonsai'];

  spriteMap: Record<string, Record<string, string>> = {
    'Monstera': { 'SEED': '🌱', 'SPROUT': '🌿', 'SAPLING': '🪴', 'BLOOM': '🌴', 'ANCIENT': '🍃✨' },
    'Cactus': { 'SEED': '🪨', 'SPROUT': '🌵', 'SAPLING': '🌵🌵', 'BLOOM': '🌺🌵', 'ANCIENT': '🏜️🌵✨' },
    'Sunflower': { 'SEED': '🌰', 'SPROUT': '🌱', 'SAPLING': '🌿', 'BLOOM': '🌻', 'ANCIENT': '☀️🌻✨' },
    'Bonsai': { 'SEED': '🌰', 'SPROUT': '🌿', 'SAPLING': '🪴', 'BLOOM': '🌲', 'ANCIENT': '⛩️🌲✨' }
  };

  plant = {
    name: 'Sprouty',
    stage: 'SEED' as PlantStage,
    hydration: 70,
    cleanliness: 50
  };

  ngOnInit() {
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);
  }

  selectSeed(species: string) {
    this.isLoading = true;
    setTimeout(() => {
      this.plant.name = species;
      this.isLoading = false;
      this.hasActivePlant = true;
    }, 1500);
  }

  getPhantomDialogue(stage: PlantStage): string {
    switch (stage) {
      case 'SEED':
        return "The dormant vessel awaits! We must nurture this latent power!";
      case 'SPROUT':
        return "A breakthrough! The green aura pierces the earth!";
      case 'SAPLING':
        return "Behold its rising strength! But do not falter, guardian!";
      case 'BLOOM':
        return "Magnificent! Its energy rivals the stars themselves!";
      case 'ANCIENT':
        return "The World Tree awakens... Our ultimate triumph is at hand!";
      default:
        return "Heed my words, guardian! The hydration aura of this sprout wanes! We must act before its life force scatters to the wind!";
    }
  }

  getSpriteUrl(species: string): string {
    return 'http://localhost:8081/sprites/' + species.toLowerCase() + '.png';
  }

  getSpritePosition(stage: PlantStage): string {
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
