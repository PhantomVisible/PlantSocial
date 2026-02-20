import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-modal.component.html',
  styleUrl: './payment-modal.component.scss'
})
export class PaymentModalComponent {
  @Input() totalCost: number = 0;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  isProcessing = false;

  onConfirm() {
    this.isProcessing = true;
    // Simulate network delay for effect
    setTimeout(() => {
      this.confirm.emit();
      this.isProcessing = false;
    }, 1500);
  }

  onCancel() {
    if (!this.isProcessing) {
      this.cancel.emit();
    }
  }
}
