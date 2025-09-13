export interface ApiErrorResponse {
  error: string;
}

export type ApiResponse<T> = T | ApiErrorResponse;

export const isApiError = (response: unknown): response is ApiErrorResponse => {
  return (
    typeof response === "object" && response !== null && "error" in response
  );
};
