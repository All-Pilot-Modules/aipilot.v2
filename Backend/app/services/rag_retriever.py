"""
RAG (Retrieval-Augmented Generation) retrieval service
Fetches relevant course material context for AI feedback generation
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.document import Document
from app.services.embedding import search_similar_chunks


def get_context_for_feedback(
    db: Session,
    question_text: str,
    student_answer: str,
    module_id: str,
    max_chunks: int = 3,
    similarity_threshold: float = 0.7,
    include_document_locations: bool = True
) -> Dict[str, Any]:
    """
    Retrieve relevant course material context for feedback generation

    Args:
        db: Database session
        question_text: The question being answered
        student_answer: The student's response
        module_id: Module ID to search within
        max_chunks: Maximum number of context chunks to retrieve
        similarity_threshold: Minimum similarity score (0-1)

    Returns:
        {
            'has_context': bool,
            'chunks': List[Dict],  # Retrieved chunks with text and metadata
            'formatted_context': str,  # Pre-formatted for prompt injection
            'sources': List[str]  # Document sources for citations
        }
    """
    # Combine question and answer for better context matching
    query = f"Question: {question_text}\nAnswer: {student_answer}"

    # Get all embedded documents from the module
    documents = db.query(Document).filter(
        Document.module_id == module_id,
        Document.processing_status == "embedded",
        Document.is_testbank == False  # Don't use testbank docs for context
    ).all()

    print(f"RAG DEBUG: Looking for documents in module {module_id}")
    print(f"   Found {len(documents)} embedded documents")

    if not documents:
        # Debug: Check what documents exist (regardless of status)
        all_docs = db.query(Document).filter(Document.module_id == module_id).all()
        print(f"   Total documents in module: {len(all_docs)}")
        for doc in all_docs:
            print(f"      - {doc.title}: status={doc.processing_status}, is_testbank={doc.is_testbank}")

        return {
            'has_context': False,
            'chunks': [],
            'formatted_context': '',
            'sources': []
        }

    # Search across all module documents
    all_results = []
    for doc in documents:
        try:
            results = search_similar_chunks(
                db=db,
                query_text=query,
                document_id=str(doc.id),
                limit=max_chunks
            )
            # Add document info to each result
            for result in results:
                result['document_title'] = doc.title
                result['document_id'] = str(doc.id)
            all_results.extend(results)
        except Exception as e:
            print(f"Error searching document {doc.id}: {str(e)}")
            continue

    print(f"   Retrieved {len(all_results)} total chunks from {len(documents)} documents")

    # Filter by similarity threshold
    filtered_results = [
        r for r in all_results
        if r['similarity'] >= similarity_threshold
    ]

    print(f"   After filtering (threshold={similarity_threshold}): {len(filtered_results)} chunks")
    if all_results and not filtered_results:
        # Show top similarity scores to help debug threshold issues
        top_3 = sorted(all_results, key=lambda x: x['similarity'], reverse=True)[:3]
        top_scores = [f"{r['similarity']:.3f}" for r in top_3]
        print(f"   Top 3 similarity scores: {top_scores}")

    # Sort by similarity and get top N
    filtered_results.sort(key=lambda x: x['similarity'], reverse=True)
    top_results = filtered_results[:max_chunks]

    if not top_results:
        return {
            'has_context': False,
            'chunks': [],
            'formatted_context': '',
            'sources': []
        }

    # Format context for prompt
    formatted_context = format_context_for_prompt(top_results, include_document_locations)

    # Extract unique sources
    sources = list(set([
        chunk['document_title']
        for chunk in top_results
    ]))

    return {
        'has_context': True,
        'chunks': top_results,
        'formatted_context': formatted_context,
        'sources': sources
    }









def format_context_for_prompt(chunks: List[Dict[str, Any]], include_document_locations: bool = True) -> str:
    """
    Format retrieved chunks into a structured context for the AI prompt

    Args:
        chunks: List of chunk dicts with 'text', 'similarity', 'document_title', 'metadata'

    Returns:
        Formatted string for prompt injection
    """
    if not chunks:
        return ""

    context_parts = ["\n=== RELEVANT COURSE MATERIAL ===\n"]
    context_parts.append("Use the following course material to provide context-aware feedback:\n")

    for i, chunk in enumerate(chunks, 1):
        similarity_pct = int(chunk['similarity'] * 100)

        # Build source reference with location details
        source_ref = f"[Source {i}] From: {chunk['document_title']}"

        # Add page/slide/section information if available
        metadata = chunk.get('metadata', {})
        location_parts = []

        if 'page_number' in metadata and metadata['page_number']:
            location_parts.append(f"Page {metadata['page_number']}")
        elif 'slide_number' in metadata and metadata['slide_number']:
            location_parts.append(f"Slide {metadata['slide_number']}")

        if 'section' in metadata and metadata['section']:
            location_parts.append(f"Section: {metadata['section']}")
        elif 'heading' in metadata and metadata['heading']:
            location_parts.append(f"'{metadata['heading']}'")

        if location_parts:
            source_ref += f" ({', '.join(location_parts)})"

        source_ref += f" (Relevance: {similarity_pct}%)"

        context_parts.append(f"\n{source_ref}")
        context_parts.append(f"{chunk['text']}\n")

    context_parts.append("\n=== END OF COURSE MATERIAL ===\n")

    if include_document_locations:
        context_parts.append("\n⚠️ IMPORTANT - Document References in Feedback:")
        context_parts.append("- When providing improvement hints, ALWAYS reference the specific document location")
        context_parts.append("- Use format: 'Review [Document Name], Page X' or 'See Slide Y in [Document]'")
        context_parts.append("- Example: 'To better understand this concept, review Lab 6, Page 3, section on Earth's Processor'")
        context_parts.append("- Example: 'The material on Slide 5 of Lecture 2 explains this topic in detail'")
        context_parts.append("- Make references natural and helpful, directing students to exact locations")
        context_parts.append("- If multiple sources are relevant, mention the most relevant one in your improvement hint\n")
    else:
        context_parts.append("\nProvide feedback based on the course material above, but do NOT include specific page or slide numbers.\n")

    return "\n".join(context_parts)


def get_context_summary(context: Dict[str, Any]) -> str:
    """
    Generate a brief summary of retrieved context for feedback metadata

    Args:
        context: Context dict from get_context_for_feedback()

    Returns:
        Human-readable summary string
    """
    if not context['has_context']:
        return "No course material context available"

    chunk_count = len(context['chunks'])
    sources = ", ".join(context['sources'])
    avg_similarity = sum(c['similarity'] for c in context['chunks']) / chunk_count
    avg_similarity_pct = int(avg_similarity * 100)

    return f"Retrieved {chunk_count} relevant chunks from: {sources} (avg relevance: {avg_similarity_pct}%)"


def should_use_rag_for_question(
    question_type: str,
    rag_settings: Dict[str, Any]
) -> bool:
    """
    Determine if RAG should be used for this question type

    Args:
        question_type: Type of question (mcq, short, essay)
        rag_settings: RAG configuration from module rubric

    Returns:
        True if RAG should be used
    """
    if not rag_settings.get('enabled', True):
        return False

    # RAG is most useful for text-based questions
    # For MCQ, it depends on whether we want concept explanations
    if question_type == 'mcq':
        # Use RAG for MCQ if we want detailed concept explanations
        return True

    # Always use RAG for short answer and essay questions
    return True
