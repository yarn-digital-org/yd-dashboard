# Firebase Patterns & Best Practices

Essential patterns and best practices for building scalable applications with Firebase, including Firestore, Authentication, Cloud Functions, and more.

## Overview

This skill covers proven patterns for Firebase development, from database design to security rules, authentication flows, and performance optimization. Learn how to build robust, scalable applications using Firebase's suite of tools.

## Prerequisites

- Basic JavaScript/TypeScript knowledge
- Understanding of NoSQL databases
- Familiarity with React or similar framework
- Basic understanding of serverless concepts

## Firebase Services Overview

### Core Services
- **Firestore**: NoSQL document database
- **Authentication**: User authentication and authorization
- **Cloud Functions**: Serverless backend logic
- **Storage**: File storage and serving
- **Hosting**: Static site hosting

## Firestore Patterns

### 1. Data Modeling

**Hierarchical Data Structure**:
```javascript
// Good: Flat structure
const userDoc = {
  uid: 'user123',
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: Timestamp.now(),
  settings: {
    theme: 'dark',
    notifications: true
  }
}

// Separate collection for user posts
const postDoc = {
  id: 'post456',
  authorId: 'user123',
  title: 'My Post',
  content: '...',
  createdAt: Timestamp.now(),
  tags: ['firebase', 'development']
}
```

**One-to-Many Relationships**:
```javascript
// Pattern 1: Subcollections
const ordersCollection = db.collection('users').doc('user123').collection('orders')

// Pattern 2: Reference with array (limited to 500 items)
const userDoc = {
  uid: 'user123',
  orderIds: ['order1', 'order2', 'order3']
}

// Pattern 3: Separate collection with foreign key
const orderDoc = {
  id: 'order1',
  userId: 'user123',
  items: [...]
}
```

### 2. Query Patterns

**Compound Queries**:
```javascript
// Multiple conditions
const activeUserPosts = await db.collection('posts')
  .where('authorId', '==', userId)
  .where('status', '==', 'active')
  .where('createdAt', '>', startDate)
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get()
```

**Array Queries**:
```javascript
// Array contains
const techPosts = await db.collection('posts')
  .where('tags', 'array-contains', 'technology')
  .get()

// Array contains any
const multipleTags = await db.collection('posts')
  .where('tags', 'array-contains-any', ['tech', 'science', 'programming'])
  .get()
```

**Pagination Pattern**:
```javascript
// Cursor-based pagination
const firstPage = await db.collection('posts')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get()

const lastDoc = firstPage.docs[firstPage.docs.length - 1]

const nextPage = await db.collection('posts')
  .orderBy('createdAt', 'desc')
  .startAfter(lastDoc)
  .limit(10)
  .get()
```

### 3. Real-time Patterns

**Document Listener**:
```javascript
// React hook for real-time document
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'

function useDocument(collection, docId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!docId) return

    const unsubscribe = onSnapshot(
      doc(db, collection, docId),
      (doc) => {
        setData(doc.exists() ? { id: doc.id, ...doc.data() } : null)
        setLoading(false)
      },
      (error) => {
        setError(error)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [collection, docId])

  return { data, loading, error }
}
```

**Collection Listener**:
```javascript
// Real-time collection with filters
function useCollection(collection, constraints = []) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let query = db.collection(collection)
    
    constraints.forEach(constraint => {
      query = query.where(...constraint)
    })

    const unsubscribe = query.onSnapshot(
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setData(docs)
        setLoading(false)
      },
      (error) => {
        console.error('Collection listener error:', error)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [collection, constraints])

  return { data, loading }
}
```

## Authentication Patterns

### 1. Auth State Management

**React Context Pattern**:
```javascript
// AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'

const AuthContext = createContext({})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    user,
    loading,
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signOut: () => signOut(auth),
    signUp: (email, password) => createUserWithEmailAndPassword(auth, email, password)
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
```

### 2. Protected Routes

```javascript
// ProtectedRoute component
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return user ? children : <Navigate to="/login" />
}

// Usage
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### 3. User Profile Management

```javascript
// User profile with Firestore
async function createUserProfile(user, additionalData = {}) {
  if (!user) return

  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    const { displayName, email, photoURL } = user
    const createdAt = new Date()

    try {
      await setDoc(userRef, {
        displayName,
        email,
        photoURL,
        createdAt,
        ...additionalData
      })
    } catch (error) {
      console.error('Error creating user profile:', error)
    }
  }

  return userRef
}
```

## Security Rules Patterns

### 1. Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public read, authenticated write
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.authorId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.authorId;
    }
    
    // Admin only
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 2. Storage Security Rules

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload to their own folder
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public read for profile images
    match /profile-images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.resource.size < 2 * 1024 * 1024 && // 2MB limit
        request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Cloud Functions Patterns

### 1. Triggered Functions

**Firestore Triggers**:
```javascript
// functions/index.js
const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()

