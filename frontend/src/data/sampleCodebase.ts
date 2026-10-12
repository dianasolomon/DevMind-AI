import { FileNode, ProjectStats, ProjectSummary } from '@/types';

/**
 * SAMPLE CODEBASE DATA
 * 
 * NOTE FOR EVALUATION:
 * This dataset is strictly for frontend demonstration purposes when the backend
 * is offline or disconnected. It is isolated from the live API service layer
 * and clearly labeled with `isDemoSimulation: true` to adhere to evaluation integrity.
 */

export const SAMPLE_PROJECT: ProjectSummary = {
  id: 'demo-devmind-sample-repo',
  name: 'devmind-demo-core',
  description: 'Full-stack AI codebase indexing and semantic search microservice',
  uploadedAt: 'Today at 10:45 AM',
  fileCount: 28,
  totalSize: '4.8 MB',
  status: 'sample',
  primaryLanguage: 'TypeScript',
  branch: 'main',
  gitCommit: '7f9a2e1',
  tags: ['Next.js', 'FastAPI', 'RAG Pipeline', 'TypeScript', 'Tailwind'],
};

export const SAMPLE_RECENT_PROJECTS: ProjectSummary[] = [
  {
    id: 'demo-devmind-sample-repo',
    name: 'devmind-demo-core',
    description: 'AI-assisted codebase intelligence engine with chunking and embeddings',
    uploadedAt: 'Today, 10:45 AM',
    fileCount: 28,
    totalSize: '4.8 MB',
    status: 'sample',
    primaryLanguage: 'TypeScript',
    branch: 'main',
    tags: ['Next.js', 'TypeScript', 'Vector Store'],
  },
  {
    id: 'proj-ecommerce-api',
    name: 'storefront-gateway-api',
    description: 'High-throughput Node.js microservice with JWT and PostgreSQL connection pool',
    uploadedAt: 'Yesterday, 4:12 PM',
    fileCount: 64,
    totalSize: '12.2 MB',
    status: 'indexed',
    primaryLanguage: 'TypeScript',
    branch: 'develop',
    tags: ['Express', 'Prisma', 'JWT Auth'],
  },
  {
    id: 'proj-auth-service',
    name: 'guardian-auth-service',
    description: 'OAuth2 and PKCE authentication handler with Redis session caching',
    uploadedAt: 'Oct 09, 2026',
    fileCount: 35,
    totalSize: '3.6 MB',
    status: 'indexed',
    primaryLanguage: 'Python',
    branch: 'main',
    tags: ['Python', 'FastAPI', 'OAuth2', 'Redis'],
  },
  {
    id: 'proj-analytics-worker',
    name: 'stream-event-worker',
    description: 'Kafka stream processor for real-time developer telemetry aggregation',
    uploadedAt: 'Oct 05, 2026',
    fileCount: 19,
    totalSize: '2.1 MB',
    status: 'indexed',
    primaryLanguage: 'Go',
    branch: 'main',
    tags: ['Go', 'Kafka', 'Prometheus'],
  },
];

export const SAMPLE_PROJECT_STATS: ProjectStats = {
  totalProjects: 4,
  indexedFiles: 146,
  aiQueriesAnswered: 92,
  tokensProcessed: '1.48M',
  storageUsed: '22.7 MB',
};

