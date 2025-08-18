/**
 * Event Registry
 * 
 * Centralized registry of all analytics events with schemas and validation
 */

import { EventSchema, EventCategory, AnalyticsEvent } from './types';
import { validateEventProperties } from './utils';

export class EventRegistry {
  private schemas: Map<string, EventSchema> = new Map();

  constructor() {
    this.registerDefaultEvents();
  }

  // ============================================================================
  // Default Event Schemas
  // ============================================================================

  private registerDefaultEvents() {
    // Search Events
    this.register({
      name: 'Search Performed',
      category: EventCategory.SEARCH,
      requiredProperties: ['query', 'search_mode'],
      optionalProperties: ['results_count', 'has_results', 'duration'],
    });

    this.register({
      name: 'Search Mode Changed',
      category: EventCategory.SEARCH,
      requiredProperties: ['from_mode', 'to_mode'],
      optionalProperties: ['trigger'],
    });

    // Clinical Trial Events
    this.register({
      name: 'Trial Viewed',
      category: EventCategory.CLINICAL_TRIALS,
      requiredProperties: ['trial_id'],
      optionalProperties: ['match_score', 'position', 'source'],
      revenue: { currency: 'USD', amount: 10 },
    });

    this.register({
      name: 'Trial Contact Viewed',
      category: EventCategory.CLINICAL_TRIALS,
      requiredProperties: ['trial_id'],
      optionalProperties: ['location', 'contact_type'],
      revenue: { currency: 'USD', amount: 50 },
    });

    this.register({
      name: 'Trial Contact Clicked',
      category: EventCategory.CLINICAL_TRIALS,
      requiredProperties: ['trial_id', 'contact_method'],
      optionalProperties: ['location', 'match_score'],
      revenue: { currency: 'USD', amount: 100 },
    });

    this.register({
      name: 'Trial Criteria Expanded',
      category: EventCategory.CLINICAL_TRIALS,
      requiredProperties: ['trial_id'],
      optionalProperties: ['section', 'match_score'],
      revenue: { currency: 'USD', amount: 15 },
    });

    // Health Profile Events
    this.register({
      name: 'Health Profile Started',
      category: EventCategory.HEALTH_PROFILE,
      requiredProperties: ['source'],
      optionalProperties: ['trigger', 'step'],
    });

    this.register({
      name: 'Health Profile Question Answered',
      category: EventCategory.HEALTH_PROFILE,
      requiredProperties: ['question_id'],
      optionalProperties: ['question_type', 'answer_type', 'time_on_question'],
    });

    this.register({
      name: 'Health Profile Completed',
      category: EventCategory.HEALTH_PROFILE,
      requiredProperties: ['questions_answered', 'completion_time'],
      optionalProperties: ['cancer_type', 'disease_stage', 'has_molecular_markers'],
      revenue: { currency: 'USD', amount: 30 },
    });

    this.register({
      name: 'Health Profile Abandoned',
      category: EventCategory.HEALTH_PROFILE,
      requiredProperties: ['last_question_id', 'questions_answered'],
      optionalProperties: ['abandon_reason', 'time_spent'],
    });

    // Conversion Events
    this.register({
      name: 'Conversion',
      category: EventCategory.CONVERSION,
      requiredProperties: ['event_id', 'event_value'],
      optionalProperties: ['attribution_source', 'conversion_path'],
    });

    this.register({
      name: 'Account Created',
      category: EventCategory.CONVERSION,
      optionalProperties: ['registration_method', 'referral_source'],
      revenue: { currency: 'USD', amount: 100 },
    });

    // Feature Discovery Events
    this.register({
      name: 'Feature Discovered',
      category: EventCategory.FEATURE_DISCOVERY,
      requiredProperties: ['feature_id', 'feature_name'],
      optionalProperties: ['feature_category', 'is_first_discovery', 'usage_count'],
    });

    this.register({
      name: 'Feature Used',
      category: EventCategory.FEATURE_DISCOVERY,
      requiredProperties: ['feature_id'],
      optionalProperties: ['usage_context', 'usage_duration'],
    });

    // Performance Events
    this.register({
      name: 'Web Vital',
      category: EventCategory.PERFORMANCE,
      requiredProperties: ['metric_name', 'value'],
      optionalProperties: ['rating', 'delta', 'navigation_type'],
    });

    this.register({
      name: 'Performance Mark',
      category: EventCategory.PERFORMANCE,
      requiredProperties: ['mark_name', 'timestamp'],
      optionalProperties: ['metadata'],
    });

    this.register({
      name: 'API Response',
      category: EventCategory.PERFORMANCE,
      requiredProperties: ['api_name', 'duration', 'success'],
      optionalProperties: ['status_code', 'error_message'],
    });

    // Error Events
    this.register({
      name: 'Error Occurred',
      category: EventCategory.ERROR,
      requiredProperties: ['error_message', 'error_type'],
      optionalProperties: ['stack_trace', 'user_action', 'recovery_action'],
    });

    this.register({
      name: 'Search Error',
      category: EventCategory.ERROR,
      requiredProperties: ['query', 'error_type'],
      optionalProperties: ['error_message', 'search_mode'],
    });

    // Engagement Events
    this.register({
      name: 'Page Viewed',
      category: EventCategory.NAVIGATION,
      requiredProperties: ['page_path'],
      optionalProperties: ['referrer', 'page_title', 'utm_source'],
    });

    this.register({
      name: 'Session Started',
      category: EventCategory.ENGAGEMENT,
      requiredProperties: ['session_id'],
      optionalProperties: ['landing_page', 'referrer', 'utm_campaign'],
    });

    this.register({
      name: 'Feedback Provided',
      category: EventCategory.ENGAGEMENT,
      requiredProperties: ['feedback_type', 'rating'],
      optionalProperties: ['message_id', 'comment', 'context'],
    });

    this.register({
      name: 'Share Action',
      category: EventCategory.ENGAGEMENT,
      requiredProperties: ['content_type', 'share_method'],
      optionalProperties: ['content_id', 'destination'],
      revenue: { currency: 'USD', amount: 5 },
    });

    // Time to Value Events
    this.register({
      name: 'TTV Milestone',
      category: EventCategory.ENGAGEMENT,
      requiredProperties: ['milestone_name', 'time_to_achieve'],
      optionalProperties: ['milestone_value', 'metadata'],
    });

    this.register({
      name: 'First Search',
      category: EventCategory.ENGAGEMENT,
      requiredProperties: ['search_mode'],
      optionalProperties: ['time_since_landing'],
      revenue: { currency: 'USD', amount: 5 },
    });

    this.register({
      name: 'First Result View',
      category: EventCategory.ENGAGEMENT,
      requiredProperties: ['result_type'],
      optionalProperties: ['time_to_view', 'result_position'],
      revenue: { currency: 'USD', amount: 10 },
    });
  }

