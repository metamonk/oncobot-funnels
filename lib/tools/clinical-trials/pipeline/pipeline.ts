/**
 * Main pipeline class for composing and executing operators
 */

import type {
  TrialOperator,
  OperatorContext,
  PipelineConfig,
  PipelineResult,
  OperatorMetadata
} from './types';

export class TrialPipeline<TInput = any, TOutput = any> {
  private operators: TrialOperator[] = [];
  private config: PipelineConfig;
  private metadata: OperatorMetadata[] = [];
  
  constructor(config: PipelineConfig = {}) {
    this.config = {
      stopOnError: false,
      enableStreaming: true,
      collectMetrics: true,
      ...config
    };
  }
  
  /**
   * Add an operator to the pipeline
   */
  add<T extends TrialOperator>(operator: T): this {
    this.operators.push(operator);
    return this;
  }
  
  /**
   * Remove an operator by name
   */
  remove(operatorName: string): this {
    this.operators = this.operators.filter(op => op.name !== operatorName);
    return this;
  }
  
  /**
   * Clear all operators
   */
  clear(): this {
    this.operators = [];
    this.metadata = [];
    return this;
  }
  
  /**
   * Get list of operator names in the pipeline
   */
  getOperatorNames(): string[] {
    return this.operators.map(op => op.name);
  }
  
  /**
   * Execute the pipeline
   */
  async execute(
    input: TInput[], 
    context: OperatorContext
  ): Promise<PipelineResult<TOutput>> {
    this.metadata = [];
    const startTime = Date.now();
    
    try {
      // Validate all operators before execution
      for (const operator of this.operators) {
        if (operator.validate && !operator.validate(context)) {
          throw new Error(`Operator ${operator.name} validation failed`);
        }
      }
      
      // Execute operators in sequence
      let result: any = input;
      
      for (const operator of this.operators) {
        try {
          // Stream pipeline progress if enabled
          if (this.config.enableStreaming && context.dataStream) {
            await this.streamProgress(operator.name, 'start', context);
          }
          
          // Execute operator
          result = await this.executeWithTimeout(
            operator,
            result,
            context
          );
          
          // Collect metadata if enabled
          if (this.config.collectMetrics && operator.getMetadata) {
            this.metadata.push(operator.getMetadata());
          }
          
          // Stream intermediate results if operator supports it
          if (operator.canStream && this.config.enableStreaming && context.dataStream) {
            await this.streamIntermediateResult(
              operator.name,
              result,
              context
            );
          }
          
          // Stream pipeline progress if enabled
          if (this.config.enableStreaming && context.dataStream) {
            await this.streamProgress(operator.name, 'complete', context);
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          if (this.config.stopOnError) {
            throw new Error(`Pipeline failed at operator ${operator.name}: ${errorMessage}`);
          } else {
            // Log error but continue
            this.metadata.push({
              operatorName: operator.name,
              inputCount: Array.isArray(result) ? result.length : 0,
              outputCount: 0,
              errors: [errorMessage]
            });
            
            // Continue with empty result for this operator
            result = [];
          }
        }
      }
      
      // Add overall pipeline metadata
      if (this.config.collectMetrics) {
        this.metadata.unshift({
          operatorName: 'pipeline',
          inputCount: Array.isArray(input) ? input.length : 0,
          outputCount: Array.isArray(result) ? result.length : 0,
          processingTime: Date.now() - startTime,
          operatorCount: this.operators.length
        });
      }
      
      return {
        data: result as TOutput[],
        metadata: this.metadata,
        context,
        success: true
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        data: [],
        metadata: this.metadata,
        context,
        success: false,
        error: errorMessage
      };
    } finally {
      // Clean up operators
      for (const operator of this.operators) {
        if (operator.cleanup) {
          await operator.cleanup();
        }
      }
    }
  }
  
  /**
   * Execute operator with timeout
   */
  private async executeWithTimeout(
    operator: TrialOperator,
    input: any[],
    context: OperatorContext
  ): Promise<any[]> {
    if (!this.config.timeout) {
      return operator.execute(input, context);
    }
    
    return Promise.race([
      operator.execute(input, context),
      new Promise<any[]>((_, reject) => 
        setTimeout(
          () => reject(new Error(`Operator ${operator.name} timed out`)),
          this.config.timeout
        )
      )
    ]);
  }
  
  /**
   * Stream pipeline progress
   */
  private async streamProgress(
    operatorName: string,
    status: 'start' | 'complete',
    context: OperatorContext
  ): Promise<void> {
    if (context.dataStream) {
      context.dataStream.writeMessageAnnotation({
        type: 'pipeline_progress',
        data: {
          operator: operatorName,
          status,
          timestamp: new Date().toISOString(),
          pipelineOperators: this.getOperatorNames()
        }
      });
    }
  }
  
  /**
   * Stream intermediate results
   */
  private async streamIntermediateResult(
    operatorName: string,
    result: any[],
    context: OperatorContext
  ): Promise<void> {
    if (context.dataStream) {
      // Only stream summary to avoid token explosion
      context.dataStream.writeMessageAnnotation({
        type: 'pipeline_intermediate',
        data: {
          operator: operatorName,
          resultCount: result.length,
          timestamp: new Date().toISOString(),
          // Include first few items as preview
          preview: result.slice(0, 3).map((item: any) => ({
            nctId: item.protocolSection?.identificationModule?.nctId,
            title: item.protocolSection?.identificationModule?.briefTitle,
            score: item.relevanceScore
          }))
        }
      });
    }
  }
  
  /**
   * Clone the pipeline with same operators but fresh state
   */
  clone(): TrialPipeline<TInput, TOutput> {
    const newPipeline = new TrialPipeline<TInput, TOutput>(this.config);
    newPipeline.operators = [...this.operators];
    return newPipeline;
  }
  
  /**
   * Create a named pipeline template for reuse
   */
  toTemplate(name: string, description: string) {
    return {
      name,
      description,
      operators: this.getOperatorNames(),
      config: this.config
    };
  }
}