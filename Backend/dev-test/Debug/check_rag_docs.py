"""
Quick script to check document status for RAG debugging
"""
from app.database import SessionLocal
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.document_embedding import DocumentEmbedding

def check_module_documents(module_id):
    db = SessionLocal()
    try:
        print('=== DOCUMENT STATUS CHECK ===')
        print(f'Module ID: {module_id}\n')

        documents = db.query(Document).filter(Document.module_id == module_id).all()

        if not documents:
            print(f'❌ No documents found for module {module_id}')
            return

        print(f'✓ Found {len(documents)} document(s)\n')

        for doc in documents:
            print(f'📄 {doc.title}')
            print(f'   File: {doc.file_name}')
            print(f'   ID: {doc.id}')
            print(f'   Status: {doc.processing_status}')
            print(f'   Is Testbank: {doc.is_testbank}')

            # Check chunks
            chunk_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()
            print(f'   Chunks: {chunk_count}')

            # Check embeddings
            embedding_count = db.query(DocumentEmbedding).filter(DocumentEmbedding.document_id == doc.id).count()
            print(f'   Embeddings: {embedding_count}')

            if chunk_count == 0:
                print(f'   ❌ NO CHUNKS - Document needs to be processed')
            elif embedding_count == 0:
                print(f'   ❌ NO EMBEDDINGS - Chunks exist but embeddings missing')
            elif chunk_count != embedding_count:
                print(f'   ⚠️  WARNING - Chunk/embedding mismatch')
            else:
                print(f'   ✅ All chunks have embeddings')

            print()

        print('=== RAG-ELIGIBLE DOCUMENTS ===')
        rag_docs = db.query(Document).filter(
            Document.module_id == module_id,
            Document.processing_status == 'embedded',
            Document.is_testbank == False
        ).all()

        if not rag_docs:
            print('❌ No RAG-eligible documents (must be: status=embedded, is_testbank=False)')
            print('\n💡 For RAG to work, documents must be:')
            print('   1. Uploaded to the module')
            print('   2. Processed with status="embedded"')
            print('   3. NOT marked as testbank (is_testbank=False)')
            print('\n📋 Current document statuses:')
            for doc in documents:
                status_emoji = '✅' if doc.processing_status == 'embedded' else '❌'
                testbank_emoji = '❌' if doc.is_testbank else '✅'
                print(f'   {doc.title}:')
                print(f'      Status {status_emoji}: {doc.processing_status}')
                print(f'      Not testbank {testbank_emoji}: {not doc.is_testbank}')
        else:
            print(f'✅ {len(rag_docs)} RAG-eligible document(s)')
            for doc in rag_docs:
                print(f'   - {doc.title}')

    finally:
        db.close()

if __name__ == '__main__':
    module_id = 'adb660ba-e5ae-4c42-8d99-dd44c377bc3c'
    check_module_documents(module_id)
