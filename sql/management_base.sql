CREATE TABLE IF NOT EXISTS suppliers (id SERIAL PRIMARY KEY, nome TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS customers (id SERIAL PRIMARY KEY, nome TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  supplier_id INT REFERENCES suppliers(id),
  material_id INT NOT NULL,
  weight_kg NUMERIC(12,3) NOT NULL,
  price_per_kg NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  material_id INT NOT NULL,
  weight_kg NUMERIC(12,3) NOT NULL,
  price_per_kg NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  material_id INT NOT NULL,
  quantity_kg NUMERIC(12,3) NOT NULL,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contas_pagar (
  id SERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto'
);

CREATE TABLE IF NOT EXISTS contas_receber (
  id SERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto'
);

CREATE TABLE IF NOT EXISTS caixa (
  id SERIAL PRIMARY KEY,
  saldo_atual NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  usuario TEXT,
  acao TEXT NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
