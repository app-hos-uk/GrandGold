"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = [
    'strapi::logger',
    'strapi::errors',
    {
        name: 'strapi::security',
        config: {
            contentSecurityPolicy: {
                useDefaults: true,
                directives: {
                    'connect-src': ["'self'", 'https:'],
                    'img-src': [
                        "'self'",
                        'data:',
                        'blob:',
                        'market-assets.strapi.io',
                        'res.cloudinary.com',
                    ],
                    'media-src': [
                        "'self'",
                        'data:',
                        'blob:',
                        'market-assets.strapi.io',
                        'res.cloudinary.com',
                    ],
                    upgradeInsecureRequests: null,
                },
            },
        },
    },
    {
        name: 'strapi::cors',
        config: {
            enabled: true,
            headers: '*',
            origin: ['http://localhost:3000', 'http://localhost:4000', 'https://*.grandgold.com'],
        },
    },
    'strapi::poweredBy',
    'strapi::query',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
];
