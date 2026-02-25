import dotenv from 'dotenv';
dotenv.config(); 

import http from 'http';
import os from 'os';
import express, { Request, Response, NextFunction } from 'express';
import actuator from 'express-actuator';          // npm i express-actuator
import passport from 'passport';
import session from 'express-session';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt, { JwtPayload } from 'jsonwebtoken';


import logger from './utils/logger';
import './config/passport';
import { connectDB, disconnectDB, getDBStatus } from './db/dbconnect';
import Routes from './routes/route';
import { loggerr } from './middlewares/middleware';


interface CustomRequest extends Request {
  userId?: string;
}

interface CustomJwtPayload extends JwtPayload {
  id: string;
}

const PORT     = process.env.PORT     || 3003;
const HOST     = process.env.HOST     || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

let server: http.Server;
let isShuttingDown = false;
let isReady        = false;   // flips true only after ALL services connect
const startedAt    = Date.now();


// ═════════════════════════════════════════════════════════════════════════════
//  EXPRESS APP
// ═════════════════════════════════════════════════════════════════════════════
const app = express();

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerr);
app.use(cookieParser());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000'
];


app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);


// ── Session ───────────────────────────────────────────────────────────────────
app.use(
  session({
    resave:            false,
    saveUninitialized: false,
    secret:            process.env.SESSION_SECRET!, // never fall back to a hardcoded string
  })
);


// ── Passport ──────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());


// ── Reject incoming requests during shutdown ──────────────────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
  if (isShuttingDown) {
    res.set('Connection', 'close');
    return res.status(503).json({ error: 'Server is shutting down, try again shortly' });
  }
  next();
});


// ═════════════════════════════════════════════════════════════════════════════
//  ACTUATOR  (express-actuator package)
//
//  What the package gives for free at /actuator/* :
//    /actuator/info    → name, version, description from package.json + git info
//    /actuator/metrics → heap, rss, uptime  (basic — we extend with /actuator/system)
//
//  What I add via customEndpoints:
//    /actuator/health    → real DB + future service status  (overrides built-in)
//    /actuator/liveness  → is the process alive?            (k8s liveness probe)
//    /actuator/readiness → ready to serve traffic?          (k8s readiness probe)
//    /actuator/system    → full OS + memory breakdown
// ═════════════════════════════════════════════════════════════════════════════

app.use(
  actuator({
    basePath: '/actuator',

    // Injected into /actuator/info under the "build" key
    infoBuildOptions: {
      env:  NODE_ENV,
      node: process.version,
      pid:  process.pid,
    },

    customEndpoints: [

      // ── /actuator/health ─────────────────────────────────────────────────
      // Overrides the built-in health so I control what "healthy" means.
      // Returns 200 when all services are UP, 503 otherwise.
      {
        id: 'health',
        controller: (_req: Request, res: Response) => {
          const db = getDBStatus();
          // const redis    = getRedisStatus();


          const allUp = db.connected;
          // const allUp = db.connected && redis.connected 

          res.status(allUp ? 200 : 503).json({
            status:  allUp ? 'UP' : 'DOWN',
            ready:   isReady,
            uptime:  formatUptime(Date.now() - startedAt),
            components: {
              db: {
                status:     db.connected ? 'UP' : 'DOWN',
                readyState: db.readyState,
                //  0 = disconnected
                //  1 = connected    ← only healthy state
                //  2 = connecting
                //  3 = disconnecting
              },
              // redis:    { status: redis.connected    ? 'UP' : 'DOWN' },
              
            },
          });
        },
      },

      // ── /actuator/liveness ───────────────────────────────────────────────
      // "Is the process alive and not in a bad state?"
      // k8s liveness probe — failure here causes a POD RESTART.
      // Rule: NEVER check DB or external services here. Only check the process itself.
      {
        id: 'liveness',
        controller: (_req: Request, res: Response) => {
          if (isShuttingDown) {
            return res.status(503).json({ status: 'SHUTTING_DOWN' });
          }
          res.json({
            status: 'ALIVE',
            pid:    process.pid,
            uptime: formatUptime(Date.now() - startedAt),
          });
        },
      },

      // ── /actuator/readiness ──────────────────────────────────────────────
      // "Is the app ready to receive traffic?"
      // k8s readiness probe — failure stops traffic routing WITHOUT restarting.
      // This goes 503 during startup (before DB connects) and during shutdown.
      // Zero-downtime deploys rely on this — new pod is only sent traffic
      // once it returns 200 here.
      {
        id: 'readiness',
        controller: (_req: Request, res: Response) => {
          if (!isReady || isShuttingDown) {
            return res.status(503).json({
              status: isShuttingDown ? 'SHUTTING_DOWN' : 'STARTING_UP',
            });
          }
          res.json({ status: 'READY' });
        },
      },

      // ── /actuator/system ─────────────────────────────────────────────────
      // Full OS + process memory stats — more detail than /actuator/metrics.
     
      {
        id: 'system',
        controller: (req: CustomRequest, res: Response) => {

    try {
            // ── 1. Extract token (supports Bearer header OR httpOnly cookie) ──────
            const token = req.cookies?.authToken;
            const JWT_SECRET = process.env.JWT_SECRET as string

            if (!token) {
              logger.warn('Unauthorized access attempt: No auth token found in cookies');
              return res.status(401).json({ message: 'Access Denied' });
            }
        
        const decoded = jwt.verify(token, JWT_SECRET) as CustomJwtPayload;
          
            // ── 3. Check admin role ───────────────────────────────────────────────
            if (decoded.role !== 'admin') {
              logger.warn(`🚫 Actuator access denied — user=${decoded.id} role=${decoded.role}`);
              res.status(403).json({
                error:  'Forbidden',
                reason: 'Admin role required',
              });
              return;
            }

            logger.info(`🔐 Actuator accessed — user=${decoded.id} role=${decoded.role}`);
            

        } catch (error: any) {
          // Covers: TokenExpiredError, JsonWebTokenError, NotBeforeError
          const isExpired = error.name === 'TokenExpiredError';

          res.status(401).json({
            error:  'Unauthorized',
            reason: isExpired ? 'Token expired' : 'Invalid token',
          });
        }


          const mem  = process.memoryUsage();
          const load = os.loadavg();

          res.json({
            process: {
              uptime:  formatUptime(Date.now() - startedAt),
              pid:     process.pid,
              version: process.version,
            },
            memory: {
              heapUsed:     toMB(mem.heapUsed),
              heapTotal:    toMB(mem.heapTotal),
              rss:          toMB(mem.rss),
              external:     toMB(mem.external),
              arrayBuffers: toMB(mem.arrayBuffers),
            },
            os: {
              platform:    os.platform(),
              arch:        os.arch(),
              cpuCount:    os.cpus().length,
              cpuModel:    os.cpus()[0]?.model,
              loadAvg:     {
                '1m':  load[0].toFixed(2),
                '5m':  load[1].toFixed(2),
                '15m': load[2].toFixed(2),
              },
              totalMemory: toMB(os.totalmem()),
              freeMemory:  toMB(os.freemem()),
              hostname:    os.hostname(),
            },
          });
        },
      },
    ],
  })
);


