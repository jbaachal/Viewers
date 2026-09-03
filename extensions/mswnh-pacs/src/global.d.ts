export {};

declare global {
  interface Window {
    config?: {
      workflowApi?: {
        baseUrl?: string;
      };
      [key: string]: any;
    };
  }
}