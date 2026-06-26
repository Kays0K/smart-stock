import Fastify from 'fastify';
import { Pool } from 'pg';
import cors from '@fastify/cors';
import 'dotenv/config';
import produtosRotas from './rotas/produtos.js';
import fastifyJwt from '@fastify/jwt';
import authRotas from './rotas/authenticação.js';
import lotesRotas from './rotas/lotes.js';
import movimentacoesRotas from './rotas/movimentacoes.js';

const sql = new Pool({
    user: "kayson",
    password: "12345",
    host: "localhost",
    port: 5432,
    database: "smartstock"
});

const servidor = Fastify();

servidor.decorate('sql', sql);

//--------------------------------------------------------------------------------

servidor.register(produtosRotas);
servidor.register(authRotas);
servidor.register(lotesRotas);
servidor.register(movimentacoesRotas);

//--------------------------------------------------------------------------------

servidor.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] 
});

//--------------------------------------------------------------------------------

servidor.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'smartstock_secret_key_123'
});

//--------------------------------------------------------------------------------

servidor.listen({
    port: 3000
});