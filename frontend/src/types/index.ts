export interface PasswordEntry {
  id: number;
  site: string;
  username: string;
  password: string;
}

export interface Division {
  id: number;
  name: string;
  credentials: PasswordEntry[];
}
