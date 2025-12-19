"""
Debug script to check RAG/embedding status and similarity scores
"""
from app.database import SessionLocal
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.document_embedding import DocumentEmbedding
from app.services.embedding import search_similar_chunks

db = SessionLocal()

print("=" * 60)
print("🔍 RAG DEBUGGING TOOL")
print("=" * 60)

# Check all documents
print("\n📄 ALL DOCUMENTS:")
documents = db.query(Document).all()
print(f"Total documents: {len(documents)}\n")

for doc in documents:
    print(f"📋 Document: {doc.title}")
    print(f"   ID: {doc.id}")
    print(f"   Module ID: {doc.module_id}")
    print(f"   Status: {doc.processing_status}")
    print(f"   Is Testbank: {doc.is_testbank}")
    print(f"   File Type: {doc.file_type}")

    # Check chunks
    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == doc.id
    ).all()
    print(f"   Chunks: {len(chunks)}")

    # Check embeddings
    embeddings = db.query(DocumentEmbedding).filter(
        DocumentEmbedding.document_id == doc.id
    ).all()
    print(f"   Embeddings: {len(embeddings)}")

    if chunks and embeddings:
        print(f"   ✅ Ready for RAG")
    elif chunks and not embeddings:
        print(f"   ⚠️  Has chunks but NO embeddings")
    elif not chunks:
        print(f"   ⚠️  No chunks created")

    print()

# Test similarity search
print("=" * 60)
print("🧪 TESTING SIMILARITY SEARCH")
print("=" * 60)

# Find documents with embeddings
embedded_docs = db.query(Document).filter(
    Document.processing_status == "embedded",
    Document.is_testbank == False
).all()

if not embedded_docs:
    print("❌ No embedded documents found for testing")
else:
    test_doc = embedded_docs[0]
    print(f"\n📄 Testing with document: {test_doc.title}")
    print(f"   Module ID: {test_doc.module_id}")

    # Test queries
    test_queries = [
        "what is lab 5 about",
        "what professor ask here",
        "HTML and CSS",
        "web development"
    ]

    for query in test_queries:
        print(f"\n🔎 Query: '{query}'")
        try:
            results = search_similar_chunks(
                db=db,
                query_text=query,
                document_id=str(test_doc.id),
                limit=5
            )

            if results:
                print(f"   Found {len(results)} chunks:")
                for i, result in enumerate(results[:3], 1):
                    print(f"   {i}. Similarity: {result['similarity']:.4f}")
                    print(f"      Text preview: {result['text'][:100]}...")

                # Check against default threshold
                above_threshold = [r for r in results if r['similarity'] >= 0.7]
                print(f"\n   📊 Chunks above threshold (0.7): {len(above_threshold)}/{len(results)}")

                if not above_threshold and results:
                    max_sim = max(r['similarity'] for r in results)
                    print(f"   ⚠️  Highest similarity ({max_sim:.4f}) is below threshold!")
                    print(f"   💡 Consider lowering threshold to ~{max_sim * 0.9:.2f}")
            else:
                print("   ❌ No results found")

        except Exception as e:
            print(f"   ❌ Error: {str(e)}")

print("\n" + "=" * 60)
print("✅ Debug complete!")
print("=" * 60)

db.close()
