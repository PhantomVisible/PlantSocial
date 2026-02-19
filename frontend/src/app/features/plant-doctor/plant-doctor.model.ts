export interface DiagnosisDTO {
    status: 'Healthy' | 'Sick';
    diseaseName?: string;
    confidence?: number;
    treatmentSteps?: string[];
}
