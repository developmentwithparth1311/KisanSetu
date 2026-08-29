export interface User {
  id: string;
  name: string;
  role: "farmer" | "fpo" | "buyer" | "government";
  phone: string;
}
