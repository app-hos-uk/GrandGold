"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
exports.default = ({ env }) => {
    const client = env('DATABASE_CLIENT', 'sqlite');
    const sqlitePath = env('DATABASE_FILENAME') || path_1.default.join(os_1.default.homedir(), '.grandgold-cms', 'dev.db');
    if (client === 'sqlite' && !env('DATABASE_FILENAME')) {
        const dir = path_1.default.dirname(sqlitePath);
        fs_1.default.mkdirSync(dir, { recursive: true, mode: 0o755 });
    }
    const connections = {
        postgres: {
            connection: {
                host: env('DATABASE_HOST', 'localhost'),
                port: env.int('DATABASE_PORT', 5432),
                database: env('DATABASE_NAME', 'grandgold_cms'),
                user: env('DATABASE_USERNAME', 'postgres'),
                password: env('DATABASE_PASSWORD', 'password'),
                ssl: env.bool('DATABASE_SSL', false) && {
                    rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
                },
            },
            pool: {
                min: env.int('DATABASE_POOL_MIN', 2),
                max: env.int('DATABASE_POOL_MAX', 10),
            },
        },
        sqlite: {
            connection: {
                filename: path_1.default.isAbsolute(sqlitePath) ? sqlitePath : path_1.default.join(__dirname, '..', sqlitePath),
                options: { readonly: false },
            },
            useNullAsDefault: true,
        },
    };
    return {
        connection: {
            client,
            ...connections[client],
            acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
        },
    };
};
