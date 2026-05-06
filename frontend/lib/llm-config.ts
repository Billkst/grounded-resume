export interface LLMConfig {
  provider: string;
  model: string;
  apiKey: string;
}

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'deepseek',
  model: 'deepseek-v4-pro',
  apiKey: '',
};
