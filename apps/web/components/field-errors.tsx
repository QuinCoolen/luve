import type { ApiError } from "@/api/mutator/axios";

/** Renders the server's error messages for one form field. */
export function FieldErrors({ error, field }: { error: ApiError | null; field: string }) {
  const messages = error?.fieldErrors(field) ?? [];
  if (messages.length === 0) return null;
  return (
    <>
      {messages.map((message) => (
        <p key={message} className="w-full text-sm text-red-500">
          {message}
        </p>
      ))}
    </>
  );
}