// ═════════════════════════════════════════════════════════════════════════════
//  APPLICATION ROUTES
// ═════════════════════════════════════════════════════════════════════════════
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'API is running', status: 'UP' });
});

app.use('/api', Routes);

// ── Global error handler — MUST be last middleware ────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Unhandled request error — ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});


// ═════════════════════════════════════════════════════════════════════════════
//  STARTUP — connect services in dependency order, THEN open HTTP
// ═════════════════════════════════════════════════════════════════════════════
async function startServer(): Promise<void> {
  logger.info(`⏳ Starting server [env=${NODE_ENV}] ...`);

  // 1. Connect external services — order matters, add new ones here
  await connectDB();
  logger.info('✅ MongoDB connected');

  // await connectRedis();    logger.info('✅ Redis connected');
 
  // 2. Create HTTP server — use http.createServer() NOT app.listen()
  //    so we hold the server reference for shutdown + WebSocket upgrades later
  server = http.createServer(app);
  // initWebSocket(server);  // ← WebSocket must attach before listen()

  await new Promise<void>((resolve, reject) => {
    server.listen(Number(PORT), HOST as string, () => resolve());
    server.once('error', reject);

  });

  // 3. Mark ready — /actuator/readiness now returns 200
  isReady = true;
  logger.info(`🚀 Server ready  →  http://${HOST}:${PORT}`);
  logger.info(`   Health check  →  http://${HOST}:${PORT}/actuator/health`);

  // 4. Register OS signal handlers AFTER a successful start
  registerShutdownHandlers();
}


// ═════════════════════════════════════════════════════════════════════════════
//  GRACEFUL SHUTDOWN — drain HTTP connections, close services in reverse order
// ═════════════════════════════════════════════════════════════════════════════
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;   // guard against duplicate calls
  isShuttingDown = true;
  isReady        = false;       // readiness probe goes red immediately

  logger.info(`🛑 ${signal} — graceful shutdown started`);

  // Safety net: force-exit if something hangs (stuck DB pool, etc.)
  const forceKill = setTimeout(() => {
    logger.error('⚠️  Shutdown timed out after 15s — forcing exit');
    process.exit(1);
  }, 15_000);
  forceKill.unref();

  try {
    // 1. Stop accepting new connections.
    //    server.close() lets existing in-flight requests finish naturally.
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    logger.info('✅ HTTP server closed (in-flight requests finished)');

    // 2. Close services in REVERSE startup order — dependents before dependencies
    // await closeWebSocket();
    // await disconnectRedis();    logger.info('✅ Redis disconnected');
    await disconnectDB();
    logger.info('✅ MongoDB disconnected');

    clearTimeout(forceKill);
    logger.info('👋 Shutdown complete');
    process.exit(0);

  } catch (err:any) {
    logger.error(`${err.message }❌ Error during shutdown`);
    process.exit(1);
  }
}


// ═════════════════════════════════════════════════════════════════════════════
//  SIGNAL HANDLERS
// ═════════════════════════════════════════════════════════════════════════════
function registerShutdownHandlers(): void {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Railway / Docker / k8s
  process.on('SIGINT',  () => gracefulShutdown('SIGINT'));  // Ctrl+C in local dev

  // Unhandled promise rejection — loud log then clean shutdown
  process.on('unhandledRejection', (reason) => {
    logger.error(`${ reason },💥 Unhandled Promise Rejection`);
    gracefulShutdown('unhandledRejection');
  });

  // Synchronous crash — same approach
  process.on('uncaughtException', (err:any) => {
    logger.error(`${ err },💥 Uncaught Exception`);
    gracefulShutdown('uncaughtException');
  });
}


// ── Helpers ───────────────────────────────────────────────────────────────────
function toMB(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
}


// ═════════════════════════════════════════════════════════════════════════════
//  BOOT
// ═════════════════════════════════════════════════════════════════════════════
startServer().catch((err) => {
  logger.error(`${ err },❌ Server failed to start`);
  process.exit(1);
});