// Trigger on document creation
exports.onUserCreate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userData = snap.data()
    const userId = context.params.userId

    // Send welcome email
    await sendWelcomeEmail(userData.email, userData.displayName)
    
    // Create user stats document
    await admin.firestore().collection('userStats').doc(userId).set({
      postsCount: 0,
      commentsCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
  })

// Trigger on document update
exports.onPostUpdate = functions.firestore
  .document('posts/{postId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    // Update search index if title changed
    if (before.title !== after.title) {
      await updateSearchIndex(context.params.postId, after)
    }
  })
```

**HTTP Functions**:
```javascript
// HTTP callable function
exports.createCustomToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in')
  }

  const { uid } = data
  
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'UID is required')
  }

  try {
    const customToken = await admin.auth().createCustomToken(uid)
    return { token: customToken }
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error creating custom token')
  }
})
```

### 2. Background Tasks

```javascript
// Scheduled function for cleanup
exports.cleanupOldData = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const batch = admin.firestore().batch()
  
  const oldPosts = await admin.firestore()
    .collection('posts')
    .where('deletedAt', '<', thirtyDaysAgo)
    .limit(500)
    .get()

  oldPosts.docs.forEach(doc => {
    batch.delete(doc.ref)
  })

  await batch.commit()
  console.log(`Cleaned up ${oldPosts.size} old posts`)
})
```

## Performance Optimization

### 1. Caching Strategies

```javascript
// Cache frequently accessed data
const cache = new Map()

async function getCachedUser(userId) {
  if (cache.has(userId)) {
    return cache.get(userId)
  }

  const userDoc = await db.collection('users').doc(userId).get()
  const userData = userDoc.data()
  
  // Cache for 5 minutes
  cache.set(userId, userData)
  setTimeout(() => cache.delete(userId), 5 * 60 * 1000)
  
  return userData
}
```

### 2. Batch Operations

```javascript
// Batch writes for better performance
async function batchUpdatePosts(updates) {
  const batch = db.batch()
  
  updates.forEach(({ docId, data }) => {
    const docRef = db.collection('posts').doc(docId)
    batch.update(docRef, data)
  })
  
  await batch.commit()
}

// Batch reads
async function getMultiplePosts(postIds) {
  const docs = await Promise.all(
    postIds.map(id => db.collection('posts').doc(id).get())
  )
  
  return docs.filter(doc => doc.exists()).map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}
```

### 3. Offline Support

```javascript
// Enable offline persistence
import { enablePersistence } from 'firebase/firestore'

enablePersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    // Multiple tabs open
  } else if (err.code == 'unimplemented') {
    // Browser doesn't support offline
  }
})

// Check connection status
import { enableNetwork, disableNetwork } from 'firebase/firestore'

// React hook for connection status
function useFirebaseConnection() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      enableNetwork(db)
    }

    const handleOffline = () => {
      setIsOnline(false)
      disableNetwork(db)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

## Testing Patterns

### 1. Unit Testing

```javascript
// Test Firebase functions
const test = require('firebase-functions-test')()
const admin = require('firebase-admin')

describe('User Functions', () => {
  let db

  beforeAll(() => {
    db = admin.firestore()
  })

  afterAll(async () => {
    await test.cleanup()
  })

  it('should create user stats on user creation', async () => {
    const snap = test.firestore.makeDocumentSnapshot({
      displayName: 'Test User',
      email: 'test@example.com'
    }, 'users/testUserId')

    const wrapped = test.wrap(functions.onUserCreate)
    await wrapped(snap, { params: { userId: 'testUserId' } })

    const userStats = await db.collection('userStats').doc('testUserId').get()
    expect(userStats.exists).toBe(true)
    expect(userStats.data().postsCount).toBe(0)
  })
})
```

### 2. Emulator Testing

```javascript
// Connect to emulator in development
import { connectFirestoreEmulator } from 'firebase/firestore'
import { connectAuthEmulator } from 'firebase/auth'

if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099')
}
```

## Best Practices

1. **Data Structure**:
   - Keep documents under 1MB
   - Use subcollections for large datasets
   - Denormalize data for read efficiency

2. **Security**:
   - Write comprehensive security rules
   - Validate data on client and server
   - Use custom claims for roles

3. **Performance**:
   - Limit query results
   - Use indexes effectively
   - Cache frequently accessed data

4. **Costs**:
   - Monitor read/write operations
   - Use compound queries wisely
   - Implement proper pagination

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Security Rules Reference](https://firebase.google.com/docs/rules)

## Related Skills

- [Next.js Deployment](./next-js-deployment.md)
- [Vercel Configuration](./vercel-config.md)
- React State Management
- TypeScript Integration