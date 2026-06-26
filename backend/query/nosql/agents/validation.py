"""MongoDB query validation agent."""
import json
import logging

logger = logging.getLogger(__name__)


def validation_agent(state: dict) -> dict:
    """Validate MongoDB query syntax and structure."""
    query = state.get("query")
    query_type = state.get("query_type")

    # Handle administrative queries (like list collections)
    if query_type == "administrative":
        state["valid"] = True
        state["error"] = None
        state["result"] = state.get("admin_result")
        return state

    if not query:
        state["valid"] = False
        state["error"] = state.get("error", "No MongoDB query generated")
        return state

    state["retry_count"] = state.get("retry_count", 0) + 1

    try:
        # Validate JSON structure
        if query_type == "aggregation":
            # Should be an array of stages
            parsed = json.loads(query)
            if not isinstance(parsed, list):
                state["valid"] = False
                state["error"] = "Aggregation pipeline must be a JSON array"
                return state

            # Validate each stage
            allowed_stages = {
                "$match", "$group", "$sort", "$limit", "$skip", "$project",
                "$count", "$lookup", "$unwind", "$bucket", "$bucketAuto",
                "$facet", "$out", "$merge", "$addFields", "$replaceRoot",
                "$redact", "$geoNear", "$sample", "$indexStats"
            }

            for stage in parsed:
                if not isinstance(stage, dict):
                    state["valid"] = False
                    state["error"] = f"Each pipeline stage must be an object"
                    return state

                stage_keys = set(stage.keys())
                invalid_stages = stage_keys - allowed_stages
                if invalid_stages:
                    state["valid"] = False
                    state["error"] = f"Unknown pipeline stages: {invalid_stages}"
                    return state

        elif query_type == "find":
            # Should be a valid filter object
            parsed = json.loads(query)
            if not isinstance(parsed, dict):
                state["valid"] = False
                state["error"] = "Find filter must be a JSON object"
                return state

            # Validate operators
            valid_operators = {
                "$eq", "$gt", "$lt", "$gte", "$lte", "$ne", "$in", "$nin",
                "$and", "$or", "$not", "$exists", "$type", "$regex", "$text",
                "$where", "$mod", "$all", "$elemMatch", "$size", "$bitsAllSet",
                "$bitsAnySet", "$bitsAllClear", "$bitsClear"
            }

            def validate_operators(obj):
                if isinstance(obj, dict):
                    for key, value in obj.items():
                        if key.startswith("$"):
                            if key not in valid_operators:
                                return False, f"Unknown operator: {key}"
                        if isinstance(value, dict):
                            valid, msg = validate_operators(value)
                            if not valid:
                                return False, msg
                return True, None

            valid, error_msg = validate_operators(parsed)
            if not valid:
                state["valid"] = False
                state["error"] = error_msg
                return state

        state["valid"] = True
        state["error"] = None
        logger.info(f"MongoDB {query_type} query validated successfully")

    except json.JSONDecodeError as e:
        state["valid"] = False
        state["error"] = f"Invalid JSON: {str(e)}"
        logger.error(f"JSON validation error: {str(e)}")

    except Exception as e:
        state["valid"] = False
        state["error"] = str(e)
        logger.error(f"MongoDB validation agent error: {str(e)}", exc_info=True)

    return state
