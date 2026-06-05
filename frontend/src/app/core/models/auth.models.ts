export interface ApiError {
  code: string;
  message: string;
  field: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  phone_number?: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}
