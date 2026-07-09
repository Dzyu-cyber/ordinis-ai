export interface User {
  id: string;
  email: string;
  businessName: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface LogoutResponse {
  success: boolean;
  data: {
    message: string;
  };
}
