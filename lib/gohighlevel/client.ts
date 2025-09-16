/**
 * GoHighLevel API Client
 * V2 API Implementation with Private Integration token
 */

interface LeadData {
  fullName?: string;
  email: string;
  phone: string;
  zipCode?: string;
  condition?: string;
  stage?: string;
  biomarkers?: string;
  priorTherapy?: string;
  companyName?: string;
  contactName?: string;
  siteLocation?: string;
  monthlyVolume?: string;
  notes?: string;
  selectedTime?: string;
  source: string;
  indication?: string;
  timestamp: string;
}

interface SubmitLeadResponse {
  success: boolean;
  message?: string;
  contactId?: string;
  leadType?: string;
  leadScore?: number;
  error?: string;
  details?: any;
  apiVersion?: 'v1' | 'v2';
}

class GoHighLevelClient {
  private v2Endpoint = '/api/gohighlevel/v2';
  private webhookEndpoint = '/api/gohighlevel/webhook'; // Also uses V2 internally
  
  constructor() {
    // V2 API only - no fallback per user requirement
  }
  
  async submitLead(data: LeadData): Promise<SubmitLeadResponse> {
    try {
      // Use V2 API only - no fallback
      const response = await this.submitToV2(data);
      return { ...response, apiVersion: 'v2' };
    } catch (error) {
      console.error('Error submitting lead:', error);
      throw error;
    }
  }
  
  private async submitToV2(data: LeadData): Promise<any> {
    const response = await fetch(this.v2Endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    return response.json();
  }
  
  // Alternative endpoint that also uses V2 API internally
  async submitViaWebhook(data: LeadData): Promise<SubmitLeadResponse> {
    const response = await fetch(this.webhookEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    return { ...result, apiVersion: 'v2' };
  }
  
  // Get current API version being used
  getCurrentApiVersion(): 'v2' {
    return 'v2'; // Always V2
  }
}

// Export singleton instance
export const ghlClient = new GoHighLevelClient();

// Export types
export type { LeadData, SubmitLeadResponse };