  // ============================================================================
  // Schema Management
  // ============================================================================

  public register(schema: EventSchema): void {
    this.schemas.set(schema.name, schema);
  }

  public unregister(eventName: string): void {
    this.schemas.delete(eventName);
  }

  public getSchema(eventName: string): EventSchema | undefined {
    return this.schemas.get(eventName);
  }

  public getAllSchemas(): EventSchema[] {
    return Array.from(this.schemas.values());
  }

  public getSchemasByCategory(category: EventCategory): EventSchema[] {
    return Array.from(this.schemas.values()).filter(
      schema => schema.category === category
    );
  }

  // ============================================================================
  // Validation
  // ============================================================================

  public validate(event: AnalyticsEvent): { valid: boolean; errors: string[] } {
    const schema = this.schemas.get(event.name);
    
    if (!schema) {
      // No schema registered - allow but warn in debug mode
      if (process.env.NODE_ENV === 'development') {
        console.warn(`No schema registered for event: ${event.name}`);
      }
      return { valid: true, errors: [] };
    }
    
    // Validate properties
    return validateEventProperties(
      event.properties || {},
      schema.requiredProperties,
      schema.optionalProperties
    );
  }

  // ============================================================================
  // Revenue Calculation
  // ============================================================================

  public getEventRevenue(eventName: string): number {
    const schema = this.schemas.get(eventName);
    return schema?.revenue?.amount || 0;
  }

  public getTotalRevenuePotential(): number {
    return Array.from(this.schemas.values())
      .reduce((total, schema) => total + (schema.revenue?.amount || 0), 0);
  }

  // ============================================================================
  // Export/Import
  // ============================================================================

  public exportSchemas(): string {
    const schemas = Array.from(this.schemas.values());
    return JSON.stringify(schemas, null, 2);
  }

  public importSchemas(json: string): void {
    try {
      const schemas = JSON.parse(json) as EventSchema[];
      schemas.forEach(schema => this.register(schema));
    } catch (error) {
      console.error('Failed to import schemas:', error);
      throw new Error('Invalid schema JSON');
    }
  }

  // ============================================================================
  // Documentation
  // ============================================================================

  public generateDocumentation(): string {
    const categories = Object.values(EventCategory);
    let doc = '# Analytics Events Documentation\n\n';
    
    for (const category of categories) {
      const schemas = this.getSchemasByCategory(category);
      if (schemas.length === 0) continue;
      
      doc += `## ${category.replace(/_/g, ' ').toUpperCase()}\n\n`;
      
      for (const schema of schemas) {
        doc += `### ${schema.name}\n`;
        if (schema.description) {
          doc += `${schema.description}\n\n`;
        }
        
        if (schema.requiredProperties?.length) {
          doc += '**Required Properties:**\n';
          schema.requiredProperties.forEach(prop => {
            doc += `- ${prop}\n`;
          });
          doc += '\n';
        }
        
        if (schema.optionalProperties?.length) {
          doc += '**Optional Properties:**\n';
          schema.optionalProperties.forEach(prop => {
            doc += `- ${prop}\n`;
          });
          doc += '\n';
        }
        
        if (schema.revenue) {
          doc += `**Revenue:** ${schema.revenue.currency} ${schema.revenue.amount}\n\n`;
        }
        
        doc += '---\n\n';
      }
    }
    
    return doc;
  }
}