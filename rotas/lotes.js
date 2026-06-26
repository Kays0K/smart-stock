export default async function lotesRotas(servidor, options) {
    const sql = servidor.sql;

    servidor.post('/lotes', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            return reply.status(401).send({ error: "Token inválido ou ausente!" });
        }

        const { produto_id, quantidade_inicial, data_fabricacao, data_validade } = request.body;
        const usuario_id = request.user.id;

        if (!produto_id || !quantidade_inicial || !data_fabricacao || !data_validade) {
            return reply.status(400).send({
                error: "Todos os campos (produto_id, quantidade_inicial, data_fabricacao, data_validade) são obrigatórios!"
            });
        }

        if (quantidade_inicial <= 0) {
            return reply.status(400).send({ error: "A quantidade inicial deve ser maior que zero!" });
        }

        if (new Date(data_validade) <= new Date(data_fabricacao)) {
            return reply.status(400).send({ error: "A data de validade deve ser posterior à data de fabricação!" });
        }

        try {

            const produtoExiste = await sql.query('SELECT id FROM Produtos WHERE id = $1;', [produto_id]);
            if (produtoExiste.rows.length === 0) {
                return reply.status(404).send({ error: `Produto com o ID ${produto_id} não foi encontrado.` });
            }

            const client = await sql.connect();

            try {
                await client.query('BEGIN');

                const queryLote = `
                    INSERT INTO Lotes (produto_id, quantidade_inicial, quantidade_atual, data_fabricacao, data_validade)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id;
                `;
                const resLote = await client.query(queryLote, [
                    produto_id,
                    quantidade_inicial,
                    quantidade_inicial,
                    data_fabricacao,
                    data_validade
                ]);

                const lote_id = resLote.rows[0].id;

                const queryMovimentacao = `
                    INSERT INTO Movimentacoes (produto_id, lote_id, usuario_id, tipo_movimentacao, quantidade)
                    VALUES ($1, $2, $3, 'ENTRADA', $4);
                `;
                await client.query(queryMovimentacao, [
                    produto_id,
                    lote_id,
                    usuario_id,
                    quantidade_inicial
                ]);

                await client.query('COMMIT');

                return reply.status(201).send({
                    message: "Lote e movimentação de entrada registados com sucesso!",
                    lote_id
                });

            } catch (transactionError) {
                await client.query('ROLLBACK');
                throw transactionError;
            } finally {
                client.release();
            }

        } catch (error) {
            servidor.log.error(error);
            return reply.status(500).send({ error: "Erro interno do servidor ao registar o lote." });
        }
    });
}