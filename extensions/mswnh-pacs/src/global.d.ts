export {};

declare global {
  interface Window {
    config?: {
      workflowApi?: {
        baseUrl?: string;
      };
      dashboard?: {
        useMockData?: boolean;
        timeZone?: string;
      };
      [key: string]: any;
    };
  }
}
