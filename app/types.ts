export type ClothingStyle = 'casual' | 'modern' | 'edgy' | 'formal' | 'sporty' | 'vintage' | 'bohemian' | 'cyberpunk' | 'steampunk' | 'gothic' | 'kawaii' | 'minimalist' | 'streetwear';

export interface GenerateOutfitRequest {
  image: string; // base64 encoded image
  style: ClothingStyle;
}

export interface GenerateOutfitResponse {
  success: boolean;
  generatedImage?: string; // base64 encoded image
  error?: string;
}
