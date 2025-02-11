export interface BudgetItem {
  id: string;
  client_id: number | null;
  client: string | null;
  product_line: string | null;
  account_level: string | null;
  classification: string | null;
  problem_description: string | null;
  month_values: Record<string, string>;
  cost_of_sales: number;
  total_amount: number;
  gp_percentage: number;
  department: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}