"""
Rubric management service
Handles rubric templates, merging, validation, and customization
"""
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from copy import deepcopy

from app.models.module import Module
from app.crud.module import get_module_by_id
from app.config.feedback_templates import RUBRIC_TEMPLATES, get_template, list_templates


def get_module_rubric(db: Session, module_id: str) -> Dict[str, Any]:
    """
    Get the rubric configuration for a module
    Falls back to default template if not configured

    Args:
        db: Database session
        module_id: UUID of the module

    Returns:
        Rubric configuration dict
    """
    module = get_module_by_id(db, module_id)
    if not module:
        raise ValueError(f"Module {module_id} not found")

    # Try new dedicated column first
    rubric = module.feedback_rubric

    # Fall back to legacy location in assignment_config for backward compatibility
    if not rubric:
        assignment_config = module.assignment_config or {}
        rubric = assignment_config.get("feedback_rubric", {})

    # If no rubric configured, use default
    if not rubric or not rubric.get("enabled", True):
        return get_template("default")["config"]

    # Merge with defaults to ensure all fields are present
    return merge_with_defaults(rubric)


def merge_with_defaults(custom_rubric: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge custom rubric with default template
    Custom values override defaults, missing fields use defaults

    Args:
        custom_rubric: Custom rubric configuration

    Returns:
        Merged rubric with all required fields
    """
    # Start with default template
    base = deepcopy(get_template("default")["config"])

    if not custom_rubric:
        return base

    # Deep merge custom rubric into base
    merged = deepcopy(base)

    # Merge grading criteria
    if "grading_criteria" in custom_rubric:
        merged["grading_criteria"] = {
            **base.get("grading_criteria", {}),
            **custom_rubric["grading_criteria"]
        }

    # Merge feedback style
    if "feedback_style" in custom_rubric:
        merged["feedback_style"] = {
            **base.get("feedback_style", {}),
            **custom_rubric["feedback_style"]
        }

    # Merge RAG settings
    if "rag_settings" in custom_rubric:
        merged["rag_settings"] = {
            **base.get("rag_settings", {}),
            **custom_rubric["rag_settings"]
        }

    # Merge question type settings
    if "question_type_settings" in custom_rubric:
        merged["question_type_settings"] = {
            "mcq": {
                **base.get("question_type_settings", {}).get("mcq", {}),
                **custom_rubric["question_type_settings"].get("mcq", {})
            },
            "short": {
                **base.get("question_type_settings", {}).get("short", {}),
                **custom_rubric["question_type_settings"].get("short", {})
            },
            "long": {
                **base.get("question_type_settings", {}).get("long", {}),
                **custom_rubric["question_type_settings"].get("long", {})
            },
            "mcq_multiple": {
                **base.get("question_type_settings", {}).get("mcq_multiple", {}),
                **custom_rubric["question_type_settings"].get("mcq_multiple", {})
            },
            "fill_blank": {
                **base.get("question_type_settings", {}).get("fill_blank", {}),
                **custom_rubric["question_type_settings"].get("fill_blank", {})
            },
            "multi_part": {
                **base.get("question_type_settings", {}).get("multi_part", {}),
                **custom_rubric["question_type_settings"].get("multi_part", {})
            }
        }

    # Merge grading thresholds
    if "grading_thresholds" in custom_rubric:
        merged["grading_thresholds"] = {
            **base.get("grading_thresholds", {}),
            **custom_rubric["grading_thresholds"]
        }

    # Override top-level fields
    if "enabled" in custom_rubric:
        merged["enabled"] = custom_rubric["enabled"]

    if "custom_instructions" in custom_rubric:
        merged["custom_instructions"] = custom_rubric["custom_instructions"]

    return merged


def update_module_rubric(
    db: Session,
    module_id: str,
    rubric_config: Dict[str, Any]
) -> Module:
    """
    Update the rubric configuration for a module

    Args:
        db: Database session
        module_id: UUID of the module
        rubric_config: New rubric configuration

    Returns:
        Updated module
    """
    module = get_module_by_id(db, module_id)
    if not module:
        raise ValueError(f"Module {module_id} not found")

    # Validate rubric before saving
    validation_errors = validate_rubric(rubric_config)
    if validation_errors:
        raise ValueError(f"Invalid rubric: {'; '.join(validation_errors)}")

    # Merge with defaults to ensure completeness
    merged_rubric = merge_with_defaults(rubric_config)

    # Update new dedicated column
    module.feedback_rubric = merged_rubric

    # Mark as modified for JSONB update
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(module, "feedback_rubric")

    # Also remove from legacy location if it exists (for cleanup)
    if module.assignment_config and "feedback_rubric" in module.assignment_config:
        assignment_config = module.assignment_config.copy()
        del assignment_config["feedback_rubric"]
        module.assignment_config = assignment_config
        flag_modified(module, "assignment_config")

    db.commit()
    db.refresh(module)

    return module


def apply_template_to_module(
    db: Session,
    module_id: str,
    template_name: str,
    preserve_custom_instructions: bool = True
) -> Module:
    """
    Apply a rubric template to a module

    Args:
        db: Database session
        module_id: UUID of the module
        template_name: Name of the template to apply
        preserve_custom_instructions: Keep existing custom instructions

    Returns:
        Updated module
    """
    module = get_module_by_id(db, module_id)
    if not module:
        raise ValueError(f"Module {module_id} not found")

    # Get template
    template = get_template(template_name)
    if not template:
        raise ValueError(f"Template '{template_name}' not found")

    # Get existing custom instructions if preserving
    existing_instructions = ""
    if preserve_custom_instructions:
        # Try new column first, fall back to legacy location
        existing_rubric = module.feedback_rubric
        if not existing_rubric:
            assignment_config = module.assignment_config or {}
            existing_rubric = assignment_config.get("feedback_rubric", {})
        existing_instructions = existing_rubric.get("custom_instructions", "") if existing_rubric else ""

    # Apply template
    new_rubric = deepcopy(template["config"])

    # Preserve custom instructions if requested
    if preserve_custom_instructions and existing_instructions:
        new_rubric["custom_instructions"] = existing_instructions

    # Update new dedicated column
    module.feedback_rubric = new_rubric

    # Mark as modified for JSONB update
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(module, "feedback_rubric")

    # Also remove from legacy location if it exists (for cleanup)
    if module.assignment_config and "feedback_rubric" in module.assignment_config:
        assignment_config = module.assignment_config.copy()
        del assignment_config["feedback_rubric"]
        module.assignment_config = assignment_config
        flag_modified(module, "assignment_config")

    db.commit()
    db.refresh(module)

    return module


def validate_rubric(rubric: Dict[str, Any]) -> List[str]:
    """
    Validate rubric configuration

    Args:
        rubric: Rubric configuration to validate

    Returns:
        List of error messages (empty if valid)
    """
    errors = []

    if not rubric:
        return ["Rubric cannot be empty"]

    # Validate grading criteria
    if "grading_criteria" in rubric:
        criteria = rubric["grading_criteria"]

        # Check that weights sum to 100 (allow 99-101 for rounding)
        total_weight = sum(c.get("weight", 0) for c in criteria.values())
        if total_weight < 99 or total_weight > 101:
            errors.append(f"Grading criteria weights must sum to 100 (current: {total_weight})")

        # Validate each criterion
        for name, criterion in criteria.items():
            if "weight" not in criterion:
                errors.append(f"Criterion '{name}' missing weight")
            elif not isinstance(criterion["weight"], (int, float)):
                errors.append(f"Criterion '{name}' weight must be a number")
            elif criterion["weight"] < 0 or criterion["weight"] > 100:
                errors.append(f"Criterion '{name}' weight must be between 0 and 100")

            if "description" not in criterion:
                errors.append(f"Criterion '{name}' missing description")

    # Validate feedback style
    if "feedback_style" in rubric:
        style = rubric["feedback_style"]

        valid_tones = ["encouraging", "neutral", "strict"]
        if "tone" in style and style["tone"] not in valid_tones:
            errors.append(f"Tone must be one of: {', '.join(valid_tones)}")

        valid_detail_levels = ["brief", "moderate", "detailed"]
        if "detail_level" in style and style["detail_level"] not in valid_detail_levels:
            errors.append(f"Detail level must be one of: {', '.join(valid_detail_levels)}")

    # Validate RAG settings
    if "rag_settings" in rubric:
        rag = rubric["rag_settings"]

        if "similarity_threshold" in rag:
            threshold = rag["similarity_threshold"]
            if not isinstance(threshold, (int, float)):
                errors.append("Similarity threshold must be a number")
            elif threshold < 0.0 or threshold > 1.0:
                errors.append("Similarity threshold must be between 0.0 and 1.0")

        if "max_context_chunks" in rag:
            chunks = rag["max_context_chunks"]
            if not isinstance(chunks, int):
                errors.append("Max context chunks must be an integer")
            elif chunks < 1 or chunks > 10:
                errors.append("Max context chunks must be between 1 and 10")

    # Validate grading thresholds
    if "grading_thresholds" in rubric:
        thresholds = rubric["grading_thresholds"]

        if "passing_score" in thresholds:
            passing_score = thresholds["passing_score"]
            if not isinstance(passing_score, (int, float)):
                errors.append("Passing score must be a number")
            elif passing_score < 0 or passing_score > 100:
                errors.append("Passing score must be between 0 and 100")

        if "partial_credit" in thresholds:
            partial_credit = thresholds["partial_credit"]
            if not isinstance(partial_credit, bool):
                errors.append("Partial credit must be a boolean value")

    return errors


def get_available_templates() -> List[Dict[str, str]]:
    """
    Get list of available rubric templates

    Returns:
        List of template metadata
    """
    return list_templates()


def get_rubric_summary(rubric: Dict[str, Any]) -> str:
    """
    Generate a human-readable summary of a rubric

    Args:
        rubric: Rubric configuration

    Returns:
        Summary string
    """
    if not rubric:
        return "No rubric configured"

    criteria_count = len(rubric.get("grading_criteria", {}))
    tone = rubric.get("feedback_style", {}).get("tone", "encouraging")
    rag_enabled = rubric.get("rag_settings", {}).get("enabled", False)

    summary = f"{criteria_count} grading criteria, {tone} tone"
    if rag_enabled:
        summary += ", RAG enabled"

    return summary
