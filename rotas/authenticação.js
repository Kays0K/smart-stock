import bcrypt from 'bcrypt'

export default async function authRotas(servidor, options) {
    const sql = servidor.sql;

    // Rota de Login (RF01)
    servidor.post('/login', async (request, reply) => {
        const { email, senha } = request.body;

        // Validação básica de campos obrigatórios
        if (!email || !senha) {
            return reply.status(400).send({ error: "E-mail e senha são obrigatórios!" });
        }

        try {
            const query = `
                SELECT id, nome, email, senha, tipo_usuario 
                FROM Usuarios 
                WHERE email = $1;
            `;
            const resultado = await sql.query(query, [email]);

            if (resultado.rows.length === 0) {
                return reply.status(401).send({ error: "E-mail ou senha inválidos!" });
            }

            const usuario = resultado.rows[0];

            const senhaValida = await bcrypt.compare(senha, usuario.senha);
            if (!senhaValida) {
                return reply.status(401).send({ error: "E-mail ou senha inválidos!" });
            }

            const token = servidor.jwt.sign({
                id: usuario.id,
                tipo_usuario: usuario.tipo_usuario 
            }, { expiresIn: '8h' }); 

            return reply.status(200).send({
                token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    tipo_usuario: usuario.tipo_usuario
                }
            });

        } catch (error) {
            return reply.status(500).send({ error: "Erro interno no servidor ao tentar logar." });
        }
    });
}