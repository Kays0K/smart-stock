import Fastify from 'fastify'
import { Pool } from 'pg'
import cors from '@fastify/cors'
import 'dotenv/config';
import produtosRotas from './rotas/produtos.js'

const sql = new Pool({
    user: "kayson",
    password: "12345",
    host: "localhost",
    port: 5432,
    database: "smartstock"
})

const servidor = Fastify()

servidor.decorate('sql', sql)

servidor.register(produtosRotas)

servidor.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] 
})

servidor.listen({
    port: 3000
})