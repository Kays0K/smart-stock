CREATE TABLE Usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    senha VARCHAR(255),
    tipo_usuario VARCHAR(20)
);

CREATE TABLE Produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150),
    categoria VARCHAR(100),
    preco_custo DECIMAL(10, 2),
    preco_venda DECIMAL(10, 2),
    estoque_minimo INTEGER
);

CREATE TABLE Lotes (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER REFERENCES Produtos(id) ON DELETE CASCADE, 
    quantidade_inicial INTEGER,
    quantidade_atual INTEGER,
    data_fabricacao DATE,
    data_validade DATE
);

CREATE TABLE Movimentacoes (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER REFERENCES Produtos(id),
    lote_id INTEGER REFERENCES Lotes(id),
    usuario_id INTEGER REFERENCES Usuarios(id),
    tipo_movimentacao VARCHAR(20),
    quantidade INTEGER,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);