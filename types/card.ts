export type BarcodeType = 'qr' | 'linear';

export interface Card {
  id: string;
  name: string;
  number: string;
  barcodeType: BarcodeType;
  color?: string;
  notes?: string;
  createdAt: number;
}