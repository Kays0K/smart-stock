export default async function movimentacoesRotas(servidor, options) {
    const sql = servidor.sql;

    servidor.post('/movimentacoes/saida', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            return reply.status(401).send({ error: "Token inválido ou ausente!" });
        }

        const { produto_id, quantidade, tipo_movimentacao } = request.body;
        const usuario_id = request.user.id; 

        if (!produto_id || !quantidade || !tipo_movimentacao) {
            return reply.status(400).send({ 
                error: "Os campos produto_id, quantidade e tipo_movimentacao são obrigatórios!" 
            });
        }

        if (quantidade <= 0) {
            return reply.status(400).send({ error: "A quantidade de saída deve ser maior que zero!" });
        }

        if (tipo_movimentacao !== 'VENDA' && tipo_movimentacao !== 'DESCARTE') {
            return reply.status(400).send({ error: "O tipo de movimentação de saída deve ser 'VENDA' ou 'DESCARTE'." });
        }

        const client = await sql.connect();

        try {
            await client.query('BEGIN');

            const queryLotes = `
                SELECT id, quantidade_atual, data_validade 
                FROM Lotes 
                WHERE produto_id = $1 AND quantidade_atual > 0 AND data_validade >= CURRENT_DATE
                ORDER BY data_validade ASC, id ASC
                FOR UPDATE;
            `;
            const resLotes = await client.query(queryLotes, [produto_id]);

            if (resLotes.rows.length === 0) {
                await client.query('ROLLBACK');
                return reply.status(400).send({ error: "Não há estoque disponível ou lotes válidos para este produto." });
            }

            const estoqueTotalDisponivel = resLotes.rows.reduce((sum, lote) => sum + lote.quantidade_atual, 0);

            if (estoqueTotalDisponivel < quantidade) {
                await client.query('ROLLBACK');
                return reply.status(400).send({ 
                    error: `Estoque insuficiente! Quantidade solicitada: ${quantidade}, Estoque total disponível: ${estoqueTotalDisponivel}` 
                });
            }

            let quantidadeRestanteParaAbater = quantidade;

            for (const lote of resLotes.rows) {
                if (quantidadeRestanteParaAbater <= 0) break;

                let quantidadeAbatidaNoLote = 0;

                if (lote.quantidade_atual >= quantidadeRestanteParaAbater) {

                    quantidadeAbatidaNoLote = quantidadeRestanteParaAbater;
                    const novaQuantidadeLote = lote.quantidade_atual - quantidadeRestanteParaAbater;
                    
                    await client.query('UPDATE Lotes SET quantidade_atual = $1 WHERE id = $2;', [novaQuantidadeLote, lote.id]);
                    quantidadeRestanteParaAbater = 0;
                } else {

                    quantidadeAbatidaNoLote = lote.quantidade_atual;
                    quantidadeRestanteParaAbater -= lote.quantidade_atual;

                    await client.query('UPDATE Lotes SET quantidade_atual = 0 WHERE id = $2;', [lote.id]);
                }

                const queryMovimentacao = `
                    INSERT INTO Movimentacoes (produto_id, lote_id, usuario_id, tipo_movimentacao, quantidade)
                    VALUES ($1, $2, $3, $4, $5);
                `;
                await client.query(queryMovimentacao, [
                    produto_id,
                    lote.id,
                    usuario_id,
                    tipo_movimentacao,
                    quantidadeAbatidaNoLote
                ]);
            }

            await client.query('COMMIT');
            return reply.status(200).send({ message: `Saída por ${tipo_movimentacao} processada com sucesso via lógica FEFO!` });

        } catch (error) {
            await client.query('ROLLBACK');
            servidor.log.error(error);
            return reply.status(500).send({ error: "Erro interno ao processar a saída de mercadoria." });
        } finally {
            client.release();
        }
    });
}