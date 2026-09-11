export function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class MockEntityNotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} '${id}' was not found in the demonstration dataset.`);
    this.name = 'MockEntityNotFoundError';
  }
}

export class MockWorkflowConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MockWorkflowConflictError';
  }
}

export class MockWorkflowValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MockWorkflowValidationError';
  }
}