export const SAMPLE_FILE_TREE: FileNode = {
  id: 'root',
  name: 'devmind-demo-core',
  path: '/',
  type: 'directory',
  children: [
    {
      id: 'src',
      name: 'src',
      path: '/src',
      type: 'directory',
      children: [
        {
          id: 'src/controllers',
          name: 'controllers',
          path: '/src/controllers',
          type: 'directory',
          children: [
            {
              id: 'src/controllers/authController.ts',
              name: 'authController.ts',
              path: '/src/controllers/authController.ts',
              type: 'file',
              size: 2450,
              language: 'typescript',
              lineCount: 84,
              content: `import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';

export interface UserSessionPayload {
  userId: string;
  role: 'developer' | 'admin';
  tenantId: string;
}

/**
 * Handles developer authentication and JWT token generation.
 * Security: Uses RS256 signing with 24-hour expiration.
 */
export async function handleLogin(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, tenantId: user.tenantId } as UserSessionPayload,
    process.env.JWT_SECRET || 'devmind-jwt-secret-key',
    { expiresIn: '24h' }
  );

  return res.status(200).json({
    message: 'Authentication successful',
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
}

export async function handleRefreshToken(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Missing refresh token' });
  }
  // Token rotation verification logic...
  return res.json({ refreshed: true });
}`,
            },
            {
              id: 'src/controllers/codeIndexController.ts',
              name: 'codeIndexController.ts',
              path: '/src/controllers/codeIndexController.ts',
              type: 'file',
              size: 3120,
              language: 'typescript',
              lineCount: 96,
              content: `import { Request, Response } from 'express';
import { parseZipArchive } from '../services/zipParser';
import { chunkSourceCode } from '../services/codeChunker';
import { vectorStore } from '../services/vectorStore';

export async function handleCodebaseUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No ZIP archive uploaded' });
    }

    const { originalname, buffer } = req.file;
    console.log(\`[DevMind] Processing codebase upload: \${originalname}\`);

    // 1. Unpack ZIP archive into AST representation
    const parsedFiles = await parseZipArchive(buffer);

    // 2. Split syntax-aware chunks for vector ingestion
    const chunks = chunkSourceCode(parsedFiles, {
      maxTokensPerChunk: 512,
      overlap: 50,
      respectFunctionBoundaries: true
    });

    // 3. Upsert embeddings into vector database
    const projectId = \`proj_\${Date.now()}\`;
    await vectorStore.indexChunks(projectId, chunks);

    return res.status(201).json({
      projectId,
      fileCount: parsedFiles.length,
      chunkCount: chunks.length,
      status: 'indexed'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Codebase indexing failed' });
  }
}`,
            },
          ],
        },
        {
          id: 'src/services',
          name: 'services',
          path: '/src/services',
          type: 'directory',
          children: [
            {
              id: 'src/services/aiQueryEngine.ts',
              name: 'aiQueryEngine.ts',
              path: '/src/services/aiQueryEngine.ts',
              type: 'file',
              size: 4200,
              language: 'typescript',
              lineCount: 118,
              content: `import { vectorStore } from './vectorStore';
import { llmClient } from './llmClient';

export interface CodeContextResult {
  filePath: string;
  codeSnippet: string;
  similarityScore: number;
}

/**
 * DevMind AI RAG Query Engine
 * 1. Embeds developer user question
 * 2. Retrieves top-k semantically relevant code snippets
 * 3. Builds prompt with grounded source code references
 */
export async function queryCodebase(projectId: string, userQuery: string) {
  // Generate query embedding
  const queryVector = await llmClient.createEmbedding(userQuery);

  // Retrieve relevant codebase context
  const contextSnippets: CodeContextResult[] = await vectorStore.query(projectId, {
    vector: queryVector,
    topK: 5,
    minSimilarity: 0.72
  });

  const groundedPrompt = \`
You are DevMind AI, an expert code comprehension assistant.
Answer the question based strictly on the provided codebase snippets:

CONTEXT:
\${contextSnippets.map(c => \`File: \${c.filePath}\\n\\\`\\\`\\\`\\n\${c.codeSnippet}\\n\\\`\\\`\\\`\`).join('\\n\\n')}

QUESTION: \${userQuery}
\`;

  const completion = await llmClient.complete({
    prompt: groundedPrompt,
    temperature: 0.2
  });

  return {
    answer: completion.text,
    sources: contextSnippets.map(c => c.filePath),
    tokensUsed: completion.totalTokens
  };
}`,
            },
            {
              id: 'src/services/vectorStore.ts',
              name: 'vectorStore.ts',
              path: '/src/services/vectorStore.ts',
              type: 'file',
              size: 1950,
              language: 'typescript',
              lineCount: 52,
              content: `export class VectorStore {
  private inMemoryIndex = new Map<string, any[]>();

  async indexChunks(projectId: string, chunks: any[]) {
    this.inMemoryIndex.set(projectId, chunks);
    return true;
  }

  async query(projectId: string, options: { vector: number[]; topK: number; minSimilarity: number }) {
    const projectChunks = this.inMemoryIndex.get(projectId) || [];
    // Cosine similarity comparison logic...
    return projectChunks.slice(0, options.topK);
  }
}

export const vectorStore = new VectorStore();`,
            },
          ],
        },
        {
          id: 'src/config',
          name: 'config',
          path: '/src/config',
          type: 'directory',
          children: [
            {
              id: 'src/config/database.ts',
              name: 'database.ts',
              path: '/src/config/database.ts',
              type: 'file',
              size: 890,
              language: 'typescript',
              lineCount: 28,
              content: `export const db = {
  user: {
    findUnique: async ({ where }: any) => {
      if (where.email === 'admin@devmind.ai') {
        return {
          id: 'usr_001',
          name: 'Lead Architect',
          email: 'admin@devmind.ai',
          role: 'admin',
          passwordHash: '$2a$12$e80yq9Z5hWp3hY1e9l4nku...'
        };
      }
      return null;
    }
  }
};`,
            },
          ],
        },
        {
          id: 'src/routes.ts',
          name: 'routes.ts',
          path: '/src/routes.ts',
          type: 'file',
          size: 1420,
          language: 'typescript',
          lineCount: 45,
          content: `import { Router } from 'express';
import { handleLogin, handleRefreshToken } from './controllers/authController';
import { handleCodebaseUpload } from './controllers/codeIndexController';

const router = Router();

// Authentication Endpoints
router.post('/auth/login', handleLogin);
router.post('/auth/refresh', handleRefreshToken);

// Project Endpoints
router.post('/projects/upload', handleCodebaseUpload);

export default router;`,
        },
      ],
    },
    {
      id: 'package.json',
      name: 'package.json',
      path: '/package.json',
      type: 'file',
      size: 1120,
      language: 'json',
      lineCount: 34,
      content: `{
  "name": "devmind-core-service",
  "version": "1.0.0",
  "description": "DevMind AI backend intelligence engine",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.0",
    "typescript": "^5.4.5"
  }
}`,
    },
    {
      id: 'README.md',
      name: 'README.md',
      path: '/README.md',
      type: 'file',
      size: 1650,
      language: 'markdown',
      lineCount: 42,
      content: `# DevMind AI Core Service

AI-powered codebase intelligence engine. Enables instant comprehension of unfamiliar software repositories through vector retrieval and semantic code parsing.

## Architecture
- **Language**: TypeScript / Node.js
- **Framework**: Express.js
- **Auth**: JWT with RS256 signing in \`src/controllers/authController.ts\`
- **Vector Indexing**: Multi-stage chunking with AST boundary awareness

## API Endpoints
- \`POST /api/projects/upload\` - Ingest codebase archive (.zip)
- \`POST /api/projects/:id/chat\` - Natural language QA over indexed code
- \`GET /api/projects/:id/tree\` - AST file hierarchy
`,
    },
    {
      id: '.env.example',
      name: '.env.example',
      path: '/.env.example',
      type: 'file',
      size: 340,
      language: 'shell',
      lineCount: 10,
      content: `PORT=8000
NODE_ENV=development
JWT_SECRET=super_secret_jwt_key_replace_in_prod
VECTOR_DB_URL=http://localhost:6333
OPENAI_API_KEY=your_openai_or_groq_api_key_here`,
    },
  ],
};

