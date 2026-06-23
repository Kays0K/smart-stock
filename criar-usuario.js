import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

const pool = new Pool({
    user: "kayson",
    password: "12345",
    host: "localhost",
    port: 5432,
    database: "smartstock"
});

async function inicializarUsuarios() {
    const saltRounds = 10;

    const usuarios = [
        {
            nome: "Kayson Administrador",
            email: "admin@smartstock.com",
            senhaPlana: "admin123",
            tipo: "ADMIN"
        },
        {
            nome: "Operador Padrão",
            email: "operador@smartstock.com",
            senhaPlana: "operador123",
            tipo: "OPERADOR"
        }
    ];

    try {
        console.log("Conectando ao banco de dados.");
        
        for (const usuario of usuarios) {
            const checkQuery = `SELECT id FROM Usuarios WHERE email = $1;`;
            const checkResult = await pool.query(checkQuery, [usuario.email]);

            if (checkResult.rows.length > 0) {
                console.log(`Usuário com o e-mail [${usuario.email}] já existe no banco. Será Pulado.`);
                continue;
            }

            console.log(`Gerando hash da senha para: ${usuario.nome}`);
            const senhaHash = await bcrypt.hash(usuario.senhaPlana, saltRounds);

            const insertQuery = `
                INSERT INTO Usuarios (nome, email, senha, tipo_usuario)
                VALUES ($1, $2, $3, $4);
            `;
            
            await pool.query(insertQuery, [
                usuario.nome, 
                usuario.email, 
                senhaHash, 
                usuario.tipo
            ]);

            console.log(`Usuário [${usuario.tipo}] criado com sucesso!`);
            console.log(`E-mail: ${usuario.email}`);
            console.log(`Senha: ${usuario.senhaPlana}\n`);
        }

    } catch (error) {
        console.error("Erro ao inserir usuários:", error);
    } finally {
        await pool.end();
        console.log("🔌 Conexão com o banco de dados encerrada.");
    }
}

inicializarUsuarios();