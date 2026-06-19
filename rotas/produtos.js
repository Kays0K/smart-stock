export default async function produtosRotas(servidor, options) {

    const sql = servidor.sql;

    servidor.post('/produtos', async (request, reply) => {
        const nome = request.body.nome;
        const categoria = request.body.categoria;
        const preco_custo = request.body.preco_custo;
        const preco_venda = request.body.preco_venda;
        const estoque_minimo = request.body.estoque_minimo;

        if (!nome || !categoria || !preco_custo || !preco_venda || !estoque_minimo) {
            return reply.status(400).send({ error: "Todos os campos são obrigatórios!" });
        }
        if(preco_custo < 0){
            return reply.status(400).send({ error: "Preco de custo deve ser maior que 0!" });
        }
        if(preco_venda < 0){
            return reply.status(400).send({ error: "Preco de venda deve ser maior que 0!" });
        }
        if(estoque_minimo < 0){
            return reply.status(400).send({ error: "Estoque minimo deve ser maior que 0!" });
        }
        const query = `
            INSERT INTO Produtos (nome, categoria, preco_custo, preco_venda, estoque_minimo) 
            VALUES ($1, $2, $3, $4, $5);
        `;
        const resultado = await sql.query(query, [nome, categoria, preco_custo, preco_venda, estoque_minimo]);
        return reply.status(201).send({ message: "Produto criado com sucesso!" });
    });

    servidor.get('/produtos', async (request, reply) => {
        const resultado = await sql.query('SELECT * FROM Produtos ORDER BY id ASC;');
        return reply.status(200).send(resultado.rows);
    });

    servidor.get('/produtos/:id', async (request, reply) => {
        const id = request.params.id;

        const resultado = await sql.query('SELECT * FROM Produtos WHERE id = $1;', [id]);

        if (resultado.rows.length === 0) {
            return reply.status(404).send({ error: `Produto com o id: ${id} não encontrado` });
        }

        return reply.status(200).send(resultado.rows[0]);
    });

    servidor.put('/produtos/:id', async (request, reply) => {
        const nome = request.body.nome;
        const categoria = request.body.categoria;
        const preco_custo = request.body.preco_custo;
        const preco_venda = request.body.preco_venda;
        const estoque_minimo = request.body.estoque_minimo;
        const id = request.params.id;

        if (!nome || !categoria || !preco_custo || !preco_venda || estoque_minimo === undefined) {
            return reply.status(400).send(
                { error: "Todos os campos são obrigatórios!" }
            )
        } else if (!id) {
            return reply.status(400).send({
                error: "Faltou o id!"
            })
        }

        const existe = await sql.query('SELECT * FROM Produtos WHERE id = $1', [id])

        if (existe.rows.length === 0) {
            return reply.status(400).send({
                error: `Produto com o id: ${id} não existe`
            })
        }

        const resultado = await sql.query('UPDATE Produtos SET nome = $1, categoria = $2, preco_custo = $3 , preco_venda = $4, estoque_minimo = $5 WHERE id = $6', [ nome, categoria, preco_custo, preco_venda, estoque_minimo, id])
        return reply.status(200).send({ message: "Produto editado com sucesso!" })
    })

    servidor.delete('/produtos/:id', async (request, reply) => {
    const id = request.params.id

    const existe = await sql.query('SELECT * FROM Produtos WHERE id = $1', [id])

        if (existe.rows.length === 0) {
            return reply.status(400).send({
                error: `Produto com o id: ${id} não existe!`
            })
        }

    const resultado = await sql.query('DELETE FROM Produtos WHERE id = $1', [id])      
    return reply.send({ message: "Produto deletado com sucesso!" }).status(200)
})
}