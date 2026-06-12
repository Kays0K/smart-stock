import Fastify from 'fastify'
import { Pool } from 'pg'
import cors from '@fastify/cors'
import 'dotenv/config';

const sql = new Pool({
    user: "kayson",
    password: "12345",
    host: "localhost",
    port: 5432,
    database: "smartstock"
})

const server = Fastify()

server.listen({
    port: 3000
})