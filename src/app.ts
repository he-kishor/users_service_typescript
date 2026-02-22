import 'dotenv/config';
import express from 'express';
import  {connectDB} from './db/dbconnect';
import Routes from './routes/route';
import { logger } from './middlewares/middleware';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import './services/passport';
import dotenv from 'dotenv';

dotenv.config();


const app = express();

// Middleware
app.use(express.json());
app.use(logger);
app.use(cookieParser());

const allowedOrigins = [
  'http://localhost:3000',
  'https://taskmanageapp-production.up.railway.app'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Session Middleware
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: 'session secret',
  })
);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Simple get method
app.get("/", (req, res) => {
  return res.send("Welcome in authentication and authorization");
});

// User route
app.use("/api", Routes);

const PORT = process.env.PORT || 3003;

// Connect to the database and then start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`The server is running on the port ${PORT}`);
  });
});