import { BadRequestException } from '@nestjs/common';

/** One Standard Schema issue (structurally identical to `StandardSchemaV1.Issue`). */
export interface SchemaIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
}

/**
 * Thrown by the global `StandardSchemaValidationPipe` when a request body,
 * query or param fails its schema. The problem+json filter turns the issues
 * into field-keyed `errors`.
 */
export class SchemaValidationException extends BadRequestException {
  constructor(readonly issues: readonly SchemaIssue[]) {
    super('One or more fields failed validation.');
  }

  /** `{ "address.street": ["Required"] }`; issues without a path go under `(root)`. */
  fieldErrors(): Record<string, string[]> {
    const fields: Record<string, string[]> = {};
    for (const issue of this.issues) {
      const key =
        issue.path && issue.path.length > 0
          ? issue.path
              .map((segment) =>
                String(typeof segment === 'object' && segment !== null ? segment.key : segment),
              )
              .join('.')
          : '(root)';
      (fields[key] ??= []).push(issue.message);
    }
    return fields;
  }
}
