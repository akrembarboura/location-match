# 🚀 LOC MAISON — Database Indexing, Pool Caching & Scalability Roadmap

> 📌 **DOCUMENT PROPERTIES**
> - **Category**: Database Optimization, Indexing, & Distributed Systems
> - **Stack**: MongoDB Atlas, Mongoose, Serverless Connection Pooling, Redis Caching
> - **Authoritative Literature References**:
>   - 📚 *Designing Data-Intensive Applications* by Martin Kleppmann
>   - 📚 *MongoDB: The Definitive Guide* by Shannon Bradshaw, Eoin Brazil, & Kristina Chodorow
>   - 📚 *Database Internals: A Deep Dive into How Distributed Data Systems Work* by Alex Petrov

---

## 📌 Executive Summary

This specification defines the database performance engineering strategy for LOC MAISON, including compound indexing, serverless connection pooling, TTL cache expiration, and distributed queue roadmaps.

---

## ⚡ 1. MongoDB Compound Indexing Strategy

To eliminate N+1 query bottlenecks as listings scale past 100,000 documents:

```typescript
// Property Schema compound indexes for high-speed search filtering
PropertySchema.index({ status: 1, category: 1, city: 1, price: 1 });
PropertySchema.index({ ownerId: 1, status: 1 });

// Reservation compound indexes
ReservationSchema.index({ propertyId: 1, status: 1, checkIn: 1, checkOut: 1 });
HousingRequestSchema.index({ status: 1, createdAt: -1 });

// TTL Expiration Index for OTP challenges (Automatically purged by MongoDB)
OTPChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

## 🏊 2. Serverless Connection Pooling (`connectToDatabase`)

Next.js API routes run in serverless environments. To prevent socket exhaustion on MongoDB Atlas:

```typescript
import mongoose from "mongoose";

let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI!, {
      bufferCommands: false,
      maxPoolSize: 10, // Maintain max 10 sockets per serverless container
    }).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

---

## 🚀 3. Scalability Roadmap

```
[Phase 1: Current Monolith] ──▶ Serverless Next.js + MongoDB Connection Pool
[Phase 2: High Traffic]    ──▶ Add Redis Cluster (Rate Limiting Counters + Session Tokens)
[Phase 3: Global Scale]    ──▶ Add BullMQ Job Queue Workers for Async Email & Cloudinary Tasks
```

---

## 📚 4. Engineering Literature References

- 📘 **Kleppmann, M. (2017).** *Designing Data-Intensive Applications*. Indexing, partitioning, transactions, and distributed consensus.
- 📙 **Bradshaw, S., Brazil, E., & Chodorow, K. (2019).** *MongoDB: The Definitive Guide*. Index design, connection pooling, and aggregation pipelines.
