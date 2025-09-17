import type {
    EvaluationRequest,
    EvaluationResponse,
} from "../_core/src/evaluator/interface.ts"


export function deno_evaluate_code_in_sandbox (request: EvaluationRequest)
{
    // This is a stub. Replace with actual sandboxed evaluation logic
    // once we can sandbox user code in Deno.
    const response: EvaluationResponse = {
        js_input_value: request.js_input_value,
        evaluation_id: 0,
        requested_at: request.requested_at,
        start_time: performance.now(),
        end_time: performance.now(),
        result: request.js_input_value, // Echo input for now
        error: null,
    }
    return Promise.resolve(response)
}
