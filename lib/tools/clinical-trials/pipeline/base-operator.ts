/**
 * Base class for pipeline operators
 */

import type { 
  TrialOperator, 
  OperatorContext, 
  OperatorMetadata 
} from './types';

export abstract class BaseOperator<TIn = any, TOut = any> 
  implements TrialOperator<TIn, TOut> {
  
  abstract name: string;
  protected metadata: OperatorMetadata | null = null;
  protected startTime: number = 0;
  
  /**
   * Main execution method - must be implemented by subclasses
   */
  abstract execute(trials: TIn[], context: OperatorContext): Promise<TOut[]>;
  
  /**
   * Whether this operator supports streaming
   */
  canStream: boolean = false;
  
  /**
   * Get metadata from last execution
   */
  getMetadata(): OperatorMetadata {
    return this.metadata || {
      operatorName: this.name,
      inputCount: 0,
      outputCount: 0,
      processingTime: 0
    };
  }
  
  /**
   * Validate that operator can run with given context
   */
  validate(context: OperatorContext): boolean {
    return true; // Override in subclasses for specific validation
  }
  
  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.metadata = null;
  }
  
  /**
   * Helper to track execution start
   */
  protected startExecution(inputCount: number): void {
    this.startTime = Date.now();
    this.metadata = {
      operatorName: this.name,
      inputCount,
      outputCount: 0,
      processingTime: 0
    };
  }
  
  /**
   * Helper to track execution end
   */
  protected endExecution(outputCount: number): void {
    if (this.metadata) {
      this.metadata.outputCount = outputCount;
      this.metadata.processingTime = Date.now() - this.startTime;
    }
  }
  
  /**
   * Helper to add metadata
   */
  protected addMetadata(key: string, value: any): void {
    if (this.metadata) {
      this.metadata[key] = value;
    }
  }
  
  /**
   * Helper to log errors
   */
  protected logError(error: string): void {
    if (this.metadata) {
      if (!this.metadata.errors) {
        this.metadata.errors = [];
      }
      this.metadata.errors.push(error);
    }
  }
  
  /**
   * Helper to log warnings
   */
  protected logWarning(warning: string): void {
    if (this.metadata) {
      if (!this.metadata.warnings) {
        this.metadata.warnings = [];
      }
      this.metadata.warnings.push(warning);
    }
  }
  
  /**
   * Stream data if streaming is enabled
   */
  protected async streamData(
    data: any, 
    type: string, 
    context: OperatorContext
  ): Promise<void> {
    if (this.canStream && context.dataStream) {
      context.dataStream.writeMessageAnnotation({
        type: `pipeline_${this.name}_${type}`,
        data: {
          operator: this.name,
          timestamp: new Date().toISOString(),
          ...data
        }
      });
    }
  }
}