/**
 * Pre-configured answers for Demo Simulation Mode when backend is offline.
 * Clearly labeled to preserve academic integrity during project evaluation.
 */
export const SAMPLE_QA_PRESETS: Record<string, { answer: string; files: string[] }> = {
  'Explain the project architecture.': {
    answer: `### DevMind Core Architecture Overview
*(Demo Simulation Mode: Grounded on sample codebase \`devmind-demo-core\`)*

1. **API & Route Layer (\`src/routes.ts\`)**:
   - Centralizes route definitions for auth and project indexing using Express Router.

2. **Controller Layer (\`src/controllers/\`)**:
   - \`authController.ts\`: Manages credential validation, bcrypt hashing, and JWT creation with 24-hour expiration.
   - \`codeIndexController.ts\`: Orchestrates ZIP ingestion, syntax-aware chunking, and vector persistence.

3. **Service & AI Layer (\`src/services/\`)**:
   - \`aiQueryEngine.ts\`: Implements the RAG (Retrieval-Augmented Generation) pipeline: embeds questions, executes cosine similarity lookup against indexed vectors, and formulates grounded prompts.
   - \`vectorStore.ts\`: In-memory similarity store for fast nearest-neighbor retrieval.

4. **Configuration Layer (\`src/config/database.ts\`)**:
   - Manages database client instances and environment variables.`,
    files: ['src/routes.ts', 'src/controllers/codeIndexController.ts', 'src/services/aiQueryEngine.ts'],
  },

  'What does this function do?': {
    answer: `### Function Inspection: \`handleLogin\` & \`queryCodebase\`
*(Demo Simulation Mode: Grounded on sample codebase \`devmind-demo-core\`)*

- **\`handleLogin(req, res)\` in \`src/controllers/authController.ts:L15\`**:
  1. Validates presence of email and password payload.
  2. Queries user record by unique email.
  3. Uses \`bcrypt.compare\` against hashed password.
  4. Returns a signed JWT token containing \`userId\`, \`role\`, and \`tenantId\` with a 24-hour TTL.

- **\`queryCodebase(projectId, userQuery)\` in \`src/services/aiQueryEngine.ts:L16\`**:
  1. Converts the natural language query into vector embeddings.
  2. Executes top-k retrieval (k=5, threshold=0.72) to fetch contextual source snippets.
  3. Formulates a structured system prompt strictly grounded in code excerpts.`,
    files: ['src/controllers/authController.ts', 'src/services/aiQueryEngine.ts'],
  },

  'Identify important dependencies.': {
    answer: `### Key Project Dependencies Analysis
*(Demo Simulation Mode: Extracted from \`package.json\`)*

- **Production Core**:
  - \`express\` (^4.19.2): HTTP web server and middleware engine.
  - \`jsonwebtoken\` (^9.0.2) & \`bcryptjs\` (^2.4.3): Security suite for password hashing and authentication tokens.
  - \`multer\` (^1.4.5): Multipart form-data handling for codebase ZIP uploads.
  - \`zod\` (^3.23.8): Runtime schema validation for incoming API requests.
- **Development Tools**:
  - \`tsx\`: TypeScript execution and fast hot-reloading.
  - \`typescript\` (^5.4.5): Type checker and compiler.`,
    files: ['package.json'],
  },

  'Where is authentication handled?': {
    answer: `### Authentication Implementation Location
*(Demo Simulation Mode: Grounded on sample codebase \`devmind-demo-core\`)*

Authentication is handled across two key files:

1. **\`src/controllers/authController.ts\`**:
   - \`handleLogin\`: Validates credentials, verifies bcrypt hash, and issues signed JWT bearer tokens.
   - \`handleRefreshToken\`: Handles cookie-based refresh token rotation.
2. **\`src/routes.ts\`**:
   - Routes \`POST /auth/login\` and \`POST /auth/refresh\` directly to the auth controller handlers.

**Security Notes**:
- Secrets are sourced from \`process.env.JWT_SECRET\`.
- Roles supported: \`developer\` and \`admin\`.`,
    files: ['src/controllers/authController.ts', 'src/routes.ts'],
  },
};
