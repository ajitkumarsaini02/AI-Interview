import { MongoClient, Db } from 'mongodb';
import { Candidate, CandidatesData } from '../types/candidate';
import { AskedQuestion, AnswerEvaluation, FinalFeedback, DifficultyLevel, InterviewSession } from '../types/interview';
import fs from 'fs';
import path from 'path';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'interview_agent';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function isMongoConfigured(): boolean {
  return Boolean(uri && uri.trim().length > 0);
}

export async function getMongoDb(): Promise<Db | null> {
  if (!isMongoConfigured() || !uri) return null;

  try {
    if (process.env.NODE_ENV === 'development') {
      if (!global._mongoClientPromise) {
        client = new MongoClient(uri);
        global._mongoClientPromise = client.connect();
      }
      clientPromise = global._mongoClientPromise;
    } else {
      client = new MongoClient(uri);
      clientPromise = client.connect();
    }

    const connectedClient = await clientPromise;
    return connectedClient.db(dbName);
  } catch (err) {
    console.warn('MongoDB Connection Warning:', err);
    return null;
  }
}

// Seed candidates into MongoDB if collection is empty
export async function seedMongoCandidatesIfEmpty(): Promise<void> {
  const db = await getMongoDb();
  if (!db) return;

  try {
    const collection = db.collection('candidates');
    const count = await collection.countDocuments();
    if (count === 0) {
      const candidatesJsonPath = path.join(process.cwd(), 'candidates.json');
      if (fs.existsSync(candidatesJsonPath)) {
        const content = fs.readFileSync(candidatesJsonPath, 'utf-8');
        const parsed = JSON.parse(content) as CandidatesData;
        const mongoDocs = parsed.candidates.map((c) => ({
          _id: c.member.id as any,
          id: c.member.id,
          member: c.member,
          missions: c.missions || [],
          signals: c.signals || {},
          createdAt: new Date(),
        }));
        await collection.insertMany(mongoDocs);
        console.log(`[MongoDB Atlas] Seeded ${mongoDocs.length} initial candidate profiles.`);
      }
    }
  } catch (err) {
    console.warn('MongoDB Candidate Seed Warning:', err);
  }
}

// MongoDB Candidate Data Operations
export async function mongoGetCandidates(): Promise<Candidate[] | null> {
  const db = await getMongoDb();
  if (!db) return null;

  try {
    await seedMongoCandidatesIfEmpty();
    const docs = await db.collection('candidates').find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((doc: any) => ({
      member: doc.member,
      missions: doc.missions || [],
      signals: doc.signals || {},
    }));
  } catch (err) {
    console.warn('MongoDB mongoGetCandidates error:', err);
    return null;
  }
}

export async function mongoGetCandidateById(id: string): Promise<Candidate | null> {
  const db = await getMongoDb();
  if (!db) return null;

  try {
    const doc: any = await db.collection('candidates').findOne({ 'member.id': id });
    if (!doc) return null;
    return {
      member: doc.member,
      missions: doc.missions || [],
      signals: doc.signals || {},
    };
  } catch (err) {
    console.warn('MongoDB mongoGetCandidateById error:', err);
    return null;
  }
}

export async function mongoAddCandidate(candidate: Candidate): Promise<boolean> {
  const db = await getMongoDb();
  if (!db) return false;

  try {
    await db.collection('candidates').updateOne(
      { 'member.id': candidate.member.id },
      {
        $set: {
          id: candidate.member.id,
          member: candidate.member,
          missions: candidate.missions || [],
          signals: candidate.signals || {},
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.warn('MongoDB mongoAddCandidate error:', err);
    return false;
  }
}

export async function mongoDeleteCandidate(id: string): Promise<boolean> {
  const db = await getMongoDb();
  if (!db) return false;

  try {
    await db.collection('candidates').deleteOne({ 'member.id': id });
    return true;
  } catch (err) {
    console.warn('MongoDB mongoDeleteCandidate error:', err);
    return false;
  }
}

// MongoDB Session Operations
export async function mongoGetSession(sessionId: string): Promise<InterviewSession | null> {
  const db = await getMongoDb();
  if (!db) return null;

  try {
    const doc: any = await db.collection('sessions').findOne({ sessionId });
    if (!doc) return null;
    return doc.sessionData as InterviewSession;
  } catch (err) {
    console.warn('MongoDB mongoGetSession error:', err);
    return null;
  }
}

export async function mongoSetSession(sessionId: string, session: InterviewSession): Promise<boolean> {
  const db = await getMongoDb();
  if (!db) return false;

  try {
    await db.collection('sessions').updateOne(
      { sessionId },
      {
        $set: {
          sessionId,
          candidateId: session.candidate.member.id,
          questionCount: session.questionCount,
          completed: session.completed,
          sessionData: session,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.warn('MongoDB mongoSetSession error:', err);
    return false;
  }
}
